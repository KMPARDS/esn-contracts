// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IDelegatable {
    function registerDelegation(uint32 _month, bytes memory _extraData) external;
}
