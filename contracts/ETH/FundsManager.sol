// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "./ERC20.sol";
import "./PlasmaManager.sol";

contract FundsManager {
	ERC20 public token;
	PlasmaManager public plasmaManager;

	constructor(ERC20 _token, PlasmaManager _plasmaManager) public {
		token = _token;
		plasmaManager = _plasmaManager;
	}
}
