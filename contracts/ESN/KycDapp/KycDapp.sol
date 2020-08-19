// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { IKycDapp } from "./IKycDapp.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract KycDapp is IKycDapp, Ownable {
    struct Identity {
        address owner;
        bytes32 kycApprovedDetailsIPFS; // this can be only updated by owner address (faithminus approval)
        bytes32 profileDetailsIPFS; // this can be updated by user anytime without need for approval
        KYC_STATUS level1;
        KYC_STATUS level3;
        KYC_STATUS level4;
        KYC_STATUS level5;
        mapping(address => KYC_STATUS) level2;
    }

    /// @dev Fixed usernames
    mapping(bytes32 => Identity) public identities;
    mapping(address => bytes32) public usernames;

    event IdentityTransfer(address indexed from, address indexed to, bytes32 indexed username);

    event KycDetailsUpdated(bytes32 indexed username, bytes32 newKycDetailsIPfS);

    event ProfileDetailsUpdated(bytes32 indexed username, bytes32 newProfileDetailsIPfS);

    function register(bytes32 _newUsername) public {
        // TODO: take payment here to prevent brute force

        require(usernames[msg.sender] == bytes32(0), "Kyc: Your identity already exists");
        require(identities[_newUsername].owner == address(0), "Kyc: Username is taken");

        usernames[msg.sender] = _newUsername;
        identities[_newUsername].owner = msg.sender;

        emit IdentityTransfer(address(0), msg.sender, _newUsername);
    }

    /// @dev This emits an event and admin can catch that and check it. And if ok then can approve it using a function
    function proposeKycDetails(bytes32 _kycUnapprovedDetailsIPFS) public {
        bytes32 _username = usernames[msg.sender];
        require(usernames[msg.sender] != bytes32(0), "Kyc: Your identity does not exist");

        emit KycDetailsUpdated(_username, _kycUnapprovedDetailsIPFS);
    }

    function approveKycDetails(bytes32 _username, bytes32 _kycUnapprovedDetailsIPFS)
        public
        onlyOwner
    {
        identities[_username].kycApprovedDetailsIPFS = _kycUnapprovedDetailsIPFS;
    }

    function updateKycLevel1Status(bytes32 _username, KYC_STATUS _kycStatus) public onlyOwner {
        identities[_username].level1 = _kycStatus;
    }

    function updateKycLevel2Status(
        bytes32 _username,
        address _platform,
        KYC_STATUS _kycStatus
    ) public onlyOwner {
        identities[_username].level2[_platform] = _kycStatus;
    }

    function updateKycLevel3Status(bytes32 _username, KYC_STATUS _kycStatus) public onlyOwner {
        identities[_username].level3 = _kycStatus;
    }

    function updateKycLevel4Status(bytes32 _username, KYC_STATUS _kycStatus) public onlyOwner {
        identities[_username].level4 = _kycStatus;
    }

    function updateKycLevel5Status(bytes32 _username, KYC_STATUS _kycStatus) public onlyOwner {
        identities[_username].level5 = _kycStatus;
    }

    function resolveAddress(bytes32 _username) public override view returns (address) {
        return identities[_username].owner;
    }

    function resolveUsername(address _wallet) public override view returns (bytes32) {
        return usernames[_wallet];
    }

    function getIdentityByAddress(address _wallet)
        public
        override
        view
        returns (
            bytes32 username,
            address owner,
            bytes32 kycApprovedDetailsIPFS,
            bytes32 profileDetailsIPFS,
            KYC_STATUS level1,
            KYC_STATUS level3,
            KYC_STATUS level4,
            KYC_STATUS level5
        )
    {
        username = usernames[_wallet];
        return getIdentityByUsername(username);
    }

    function getIdentityByUsername(bytes32 _username)
        public
        override
        view
        returns (
            bytes32 username,
            address owner,
            bytes32 kycApprovedDetailsIPFS,
            bytes32 profileDetailsIPFS,
            KYC_STATUS level1,
            KYC_STATUS level3,
            KYC_STATUS level4,
            KYC_STATUS level5
        )
    {
        require(_username != bytes32(0), "Kyc: Identity does not exist");
        Identity storage indentity = identities[_username];

        username = _username;
        owner = indentity.owner;
        kycApprovedDetailsIPFS = indentity.kycApprovedDetailsIPFS;
        profileDetailsIPFS = indentity.profileDetailsIPFS;
        level1 = indentity.level1;
        level3 = indentity.level3;
        level4 = indentity.level4;
        level5 = indentity.level5;
    }

    function getKycLevel2(address _wallet, address _platform)
        public
        override
        view
        returns (KYC_STATUS)
    {
        bytes32 _username = usernames[_wallet];
        require(_username != bytes32(0), "Kyc: Identity does not exist");
        return identities[_username].level2[_platform];
    }

    function isKycLevel1(address _wallet) public override view returns (bool) {
        bytes32 _username = usernames[_wallet];
        if (_username == bytes32(0)) {
            return false;
        }
        return identities[_username].level1 == KYC_STATUS.APPROVED;
    }

    function isKycLevel2(address _wallet, address _platform) public override view returns (bool) {
        bytes32 _username = usernames[_wallet];
        if (_username == bytes32(0)) {
            return false;
        }
        return identities[_username].level2[_platform] == KYC_STATUS.APPROVED;
    }

    function isKycLevel3(address _wallet) public override view returns (bool) {
        bytes32 _username = usernames[_wallet];
        if (_username == bytes32(0)) {
            return false;
        }
        return identities[_username].level3 == KYC_STATUS.APPROVED;
    }

    function isKycLevel4(address _wallet) public override view returns (bool) {
        bytes32 _username = usernames[_wallet];
        if (_username == bytes32(0)) {
            return false;
        }
        return identities[_username].level4 == KYC_STATUS.APPROVED;
    }

    function isKycLevel5(address _wallet) public override view returns (bool) {
        bytes32 _username = usernames[_wallet];
        if (_username == bytes32(0)) {
            return false;
        }
        return identities[_username].level5 == KYC_STATUS.APPROVED;
    }
}
