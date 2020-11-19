// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IBookingDappManager {

    function emitTickets(
        address buyer,
        uint256[] memory seats,
        string memory name,
        string memory location,
        uint256 startTime
    ) external;

    function emitCancel(
        address buyer,
        uint256[] memory seats,
        string memory name,
        string memory location,
        uint256 startTime
    ) external;

    // function payRewards(
    //     address _networker,
    //     uint256 _treeAmount,
    //     uint256 _introducerAmount
    // ) external payable;
}