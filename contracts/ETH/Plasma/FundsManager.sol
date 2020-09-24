// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { RLP } from "../../lib/RLP.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { PlasmaManager } from "./PlasmaManager.sol";
import { EthParser } from "../../lib/EthParser.sol";
import { Merkle } from "../../lib/Merkle.sol";
import { MerklePatriciaProof } from "../../lib/MerklePatriciaProof.sol";
import { Governable } from "../../ESN/Governance/Governable.sol";

/// @title Funds Manager Contract
/// @notice Gives ERC20 tokens on ETH for Native tokens deposited on ESN.
contract FundsManager is Governable {
    using RLP for bytes;
    using RLP for RLP.RLPItem;

    /// @notice Era Swap Token contract reference.
    ERC20 public token;

    /// @notice Plasma Manager contract reference.
    PlasmaManager public plasmaManager;

    /// @notice FundsManager contract reference.
    address public fundsManagerESN;

    /// @dev Stores withdrawal transaction hashes done on ESN.
    mapping(bytes32 => bool) claimedTransactions;

    function setToken(address _token) public onlyGovernance {
        token = ERC20(_token);
    }

    function setPlasmaManagerAddress(address _plasmaManager) public onlyGovernance {
        plasmaManager = PlasmaManager(_plasmaManager);
    }

    function setFundsManagerESNAddress(address _fundsManagerESN) public onlyGovernance {
        fundsManagerESN = _fundsManagerESN;
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
