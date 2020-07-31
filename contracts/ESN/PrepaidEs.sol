// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "../lib/SafeMath.sol";
import "../lib/PrepaidEsReceiver.sol";

/// @title PrepaidEs Tokens
/// @notice Wraps Era Swap token into a ERC20 token.
/// @dev Inspired from ERC-223.
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

    /// @notice Converts native tokens to wrapped format.
    /// @param _destination: Address on which prepaid to be credited.
    function convertToESP(address _destination) public payable {
        require(msg.value > 0, "ESP: Zero ES not allowed");
        balances[_destination] = balances[_destination].add(msg.value);
        emit Transfer(address(0), _destination, msg.value);
    }

    /// @notice Gets the prepaid balance of a holder.
    /// @param _owner: Address of tokens owner.
    /// @return PrepaidEs balance of token owner.
    function balanceOf(address _owner) public view returns (uint256) {
        return balances[_owner];
    }

    /// @notice Private method that transfers tokens to receiver.
    /// @param _receiver: Address of receiver.
    /// @param _value: Number of tokens to transfer.
    /// @return True if call is executed successfully.
    function transfer(address _receiver, uint256 _value) public returns (bool) {
        require(_value <= balances[msg.sender], "ERC20: Insufficient balance");

        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_receiver] = balances[_receiver].add(_value);

        emit Transfer(msg.sender, _receiver, _value);

        if (isContract(_receiver)) {
            // TODO: make the transaction general by allowing to pass arbitary data.
            (bool _success, ) = _receiver.call(
                abi.encodeWithSignature("prepaidFallback(address,uint256)", msg.sender, _value)
            );
            require(
                _success,
                "ESP: Receiver doesn't implement prepaidFallback or the execution failed"
            );
        }

        return true;
    }

    /// @notice Converts prepaid tokens back to native tokens.
    /// @param _receiver: Address of native tokens receiver.
    /// @param _value: Amount of prepaid es tokens to convert.
    /// @dev Only callable by authorised platforms.
    function transferLiquid(address _receiver, uint256 _value) public {
        // TODO: only allow certain smart contracts to call this method like TimeAlly or Dayswappers.
        require(_value <= balances[msg.sender], "ERC20: Insufficient balance");
        balances[msg.sender] = balances[msg.sender].sub(_value);
        emit Transfer(msg.sender, address(0), _value);

        (bool _success, ) = _receiver.call{ value: _value }("");
        require(_success, "NRTM: ES transfer failing");
    }

    /// @notice Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
    /// @param _delegate: The address which will spend the funds.
    /// @param _value: The amount of tokens to be spent.
    function approve(address _delegate, uint256 _value) public returns (bool) {
        allowed[msg.sender][_delegate] = _value;
        emit Approval(msg.sender, _delegate, _value);
        return true;
    }

    /// @notice Function to check the amount of tokens that an owner allowed to a spender.
    /// @param _owner: address The address which owns the funds.
    /// @param _delegate: address The address which will spend the funds.
    /// @return A uint256 specifying the amount of tokens still available for the spender.
    function allowance(address _owner, address _delegate) public view returns (uint256) {
        return allowed[_owner][_delegate];
    }

    /// @notice Transfer tokens from one address to another.
    /// @param _owner: address The address which you want to send tokens from.
    /// @param _receiver: address The address which you want to transfer to.
    /// @param _value: uint256 the amount of tokens to be transferred.
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

    /// @notice Checks whether an address is a smart contract or a normal wallet
    /// @param _addr: Address of receiver
    /// @return Whether an address is a smart contract or normal wallet
    function isContract(address _addr) private view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }
}
