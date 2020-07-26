// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

abstract contract PrepaidEsReceiver {
    function prepaidFallback(address, uint256) external virtual returns (bool);
}
