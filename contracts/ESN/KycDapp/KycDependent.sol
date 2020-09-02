// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { IKycDapp } from "./IKycDapp.sol";
import { Governable } from "../Governance/Governable.sol";

abstract contract KycDependent is Governable {
    IKycDapp public kycDapp;

    function setKycDapp(address _kycDapp) public onlyGovernance {
        kycDapp = IKycDapp(_kycDapp);
    }

    function resolveAddress(bytes32 _username) internal view returns (address) {
        return kycDapp.resolveAddress(_username);
    }
}
