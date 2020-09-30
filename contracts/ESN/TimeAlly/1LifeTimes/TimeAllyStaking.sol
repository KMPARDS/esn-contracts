// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { INRTManager } from "../../NRT/INRTManager.sol";
import { ITimeAllyManager } from "./ITimeAllyManager.sol";
import { IKycDapp } from "../../KycDapp/IKycDapp.sol";
import { IDayswappers } from "../../Dayswappers/IDayswappers.sol";
import { IPrepaidEs } from "../../PrepaidEs/IPrepaidEs.sol";
import { PrepaidEsReceiver } from "../../PrepaidEs/PrepaidEsReceiver.sol";
import { IDelegatable } from "./IDelegatable.sol";

// import { RegistryDependent } from "../../KycDapp/RegistryDependent.sol";

/// @title TimeAlly Staking Target
/// @notice Target Logic for TimeAlly Staking Contracts.
/// @dev This contract is deployed once and initialised and ERC-1167 clones are further deployed.
contract TimeAllyStaking is PrepaidEsReceiver {
    using SafeMath for uint256;

    enum DestroyReason { SelfReport, ExternalReport, Merge }

    /// @notice NRT Manager contract reference.
    INRTManager public nrtManager;

    /// @notice TimeAlly Manager contract reference.
    ITimeAllyManager public timeallyManager;

    /// @notice KycDapp contract reference.
    IKycDapp public kycDapp;

    /// @dev 30.4368 days to take account for leap years.
    uint256 public constant SECONDS_IN_MONTH = 2629744;

    /// @notice ERC-173 Contract Ownership
    address public owner;

    /// @notice Timestamp of staking creation
    uint48 public timestamp;

    /// @notice NRT month from which the staking receives rewards.
    uint32 public startMonth;

    /// @notice Temporary end month for staking. Can be atmost `defaultMonths` far from
    ///         current NRT month to have less gas for split & merge, keeping user convenience.
    uint32 public endMonth;

    /// @notice Maximum amount of loan that can be taken or exit. Restaking increases this.
    uint256 public issTimeLimit;

    /// @notice Timestmap when IssTime was started. If zero means IssTime isn't active
    uint48 public issTimeTimestamp;

    /// @notice Amount of loan taken.
    uint256 public issTimeTakenValue;

    /// @notice NRT month in which last IssTime was taken.
    uint32 public lastIssTimeMonth;

    /// @dev Keeps track of topups or splits done on this staking. A topup done in this month is
    ///      applicable from next month.
    mapping(uint32 => int256) topups;

    /// @dev Keeps track of Claimed months
    mapping(uint32 => bool) claimedMonths;

    /// @dev Keeps track of monthly delegations. Entire staking is given as a delegation. To
    ///      have multiple delegations, one can split staking and delegate.
    mapping(uint32 => address) delegations;

    /// @notice Emits when a topup is done on this staking.
    event Topup(int256 amount, address benefactor);

    /// @notice Emits when IssTime is increased.
    event IssTimeIncrease(uint256 amount, address benefactor);

    /// @notice Emits for every NRT month's reward that is claimed.
    event Claim(uint32 indexed month, uint256 amount, ITimeAllyManager.RewardType rewardType);

    /// @notice Emits for every delegation done.
    event Delegate(uint32 indexed month, address indexed platform, bytes extraData);

    /// @notice Emits when this staking is destroyed, happens once.
    event Destroy(DestroyReason destroyReason);

    modifier onlyOwner() {
        require(msg.sender == owner, "TAS: Only staker can call");
        _;
    }

    modifier whenIssTimeNotActive() {
        require(issTimeTimestamp == 0, "TAS: Can't when IssTime active");
        _;
    }

    modifier whenIssTimeActive() {
        require(issTimeTimestamp != 0, "TAS: Can't when IssTime inactive");
        _;
    }

    modifier whenNoDelegations() {
        require(!hasDelegations(), "TAS: Can't when delegated");
        _;
    }

    /// @notice Initialises the staking contract.
    /// @dev Called by TimeAlly Manager immediately after deploying.
    /// @param _owner: Address of owner for this staking.
    /// @param _defaultMonths: NRT months to extend the staking.
    /// @param _initialIssTimeLimit: Inital IssTimeLimit for the staking.
    /// @param _kycDapp: Address of Validator Manager smart contract.
    // /// @param _nrtManager: Address of NRT Manager smart contract.
    /// @param _claimedMonths: Markings for claimed months in previous TimeAlly ETH contract.
    function init(
        address _owner,
        uint32 _defaultMonths,
        uint256 _initialIssTimeLimit,
        address _kycDapp,
        address _nrtManager,
        bool[] memory _claimedMonths
    ) public payable {
        require(timestamp == 0, "TAS: Already initialized");

        timeallyManager = ITimeAllyManager(msg.sender);
        // setKycDapp(_kycDapp);

        // TODO: Switch to always querying the contract address from
        //       parent to enable a possible migration.
        kycDapp = IKycDapp(_kycDapp);
        // nrtManager = INRTManager(kycDapp.resolveAddress("NRT_MANAGER"));
        nrtManager = INRTManager(_nrtManager);

        owner = _owner;
        timestamp = uint48(block.timestamp);
        issTimeLimit = _initialIssTimeLimit;

        uint32 _currentMonth = nrtManager.currentNrtMonth();
        startMonth = _currentMonth + 1;

        if (_claimedMonths.length > _defaultMonths) {
            _defaultMonths = uint32(_claimedMonths.length);
        }
        endMonth = startMonth + _defaultMonths - 1;

        for (uint32 i = 0; i < _claimedMonths.length; i++) {
            if (_claimedMonths[i]) {
                claimedMonths[startMonth + i] = _claimedMonths[i];
            }
        }

        if (msg.value > 0) {
            _stakeTopUp(msg.value);
        }
    }

    /// @notice Native tokens transferred to the contract addresses gets as topup.
    receive() external payable {
        _stakeTopUp(msg.value);
    }

    /// @notice Called by Prepaid contract then transfer done to this contract.
    /// @dev Used for topup using Prepaid ES.
    /// @param _value: Amount of prepaid ES tokens transferred.
    function prepaidFallback(address, uint256 _value) public override returns (bool) {
        address prepaidEs = kycDapp.resolveAddress("PREPAID_ES");
        require(msg.sender == prepaidEs, "TAS: Only prepaidEs can call");
        IPrepaidEs(prepaidEs).transfer(address(timeallyManager), _value);

        return true;
    }

    /// @notice Delegates the staking to a platform.
    /// @dev Delegation gives the platform address to take control of the staking.
    /// @param _platform: Smart contract of the platform.
    /// @param _extraData: Any extra data that the platform requires to link delegation.
    /// @param _months: Number of months for which delegation is done.
    function delegate(
        address _platform,
        bytes memory _extraData,
        uint32[] memory _months
    ) public onlyOwner whenIssTimeNotActive {
        require(_platform != address(0), "TAS: Cant delegate on zero");
        uint32 _currentMonth = nrtManager.currentNrtMonth();

        for (uint32 i = 0; i < _months.length; i++) {
            uint32 _month = _months[i];
            require(_month > _currentMonth, "TAS: Only future months allowed");
            require(_month <= endMonth, "TAS: Can't delegate beyond");
            require(delegations[_month] == address(0), "TAS: Month already delegated");
            delegations[_month] = _platform;
            // validatorManager.registerDelegation(_month, _extraData);
            // (bool _success, bytes memory _revertReason) = _platform.call(
            //     abi.encodeWithSignature("registerDelegation(uint256,bytes)", _month, _extraData)
            // );
            IDelegatable(_platform).registerDelegation(_month, _extraData);
            // require(
            //     _success,
            //     string(abi.encodePacked("TAS: REGISTER_DELEGATION_FAILING2", _revertReason))
            // );

            emit Delegate(_month, _platform, _extraData);
        }
    }

    /// @notice Withdraws monthly NRT rewards from TimeAlly Manager.
    /// @param _months: NRT Months for which rewards to be withdrawn.
    /// @param _rewardType: 0 => Liquid, 1 => Prepaid, 2 => Staked.
    function withdrawMonthlyNRT(uint32[] memory _months, ITimeAllyManager.RewardType _rewardType)
        public
        onlyOwner
        whenIssTimeNotActive
    {
        require(_months.length > 0, "TAS: Months array is empty");

        uint32 _currentMonth = nrtManager.currentNrtMonth();
        uint256 _unclaimedReward;

        for (uint256 i = 0; i < _months.length; i++) {
            uint32 _month = _months[i];
            require(_month <= _currentMonth, "TAS: Month NRT not released");
            require(_month <= endMonth, "TAS: Can't after endMonth");
            require(_month >= startMonth, "TAS: Can't before startMonth");
            require(!claimedMonths[_month], "TAS: Month already claimed");

            claimedMonths[_month] = true;
            uint256 _reward = getMonthlyReward(_month);
            _unclaimedReward = _unclaimedReward.add(_reward);

            emit Claim(_month, _reward, _rewardType);
        }

        /// @dev Communicates TimeAlly manager to process _unclaimedReward.
        timeallyManager.processNrtReward(_unclaimedReward, _rewardType);
    }

    /// @notice Increases IssTime limit value.
    /// @dev Called by TimeAllyManager contract when processing NRT reward.
    /// @param _increaseValue: Amount of IssTimeLimit to increase.
    function increaseIssTime(uint256 _increaseValue) external {
        require(
            msg.sender == address(timeallyManager) ||
                msg.sender == kycDapp.resolveAddress("DAYSWAPPERS") ||
                msg.sender == kycDapp.resolveAddress("TIMEALLY_CLUB"),
            "TAS: Only Allowed can call"
        );

        issTimeLimit = issTimeLimit.add(_increaseValue);

        emit IssTimeIncrease(_increaseValue, msg.sender);
    }

    /// @notice Starts IssTime in Loan mode or Exit mode the staking.
    /// @param _value: Amount of IssTime to be taken.
    /// @param _destroy: Whether Exit mode is selected or not.
    function startIssTime(uint256 _value, bool _destroy)
        public
        onlyOwner
        whenIssTimeNotActive
        whenNoDelegations
    {
        require(_value > 0, "TAS: Loan can't be zero");
        require(_value <= getTotalIssTime(_destroy), "TAS: Exceeds IssTime Limit");
        uint32 _currentMonth = nrtManager.currentNrtMonth();
        require(!claimedMonths[_currentMonth], "TAS: Can't IssTime if current month claimed");
        require(lastIssTimeMonth < _currentMonth, "TAS: Cannot IssTime twice in single month");
        if (!_destroy) {
            require(_currentMonth < endMonth, "TAS: Can't Normal IssTime after endMonth");
        }

        issTimeTimestamp = uint48(block.timestamp);
        issTimeTakenValue = _value;
        lastIssTimeMonth = _currentMonth;
        claimedMonths[_currentMonth + 1] = true;
        _decreaseSelfFromTotalActive();

        (bool _success, ) = owner.call{ value: _value }("");
        require(_success, "TAS: IssTime liquid transfer is failing");

        if (_destroy) {
            _destroyStaking(DestroyReason.SelfReport);
        }
    }

    /// @notice Used to finish IssTime and bring staking back to normal form.
    /// @dev Interest need to be passed along the value
    function submitIssTime() public payable whenIssTimeActive {
        uint256 _interest = getIssTimeInterest();
        uint256 _submitValue = issTimeTakenValue.add(_interest);
        require(msg.value >= _submitValue, "TAS: Insufficient IssTime submit value");
        // INRTManager _nrtManager = nrtManager;

        uint32 _currentMonth = nrtManager.currentNrtMonth();
        require(issTimeTimestamp + SECONDS_IN_MONTH >= block.timestamp, "TAS: Deadline exceded");

        delete issTimeTimestamp;
        delete issTimeTakenValue;
        if (_currentMonth == lastIssTimeMonth) {
            claimedMonths[_currentMonth + 1] = false;
        }

        _increaseSelfFromTotalActive();
        nrtManager.addToLuckPool{ value: _interest }();

        uint256 _exceedValue = msg.value.sub(_submitValue);
        if (_exceedValue > 0) {
            (bool _success, ) = msg.sender.call{ value: _exceedValue }("");
            require(_success, "TAS: Exceed value transfer is failing");
        }
    }

    /// @notice Allows anyone after deadline to report IssTime not paid and earn incentive.
    function reportIssTime() public whenIssTimeActive {
        if (msg.sender != owner) {
            uint32 _currentMonth = nrtManager.currentNrtMonth();
            require(_currentMonth > lastIssTimeMonth, "TAS: Month not elapsed for reporting");
        }

        uint256 _principal = getPrincipalAmount(lastIssTimeMonth + 1);
        uint256 _incentive = _principal.div(100);

        /// @dev To prevent re-entrancy
        issTimeTimestamp = 0;

        {
            (bool _success, ) = msg.sender.call{ value: _incentive }("");
            require(_success, "TAS: Incentive transfer is failing");
        }

        DestroyReason _destroyReason = msg.sender == owner
            ? DestroyReason.SelfReport
            : DestroyReason.ExternalReport;

        _destroyStaking(_destroyReason);
    }

    /// @notice Increases self staking in total active stakings.
    /// @dev Used in topup, receive merge to update the total active staking in TimeAlly Manager.
    function _increaseSelfFromTotalActive() private {
        uint32 _currentNrtMonth = nrtManager.currentNrtMonth();
        uint256 _principal = getPrincipalAmount(endMonth);
        timeallyManager.increaseActiveStaking(_principal, _currentNrtMonth + 1, endMonth);
    }

    /// @notice Decreases self staking in total active stakings.
    /// @dev Used in split, merge to update the total active staking in TimeAlly Manager.
    function _decreaseSelfFromTotalActive() private {
        uint32 _currentNrtMonth = nrtManager.currentNrtMonth();
        uint256 _principal = getPrincipalAmount(endMonth);
        timeallyManager.decreaseActiveStaking(_principal, _currentNrtMonth + 1, endMonth);
    }

    /// @notice Destroys the staking.
    /// @dev Used when staking is merged into other staking or reported.
    function _destroyStaking(DestroyReason _destroyReason) private {
        uint256 _balance = address(this).balance;
        if (_balance > 0) {
            nrtManager.addToBurnPool{ value: _balance }();
        }

        emit Destroy(_destroyReason);
        timeallyManager.removeStaking(owner);
        selfdestruct(address(0));
    }

    /// @notice Transfers staking ownership to other wallet address.
    /// @param _newOwner: Address of the new owner.
    function transferOwnership(address _newOwner) public {
        if (msg.sender != owner) {
            uint32 _currentMonth = nrtManager.currentNrtMonth();
            require(
                msg.sender == delegations[_currentMonth],
                "TAS: Only owner or delegatee allowed"
            );
        }
        address _oldOwner = owner;
        owner = _newOwner;
        // super.transferOwnership(_newOwner);
        timeallyManager.emitStakingTransfer(_oldOwner, _newOwner);
    }

    /// @notice Splits the staking creating a new staking contract.
    /// @param _value: Amount of tokens to seperate from this staking to create new.
    function split(uint256 _value) public payable onlyOwner whenIssTimeNotActive whenNoDelegations {
        uint32 _currentMonth = nrtManager.currentNrtMonth();

        uint256 _principal = getPrincipalAmount(_currentMonth + 1);
        require(_value < _principal, "TAS: Can only split to value smaller than principal");

        require(msg.value >= getSplitFee(_value, _currentMonth), "TAS: Insufficient split fees");

        /// @dev Burn the split staking fees.
        nrtManager.addToBurnPool{ value: msg.value }();

        uint256 _initialIssTime = issTimeLimit;
        if (_initialIssTime > 0) {
            /// @dev Calculate issTime share for split staking.
            _initialIssTime = _initialIssTime.mul(_value).div(_principal);
        }

        /// @dev Reduce self isstime limit.
        issTimeLimit = issTimeLimit.sub(_initialIssTime);

        /// @dev Insert a single negative topup here.
        topups[_currentMonth] -= int256(_value);
        emit Topup(-int256(_value), msg.sender);

        /// @dev Request timeally to create a new staking.
        timeallyManager.splitStaking{ value: _value }(owner, _initialIssTime, endMonth);
    }

    /// @notice Merge the staking into a master staking.
    /// @dev This action destroys any unclaimed NRT benefits of this staking.
    /// @param _masterStaking: Address of master staking contract
    function mergeIn(address _masterStaking)
        public
        onlyOwner
        whenIssTimeNotActive
        whenNoDelegations
    {
        require(_masterStaking != address(this), "TAS: Cannot merge with self");
        require(
            timeallyManager.isStakingContractValid(_masterStaking),
            "TAS: Master staking should be a valid staking contract"
        );

        /// @dev Send staking value to master.
        TimeAllyStaking(payable(_masterStaking)).receiveMerge{ value: principal() }(
            owner,
            issTimeLimit
        );

        /// @dev Reduces total active stakings in timeally manager and self destructs.
        _decreaseSelfFromTotalActive();

        _destroyStaking(DestroyReason.Merge);
    }

    /// @notice Processes a merge request from other staking contract.
    /// @param _childOwner: Owner address in the child smart contract.
    /// @param _childIssTimeLimit: IssTime of child smart contract.
    function receiveMerge(address _childOwner, uint256 _childIssTimeLimit)
        external
        payable
        returns (bool)
    {
        // ITimeAllyManager _timeallyManager = timeallyManager();
        require(
            timeallyManager.isStakingContractValid(msg.sender),
            "TAS: Only valid staking contract can call"
        );
        require(_childOwner == owner, "TAS: Owner of child and master stakings should be same");

        /// @dev Registers topup and adds total active stakings in timeally manager.
        _stakeTopUp(msg.value);

        /// @dev Increments the IssTime from the child into this staking.
        issTimeLimit = issTimeLimit.add(_childIssTimeLimit);

        timeallyManager.emitStakingMerge(msg.sender);
    }

    /// @notice Gets the amount monthly reward of NRT.
    /// @param _month: NRT Month.
    /// @return Amount of Monthly NRT Reward for the month.
    function getMonthlyReward(uint32 _month) public view returns (uint256) {
        // ITimeAllyManager _timeallyManager = timeallyManager();
        uint256 _totalActiveStaking = timeallyManager.getTotalActiveStaking(_month);
        uint256 _timeallyNrtReleased = timeallyManager.getMonthlyNRT(_month);

        return getPrincipalAmount(_month).mul(_timeallyNrtReleased).div(_totalActiveStaking);
    }

    /// @notice Extends the staking.
    /// @dev Increases the endMonth to next 12 months.
    function extend() public {
        uint32 _currentMonth = nrtManager.currentNrtMonth();
        require(
            _currentMonth <= endMonth,
            "TAS: Cannot extend for expired staking. Only option exists to IssTime in destroy mode"
        );

        uint32 _newEndMonth = _currentMonth + 12;

        require(_newEndMonth > endMonth, "TAS: Already extended");

        uint32 _previousEndMonth = endMonth;
        endMonth = _newEndMonth;

        timeallyManager.increaseActiveStaking(principal(), _previousEndMonth + 1, _newEndMonth);
    }

    /// @notice Topups the staking.
    /// @param _topupAmount: Amount of staking topup.
    function _stakeTopUp(uint256 _topupAmount) private {
        uint32 _currentMonth = nrtManager.currentNrtMonth();
        topups[_currentMonth] += int256(_topupAmount);

        emit Topup(int256(_topupAmount), msg.sender);
        timeallyManager.increaseActiveStaking(_topupAmount, _currentMonth + 1, endMonth);
    }

    /// @notice Gets the principal amount.
    /// @dev Calculates the principal amount based on topups.
    /// @param _month: NRT Month.
    /// @return Principal amount for the month.
    function getPrincipalAmount(uint32 _month) public view returns (uint256) {
        if (_month > endMonth) {
            return 0;
        }

        uint256 _principalAmount;

        for (uint32 i = startMonth - 1; i < _month; i++) {
            if (topups[i] > 0) {
                _principalAmount = _principalAmount.add(uint256(topups[i]));
            } else if (topups[i] < 0) {
                _principalAmount = _principalAmount.sub(uint256(topups[i] * -1));
            }
        }

        return _principalAmount;
    }

    /// @notice Gets principal amount for next month, can be treated to get staking's principal.
    /// @return Principal amount of the staking.
    function nextMonthPrincipalAmount() public view returns (uint256) {
        return principal();
    }

    /// @notice Gets principal amount for next month, can be treated to get staking's principal.
    /// @return Principal amount of the staking.
    function principal() public view returns (uint256) {
        uint32 _currentMonth = nrtManager.currentNrtMonth();
        return getPrincipalAmount(_currentMonth + 1);
    }

    /// @notice Gets claim status of NRT reward for a month.
    /// @param _month: NRT Month.
    /// @return Whether reward for the month is claimed.
    function isMonthClaimed(uint32 _month) public view returns (bool) {
        return claimedMonths[_month];
    }

    /// @notice Gets delegation status of a month.
    /// @param _month: NRT month.
    /// @return Whether staking has delegated a particular month.
    function isMonthDelegated(uint32 _month) public view returns (bool) {
        return delegations[_month] != address(0);
    }

    /// @notice Checks if staking has any delegation in present of future.
    /// @return Whether staking has any delegations.
    function hasDelegations() public view returns (bool) {
        uint32 _currentMonth = nrtManager.currentNrtMonth();

        for (uint32 i = _currentMonth; i <= endMonth; i++) {
            if (isMonthDelegated(i)) {
                return true;
            }
        }

        return false;
    }

    /// @notice Get delegation for a month.
    /// @param _month: NRT Month.
    /// @return Address of the platform the staking is delegated to.
    function getDelegation(uint32 _month) public view returns (address) {
        return delegations[_month];
    }

    /// @notice Gets allowed IssTime Limit for this staking.
    /// @param _destroy: Whether exit mode is selected.
    /// @return Actual IssTime Limit that can be taken.
    function getTotalIssTime(bool _destroy) public view returns (uint256) {
        uint256 _limit = issTimeLimit;

        uint32 _currentMonth = nrtManager.currentNrtMonth();

        // TODO: add percentage from the dayswapper, apply it to contract balance.
        uint256 _activeUsers = IDayswappers(kycDapp.resolveAddress("DAYSWAPPERS"))
            .getTotalMonthlyActiveDayswappers(_currentMonth);

        if (_activeUsers >= 10000) {
            uint256 leverD = getPrincipalAmount(_currentMonth + 1).mul(_activeUsers).div(
                10000 * 100
            );
            _limit = _limit.add(leverD);
        }

        uint256 _cap = address(this).balance;
        if (!_destroy) {
            /// @dev If destroy mode is not selected then cap to 97%.
            _cap = _cap.mul(97).div(100);
        }

        if (_limit > _cap) {
            // TODO: Shouldn't this be: _limit = _cap; ??
            _limit = _cap.mul(97).div(100);
        }

        return _limit;
    }

    /// @notice Gets live IssTime Interest amount.
    /// @return Amount of interest to be paid to submitIssTime.
    function getIssTimeInterest() public view returns (uint256) {
        require(issTimeTimestamp != 0, "TAS: IssTime not started");

        /// @dev 0.1% per day increases every second.
        return issTimeTakenValue.mul(block.timestamp - issTimeTimestamp + 1).div(86400).div(1000);
    }

    /// @notice Gets split fees based on staking age.
    /// @param _value: Amount to be split.
    /// @param _month: NRT Month.
    function getSplitFee(uint256 _value, uint256 _month) public view returns (uint256) {
        if (_month <= startMonth + 12) {
            return _value.mul(3).div(100);
        } else if (_month <= startMonth + 24) {
            return _value.mul(2).div(100);
        } else if (_month <= startMonth + 36) {
            return _value.mul(1).div(100);
        } else {
            return 0;
        }
    }
}
