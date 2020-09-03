// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface INRTManager {
    function currentNrtMonth() external view returns (uint32);

    function addToLuckPool() external payable;

    function addToBurnPool() external payable;
}
