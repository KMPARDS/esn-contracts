// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

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

    /// @dev keeping deployer private since this wallet will be used for onetime
    ///     calling setInitialValues method, after that it has no special role.
    ///     Hence it doesn't make sence creating a method by marking it public.
    address private deployer;

    uint256 public latestBlockNumber;
    address public tokenOnETH;
    address public reverseDepositAddress = address(this);
    address[] mainValidators;

    mapping(uint256 => BlockHeaderProposal[]) ethHeaderProposals;
    mapping(uint256 => BlockHeaderFinalized) finalizedEthHeaders;

    event NewBlockHeader(uint256 blockNumber, uint256 proposalId);

    // any validator will be able to add a block proposal
    // TODO: replace validator mapping with a validator contract
    constructor() {
        deployer = msg.sender;
    }

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

    // TODO: remove this function or make it one time only
    function updateDepositAddress(address _reverseDepositAddress) public {
        reverseDepositAddress = _reverseDepositAddress;
    }

    function proposeBlock(
        uint256 _blockNumber,
        bytes32 _transactionsRoot,
        bytes32 _receiptsRoot
    ) public {
        require(isValidator(msg.sender), "RPLSMA: not a validator");

        /// @dev check if the proposal already exists
        (bool _doesProposalExist, uint256 _proposalId) = findProposal(
            _blockNumber,
            _transactionsRoot,
            _receiptsRoot
        );

        if (!_doesProposalExist) {
            ethHeaderProposals[_blockNumber].push(
                BlockHeaderProposal({
                    transactionsRoot: _transactionsRoot,
                    receiptsRoot: _receiptsRoot,
                    proposalValidators: new address[](0)
                })
            );

            _proposalId = ethHeaderProposals[_blockNumber].length - 1;
        }

        // @dev checks and removes if validator has voted to any other proposal
        _removeValidatorFromAllProposals(ethHeaderProposals[_blockNumber], msg.sender);

        ethHeaderProposals[_blockNumber][_proposalId].proposalValidators.push(msg.sender);
    }

    function finalizeProposal(uint256 _blockNumber, uint256 _proposalId) public {
        require(_blockNumber <= latestBlockNumber + 1, "RPLSMA: invalid block number");
        uint256 _votes;

        address[] storage proposalValidators = ethHeaderProposals[_blockNumber][_proposalId]
            .proposalValidators;

        for (uint256 i = 0; i < proposalValidators.length; i++) {
            // TODO: check validator from validator contract instead
            if (isValidator(proposalValidators[i])) {
                _votes++;
            }
        }

        require(_votes.mul(3) > mainValidators.length.mul(2), "RPLSMA: not 66% validators");

        finalizedEthHeaders[_blockNumber] = BlockHeaderFinalized({
            transactionsRoot: ethHeaderProposals[_blockNumber][_proposalId].transactionsRoot,
            receiptsRoot: ethHeaderProposals[_blockNumber][_proposalId].receiptsRoot
        });

        /// @dev to prevent replay
        delete ethHeaderProposals[_blockNumber][_proposalId].proposalValidators;

        latestBlockNumber = _blockNumber;

        emit NewBlockHeader(_blockNumber, _proposalId);
    }

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

    function isValidator(address _validator) public view returns (bool) {
        for (uint256 i = 0; i < mainValidators.length; i++) {
            if (_validator == mainValidators[i]) {
                return true;
            }
        }

        return false;
    }

    function getProposalValidators(uint256 _blockNumber, uint256 _proposalId)
        public
        view
        returns (address[] memory)
    {
        return ethHeaderProposals[_blockNumber][_proposalId].proposalValidators;
    }

    function getFinalizedEthHeader(uint256 _ethBlockNumber)
        public
        view
        returns (BlockHeaderFinalized memory)
    {
        return finalizedEthHeaders[_ethBlockNumber];
    }

    function getEthHeaderProposal(uint256 _ethBlockNumber, uint256 _proposalIndex)
        public
        view
        returns (BlockHeaderProposal memory)
    {
        return ethHeaderProposals[_ethBlockNumber][_proposalIndex];
    }

    function getProposalsCount(uint256 _blockNumber) public view returns (uint256) {
        return ethHeaderProposals[_blockNumber].length;
    }

    function getEthHeaderProposals(uint256 _ethBlockNumber)
        public
        view
        returns (BlockHeaderProposal[] memory)
    {
        return ethHeaderProposals[_ethBlockNumber];
    }

    function findProposal(
        uint256 _blockNumber,
        bytes32 _transactionsRoot,
        bytes32 _receiptsRoot
    ) public view returns (bool, uint256) {
        for (uint256 i = 0; i < ethHeaderProposals[_blockNumber].length; i++) {
            if (
                _transactionsRoot == ethHeaderProposals[_blockNumber][i].transactionsRoot &&
                _receiptsRoot == ethHeaderProposals[_blockNumber][i].receiptsRoot
            ) {
                return (true, i);
            }
        }

        return (false, 0);
    }

    function getAllValidators() public view returns (address[] memory) {
        return mainValidators;
    }

    function getValidator(uint256 _validatorIndex) public view returns (address) {
        return mainValidators[_validatorIndex];
    }
}
