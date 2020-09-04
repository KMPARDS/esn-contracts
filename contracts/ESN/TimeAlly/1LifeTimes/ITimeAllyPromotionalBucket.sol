// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface ITimeAllyPromotionalBucket {
    function rewardToStaker(address _wallet, uint256 _stakingReward) external;

    function claimReward(address stakingContract) external;
}
