// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPrepaidEs is IERC20 {
    function convertToESP(address _destination) external payable;

    function transferLiquid(address _receiver, uint256 _value) external;
}
