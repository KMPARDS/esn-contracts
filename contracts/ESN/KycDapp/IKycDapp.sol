// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IKycDapp {
    enum KYC_STATUS { NULL, APPROVED, SUSPENDED }

    function isKycLevel1(address _wallet) external view returns (bool);

    function isKycLevel2(address _wallet, address _platform) external view returns (bool);

    function isKycLevel3(address _wallet) external view returns (bool);

    function isKycLevel4(address _wallet) external view returns (bool);

    function isKycLevel5(address _wallet) external view returns (bool);

    function getIdentityByUsername(bytes32 _username)
        external
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
            KYC_STATUS level3,
            KYC_STATUS level4,
            KYC_STATUS level5
        );

    function getKycLevel2(address _wallet, address _platform) external view returns (KYC_STATUS);
}
