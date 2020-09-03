// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { IKycDapp } from "./IKycDapp.sol";

interface IRegistryDependent {
    function setKycDapp(address _kycDapp) external;

    // function resolveAddress(bytes32 _username) external view returns (address);

    // function resolveUsername(address _wallet) external view returns (bytes32);

    function kycDapp() external view returns (IKycDapp);
}
