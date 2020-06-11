// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "../lib/SafeMath.sol";

contract ERC20 {
	string public constant name = "EraSwap";
	string public constant symbol = "ES";
	uint8 public constant decimals = 18;

	event Approval(address indexed tokenOwner, address indexed spender, uint256 tokens);
	event Transfer(address indexed from, address indexed to, uint256 tokens);

	mapping(address => uint256) balances;
	mapping(address => mapping(address => uint256)) allowed;

	uint256 public totalSupply;

	using SafeMath for uint256;

	constructor() public {
		totalSupply = 9100000000 ether;
		balances[msg.sender] = totalSupply;
	}

	// function totalSupply() public view returns (uint256) {
	//   return totalSupply;
	// }

	function balanceOf(address tokenOwner) public view returns (uint256) {
		return balances[tokenOwner];
	}

	function transfer(address receiver, uint256 numTokens) public returns (bool) {
		require(numTokens <= balances[msg.sender], "ERC20: insufficient balance");
		balances[msg.sender] = balances[msg.sender].sub(numTokens);
		balances[receiver] = balances[receiver].add(numTokens);
		emit Transfer(msg.sender, receiver, numTokens);
		return true;
	}

	function approve(address delegate, uint256 numTokens) public returns (bool) {
		allowed[msg.sender][delegate] = numTokens;
		emit Approval(msg.sender, delegate, numTokens);
		return true;
	}

	function allowance(address owner, address delegate) public view returns (uint256) {
		return allowed[owner][delegate];
	}

	function transferFrom(
		address owner,
		address buyer,
		uint256 numTokens
	) public returns (bool) {
		require(numTokens <= balances[owner], "ERC20: insufficient balance");
		require(numTokens <= allowed[owner][msg.sender], "insufficient allowance");

		balances[owner] = balances[owner].sub(numTokens);
		allowed[owner][msg.sender] = allowed[owner][msg.sender].sub(numTokens);
		balances[buyer] = balances[buyer].add(numTokens);
		emit Transfer(owner, buyer, numTokens);
		return true;
	}
}
