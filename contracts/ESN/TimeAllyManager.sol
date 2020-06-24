// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "./NRTManager.sol";
import "./TimeAllyES.sol";

contract TimeAllyManager {
    struct StakingPlan {
        uint256 months;
        uint256 fractionFrom15;
        bool est;
    }

    address deployer;
    NRTManager nrtManager;

    StakingPlan[] public stakingPlans;

    mapping(address => bool) public validStakingContracts;
    mapping(uint256 => uint256) public totalActiveStakings;
    mapping(uint256 => uint256) public timeAllyMonthlyNRT;

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
        TimeAllyES timeallyContract = (new TimeAllyES){ value: msg.value }(
            _planId,
            _currentNrtMonth
        );

        for (uint256 i = 1; i <= stakingPlans[_planId].months; i++) {
            totalActiveStakings[_currentNrtMonth + i] += msg.value;
        }

        validStakingContracts[address(timeallyContract)] = true;

        emit NewStaking(msg.sender, address(timeallyContract));
    }

    function setInitialValues(address nrtAddress) public {
        require(msg.sender == deployer, "TimeAlly: Only deployer can call");
        deployer = address(0);
        nrtManager = NRTManager(nrtAddress);
    }
}
