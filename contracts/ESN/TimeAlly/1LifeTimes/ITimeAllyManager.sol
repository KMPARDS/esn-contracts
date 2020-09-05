// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { IRegistryDependent } from "../../KycDapp/IRegistryDependent.sol";
import { INRTReceiver } from "../../NRT/INRTReceiver.sol";

interface ITimeAllyManager is INRTReceiver, IRegistryDependent {
    enum RewardType { Liquid, Prepaid, Staked }

    function stake() external payable;

    function isStakingContractValid(address _stakingContract) external view returns (bool);

    function getTotalActiveStaking(uint32 _month) external view returns (uint256);

    // Methods callable only from valid staking contracts:

    function emitStakingTransfer(address _oldOwner, address _newOwner) external;

    function emitStakingMerge(address _childStaking) external;

    function increaseActiveStaking(
        uint256 _amount,
        uint32 _startMonth,
        uint32 _endMonth
    ) external;

    function decreaseActiveStaking(
        uint256 _amount,
        uint32 _startMonth,
        uint32 _endMonth
    ) external;

    function splitStaking(
        address _owner,
        uint256 _initialIssTime,
        uint32 _masterEndMonth
    ) external payable;

    function removeStaking(address _owner) external;

    function processNrtReward(uint256 _reward, RewardType _rewardType) external;
}
