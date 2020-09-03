// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { NRTManager } from "./NRTManager.sol";
import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";
import { INRTReceiver } from "./INRTReceiver.sol";

abstract contract NRTReceiver is INRTReceiver, RegistryDependent {
    /// @dev To be setable in the contract
    // NRTManager public nrtManager;

    /// @dev Maps NRT month to NRT amount received in the month.
    mapping(uint32 => uint256) monthlyNRT;

    /// @notice Allows NRT Manager contract to send NRT share for TimeAlly.
    function receiveNrt(uint32 _currentNrtMonth) public virtual override payable {
        address payable _nrtManager = payable(resolveAddress("NRT_MANAGER"));
        require(msg.sender == _nrtManager, "NRTReceiver: Only NRT can send");
        // uint256 currentNrtMonth = NRTManager(_nrtManager).currentNrtMonth();
        monthlyNRT[_currentNrtMonth] = msg.value;
    }

    function getMonthlyNRT(uint32 _month) public virtual override view returns (uint256) {
        return monthlyNRT[_month];
    }
}
