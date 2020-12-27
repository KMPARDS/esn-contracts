// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IBookingDappManager {
    event BoughtTickets(
        address indexed _event,
        address indexed buyer,
        uint256[] seats,
        string name,
        string location,
        uint256 startTime
    );

    event CancelTickets(
        address indexed _event,
        address indexed buyer,
        uint256[] seats,
        string name,
        string location,
        uint256 startTime
    );

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

    function payRewards(
        address _buyer,
        address _seller,
        uint256 _value,
        uint256 _distribute
    ) external payable;
}
