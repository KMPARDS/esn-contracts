// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IRegistry {
    function getAddress(bytes32 _identifier) external view returns (address);
}
