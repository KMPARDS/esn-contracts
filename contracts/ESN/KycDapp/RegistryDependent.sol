// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { IKycDapp } from "./IKycDapp.sol";
import { IRegistryDependent } from "./IRegistryDependent.sol";
import { Governable } from "../Governance/Governable.sol";
import { INRTManager } from "../NRT/INRTManager.sol";
import { ITimeAllyManager } from "../TimeAlly/1LifeTimes/ITimeAllyManager.sol";
import { ITimeAllyClub } from "../TimeAlly/Club/ITimeAllyClub.sol";
import { IPrepaidEs } from "../IPrepaidEs.sol";
import { IDayswappers } from "../Dayswappers/IDayswappers.sol";

abstract contract RegistryDependent is IRegistryDependent, Governable {
    IKycDapp private kycDapp_;

    function setKycDapp(address _kycDapp) public virtual override onlyGovernance {
        kycDapp_ = IKycDapp(_kycDapp);
    }

    function resolveAddress(bytes32 _username) internal view returns (address) {
        return kycDapp_.resolveAddress(_username);
    }

    function resolveUsername(address _wallet) internal view returns (bytes32) {
        return kycDapp_.resolveUsername(_wallet);
    }

    function kycDapp() public override view returns (IKycDapp) {
        return kycDapp_;
    }

    function nrtManager() internal view returns (INRTManager) {
        return INRTManager(resolveAddress("NRT_MANAGER"));
    }

    // TODO create interfaces of all contracts and put their functins here
    function timeallyManager() internal view returns (ITimeAllyManager) {
        return ITimeAllyManager(resolveAddress("TIMEALLY_MANAGER"));
    }

    function timeallyClub() internal view returns (ITimeAllyClub) {
        return ITimeAllyClub(resolveAddress("TIMEALLY_CLUB"));
    }

    function prepaidEs() internal view returns (IPrepaidEs) {
        return IPrepaidEs(resolveAddress("PREPAID_ES"));
    }

    function dayswappers() internal view returns (IDayswappers) {
        return IDayswappers(resolveAddress("DAYSWAPPERS"));
    }
}
