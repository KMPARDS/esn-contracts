// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { NRTManager } from "../../NRT/NRTManager.sol";
import { NRTReceiver } from "../../NRT/NRTReceiver.sol";
import { TimeAllyStaking } from "./TimeAllyStaking.sol";
import { TimeAllyClub } from "../Club/TimeAllyClub.sol";
import { IPrepaidEs } from "../../PrepaidEs/IPrepaidEs.sol";
import { PrepaidEsReceiver } from "../../PrepaidEs/PrepaidEsReceiver.sol";
import { EIP1167CloneFactory } from "../../../lib/EIP1167CloneFactory.sol";
import { ITimeAllyManager } from "./ITimeAllyManager.sol";
import { IDayswappers } from "../../Dayswappers/IDayswappers.sol";
import { RegistryDependent } from "../../KycDapp/RegistryDependent.sol";
import { WithAdminMode } from "../../Governance/AdminMode.sol";
import { Governable } from "../../Governance/Governable.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/Initializable.sol";

/// @title TimeAlly Manager
/// @notice Creates TimeAlly Stakings and Manages NRT distribution.
contract TimeAllyManager is
    Governable,
    WithAdminMode,
    RegistryDependent,
    NRTReceiver,
    PrepaidEsReceiver,
    EIP1167CloneFactory,
    ITimeAllyManager,
    Initializable
{
    using SafeMath for uint256;

    /// @dev Deployed contract with bytecode to be reused as EIP1167 Minimal Proxy.
    address public stakingTarget;

    /// @notice NRT Manager contract reference.
    // NRTManager public nrtManager;

    /// @notice Validator Manager contract reference.
    // ValidatorManager public validatorManager;

    /// @notice Prepaid ES contract reference.
    // PrepaidEs public prepaidEs;

    /// @notice TimeAlly Club contract reference.
    // TimeAllyClub public timeallyClub;

    // address public dayswappers;

    /// @notice Default months for stakings.
    uint32 public defaultMonths = 12;

    /// @notice Admin mode status
    /// @dev Admin mode is used to migrate stakings from earlier ETH contract into
    ///      ESN version. Once admin mode is switched off, cannot be turned on.
    // bool public adminMode = true;

    /// @dev Maps for active staking contracts deployed through this contract.
    mapping(address => bool) validStakingContracts;

    /// @dev Maps NRT month to total staked ES in the month, useful for efficient reward calculation.
    mapping(uint32 => uint256) totalActiveStakings;

    /// @dev Maps NRT month to NRT amount received in the month.
    // mapping(uint256 => uint256) timeAllyMonthlyNRT;

    modifier onlyStakingContract() {
        require(isStakingContractValid(msg.sender), "TimeAlly: STAKING_NOT_RECOGNIZED");
        _;
    }

    // modifier adminModeIsActive() {
    //     require(adminMode, "TimeAlly: Admin mode is not active");
    //     _;
    // }

    /// @notice Emits when a staking is minted, transferred or burned.
    event StakingTransfer(address indexed from, address indexed to, address indexed staking);

    /// @notice Emits when a staking is split.
    event StakingSplit(address indexed master, address indexed child);

    /// @notice Emits when a staking is merged.
    event StakingMerge(address indexed master, address indexed child);

    /// @notice Allows NRT Manager contract to send NRT share for TimeAlly.
    // function receiveNrt() external payable {
    //     require(msg.sender == address(nrtManager), "TimeAlly: Only NRT can send");
    //     uint256 currentNrtMonth = nrtManager.currentNrtMonth();
    //     timeAllyMonthlyNRT[currentNrtMonth] = msg.value;
    // }

    function initialize() public payable initializer {
        _initializeGovernable();
        _initializeAdminMode();

        if (defaultMonths == 0) {
            setDefaultMonths(12);
        }
    }

    function setDefaultMonths(uint32 _defaultMonths) public onlyGovernance {
        defaultMonths = _defaultMonths;
    }

    /// @notice Allows prepaid ES to transfer liquid tokens when staking with prepaid ES.
    receive() external payable {}

    /// @notice Deploys a new staking contract with value sent.
    function stake() public override payable {
        require(msg.value > 0, "TimeAlly: NO_VALUE_SENT");

        _stake(msg.value, msg.sender, 0, new bool[](0));

        _reportRewardToDayswappersTimeAllyClub(msg.sender, msg.value);
    }

    /// @notice Used in admin mode to send initial stakings.
    /// @param _receiver: Address of receipent of the staking contract.
    /// @param _initialIssTime: IssTime Limit to be given initially.
    /// @param _claimedMonths: Markings for claimed months in previous TimeAlly ETH contract.
    function sendStake(
        address _receiver,
        uint256 _initialIssTime,
        bool[] memory _claimedMonths
    ) public payable {
        require(msg.value > 0, "TimeAlly: NO_VALUE_SENT");

        if (!isAdminMode()) {
            require(_initialIssTime == 0, "TimeAlly: ISSTIME_SHOULD_BE_ZERO");
            require(_claimedMonths.length == 0, "TimeAlly: CLAIMEDMONTHS_SHOULD_BE_ZERO");
        }

        _stake(msg.value, _receiver, _initialIssTime, _claimedMonths);
    }

    /// @notice Withdraws the NRT rewards claimed by stakers (to process native token replacement).
    /// @param _amount: Amount of claimed NRT rewards by stakers.
    function withdrawClaimedNrt(uint256 _amount) public payable whenAdminMode onlyGovernance {
        if (_amount > 0) {
            (bool _success, ) = msg.sender.call{ value: _amount }("");
            require(_success, "FM_ESN: NATIVE_TRANSFER_FAILING");
        }

        // deactivating admin mode
        renounceAdminMode();
    }

    /// @dev Deploys and initiates a staking contract and updates total active stakings.
    /// @param _value: Amount of staking contract.
    /// @param _owner: Owner for the staking contract.
    /// @param _initialIssTimeLimit: Inital IssTimeLimit for the staking.
    /// @param _claimedMonths: Markings for claimed months in previous TimeAlly ETH contract.
    function _stake(
        uint256 _value,
        address _owner,
        uint256 _initialIssTimeLimit,
        bool[] memory _claimedMonths
    ) private returns (address) {
        TimeAllyStaking timeallyStakingContract = TimeAllyStaking(
            payable(createClone(stakingTarget))
        );

        validStakingContracts[address(timeallyStakingContract)] = true;

        emit StakingTransfer(address(0), _owner, address(timeallyStakingContract));

        timeallyStakingContract.init{ value: _value }(
            _owner,
            defaultMonths,
            _initialIssTimeLimit,
            address(kycDapp()),
            address(nrtManager()),
            // address(validatorManager),
            _claimedMonths
        );

        return address(timeallyStakingContract);
    }

    /// @notice Emits a StakingTransfer event.
    /// @dev Called by any valid staking contract when it transfers ownership.
    /// @param _oldOwner: Address of sender.
    /// @param _newOwner: Address of receiver.
    function emitStakingTransfer(address _oldOwner, address _newOwner)
        external
        override
        onlyStakingContract
    {
        emit StakingTransfer(_oldOwner, _newOwner, msg.sender);
    }

    /// @notice Emits a StakingMerge event.
    /// @dev Called by any valid staking contract when it splits.
    /// @param _childStaking: Address of new staking contract created my master staking.
    function emitStakingMerge(address _childStaking) external override onlyStakingContract {
        emit StakingMerge(msg.sender, _childStaking);
    }

    /// @notice Increases active stakings for a range of months.
    /// @param _amount: Amount to increase.
    /// @param _startMonth: Month from which increasing should be done
    /// @param _endMonth: Month upto which increasing should be done
    /// @dev Used by staking contracts when need to topup, split, merge, issTime and destroy.
    function increaseActiveStaking(
        uint256 _amount,
        uint32 _startMonth,
        uint32 _endMonth
    ) public override onlyStakingContract {
        for (uint32 i = _startMonth; i <= _endMonth; i++) {
            totalActiveStakings[i] = totalActiveStakings[i].add(_amount);
        }
    }

    /// @notice Decreases active stakings for a range of months.
    /// @param _amount: Amount to decrease.
    /// @param _startMonth: Month from which decreasing should be done
    /// @param _endMonth: Month upto which decreasing should be done
    /// @dev Used by staking contracts when need to topup, split, merge, issTime and destroy.
    function decreaseActiveStaking(
        uint256 _amount,
        uint32 _startMonth,
        uint32 _endMonth
    ) public override onlyStakingContract {
        for (uint32 i = _startMonth; i <= _endMonth; i++) {
            totalActiveStakings[i] = totalActiveStakings[i].sub(_amount);
        }
    }

    /// @notice Creates the child contract when spliting a staking, updates active stakings and emits event
    /// @param _owner: Owner of the master staking, is set as owner of the new staking that is created.
    /// @param _initialIssTime: IssTime Limit that is being passed while split.
    /// @param _masterEndMonth: Extension end month of master staking for adjusting the total active stakings.
    function splitStaking(
        address _owner,
        uint256 _initialIssTime,
        uint32 _masterEndMonth
    ) external override payable onlyStakingContract {
        uint32 _currentNrtMonth = nrtManager().currentNrtMonth();

        /// @dev Active staking of the child staking value is decreased (which was included in master staking)
        ///      When staking is created from below _stake(), it is again added to the active stakings.
        ///      This results in 12 subtractions and 12 additions in worst case, this is gas consuming, but
        ///      done for the sake of simplicity. To make this gas efficient, custom logic would be required to
        ///      be written instead of reusing existing helper methods.
        decreaseActiveStaking(msg.value, _currentNrtMonth + 1, _masterEndMonth);

        address _childStaking = _stake(msg.value, _owner, _initialIssTime, new bool[](0));
        emit StakingSplit(msg.sender, _childStaking);
    }

    /// @notice Removes the staking from valid staking.
    /// @param _owner: Address of owner (for emiting the event).
    function removeStaking(address _owner) external override onlyStakingContract {
        // uint256 _currentNrtMonth = nrtManager.currentNrtMonth();
        // decreaseActiveStaking(_amount, _currentNrtMonth + 1, _endMonth);

        validStakingContracts[msg.sender] = false;

        emit StakingTransfer(_owner, address(0), msg.sender);
    }

    function setStakingTarget(address _stakingTarget) public onlyGovernance {
        stakingTarget = _stakingTarget;
    }

    /// @notice Called by Prepaid contract then transfer done to this contract.
    /// @dev Used for creating a staking using prepaid ES
    /// @param _sender: The msg.sender in prepaid contract's transfer method.
    /// @param _value: Amount of prepaid ES tokens transferred.
    function prepaidFallback(address _sender, uint256 _value) public override returns (bool) {
        IPrepaidEs _prepaidEs = prepaidEs();
        require(msg.sender == address(_prepaidEs), "TAStaking: ONLY_PREPAID_ES_CAN_CALL");
        if (isStakingContractValid(_sender)) {
            /// @dev Help staking to convert prepaid to liquid for topup.
            _prepaidEs.transferLiquid(_sender, _value);
        } else {
            /// @dev New staking using prepaid set to timeally address.
            _prepaidEs.transferLiquid(address(this), _value);
            _stake(_value, _sender, 0, new bool[](0));

            _reportRewardToDayswappersTimeAllyClub(_sender, _value);
        }

        return true;
    }

    function _reportRewardToDayswappersTimeAllyClub(address _networker, uint256 _amount) private {
        timeallyClub().rewardToIntroducer(_networker, _amount);
        IDayswappers _dayswappers = dayswappers();
        _dayswappers.reportVolume(_networker, _amount);
        address _introducer = _dayswappers.resolveIntroducer(_networker);
        _dayswappers.reportVolume(_introducer, _amount);
    }

    /// @notice Processes NRT reward to the staker.
    /// @dev Called by staking contract when withdrawing monthly reward.
    /// @param _reward: Amount of reward to be processed.
    /// @param _rewardType: 0 => Liquid, 1 => Prepaid, 2 => Staked.
    function processNrtReward(uint256 _reward, RewardType _rewardType)
        public
        override
        onlyStakingContract
    {
        /// @dev This require won't likely fail, but it's kept for reason string.
        require(address(this).balance >= _reward, "TimeAlly: INSUFFICIENT_FUNDS_TO_PROCESS_REWARD");

        TimeAllyStaking staking = TimeAllyStaking(msg.sender);
        address _owner = staking.owner();

        uint256 _stakedReward = _reward.div(2);
        uint256 _prepaidReward;
        uint256 _liquidReward;
        uint256 _issTime;

        if (_rewardType == RewardType.Liquid) {
            _liquidReward = _stakedReward; //_reward.div(2);
        } else if (_rewardType == RewardType.Prepaid) {
            _issTime = _stakedReward;
            _prepaidReward = _stakedReward; //_reward.div(2);
        } else if (_rewardType == RewardType.Staked) {
            _issTime = _stakedReward.mul(225).div(100);
            _stakedReward = _reward;
        } else {
            /// @dev Invalid enum calls are auto-reverted but still, just in some case.
            require(false, "TimeAlly: INVALID_REWARD_TYPE_SPECIFIED");
        }

        /// @dev Send staking rewards as topup if any.
        if (_stakedReward > 0) {
            (bool _success, ) = msg.sender.call{ value: _stakedReward }("");
            require(_success, "TimeAlly: STAKING_TOPUP_FAILING");
        }

        /// @dev Send prepaid rewards if any.
        if (_prepaidReward > 0) {
            prepaidEs().convertToESP{ value: _prepaidReward }(_owner);
        }

        /// @dev Send liquid rewards if any.
        if (_liquidReward > 0) {
            (bool _success, ) = _owner.call{ value: _liquidReward }("");
            require(_success, "TimeAlly: LIQUID_ES_TRANSFER_TO_OWNER_FAILING");
        }

        /// @dev Increase IssTime Limit for the staking.
        if (_issTime > 0) {
            staking.increaseIssTime(_issTime);
        }
    }

    /// @notice Checks if a given address is a valid and active staking contract.
    /// @param _stakingContract: An address to check.
    /// @return Whether the address is a valid staking contract.
    /// @dev An address once a valid staking contract, is no longer a valid one if it is destroyed.
    function isStakingContractValid(address _stakingContract) public override view returns (bool) {
        return validStakingContracts[_stakingContract];
    }

    function getTotalActiveStaking(uint32 _month) public override view returns (uint256) {
        return totalActiveStakings[_month];
    }

    // function getTimeAllyMonthlyNRT(uint256 _month) public view returns (uint256) {
    //     return timeAllyMonthlyNRT[_month];
    // }
}
