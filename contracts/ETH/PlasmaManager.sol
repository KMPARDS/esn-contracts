// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./ERC20.sol";
import "../lib/EthParser.sol";
import "../lib/ECDSA.sol";
import "../lib/RLP.sol";
import "../lib/RLPEncode.sol";
import "../lib/Merkle.sol";
import "../lib/MerklePatriciaProof.sol";
import "../lib/BytesLib.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

/// @title Plasma Manager contract
/// @notice Manages block roots of Era Swap Network.
contract PlasmaManager {
    using RLP for bytes;
    using RLP for RLP.RLPItem;

    using SafeMath for uint256;

    struct BunchHeader {
        uint256 startBlockNumber;
        uint256 bunchDepth; // number of blocks in bunch is 2^bunchDepth
        bytes32 transactionsMegaRoot;
        bytes32 receiptsMegaRoot;
        bytes32 lastBlockHash;
    }

    // TODO: setup governance
    /// @dev keeping deployer private since this wallet will be used for onetime
    ///     calling setInitialValues method, after that it has no special role.
    ///     Hence it doesn't make sence creating a method by marking it public.
    address private deployer;

    // TODO: setup governance
    mapping(address => bool) validValidators;
    address[] validators;

    /// @dev Stores bunch headers with bunch index starting from 0.
    BunchHeader[] bunchHeaders;

    /// @dev EIP-191 Prepend byte + Version byte
    bytes constant PREFIX = hex"1997";

    /// @dev ESN Testnet ChainID
    bytes32 constant DOMAIN_SEPERATOR = hex"6f3a1e66e989a1cf337b9dd2ce4c98a5e78763cf9f9bdaac5707038c66a4d74e";
    uint256 constant CHAIN_ID = 0x144c;

    /// @dev ESN Mainnet ChainID
    // bytes32 constant DOMAIN_SEPERATOR = hex"e46271463d569b31951a3c222883dd59f9b6ab2887f2ff847aa230eca6d341ae";
    // uint256 constant CHAIN_ID = 0x144d;

    /// @notice Era Swap Token contract reference.
    ERC20 public token;

    /// @notice Emits when a new bunch header is finalized.
    event NewBunchHeader(uint256 _startBlockNumber, uint256 _bunchDepth, uint256 _bunchIndex);

    /// @notice Sets deployer address/
    constructor() {
        deployer = msg.sender;
    }

    // TODO: setup governance
    function setInitialValues(address _token, address[] memory _validators) public {
        require(msg.sender == deployer, "PLASMA: Only deployer can call");

        if (_token != address(0)) {
            require(address(token) == address(0), "PLASMA: Token adrs already set");

            token = ERC20(_token);
        }

        if (_validators.length > 0) {
            require(validators.length == 0, "PLASMA: Validators already set");

            for (uint256 _i = 0; _i < _validators.length; _i++) {
                validValidators[_validators[_i]] = true;
            }
            validators = _validators;
        }
    }

    // TODO: link with ESN validators.
    function getAllValidators() public view returns (address[] memory) {
        return validators;
    }

    /// @notice Gets index of last bunch header from bunch header list.
    /// @return Index of last bunch header.
    function lastBunchIndex() public view returns (uint256) {
        return bunchHeaders.length - 1;
    }

    /// @notice Allows anyone to submit a signed bunch header.
    /// @param _signedHeader: RLP(RLP(startBlockNumber,bunchDepth,txMRoot, rcMRoot, lastBlockHash),...sigs[])
    function submitBunchHeader(bytes memory _signedHeader) public {
        RLP.RLPItem[] memory _fullList = _signedHeader.toRLPItem().toList();
        RLP.RLPItem[] memory _headerArray = _fullList[0].toList();
        require(_headerArray.length == 5, "PLASMA: invalid proposal");

        BunchHeader memory _bunchHeader = BunchHeader({
            startBlockNumber: _headerArray[0].toUint(),
            bunchDepth: _headerArray[1].toUint(),
            transactionsMegaRoot: _headerArray[2].toBytes32(),
            receiptsMegaRoot: _headerArray[3].toBytes32(),
            lastBlockHash: _headerArray[4].toBytes32()
        });

        require(
            _bunchHeader.startBlockNumber == getNextStartBlockNumber(),
            "PLASMA: invalid start block no."
        );

        bytes memory _headerRLP = _fullList[0].toRLPBytes();

        bytes32 _digest = keccak256(abi.encodePacked(PREFIX, DOMAIN_SEPERATOR, _headerRLP));

        uint256 _numberOfValidSignatures;

        /// @dev Verifying signetures.
        for (uint256 i = 1; i < _fullList.length; i++) {
            bytes memory _signature = _fullList[i].toBytes();

            address _signer = ECDSA.recover(_digest, _signature);

            require(isValidator(_signer), "PLASMA: invalid validator sig");

            _numberOfValidSignatures++;
        }

        require(
            _numberOfValidSignatures.mul(3) > validators.length.mul(2),
            "PLASMA: not 66% validators"
        );

        uint256 _bunchIndex = bunchHeaders.length;

        bunchHeaders.push(_bunchHeader);

        emit NewBunchHeader(_bunchHeader.startBlockNumber, _bunchHeader.bunchDepth, _bunchIndex);
    }

    /// @notice Gets the start block number after last bunch.
    /// @return Next start block number.
    function getNextStartBlockNumber() public view returns (uint256) {
        if (bunchHeaders.length == 0) return 0;
        return
            bunchHeaders[bunchHeaders.length - 1].startBlockNumber +
            2**bunchHeaders[bunchHeaders.length - 1].bunchDepth;
    }

    // TODO: governance
    function isValidator(address _validator) public view returns (bool) {
        return validValidators[_validator];
    }

    function getValidator(uint256 _validatorIndex) public view returns (address) {
        return validators[_validatorIndex];
    }

    /// @notice Gets finalized bunch headers by index.
    /// @param _bunchIndex: Index of the bunch.
    /// @return BunchHeader struct.
    function getBunchHeader(uint256 _bunchIndex) public view returns (BunchHeader memory) {
        return bunchHeaders[_bunchIndex];
    }
}
