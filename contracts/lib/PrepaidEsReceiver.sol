// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

abstract contract PrepaidEsReceiver {
    function prepaidFallback(address, uint256) external virtual returns (bool);
}
