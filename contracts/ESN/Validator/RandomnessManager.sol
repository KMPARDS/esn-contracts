// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { IRandomnessManager } from "./IRandomnessManager.sol";

/// @title Randomness Manager
/// @notice Generates pseudo random bytes.
/// @dev Relies on last block hash as the source of entropy.
contract RandomnessManager is IRandomnessManager {
    /// @dev Stores last used seed in case of multiple calls in same block
    bytes32 existingSeed;

    /// @dev Number of calls in the same block
    uint256 nonce;

    /// @notice Generates pseudo random bytes
    /// @return Pseudo random bytes
    function getRandomBytes32() public override returns (bytes32) {
        bytes32 _latestSeed = getSeed();
        if (_latestSeed != existingSeed) {
            existingSeed = _latestSeed;
            nonce = 0;
        }

        /// @dev Increments the nonce for multiple calls in same block
        nonce++;

        return keccak256(abi.encodePacked(existingSeed, nonce));
    }

    /// @notice Generates pseudo random bytes as per requirement
    /// @param _numberOfBytes Number of bytes32
    /// @return Pseudo random bytes
    function getRandomBytes(uint256 _numberOfBytes) external override returns (bytes memory) {
        bytes memory _concat;
        for (uint256 i = 0; i < _numberOfBytes; i++) {
            _concat = abi.encodePacked(_concat, getRandomBytes32());
        }
        return _concat;
    }

    /// @dev Gets the seed to work with
    /// @return Last block hash
    function getSeed() private view returns (bytes32) {
        return blockhash(block.number - 1);
    }
}
