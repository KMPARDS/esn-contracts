// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface INRTReceiver {
    function receiveNrt(uint32 _currentNrtMonth) external payable;

    function getMonthlyNRT(uint32 _month) external view returns (uint256);
}
