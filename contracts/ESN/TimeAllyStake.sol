// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "../lib/SafeMath.sol";
import "./NRTManager.sol";
import "./TimeAllyManager.sol";

contract TimeAllyStake {
    using SafeMath for uint256;

    NRTManager public nrtManager;
    TimeAllyManager public timeAllyManager;

    address public staker;
    uint256 public timestamp;
    uint256 public stakingStartMonth;
    uint256 public stakingPlanId;
    uint256 public stakingEndMonth;
    uint256 public unboundedBasicAmount;
    mapping(uint256 => uint256) public principalAmount;
    mapping(uint256 => bool) public isMonthClaimed;

    constructor(uint256 _planId) public payable {
        timeAllyManager = TimeAllyManager(msg.sender);
        nrtManager = NRTManager(timeAllyManager.nrtManager());
        staker = tx.origin;
        timestamp = now;
        stakingPlanId = _planId;
        stakingStartMonth = nrtManager.currentNrtMonth();
        (uint256 _months, , ) = timeAllyManager.stakingPlans(_planId);
        stakingEndMonth = stakingStartMonth + _months;

        for (uint256 i = stakingStartMonth + 1; i <= stakingEndMonth; i++) {
            principalAmount[i] = msg.value;
        }

        unboundedBasicAmount = msg.value.mul(2).div(100);
    }

    receive() external payable {
        _stakeTopUp(msg.value);
    }

    function _stakeTopUp(uint256 _topupAmount) private {
        uint256 _currentMonth = nrtManager.currentNrtMonth();

        for (uint256 i = _currentMonth + 1; i <= stakingEndMonth; i++) {
            principalAmount[i] = msg.value;
        }

        uint256 _increasedBasic = _topupAmount
            .mul(2)
            .div(100)
            .mul(stakingEndMonth - _currentMonth - 1)
            .div(stakingEndMonth - stakingStartMonth + 1);

        unboundedBasicAmount = unboundedBasicAmount.add(_increasedBasic);

        timeAllyManager.increaseActiveStake(_topupAmount, stakingEndMonth);
    }
}
