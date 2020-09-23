// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { RLP } from "../../lib/RLP.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { PlasmaManager } from "./PlasmaManager.sol";
import { EthParser } from "../../lib/EthParser.sol";
import { Merkle } from "../../lib/Merkle.sol";
import { MerklePatriciaProof } from "../../lib/MerklePatriciaProof.sol";

/// @title Funds Manager Contract
/// @notice Gives ERC20 tokens on ETH for Native tokens deposited on ESN.
contract FundsManager {
    using RLP for bytes;
    using RLP for RLP.RLPItem;

    /// @notice Era Swap Token contract reference.
    ERC20 public token;

    /// @notice Plasma Manager contract reference.
    PlasmaManager public plasmaManager;

    /// @notice FundsManager contract reference.
    address public fundsManagerESN;

    // TODO: setup governance.
    /// @dev keeping deployer private since this wallet will be used for onetime
    ///     calling setInitialValues method, after that it has no special role.
    ///     Hence it doesn't make sence creating a method by marking it public.
    address private deployer;

    /// @dev Stores withdrawal transaction hashes done on ESN.
    mapping(bytes32 => bool) claimedTransactions;

    /// @notice Sets the deployer address.
    constructor() {
        deployer = msg.sender;
    }

    // TOOD: setup governance
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

    /// @notice Allows to submit a proof for a transaction done on ESN.
    /// @param _rawTransactionProof: RLP(bunchIndex, blockNumber, block MP, txRoot, rawTx, txIndex, tx MPP)
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

        require(!isTransactionClaimed(_txHash), "FM_ETH: Tx already claimed");

        require(
            MerklePatriciaProof.verify(_rawTx, _txIndex, _txInBlockProof, _txRoot),
            "FM_ETH: Invalid MPT Tx proof"
        );

        PlasmaManager.BunchHeader memory _bunchHeader = plasmaManager.getBunchHeader(_bunchIndex);

        /// @dev checks for bunch inclusion proof
        require(
            Merkle.verify(
                _txRoot, /// @dev data to verify
                _blockNumber - _bunchHeader.startBlockNumber,
                _bunchHeader.transactionsMegaRoot,
                _blockInBunchProof
            ),
            "FM_ETH: Invalid Merkle Proof"
        );

        (address _signer, address _to, uint256 _value, ) = EthParser.parseTransaction(_rawTx);

        require(_signer != address(0), "");
        require(_to == fundsManagerESN, "FM_ETH: Incorrect deposit addrs");

        claimedTransactions[_txHash] = true;
        token.transfer(_signer, _value);
    }

    /// @notice Gets whether a withdrawal transaction hash (on ESN) is already claimed for getting ERC20 tokens.
    /// @param _transactionHash: Hash of the transaction.
    /// @return Whether transaction is claimed.
    function isTransactionClaimed(bytes32 _transactionHash) public view returns (bool) {
        return claimedTransactions[_transactionHash];
    }
}
