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

	/// @dev keeping deployer private since this wallet will be used for onetime
	///     calling setInitialValues method, after that it has no special role.
	///     Hence it doesn't make sence creating a method by marking it public.
	address private deployer;

	mapping(bytes32 => bool) public transactionClaimed;

	constructor() public {
		deployer = msg.sender;
	}

	function setInitialValues(
		address _token,
		address _plasmaManager,
		address _fundsManagerESN
	) public {
		require(msg.sender == deployer, "FM_ETH: Only deployer can call");
		address zeroAddress = address(0);

		if (_token != zeroAddress) {
			require(address(token) == zeroAddress, "FM_ETH: Token adrs already set");

			token = ERC20(_token);
		}

		if (_plasmaManager != zeroAddress) {
			require(address(plasmaManager) == zeroAddress, "FM_ETH: Plasma adrs already set");

			plasmaManager = PlasmaManager(_plasmaManager);
		}

		if (_fundsManagerESN != zeroAddress) {
			require(fundsManagerESN == zeroAddress, "FM_ETH: FM_ESN adrs already set");

			fundsManagerESN = _fundsManagerESN;
		}
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
