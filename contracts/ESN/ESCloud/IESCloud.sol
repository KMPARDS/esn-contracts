// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IESCloud {
    function payRewards(
        address _buyer,
        address _seller,
        uint256 _value,
        uint256 _distribute
    ) external payable;

    function isAdmin(address user) external view returns (bool);

    function Dispute(address Host_address, bytes32 file) external;
}
