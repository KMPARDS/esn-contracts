// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../lib/SafeMath.sol";
import "./NRTManager.sol";
import "./TimeAllyStake.sol";

contract TimeAllyManager {
    using SafeMath for uint256;

    struct StakingPlan {
        uint256 months;
        uint256 fractionFrom15;
        bool estMode;
    }

    address public deployer;
    NRTManager public nrtManager;

    StakingPlan[] public stakingPlans;

    mapping(address => bool) public validStakingContracts;
    mapping(uint256 => uint256) public totalActiveStakings;
    mapping(uint256 => uint256) public timeAllyMonthlyNRT;

    modifier onlyStakeContract() {
        require(validStakingContracts[msg.sender], "TimeAlly: Staking not recognized");
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
        TimeAllyStake timeallyStakeContract = (new TimeAllyStake){ value: msg.value }(_planId);

        for (uint256 i = 1; i <= stakingPlans[_planId].months; i++) {
            totalActiveStakings[_currentNrtMonth + i] += msg.value;
        }

        validStakingContracts[address(timeallyStakeContract)] = true;

        emit NewStaking(msg.sender, address(timeallyStakeContract));
    }

    function increaseActiveStake(uint256 _amount, uint256 _uptoMonth) external onlyStakeContract {
        uint256 _currentNrtMonth = nrtManager.currentNrtMonth();

        for (uint256 i = _currentNrtMonth + 1; i <= _uptoMonth; i++) {
            totalActiveStakings[i] = totalActiveStakings[i].add(_amount);
        }
    }

    function setInitialValues(address nrtAddress) public {
        require(msg.sender == deployer, "TimeAlly: Only deployer can call");
        nrtManager = NRTManager(nrtAddress);
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
}
