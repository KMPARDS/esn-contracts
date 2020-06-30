// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../lib/SafeMath.sol";
import "./NRTManager.sol";
import "./TimeAllyStaking.sol";
import "./ValidatorManager.sol";

contract TimeAllyManager {
    using SafeMath for uint256;

    struct StakingPlan {
        uint256 months;
        uint256 fractionFrom15;
        bool estMode;
    }

    address public deployer;
    NRTManager public nrtManager;
    ValidatorManager public validatorManager;

    StakingPlan[] stakingPlans;

    mapping(address => bool) validStakingContracts;
    mapping(uint256 => uint256) totalActiveStakings;
    mapping(uint256 => uint256) timeAllyMonthlyNRT;

    modifier onlyStakingContract() {
        require(isStakingContractValid(msg.sender), "TimeAlly: Staking not recognized");
        _;
    }

    event NewStaking(address indexed staker, address indexed staking);

    constructor() public {
        deployer = msg.sender;
    }

    receive() external payable {
        require(msg.sender == address(nrtManager), "TimeAlly: Only NRT can send");
        uint256 currentNrtMonth = nrtManager.currentNrtMonth();
        timeAllyMonthlyNRT[currentNrtMonth] = msg.value;
    }

    function stake(uint256 _planId) public payable {
        require(msg.value > 0, "TimeAlly: No value");

        uint256 _currentNrtMonth = nrtManager.currentNrtMonth();
        TimeAllyStaking timeallyStakingContract = (new TimeAllyStaking){ value: msg.value }(
            _planId
        );

        for (uint256 i = 1; i <= stakingPlans[_planId].months; i++) {
            totalActiveStakings[_currentNrtMonth + i] += msg.value;
        }

        validStakingContracts[address(timeallyStakingContract)] = true;

        emit NewStaking(msg.sender, address(timeallyStakingContract));
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

    function setInitialValues(address _nrtAddress, address _validatorManager) public {
        require(msg.sender == deployer, "TimeAlly: Only deployer can call");
        nrtManager = NRTManager(_nrtAddress);
        validatorManager = ValidatorManager(_validatorManager);
    }

    // TODO: setup governance to this
    function addStakingPlan(
        uint256 _months,
        uint256 _fractionFrom15,
        bool _estMode
    ) public {
        require(msg.sender == deployer, "TimeAlly: Only deployer can call");

        stakingPlans.push(
            StakingPlan({ months: _months, fractionFrom15: _fractionFrom15, estMode: _estMode })
        );
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

    function getStakingPlan(uint256 _stakingPlanId) public view returns (StakingPlan memory) {
        return stakingPlans[_stakingPlanId];
    }

    function getStakingPlans() public view returns (StakingPlan[] memory) {
        return stakingPlans;
    }
}
