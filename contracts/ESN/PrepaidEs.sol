// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "../lib/SafeMath.sol";
import "./PrepaidEsReceiver.sol";

contract PrepaidEs {
    string public constant name = "PrepaidES";
    string public constant symbol = "ESP";
    uint8 public constant decimals = 18;

    event Approval(address indexed tokenOwner, address indexed spender, uint256 tokens);
    event Transfer(address indexed from, address indexed to, uint256 tokens);

    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowed;

    uint256 public totalSupply;

    using SafeMath for uint256;

    function convertToESP(address _receiver) public payable {
        require(msg.value > 0, "ESP: Zero ES not allowed");
        balances[_receiver] = balances[_receiver].add(msg.value);
        emit Transfer(address(0), _receiver, msg.value);
    }

    function balanceOf(address _tokenOwner) public view returns (uint256) {
        return balances[_tokenOwner];
    }

    function _transfer(address _receiver, uint256 _numTokens) private returns (bool) {
        require(_numTokens <= balances[msg.sender], "ERC20: Insufficient balance");
        balances[msg.sender] = balances[msg.sender].sub(_numTokens);
        balances[_receiver] = balances[_receiver].add(_numTokens);
        emit Transfer(msg.sender, _receiver, _numTokens);
        return true;
    }

    function transfer(address _destination, uint256 _value) public returns (bool) {
        _transfer(_destination, _value);

        if (isContract(_destination)) {
            (bool _success, ) = _destination.call(
                abi.encodeWithSignature("prepaidFallback(address,uint256)", msg.sender, _value)
            );
            require(
                _success,
                "ESP: Receiver doesn't implement prepaidFallback or the execution failed"
            );
            // PrepaidEsReceiver(_destination).prepaidFallback(msg.sender, _value);
        }

        return true;
    }

    function transferLiquid(address _receiver, uint256 _numTokens) public {
        // TODO: only allow certain smart contracts to call this method like TimeAlly or Dayswappers
        require(_numTokens <= balances[msg.sender], "ERC20: Insufficient balance");
        balances[msg.sender] = balances[msg.sender].sub(_numTokens);
        emit Transfer(msg.sender, address(0), _numTokens);

        (bool _success, ) = _receiver.call{ value: _numTokens }("");
        require(_success, "NRTM: ES transfer failing");
    }

    function approve(address _delegatee, uint256 _numTokens) public returns (bool) {
        allowed[msg.sender][_delegatee] = _numTokens;
        emit Approval(msg.sender, _delegatee, _numTokens);
        return true;
    }

    function allowance(address _owner, address _delegate) public view returns (uint256) {
        return allowed[_owner][_delegate];
    }

    function transferFrom(
        address _owner,
        address _receiver,
        uint256 _numTokens
    ) public returns (bool) {
        require(_numTokens <= balances[_owner], "ERC20: insufficient balance");
        require(_numTokens <= allowed[_owner][msg.sender], "insufficient allowance");

        balances[_owner] = balances[_owner].sub(_numTokens);
        allowed[_owner][msg.sender] = allowed[_owner][msg.sender].sub(_numTokens);
        balances[_receiver] = balances[_receiver].add(_numTokens);
        emit Transfer(_owner, _receiver, _numTokens);
        return true;
    }

    function isContract(address _addr) private view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }
}
