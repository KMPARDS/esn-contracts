// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "../lib/SafeMath.sol";
import "./NRTManager.sol";
import "./TimeAllyStaking.sol";
import "./ValidatorManager.sol";
import "./PrepaidEs.sol";
import "../lib/PrepaidEsReceiver.sol";
import "../lib/EIP1167CloneFactory.sol";

contract TimeAllyManager is PrepaidEsReceiver, EIP1167CloneFactory {
    using SafeMath for uint256;

    enum RewardType { Liquid, Prepaid, Staked }

    address public deployer;
    address public stakingTarget;
    NRTManager public nrtManager;
    ValidatorManager public validatorManager;
    PrepaidEs public prepaidEs;

    // TODO: make this changable through governance
    uint256 public defaultMonths = 12;
    bool public adminMode = true;

    mapping(address => bool) validStakingContracts;
    mapping(uint256 => uint256) totalActiveStakings;
    mapping(uint256 => uint256) timeAllyMonthlyNRT;

    modifier onlyStakingContract() {
        require(isStakingContractValid(msg.sender), "TimeAlly: Staking not recognized");
        _;
    }

    modifier adminModeIsActive() {
        require(adminMode, "TimeAlly: Admin mode is not active");
        _;
    }

    event StakingTransfer(address indexed from, address indexed to, address indexed staking);
    event StakingSplit(address indexed master, address indexed child);
    event StakingMerge(address indexed master, address indexed child);

    constructor() {
        deployer = msg.sender;
    }

    function receiveNrt() external payable {
        require(msg.sender == address(nrtManager), "TimeAlly: Only NRT can send");
        uint256 currentNrtMonth = nrtManager.currentNrtMonth();
        timeAllyMonthlyNRT[currentNrtMonth] = msg.value;
    }

    receive() external payable {}

    function stake() public payable {
        require(msg.value > 0, "TimeAlly: No value");

        _stake(msg.value, msg.sender, 0, new bool[](0));
    }

    function sendStake(
        address _receiver,
        uint256 _initialIssTime,
        bool[] memory _claimedMonths
    ) public payable adminModeIsActive {
        require(msg.value > 0, "TimeAlly: No value");

        _stake(msg.value, _receiver, _initialIssTime, _claimedMonths);
    }

    function withdrawClaimedNrt(uint256 _amount) public payable adminModeIsActive {
        if (_amount > 0) {
            msg.sender.transfer(_amount);
        }
    }

    function deactivateAdminMode() public adminModeIsActive {
        // TODO: make this callable by the governor
        adminMode = false;
    }

    function _stake(
        uint256 _value,
        address _owner,
        uint256 _initialIssTimeLimit,
        bool[] memory _claimedMonths
    ) private returns (address) {
        uint256 _currentNrtMonth = nrtManager.currentNrtMonth();

        TimeAllyStaking timeallyStakingContract = TimeAllyStaking(
            payable(createClone(stakingTarget))
        );

        timeallyStakingContract.init{ value: _value }(
            _owner,
            defaultMonths,
            _initialIssTimeLimit,
            address(nrtManager),
            address(validatorManager),
            _claimedMonths
        );

        for (uint256 i = 1; i <= defaultMonths; i++) {
            totalActiveStakings[_currentNrtMonth + i] += _value;
        }

        validStakingContracts[address(timeallyStakingContract)] = true;

        emit StakingTransfer(address(0), _owner, address(timeallyStakingContract));

        return address(timeallyStakingContract);
    }

    function emitStakingTransfer(address _oldOwner, address _newOwner)
        external
        onlyStakingContract
    {
        emit StakingTransfer(_oldOwner, _newOwner, msg.sender);
    }

    function emitStakingMerge(address _childStaking) external onlyStakingContract {
        emit StakingMerge(msg.sender, _childStaking);
    }

    function increaseActiveStaking(
        uint256 _amount,
        uint256 _startMonth,
        uint256 _endMonth
    ) public onlyStakingContract {
        for (uint256 i = _startMonth; i <= _endMonth; i++) {
            totalActiveStakings[i] = totalActiveStakings[i].add(_amount);
        }
    }

    function decreaseActiveStaking(
        uint256 _amount,
        uint256 _startMonth,
        uint256 _endMonth
    ) public onlyStakingContract {
        for (uint256 i = _startMonth; i <= _endMonth; i++) {
            totalActiveStakings[i] = totalActiveStakings[i].sub(_amount);
        }
    }

    function splitStaking(
        address _owner,
        uint256 _initialIssTime,
        uint256 _masterEndMonth
    ) external payable onlyStakingContract {
        uint256 _currentNrtMonth = nrtManager.currentNrtMonth();
        decreaseActiveStaking(msg.value, _currentNrtMonth + 1, _masterEndMonth);

        address _childStaking = _stake(msg.value, _owner, _initialIssTime, new bool[](0));
        emit StakingSplit(msg.sender, _childStaking);
    }

    function removeStaking(address _owner) external onlyStakingContract {
        // uint256 _currentNrtMonth = nrtManager.currentNrtMonth();
        // decreaseActiveStaking(_amount, _currentNrtMonth + 1, _endMonth);

        validStakingContracts[msg.sender] = false;

        emit StakingTransfer(_owner, address(0), msg.sender);
    }

    function setInitialValues(
        address payable _nrtAddress,
        address _validatorManager,
        address _prepaidEs,
        address _stakingTarget
    ) public {
        require(msg.sender == deployer, "TimeAlly: Only deployer can call");
        nrtManager = NRTManager(_nrtAddress);
        validatorManager = ValidatorManager(_validatorManager);
        prepaidEs = PrepaidEs(_prepaidEs);
        stakingTarget = _stakingTarget;
    }

    function prepaidFallback(address _sender, uint256 _value) public override returns (bool) {
        require(msg.sender == address(prepaidEs), "TAStaking: Only PrepaidEs contract can call");
        if (isStakingContractValid(_sender)) {
            /// @dev help staking to convert prepaid to liquid for topup
            prepaidEs.transferLiquid(_sender, _value);
        } else {
            /// @dev new staking using prepaid set to timeally address
            // @TODO this doesn't work because receive() on TA Manager reverts
            prepaidEs.transferLiquid(address(this), _value);
            _stake(_value, _sender, 0, new bool[](0));
        }

        return true;
    }

    function processNrtReward(uint256 _reward, RewardType _rewardType) public onlyStakingContract {
        /// @dev This require won't likely fail, but it's kept for reason string
        require(address(this).balance >= _reward, "TimeAlly: Insufficient NRT to process reward");

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
            /// @dev Invalid enum calls are auto-reverted but still, just in some case
            require(false, "TimeAlly: Invalid reward type specified");
        }

        /// @dev send staking rewards as topup if any
        if (_stakedReward > 0) {
            (bool _success, ) = msg.sender.call{ value: _stakedReward }("");
            require(_success, "TimeAlly: Staking Topup is failing");
        }

        /// @dev send prepaid rewards if any
        if (_prepaidReward > 0) {
            prepaidEs.convertToESP{ value: _prepaidReward }(_owner);
        }

        /// @dev send liquid rewards if any
        if (_liquidReward > 0) {
            (bool _success, ) = _owner.call{ value: _liquidReward }("");
            require(_success, "TimeAlly: Liquid ES transfer to owner is failing");
        }

        /// @dev increase IssTime Limit for the staking
        if (_issTime > 0) {
            staking.increaseIssTime(_issTime);
        }
    }

    function isStakingContractValid(address _stakingContract) public view returns (bool) {
        return validStakingContracts[_stakingContract];
    }

    function getTotalActiveStaking(uint256 _month) public view returns (uint256) {
        return totalActiveStakings[_month];
    }

    function getTimeAllyMonthlyNRT(uint256 _month) public view returns (uint256) {
        return timeAllyMonthlyNRT[_month];
    }
}
