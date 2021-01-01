// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IRentingDappManager {
    function payRewards(
        address _buyer,
        address _seller,
        uint256 _value,
        uint256 _distribute
    ) external payable;

    function isAdmin(address user) external view returns (bool);

    function raiseDispute(
        address _product,
        address _rent,
        string memory _details
    ) external;
}
