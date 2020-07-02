// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

contract RandomManager {
    bytes32 existingSeed;
    uint256 nonce;

    function getRandomBytes32() public returns (bytes32) {
        bytes32 _latestSeed = getSeed();
        if (_latestSeed != existingSeed) {
            existingSeed = _latestSeed;
            nonce = 0;
        }

        nonce++;
        return keccak256(abi.encodePacked(existingSeed, nonce));
    }

    function getMultipleRandomBytes(uint256 _numberOfBytes) external returns (bytes memory) {
        bytes memory _concat;
        for (uint256 i = 0; i < _numberOfBytes; i++) {
            _concat = abi.encodePacked(_concat, getRandomBytes32());
        }
        return _concat;
    }

    function getSeed() private view returns (bytes32) {
        return blockhash(block.number - 1);
    }
}
