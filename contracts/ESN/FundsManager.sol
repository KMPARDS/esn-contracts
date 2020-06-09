// SPDX-License-Identifier: MIT

pragma solidity ^0.6.8;

import "../lib/RLP.sol";
import "../lib/MerklePatriciaProof.sol";
import "./ReversePlasma.sol";

contract FundsManager {
	using RLP for bytes;
	using RLP for RLP.RLPItem;

	address public tokenOnETH;
	address public fundsManagerETH;
	ReversePlasma public reversePlasma;

	constructor(address _tokenOnETH, ReversePlasma _reversePlasma) public payable {
		tokenOnETH = _tokenOnETH;
		reversePlasma = _reversePlasma;
	}

	function setFundsManagerETHAddress(address _fundsManagerETH) public {
		require(fundsManagerETH == address(0), "FM_ESN: FM_ETH adrs already set");
		fundsManagerETH = _fundsManagerETH;
		// TODO: make it callable by deployer only
	}

	function claimDeposit(bytes memory _rawProof) public {
		RLP.RLPItem[] memory _decodedProof = _rawProof.toRLPItem().toList();

		uint256 _blockNumber = _decodedProof[0].toUint();

		bytes memory _txIndex = _decodedProof[1].toBytes();
		bytes memory _rawTx = _decodedProof[2].toBytes();
		bytes memory _txInBlockProof = _decodedProof[3].toBytes();
		bytes memory _rawReceipt = _decodedProof[4].toBytes();
		bytes memory _receiptInBlockProof = _decodedProof[5].toBytes();

		(bytes32 transactionsRoot, bytes32 receiptsRoot) = reversePlasma.ethBlockchain(
			_blockNumber
		);

		require(transactionsRoot != bytes32(0), "FM_ESN: Block not finalized");
		require(receiptsRoot != bytes32(0), "FM_ESN: Block not finalized");

		require(
			MerklePatriciaProof.verify(_rawTx, _txIndex, _txInBlockProof, transactionsRoot),
			"FM_ESN: Invalid MPT Tx proof"
		);

		require(
			MerklePatriciaProof.verify(_rawReceipt, _txIndex, _receiptInBlockProof, receiptsRoot),
			"FM_ESN: Invalid MPT Rc proof"
		);

		bool _status = EthParser.parseReceipt(_rawReceipt);
		require(_status, "FM_ESN: Rc failed");

		(address _signer, address _erc20Contract, , bytes memory _data) = EthParser
			.parseTransaction(_rawTx);

		require(_erc20Contract == tokenOnETH, "FM_ESN: Invalid ERC20");

		bytes4 _methodSignature;
		address _to;
		uint256 _value;

		assembly {
			let _pointer := add(_data, 0x20)
			_methodSignature := mload(_pointer)
			_to := mload(add(0x4, _pointer))
			_value := mload(add(0x24, _pointer))
		}

		require(_methodSignature == hex"a9059cbb", "FM_ESN: Invalid ERC20 transfer");
		require(_to == fundsManagerETH, "FM_ESN: Invalid deposit address");

		// uncomment this
		payable(_signer).transfer(_value);
	}
}
