// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

contract TimeAllyES {
    address public staker;
    uint256 public amount;
    uint256 public timestamp;
    uint256 public stakingMonth;
    uint256 public stakingPlanId;
    mapping(uint256 => bool) isMonthClaimed;

    constructor(uint256 _planId, uint256 _stakingMonth) public payable {
        staker = msg.sender;
        amount = msg.value;
        timestamp = now;
        stakingMonth = _stakingMonth;
        stakingPlanId = _planId;
    }
}
