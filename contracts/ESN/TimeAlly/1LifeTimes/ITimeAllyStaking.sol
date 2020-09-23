// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface ITimeAllyStaking {
    function startMonth() external view returns (uint32);

    function principal() external view returns (uint256);

    function increaseIssTime(uint256 _increaseValue) external;
}
