// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../lib/SafeMath.sol";
import "./NRTManager.sol";
import "./TimeAllyStaking.sol";
import "./ValidatorManager.sol";
import "./PrepaidEs.sol";
import "./PrepaidEsReceiver.sol";

contract TimeAllyManager is PrepaidEsReceiver {
    using SafeMath for uint256;

    address public deployer;
    NRTManager public nrtManager;
    ValidatorManager public validatorManager;
    PrepaidEs public prepaidEs;

    // TODO: make this changable through governance
    uint256 public defaultMonths = 12;

    mapping(address => bool) validStakingContracts;
    mapping(uint256 => uint256) totalActiveStakings;
    mapping(uint256 => uint256) timeAllyMonthlyNRT;

    modifier onlyStakingContract() {
        require(isStakingContractValid(msg.sender), "TimeAlly: Staking not recognized");
        _;
    }

    event StakingTransfer(address indexed from, address indexed to, address indexed staking);

    constructor() public {
        deployer = msg.sender;
    }

    receive() external payable {
        require(msg.sender == address(nrtManager), "TimeAlly: Only NRT can send");
        uint256 currentNrtMonth = nrtManager.currentNrtMonth();
        timeAllyMonthlyNRT[currentNrtMonth] = msg.value;
    }

    function stake() public payable {
        require(msg.value > 0, "TimeAlly: No value");

        uint256 _currentNrtMonth = nrtManager.currentNrtMonth();
        TimeAllyStaking timeallyStakingContract = (new TimeAllyStaking){ value: msg.value }();

        for (uint256 i = 1; i <= defaultMonths; i++) {
            totalActiveStakings[_currentNrtMonth + i] += msg.value;
        }

        validStakingContracts[address(timeallyStakingContract)] = true;

        // emit NewStaking(msg.sender, address(timeallyStakingContract));
        emit StakingTransfer(address(0), msg.sender, address(timeallyStakingContract));
    }

    function emitStakingTransfer(address _oldOwner, address _newOwner)
        external
        onlyStakingContract
    {
        emit StakingTransfer(_oldOwner, _newOwner, msg.sender);
    }

    function increaseActiveStaking(uint256 _amount, uint256 _uptoMonth)
        external
        onlyStakingContract
    {
        uint256 _currentNrtMonth = nrtManager.currentNrtMonth();

        for (uint256 i = _currentNrtMonth + 1; i <= _uptoMonth; i++) {
            totalActiveStakings[i] = totalActiveStakings[i].add(_amount);
        }
    }

    function setInitialValues(
        address _nrtAddress,
        address payable _validatorManager,
        address _prepaidEs
    ) public {
        require(msg.sender == deployer, "TimeAlly: Only deployer can call");
        nrtManager = NRTManager(_nrtAddress);
        validatorManager = ValidatorManager(_validatorManager);
        prepaidEs = PrepaidEs(_prepaidEs);
    }

    function prepaidFallback(address _sender, uint256 _value) public override returns (bool) {
        require(msg.sender == address(prepaidEs), "TAStaking: Only PrepaidEs contract can call");
        if (isStakingContractValid(_sender)) {
            prepaidEs.transferLiquid(_sender, _value);
        } else {
            // new staking
        }

        return true;
    }

    function processNrtReward(uint256 _reward) public onlyStakingContract {
        /// @dev This require won't likely fail, but it's kept for reason string
        require(address(this).balance >= _reward, "TimeAlly: Insufficient NRT to process reward");

        TimeAllyStaking staking = TimeAllyStaking(msg.sender);
        address _owner = staking.owner();

        {
            uint256 _prepaidReward = _reward.div(4);
            prepaidEs.convertToESP{ value: _prepaidReward }(_owner);
        }

        {
            uint256 _stakedReward = _reward.div(4);
            (bool _success, ) = msg.sender.call{ value: _stakedReward }("");
            require(_success, "TimeAlly: Staking Topup is failing");
        }

        {
            uint256 _liquidReward = _reward.div(2);
            (bool _success, ) = _owner.call{ value: _liquidReward }("");
            require(_success, "TimeAlly: Liquid ES transfer to owner is failing");
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
