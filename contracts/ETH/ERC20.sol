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

    function balanceOf(address _owner) public view returns (uint256) {
        return balances[_owner];
    }

    function transfer(address _receiver, uint256 _value) public returns (bool) {
        require(_value <= balances[msg.sender], "ERC20: Insufficient balance");
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_receiver] = balances[_receiver].add(_value);
        emit Transfer(msg.sender, _receiver, _value);
        return true;
    }

    function approve(address _delegate, uint256 _value) public returns (bool) {
        allowed[msg.sender][_delegate] = _value;
        emit Approval(msg.sender, _delegate, _value);
        return true;
    }

    function allowance(address _owner, address _delegate) public view returns (uint256) {
        return allowed[_owner][_delegate];
    }

    function transferFrom(
        address _owner,
        address _receiver,
        uint256 _value
    ) public returns (bool) {
        require(_value <= balances[_owner], "ERC20: insufficient balance");
        require(_value <= allowed[_owner][msg.sender], "insufficient allowance");

        balances[_owner] = balances[_owner].sub(_value);
        allowed[_owner][msg.sender] = allowed[_owner][msg.sender].sub(_value);
        balances[_receiver] = balances[_receiver].add(_value);

        emit Transfer(_owner, _receiver, _value);
        return true;
    }
}
