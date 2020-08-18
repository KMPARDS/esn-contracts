// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { NRTManager } from "./NRTManager.sol";

abstract contract NRTReceiver {
    /// @dev To be setable in the contract
    NRTManager public nrtManager;

    /// @dev Maps NRT month to NRT amount received in the month.
    mapping(uint256 => uint256) monthlyNRT;

    /// @notice Allows NRT Manager contract to send NRT share for TimeAlly.
    function receiveNrt() external payable {
        require(msg.sender == address(nrtManager), "NRTReceiver: Only NRT can send");
        uint256 currentNrtMonth = nrtManager.currentNrtMonth();
        monthlyNRT[currentNrtMonth] = msg.value;
    }

    function getMonthlyNRT(uint256 _month) public view returns (uint256) {
        return monthlyNRT[_month];
    }
}
