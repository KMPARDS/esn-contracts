// SPDX-License-Identifier: MIT

pragma solidity ^0.6.8;

import "./ERC20.sol";

contract FundsManager {
	ERC20 public token;

	constructor(ERC20 _token) public {
		token = _token;
	}
}
