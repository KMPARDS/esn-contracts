// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "../lib/RLP.sol";
import "./ERC20.sol";
import "./PlasmaManager.sol";

contract FundsManager {
	using RLP for bytes;
	using RLP for RLP.RLPItem;

	ERC20 public token;
	PlasmaManager public plasmaManager;
	address public fundsManagerESN;
	mapping(bytes32 => bool) public transactionClaimed;

	constructor(ERC20 _token, PlasmaManager _plasmaManager) public {
		token = _token;
		plasmaManager = _plasmaManager;
	}

	function setFundsManagerESNAddress(address _fundsManagerESN) public {
		require(fundsManagerESN == address(0), "FM_ETH: FM_ESN adrs already set");
		fundsManagerESN = _fundsManagerESN;
		// TODO: make it callable by deployer only
	}

	function claimWithdrawal(bytes memory _rawTransactionProof) public {
		RLP.RLPItem[] memory _decodedProof = _rawTransactionProof.toRLPItem().toList();

		uint256 _bunchIndex = _decodedProof[0].toUint();
		uint256 _blockNumber = _decodedProof[1].toUint();
		bytes memory _blockInBunchProof = _decodedProof[2].toBytes();
		bytes32 _txRoot = _decodedProof[3].toBytes32();
		bytes memory _rawTx = _decodedProof[4].toBytes();
		bytes memory _txIndex = _decodedProof[5].toBytes();
		bytes memory _txInBlockProof = _decodedProof[6].toBytes();

		bytes32 _txHash = keccak256(_rawTx);

		require(!transactionClaimed[_txHash], "FM_ETH: Tx already claimed");

		require(
			MerklePatriciaProof.verify(_rawTx, _txIndex, _txInBlockProof, _txRoot),
			"FM_ETH: Invalid MPT Tx proof"
		);

		(uint256 _startBlockNumber, , bytes32 _transactionsMegaRoot, ) = plasmaManager.bunches(
			_bunchIndex
		);

		// now check for bunch inclusion proof
		require(
			Merkle.verify(
				_txRoot, // data to verify
				_blockNumber - _startBlockNumber,
				_transactionsMegaRoot,
				_blockInBunchProof
			),
			"FM_ETH: Invalid Merkle Proof"
		);

		(address _signer, address _to, uint256 _value, ) = EthParser.parseTransaction(_rawTx);

		require(_signer != address(0), "");
		require(_to == fundsManagerESN, "FM_ETH: Incorrect deposit addrs");

		transactionClaimed[_txHash] = true;
		token.transfer(_signer, _value);
	}
}
