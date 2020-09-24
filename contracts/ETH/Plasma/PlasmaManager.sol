// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { ECDSA } from "@openzeppelin/contracts/cryptography/ECDSA.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { Governable } from "../../ESN/Governance/Governable.sol";

/// @title Plasma Manager contract
/// @notice Manages block roots of Era Swap Network.
contract PlasmaManager is Governable {
    using SafeMath for uint256;

    struct BunchHeader {
        uint256 startBlockNumber;
        uint256 bunchDepth; // number of blocks in bunch is 2^bunchDepth
        bytes32 transactionsMegaRoot;
        bytes32 receiptsMegaRoot;
        bytes32 lastBlockHash;
    }

    // TODO: setup governance
    mapping(address => bool) validValidators;
    address[] validators;

    /// @dev Stores bunch headers with bunch index starting from 0.
    BunchHeader[] bunchHeaders;

    /// @dev EIP-191 Prepend byte + Version byte
    bytes constant PREFIX = hex"1900";

    /// @notice Emits when a new bunch header is finalized.
    event NewBunchHeader(uint256 _startBlockNumber, uint256 _bunchDepth, uint256 _bunchIndex);

    // TODO: setup governance
    function setInitialValidators(address[] memory _validators) public onlyGovernance {
        if (_validators.length > 0) {
            require(validators.length == 0, "Plasma: VALIDATORS_ALREADY_SET");

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
    /// @param _startBlockNumber: Start block number in the bunch
    /// @param _bunchDepth: Depth of the bunch
    /// @param _txMRoot: Tx mega root of the blocks in the bunch
    /// @param _rcMRoot: Receipts mega root of the blocks in the bunch
    /// @param _lastBlockHash: Hash of the last block in this bunch for checkpoint purpose
    /// @param _sigs: Array of sigs
    function submitBunchHeader(
        uint256 _startBlockNumber,
        uint256 _bunchDepth,
        bytes32 _txMRoot,
        bytes32 _rcMRoot,
        bytes32 _lastBlockHash,
        bytes[] calldata _sigs
    ) public {
        BunchHeader memory _bunchHeader = BunchHeader({
            startBlockNumber: _startBlockNumber,
            bunchDepth: _bunchDepth,
            transactionsMegaRoot: _txMRoot,
            receiptsMegaRoot: _rcMRoot,
            lastBlockHash: _lastBlockHash
        });

        require(
            _bunchHeader.startBlockNumber == getNextStartBlockNumber(),
            "Plasma: INVALID_START_BLOCK_NUMBER"
        );

        bytes memory _header = abi.encode(
            _startBlockNumber,
            _bunchDepth,
            _txMRoot,
            _rcMRoot,
            _lastBlockHash
        );

        bytes32 _digest = keccak256(abi.encodePacked(PREFIX, address(this), _header));

        uint256 _numberOfValidSignatures;
        uint160 _lastSigner;

        /// @dev Verifying signetures.
        for (uint256 i = 0; i < _sigs.length; i++) {
            bytes memory _signature = _sigs[i];

            address _signer = ECDSA.recover(_digest, _signature);

            require(isValidator(_signer), "Plasma: NOT_VALIDATOR");

            uint160 _signerUint = uint160(_signer);
            require(_lastSigner < _signerUint, "Plasma: INVALID_SIG_ARRANGEMENT");

            _numberOfValidSignatures++;
        }

        require(
            _numberOfValidSignatures.mul(3) > validators.length.mul(2),
            "Plasma: NOT_66%_VALIDATORS"
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
