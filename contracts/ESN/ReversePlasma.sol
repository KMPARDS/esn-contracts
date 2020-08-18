// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

// TODO: remove unnecessary stuff
import "../lib/EthParser.sol";
import "../lib/BytesLib.sol";
import "../lib/RLP.sol";
import "../lib/RLPEncode.sol";
import "../lib/MerklePatriciaProof.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

/// @title Reverse Plasma Manager
/// @notice Manages block roots of Ethereum blockchain.
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

    // TODO: move this into a public governor contract address.
    /// @dev keeping deployer private since this wallet will be used for onetime
    ///     calling setInitialValues method, after that it has no special role.
    ///     Hence it doesn't make sence creating a method by marking it public.
    address private deployer;

    /// @notice The highest ETH finalised block number.
    uint256 public latestBlockNumber;

    /// @notice Era Swap ERC20 contract address.
    address public tokenOnETH;

    // TODO: to be taken from validator manager.
    address[] mainValidators;

    /// @dev Proposals of ETH blocks.
    mapping(uint256 => BlockHeaderProposal[]) ethHeaderProposals;

    /// @dev Finalized ETH blocks, used for processing deposits.
    mapping(uint256 => BlockHeaderFinalized) finalizedEthHeaders;

    /// @notice Emits when an ETH block is finalised (after consensus).
    event NewBlockHeader(uint256 blockNumber, uint256 proposalId);

    // any validator will be able to add a block proposal
    // TODO: replace validator mapping with a validator contract
    constructor() {
        deployer = msg.sender;
    }

    // TODO: redesign this with DAO governance
    function setInitialValues(
        address _tokenOnETH,
        uint256 _startBlockNumber,
        address[] memory _validators
    ) public {
        require(msg.sender == deployer, "RPLSMA: Only deployer can call");

        if (_tokenOnETH != address(0)) {
            require(address(tokenOnETH) == address(0), "RPLSMA: Token adrs already set");

            tokenOnETH = _tokenOnETH;
        }

        if (_startBlockNumber != 0) {
            require(latestBlockNumber == 0, "RPLSMA: StrtBlockNum already set");

            latestBlockNumber = _startBlockNumber - 1;
        }

        if (_validators.length > 0) {
            require(mainValidators.length == 0, "RPLSMA: Validators already set");

            // for (uint256 _i = 0; _i < _validators.length; _i++) {
            //     isValidator[_validators[_i]] = true;
            // }
            mainValidators = _validators;
        }
    }

    /// @notice Used by Kami to propose a block.
    /// @param _ethBlockNumber: ETH block number.
    /// @param _transactionsRoot: ETH block transactions root.
    /// @param _receiptsRoot: ETH block receipts root.
    function proposeBlock(
        uint256 _ethBlockNumber,
        bytes32 _transactionsRoot,
        bytes32 _receiptsRoot
    ) public {
        require(isValidator(msg.sender), "RPLSMA: not a validator");

        /// @dev check if the proposal already exists.
        (bool _doesProposalExist, uint256 _proposalId) = findProposal(
            _ethBlockNumber,
            _transactionsRoot,
            _receiptsRoot
        );

        if (!_doesProposalExist) {
            ethHeaderProposals[_ethBlockNumber].push(
                BlockHeaderProposal({
                    transactionsRoot: _transactionsRoot,
                    receiptsRoot: _receiptsRoot,
                    proposalValidators: new address[](0)
                })
            );

            _proposalId = ethHeaderProposals[_ethBlockNumber].length - 1;
        }

        /// @dev checks and removes if validator has voted to any other proposal.
        _removeValidatorFromAllProposals(ethHeaderProposals[_ethBlockNumber], msg.sender);

        ethHeaderProposals[_ethBlockNumber][_proposalId].proposalValidators.push(msg.sender);
    }

    /// @notice Finalizes a proposal on which consensus is acheived.
    /// @param _ethBlockNumber ETH block number of the proposal.
    /// @param _proposalId Proposal Id of the proposal.
    function finalizeProposal(uint256 _ethBlockNumber, uint256 _proposalId) public {
        require(_ethBlockNumber <= latestBlockNumber + 1, "RPLSMA: invalid block number");
        uint256 _votes;

        address[] storage proposalValidators = ethHeaderProposals[_ethBlockNumber][_proposalId]
            .proposalValidators;

        for (uint256 i = 0; i < proposalValidators.length; i++) {
            // TODO: check validator from validator contract instead
            if (isValidator(proposalValidators[i])) {
                _votes++;
            }
        }

        require(_votes.mul(3) > mainValidators.length.mul(2), "RPLSMA: not 66% validators");

        finalizedEthHeaders[_ethBlockNumber] = BlockHeaderFinalized({
            transactionsRoot: ethHeaderProposals[_ethBlockNumber][_proposalId].transactionsRoot,
            receiptsRoot: ethHeaderProposals[_ethBlockNumber][_proposalId].receiptsRoot
        });

        /// @dev to prevent replay.
        delete ethHeaderProposals[_ethBlockNumber][_proposalId].proposalValidators;

        latestBlockNumber = _ethBlockNumber;

        emit NewBlockHeader(_ethBlockNumber, _proposalId);
    }

    /// @notice Removes a validator from all proposals of a block.
    /// @dev Used when a validator is revoting to a new proposal.
    /// @param proposals: Storage reference of proposals array.
    /// @param _validator: Address of validator to remove.
    function _removeValidatorFromAllProposals(
        BlockHeaderProposal[] storage proposals,
        address _validator
    ) private {
        for (uint256 i = 0; i < proposals.length; i++) {
            address[] storage proposalValidators = proposals[i].proposalValidators;

            for (uint256 j = 0; j < proposalValidators.length; j++) {
                if (_validator == proposalValidators[j]) {
                    proposalValidators[j] = proposalValidators[proposalValidators.length - 1];
                    proposalValidators.pop();
                    break;
                }
            }
        }
    }

    // TODO: to be redesigned through Validator manager contract.
    function isValidator(address _validator) public view returns (bool) {
        for (uint256 i = 0; i < mainValidators.length; i++) {
            if (_validator == mainValidators[i]) {
                return true;
            }
        }

        return false;
    }

    /// @notice Gets validators of a proposal.
    /// @param _ethBlockNumber: ETH block number of the proposal.
    /// @param _proposalId: Id of the proposal.
    /// @return Returns the validator addresses who voted for the proposal.
    function getProposalValidators(uint256 _ethBlockNumber, uint256 _proposalId)
        public
        view
        returns (address[] memory)
    {
        return ethHeaderProposals[_ethBlockNumber][_proposalId].proposalValidators;
    }

    /// @notice Gets a finalised header.
    /// @param _blockNumber: ETH block number.
    /// @return Finalized Merkle roots based on consensus.
    /// @dev Must check if roots are non-zero.
    function getFinalizedEthHeader(uint256 _blockNumber)
        public
        view
        returns (BlockHeaderFinalized memory)
    {
        return finalizedEthHeaders[_blockNumber];
    }

    /// @notice Gets a block proposal.
    /// @param _ethBlockNumber: ETH block number.
    /// @param _proposalId: Id of the proposal.
    function getEthHeaderProposal(uint256 _ethBlockNumber, uint256 _proposalId)
        public
        view
        returns (BlockHeaderProposal memory)
    {
        return ethHeaderProposals[_ethBlockNumber][_proposalId];
    }

    /// @notice Gets number of proposals for the ETH block roots.
    /// @param _ethBlockNumber: ETH block number.
    /// @return Count of proposals.
    function getProposalsCount(uint256 _ethBlockNumber) public view returns (uint256) {
        return ethHeaderProposals[_ethBlockNumber].length;
    }

    /// @notice Gets all proposals for an ETH block.
    /// @param _ethBlockNumber: ETH block number.
    /// @return All proposals for the block number
    function getEthHeaderProposals(uint256 _ethBlockNumber)
        public
        view
        returns (BlockHeaderProposal[] memory)
    {
        return ethHeaderProposals[_ethBlockNumber];
    }

    /// @notice Finds if same proposal is already created
    /// @param _ethBlockNumber: ETH block number.
    /// @param _transactionsRoot: MPT transactions root
    /// @param _receiptsRoot: MPT receipts root
    /// @return Whether a proposal with same roots exists
    /// @return Proposal id for the proposal if it exists
    function findProposal(
        uint256 _ethBlockNumber,
        bytes32 _transactionsRoot,
        bytes32 _receiptsRoot
    ) public view returns (bool, uint256) {
        for (uint256 i = 0; i < ethHeaderProposals[_ethBlockNumber].length; i++) {
            if (
                _transactionsRoot == ethHeaderProposals[_ethBlockNumber][i].transactionsRoot &&
                _receiptsRoot == ethHeaderProposals[_ethBlockNumber][i].receiptsRoot
            ) {
                return (true, i);
            }
        }

        return (false, 0);
    }

    // TODO to be connected with Validator manager
    function getAllValidators() public view returns (address[] memory) {
        return mainValidators;
    }

    /// TODO to be connected with Validator manager
    function getValidator(uint256 _validatorIndex) public view returns (address) {
        return mainValidators[_validatorIndex];
    }
}
