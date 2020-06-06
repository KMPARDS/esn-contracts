// SPDX-License-Identifier: MIT

pragma solidity 0.6.8;

import "./ERC20.sol";
import "../lib/EthParser.sol";
import "../lib/ECVerify.sol";
import "../lib/RLP.sol";
import "../lib/RLPEncode.sol";
import "../lib/Merkle.sol";
import "../lib/MerklePatriciaProof.sol";
import "../lib/BytesLib.sol";

// this contract will store block headers
contract PlasmaManager {
	using RLP for bytes;
	using RLP for RLP.RLPItem;

	struct BunchHeader {
		uint256 startBlockNumber;
		uint256 bunchDepth; // number of blocks in bunch is 2^bunchDepth
		bytes32 transactionsMegaRoot;
		bytes32 receiptsMegaRoot;
	}

	uint256 public numberOfValidators;
	mapping(address => bool) public isValidator;
	mapping(bytes32 => bool) public processedWithdrawals;
	address[] public validators;
	address[] public signers;
	BunchHeader[] public bunches;

	/// @dev EIP-191 Prepend byte + Version byte
	bytes constant PREFIX = hex"1997";

	/// @dev ESN Testnet ChainID
	bytes32 constant DOMAIN_SEPERATOR = hex"6f3a1e66e989a1cf337b9dd2ce4c98a5e78763cf9f9bdaac5707038c66a4d74e";
	uint256 constant CHAIN_ID = 0x144c;

	/// @dev ESN Mainnet ChainID
	// bytes32 constant DOMAIN_SEPERATOR = hex"e46271463d569b31951a3c222883dd59f9b6ab2887f2ff847aa230eca6d341ae";
	// uint256 constant CHAIN_ID = 0x144d;

	ERC20 public token;

	/// @dev to avoid confusion, there will a same plasma contract address (deployed by )
	address public esnDepositAddress = address(this);

	event NewBunchHeader(
		uint256 _startBlockNumber,
		uint256 _bunchDepth,
		uint256 _bunchIndex
	);

	constructor(address[] memory _validators, ERC20 _token) public {
		for (uint256 _i = 0; _i < _validators.length; _i++) {
			isValidator[_validators[_i]] = true;
		}
		numberOfValidators = _validators.length;
		validators = _validators;

		token = _token;
	}

	function getAllValidators() public view returns (address[] memory) {
		return validators;
	}

	function getAllSigners() public view returns (address[] memory) {
		return signers;
	}

	function lastBunchIndex() public view returns (uint256) {
		return bunches.length;
	}

	// this is not needed as deposit address will be self address
	function setESNDepositAddress(address _esnDepositAddress) public {
		esnDepositAddress = _esnDepositAddress;
	}

	function submitBunchHeader(bytes memory _signedHeader) public {
		RLP.RLPItem[] memory _fullList = _signedHeader.toRLPItem().toList();
		RLP.RLPItem[] memory _headerArray = _fullList[0].toList();
		require(_headerArray.length == 4, "bunch header must have 4 members");

		BunchHeader memory _bunchHeader = BunchHeader({
			startBlockNumber: _headerArray[0].toUint(),
			bunchDepth: _headerArray[1].toUint(),
			transactionsMegaRoot: _headerArray[2].toBytes32(),
			receiptsMegaRoot: _headerArray[3].toBytes32()
		});

		require(
			_bunchHeader.startBlockNumber == getNextStartBlockNumber(),
			"invalid start block number"
		);

		bytes memory _headerRLP = _fullList[0].toRLPBytes();

		bytes32 _digest = keccak256(
			abi.encodePacked(PREFIX, DOMAIN_SEPERATOR, _headerRLP)
		);

		uint256 _numberOfValidSignatures;

		for (uint256 i = 1; i < _fullList.length; i++) {
			bytes memory _signature = _fullList[i].toBytes();

			(bool _success, address _signer) = ECVerify.ecrecovery(
				_digest,
				_signature
			);

			require(_success, "ecrecover should success");

			require(isValidator[_signer], "invalid validator signature");

			_numberOfValidSignatures++;
		}

		require(
			_numberOfValidSignatures > (numberOfValidators * 66) / 100,
			"66% validators should sign"
		);

		uint256 _bunchIndex = bunches.length;

		bunches.push(_bunchHeader);

		emit NewBunchHeader(
			_bunchHeader.startBlockNumber,
			_bunchHeader.bunchDepth,
			_bunchIndex
		);
	}

	function claimWithdrawal(bytes memory _rawTransactionProof) public {
		RLP.RLPItem[] memory _decodedProof = _rawTransactionProof
			.toRLPItem()
			.toList();

		uint256 _bunchIndex = _decodedProof[0].toUint();
		uint256 _blockNumber = _decodedProof[1].toUint();
		bytes memory _blockInBunchProof = _decodedProof[2].toBytes();
		bytes32 _txRoot = _decodedProof[3].toBytes32();
		bytes memory _rawTx = _decodedProof[4].toBytes();
		bytes memory _txIndex = _decodedProof[5].toBytes();
		bytes memory _txInBlockProof = _decodedProof[6].toBytes();

		bytes32 _txHash = keccak256(_rawTx);

		require(
			!processedWithdrawals[_txHash],
			"Already processed withdrawal for this transaction"
		);

		require(
			MerklePatriciaProof.verify(
				_rawTx,
				_txIndex,
				_txInBlockProof,
				_txRoot
			),
			"Invalid Patricia Proof"
		);

		/// now check for bunch inclusion proof
		require(
			Merkle.verify(
				_txRoot, // data to verify
				_blockNumber - bunches[_bunchIndex].startBlockNumber,
				bunches[_bunchIndex].transactionsMegaRoot,
				_blockInBunchProof
			),
			"Invalid Merkle Proof"
		);

		(address _signer, address _to, uint256 _value, ) = EthParser
			.parseTransaction(_rawTx);

		require(
			_to == esnDepositAddress,
			// _to == address(this), // in actual deployment
			"transfer should be made to ESN Deposit Address"
		);

		processedWithdrawals[_txHash] = true;

		token.transfer(_signer, _value);
	}

	function getNextStartBlockNumber() public view returns (uint256) {
		if (bunches.length == 0) return 0;
		return
			bunches[bunches.length - 1].startBlockNumber +
			2**bunches[bunches.length - 1].bunchDepth;
	}
}
