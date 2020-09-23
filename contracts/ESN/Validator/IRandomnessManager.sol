// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IRandomnessManager {
    function getRandomBytes32() external returns (bytes32);

    function getRandomBytes(uint256 _numberOfBytes) external returns (bytes memory);
}
