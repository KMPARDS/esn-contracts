// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { Governable } from "../Governance/Governable.sol";

/// @title Reverse Plasma Manager
/// @notice Manages block roots of Ethereum blockchain.
contract ReversePlasma is Governable {
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

    /// @notice The highest ETH finalised block number.
    uint256 public latestBlockNumber;

    // TODO beta: to be taken from validator manager.
    // This can be addressed for Beta, since in Alpha, foundation nodes will be there
    address[] mainValidators;

    /// @dev Proposals of ETH blocks.
    mapping(uint256 => BlockHeaderProposal[]) ethHeaderProposals;

    /// @dev Finalized ETH blocks, used for processing deposits.
    mapping(uint256 => BlockHeaderFinalized) finalizedEthHeaders;

    /// @notice Emits when an ETH block is finalised (after consensus).
    event NewBlockHeader(uint256 blockNumber, uint256 proposalId);

    // any validator will be able to add a block proposal
    // TODO beta: replace validator mapping with a validator contract
    // constructor() {
    //     deployer = msg.sender;
    // }

    function setInitialValues(uint256 _startBlockNumber, address[] memory _validators)
        public
        onlyGovernance
    {
        if (_startBlockNumber != 0) {
            require(latestBlockNumber == 0, "RPLSMA: START_BLOCK_NUMBER_ALREADY_SET");

            latestBlockNumber = _startBlockNumber - 1;
        }

        // if (_validators.length > 0) {
        setValidators(_validators);
        // }
    }

    function setValidators(address[] memory _validators) public onlyGovernance {
        mainValidators = _validators;
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
        require(isValidator(msg.sender), "RPLSMA: NOT_A_VALIDATOR");

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
        require(_ethBlockNumber <= latestBlockNumber + 1, "RPLSMA: INVALID_BLOCK_NUMBER");
        uint256 _votes;

        address[] storage proposalValidators = ethHeaderProposals[_ethBlockNumber][_proposalId]
            .proposalValidators;

        for (uint256 i = 0; i < proposalValidators.length; i++) {
            // TODO beta: check validator from validator contract instead
            // This can be addressed for Beta, since in Alpha, foundation nodes will be there
            if (isValidator(proposalValidators[i])) {
                _votes++;
            }
        }

        require(_votes.mul(3) > mainValidators.length.mul(2), "RPLSMA: NOT_66%_VALIDATORS");

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

    // TODO beta: to be redesigned through Validator manager contract.
    // This can be addressed for Beta, since in Alpha, foundation nodes will be there
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

    // TODO beta: to be connected with Validator manager
    // This can be addressed for Beta, since in Alpha, foundation nodes will be there
    function getAllValidators() public view returns (address[] memory) {
        return mainValidators;
    }

    /// TODO beta: to be connected with Validator manager
    // This can be addressed for Beta, since in Alpha, foundation nodes will be there
    function getValidator(uint256 _validatorIndex) public view returns (address) {
        return mainValidators[_validatorIndex];
    }
}
