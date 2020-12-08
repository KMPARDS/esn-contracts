// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { INRTReceiver } from "./INRTReceiver.sol";

abstract contract NRTReceiver is INRTReceiver, RegistryDependent {
    /// @dev To be setable in the contract
    // NRTManager public nrtManager;

    /// @dev Maps NRT month to NRT amount received in the month.
    mapping(uint32 => uint256) monthlyNRT;

    event NRTReceived(uint32 indexed month, uint256 indexed amount, address sender);

    /// @notice Allows NRT Manager contract to send NRT share for TimeAlly.
    function receiveNrt(uint32 _currentNrtMonth) public payable virtual override {
        address payable _nrtManager = payable(resolveAddress("NRT_MANAGER"));
        require(msg.sender == _nrtManager, "NRTReceiver: ONLY_NRT_CAN_SEND");
        // uint256 currentNrtMonth = NRTManager(_nrtManager).currentNrtMonth();
        monthlyNRT[_currentNrtMonth] = msg.value;

        emit NRTReceived(_currentNrtMonth, msg.value, msg.sender);
    }

    function getMonthlyNRT(uint32 _month) public view virtual override returns (uint256) {
        return monthlyNRT[_month];
    }
}
