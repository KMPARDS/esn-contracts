// SPDX-License-Identifier: MIT

pragma solidity 0.6.8;

// TODO: remove unnecessary stuff
import "../lib/EthParser.sol";
import "../lib/BytesLib.sol";
import "../lib/RLP.sol";
import "../lib/RLPEncode.sol";
import "../lib/MerklePatriciaProof.sol";
import "../lib/SafeMath.sol";

contract ReversePlasma {
	using RLP for bytes;
	using RLP for RLP.RLPItem;

	using SafeMath for uint256;

	struct BlockHeaderFinalized {
		bytes32 transactionsRoot;
		bytes32 receiptsRoot;
	}

	struct BlockHeaderProposal {
		bytes32 transactionsRoot;
		bytes32 receiptsRoot;
		address[] proposalValidators;
	}

	uint256 public latestBlockNumber;
	address public tokenOnETH;
	address public reverseDepositAddress = address(this);
	address[] public mainValidators;

	mapping(uint256 => BlockHeaderProposal[]) public ethProposals;
	mapping(uint256 => BlockHeaderFinalized) public ethBlockchain;

	event NewBlockHeader(uint256 blockNumber, uint256 proposalId);

	// any validator will be able to add a block proposal
	// TODO: replace validator mapping with a validator contract
	constructor(address[] memory _validators, address _token) public {
		mainValidators = _validators;
		tokenOnETH = _token;
	}

	// TODO: remove this function or make it one time only
	function updateDepositAddress(address _reverseDepositAddress) public {
		reverseDepositAddress = _reverseDepositAddress;
	}

	function proposeBlock(bytes memory _blockHeader) public {
		require(isValidator(msg.sender), "R_PLASMA: not a validator");

		uint256 _blockNumber;
		bytes32 _transactionsRoot;
		bytes32 _receiptsRoot;

		assembly {
			let _pointer := add(_blockHeader, 0x20)
			_blockNumber := mload(_pointer)
			_transactionsRoot := mload(add(_pointer, 0x20))
			_receiptsRoot := mload(add(_pointer, 0x40))
		}

		/// @dev check if the proposal already exists
		(bool _doesProposalExist, uint256 _proposalId) = findProposal(
			_blockNumber,
			_transactionsRoot,
			_receiptsRoot
		);

		if (!_doesProposalExist) {
			ethProposals[_blockNumber].push(
				BlockHeaderProposal({
					transactionsRoot: _transactionsRoot,
					receiptsRoot: _receiptsRoot,
					proposalValidators: new address[](0)
				})
			);

			_proposalId = 0;
		}

		// @dev checks and removes if validator has voted to any other proposal
		_removeValidatorFromAllProposals(
			ethProposals[_blockNumber],
			msg.sender
		);

		ethProposals[_blockNumber][_proposalId].proposalValidators.push(
			msg.sender
		);
	}

	function finalizeProposal(uint256 _blockNumber, uint256 _proposalId)
		public
	{
		uint256 _votes;


			address[] storage proposalValidators
		 = ethProposals[_blockNumber][_proposalId].proposalValidators;

		for (uint256 i = 0; i < proposalValidators.length; i++) {
			// TODO: check validator from validator contract instead
			if (isValidator(proposalValidators[i])) {
				_votes++;
			}
		}

		if (_votes.mul(3) > mainValidators.length.mul(2)) {
			ethBlockchain[_blockNumber] = BlockHeaderFinalized({
				transactionsRoot: ethProposals[_blockNumber][_proposalId]
					.transactionsRoot,
				receiptsRoot: ethProposals[_blockNumber][_proposalId]
					.receiptsRoot
			});
		}
	}

	function _removeValidatorFromAllProposals(
		BlockHeaderProposal[] storage proposals,
		address _validator
	) private {
		for (uint256 i = 0; i < proposals.length; i++) {
			address[] storage proposalValidators = proposals[i]
				.proposalValidators;

			for (uint256 j = 0; j < proposalValidators.length; j++) {
				if (_validator == proposalValidators[j]) {
					proposalValidators[j] = proposalValidators[proposalValidators
						.length - 1];
					proposalValidators.pop();
					break;
				}
			}
		}
	}

	function isValidator(address _validator) public view returns (bool) {
		for (uint256 i = 0; i < mainValidators.length; i++) {
			if (_validator == mainValidators[i]) {
				return true;
			}
		}

		return false;
	}

	function findProposal(
		uint256 _blockNumber,
		bytes32 _transactionsRoot,
		bytes32 _receiptsRoot
	) public view returns (bool, uint256) {
		for (uint256 i = 0; i < ethProposals[_blockNumber].length; i++) {
			if (
				_transactionsRoot ==
				ethProposals[_blockNumber][i].transactionsRoot &&
				_receiptsRoot == ethProposals[_blockNumber][i].receiptsRoot
			) {
				return (true, i);
			}
		}

		return (false, 0);
	}

	function getAllValidators() public view returns (address[] memory) {
		return mainValidators;
	}

	// the below function replaced by removeValidatorFromAllProposals
	// function checkValidatorExistsInArray(
	// 	address[] storage _addressArray,
	// 	address _validator
	// ) private view returns (bool) {
	// 	for (uint256 i = 0; i < _addressArray.length; i++) {
	// 		if (_validator == _addressArray[i]) {
	// 			return true;
	// 		}
	// 	}

	// 	return false;
	// }

	// TODO: can move this to a different contract
	// function claimDeposit(bytes memory _rawProof) public {
	// 	RLP.RLPItem[] memory _decodedProof = _rawProof.toRLPItem().toList();

	// 	uint256 _blockNumber = _decodedProof[0].toUint();
	// 	bytes memory _txIndex = _decodedProof[1].toBytes();
	// 	bytes memory _rawTx = _decodedProof[2].toBytes();
	// 	bytes memory _txInBlockProof = _decodedProof[3].toBytes();
	// 	bytes memory _rawReceipt = _decodedProof[4].toBytes();
	// 	bytes memory _receiptInBlockProof = _decodedProof[5].toBytes();

	// 	require(
	// 		MerklePatriciaProof.verify(
	// 			_rawTx,
	// 			_txIndex,
	// 			_txInBlockProof,
	// 			ethBlock[_blockNumber].transactionsRoot
	// 		),
	// 		"Invalid Patricia Tree Transactions proof"
	// 	);

	// 	require(
	// 		MerklePatriciaProof.verify(
	// 			_rawReceipt,
	// 			_txIndex,
	// 			_receiptInBlockProof,
	// 			ethBlock[_blockNumber].receiptsRoot
	// 		),
	// 		"Invalid Patricia Tree Receipts proof"
	// 	);

	// 	bool _status = EthParser.parseReceipt(_rawReceipt);
	// 	require(_status, "Cannot process deposit for a failed transaction");

	// 	(
	// 		address _signer,
	// 		address _erc20Contract,
	// 		,
	// 		bytes memory _data
	// 	) = EthParser.parseTransaction(_rawTx);

	// 	require(
	// 		_erc20Contract == token,
	// 		"transfer should be made to EraSwap ERC20 contract"
	// 	);

	// 	bytes4 _methodSignature;
	// 	address _to;
	// 	uint256 _value;

	// 	assembly {
	// 		let _pointer := add(_data, 0x20)
	// 		_methodSignature := mload(_pointer)
	// 		_to := mload(add(0x4, _pointer))
	// 		_value := mload(add(0x24, _pointer))
	// 	}

	// 	require(
	// 		_methodSignature == hex"a9059cbb",
	// 		"transfer method should be there"
	// 	);
	// 	require(
	// 		_to == depositAddress,
	// 		"tokens should be sent to deposit address"
	// 	);

	// 	// uncomment this
	// 	// payable(_signer).transfer(_value);
	// }
}
