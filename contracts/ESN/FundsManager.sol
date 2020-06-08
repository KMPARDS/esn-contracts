// SPDX-License-Identifier: MIT

pragma solidity ^0.6.8;

import "./ReversePlasma.sol";

contract FundsManager {
	address public tokenOnETH;
	ReversePlasma public reversePlasma;

	constructor(address _tokenOnETH, ReversePlasma _reversePlasma) public {
		tokenOnETH = _tokenOnETH;
		reversePlasma = _reversePlasma;
	}
}
