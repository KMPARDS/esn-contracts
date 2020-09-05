// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "../../lib/RLP.sol";
import "../../lib/MerklePatriciaProof.sol";
import "./ReversePlasma.sol";

/// @title Funds Manager Contract
/// @notice Gives ESN native tokens for ERC20 deposited on ETH.
contract FundsManager {
    using RLP for bytes;
    using RLP for RLP.RLPItem;

    // TODO: Convert deployer into governor.
    /// @dev keeping deployer private since this wallet will be used for onetime
    ///    calling setInitialValues method, after that it has no special role.
    ///    Hence it doesn't make sence creating a method by marking it public.
    address private deployer;

    /// @dev Era Swap ERC20 smart contract address deployed on ETH.
    address public tokenOnETH;

    /// @dev Funds Manager contract deployed on ETH.
    address public fundsManagerETH;

    /// @dev Reverse Plasma smart contract deployed on ESN.
    ReversePlasma public reversePlasma;

    /// @dev Stores deposit transaction hashes done on ETH.
    mapping(bytes32 => bool) claimedTransactions;

    /// @notice Sets the deployer address.
    constructor() payable {
        deployer = msg.sender;
    }

    /// @notice Allows for direct deposits of native currency into this contract (Era Swap).
    receive() external payable {}

    /// @notice Sets initial enviornment values.
    /// @param _reversePlasma: Address of Reverse Plasma contract on ESN.
    /// @param _tokenOnETH: Address of Era Swap ERC20 contract on ETH.
    /// @param _fundsManagerETH: Address of Funds Manager contract on ETH.
    function setInitialValues(
        address _reversePlasma,
        address _tokenOnETH,
        address _fundsManagerETH
    ) public {
        require(msg.sender == deployer, "FM_ESN: Only deployer can call");

        if (_reversePlasma != address(0)) {
            require(address(reversePlasma) == address(0), "FM_ESN: Plasma adrs already set");

            reversePlasma = ReversePlasma(_reversePlasma);
        }

        if (_tokenOnETH != address(0)) {
            require(tokenOnETH == address(0), "FM_ESN: Token adrs already set");

            tokenOnETH = _tokenOnETH;
        }

        if (_fundsManagerETH != address(0)) {
            require(fundsManagerETH == address(0), "FM_ESN: FM_ETH adrs already set");

            fundsManagerETH = _fundsManagerETH;
        }
    }

    /// @notice Allows to submit a proof for a transaction done on ETH.
    /// @param _rawProof: RLP(ethBlockNumber, txIndex, rawTx, tx MPP, rawReceipt, receipt MPP).
    function claimDeposit(bytes memory _rawProof) public {
        RLP.RLPItem[] memory _decodedProof = _rawProof.toRLPItem().toList();

        uint256 _blockNumber = _decodedProof[0].toUint();

        bytes memory _txIndex = _decodedProof[1].toBytes();
        bytes memory _rawTx = _decodedProof[2].toBytes();
        bytes memory _txInBlockProof = _decodedProof[3].toBytes();
        bytes memory _rawReceipt = _decodedProof[4].toBytes();
        bytes memory _receiptInBlockProof = _decodedProof[5].toBytes();

        bytes32 _txHash = keccak256(_rawTx);
        require(!isTransactionClaimed(_txHash), "FM_ESN: Tx already claimed");

        ReversePlasma.BlockHeaderFinalized memory _finalizedHeader = reversePlasma
            .getFinalizedEthHeader(_blockNumber);

        require(_finalizedHeader.transactionsRoot != bytes32(0), "FM_ESN: Block not finalized");
        require(_finalizedHeader.receiptsRoot != bytes32(0), "FM_ESN: Block not finalized");

        require(
            MerklePatriciaProof.verify(
                _rawTx,
                _txIndex,
                _txInBlockProof,
                _finalizedHeader.transactionsRoot
            ),
            "FM_ESN: Invalid MPT Tx proof"
        );

        require(
            MerklePatriciaProof.verify(
                _rawReceipt,
                _txIndex,
                _receiptInBlockProof,
                _finalizedHeader.receiptsRoot
            ),
            "FM_ESN: Invalid MPT Rc proof"
        );

        bool _status = EthParser.parseReceiptStatus(_rawReceipt);
        require(_status, "FM_ESN: Failed Rc not acceptable");

        (address _signer, address _erc20Contract, , bytes memory _data) = EthParser
            .parseTransaction(_rawTx);

        require(_erc20Contract == tokenOnETH, "FM_ESN: Incorrect ERC20 contract");

        bytes4 _methodSignature;
        address _to;
        uint256 _value;

        assembly {
            let _pointer := add(_data, 0x20)
            _methodSignature := mload(_pointer)
            _to := mload(add(0x4, _pointer))
            _value := mload(add(0x24, _pointer))
        }

        require(_methodSignature == hex"a9059cbb", "FM_ESN: Not ERC20 transfer");
        require(_to == fundsManagerETH, "FM_ESN: Incorrect deposit addrs");

        claimedTransactions[_txHash] = true;
        payable(_signer).transfer(_value);
    }

    /// @notice Gets whether an deposit transaction hash (on ETH) is already claimed for getting native tokens.
    /// @param _transactionHash: Hash of the transaction.
    /// @return Whether transaction is claimed.
    function isTransactionClaimed(bytes32 _transactionHash) public view returns (bool) {
        return claimedTransactions[_transactionHash];
    }
}
