// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IKycDapp {
    enum KYC_STATUS { NULL, APPROVED, SUSPENDED }

    event IdentityTransfer(address indexed from, address indexed to, bytes32 indexed username);

    event KycDetailsUpdated(bytes32 indexed username, bytes32 newKycDetailsIPfS);

    event ProfileDetailsUpdated(bytes32 indexed username, bytes32 newProfileDetailsIPfS);

    event KycApplied(
        bytes32 indexed username,
        uint8 indexed level,
        bytes32 platformIdentifier,
        bytes32 specialization
    );

    event KycStatusUpdated(
        bytes32 indexed username,
        uint8 indexed level,
        bytes32 platformIdentifier,
        bytes32 specialization,
        KYC_STATUS newKycStatus
    );

    event KycFeeUpdated(
        uint8 indexed level,
        bytes32 indexed platformIdentifier,
        bytes32 indexed specialization,
        uint256 amount
    );

    function isKycLevel1(address _wallet) external view returns (bool);

    function isKycApproved(
        address _wallet,
        uint8 _level,
        bytes32 _platformIdentifier,
        bytes32 _specialization
    ) external view returns (bool);

    function resolveAddress(bytes32 _username) external view returns (address);

    function resolveUsername(address _wallet) external view returns (bytes32);

    function getIdentityByUsername(bytes32 _username)
        external
        view
        returns (
            bytes32 username,
            address owner,
            bytes32 kycApprovedDetailsIPFS,
            bytes32 profileDetailsIPFS,
            KYC_STATUS level1,
            bool isGovernanceControllable
        );

    function getIdentityByAddress(address _wallet)
        external
        view
        returns (
            bytes32 username,
            address owner,
            bytes32 kycApprovedDetailsIPFS,
            bytes32 profileDetailsIPFS,
            KYC_STATUS level1,
            bool isGovernanceControllable
        );

    function getKycStatusByUsername(
        bytes32 _username,
        uint8 _level,
        bytes32 _platformIdentifier,
        bytes32 _specialization
    ) external view returns (KYC_STATUS);

    function getKycStatusByAddress(
        address _wallet,
        uint8 _level,
        bytes32 _platformIdentifier,
        bytes32 _specialization
    ) external view returns (KYC_STATUS);
}
