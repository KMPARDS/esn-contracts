// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { IKycDapp } from "./IKycDapp.sol";
import { IRegistryDependent } from "./IRegistryDependent.sol";
import { Governable } from "../Governance/Governable.sol";
import { INRTManager } from "../NRT/INRTManager.sol";
import { ITimeAllyManager } from "../TimeAlly/1LifeTimes/ITimeAllyManager.sol";
import { ITimeAllyPromotionalBucket } from "../TimeAlly/1LifeTimes/ITimeAllyPromotionalBucket.sol";
import { ITimeAllyClub } from "../TimeAlly/Club/ITimeAllyClub.sol";
import { IPrepaidEs } from "../PrepaidEs/IPrepaidEs.sol";
import { IDayswappers } from "../Dayswappers/IDayswappers.sol";
import { IValidatorManager } from "../Validator/IValidatorManager.sol";
import { RandomnessManager } from "../Validator/RandomnessManager.sol";

abstract contract RegistryDependent is IRegistryDependent, Governable {
    IKycDapp private kycDapp_;

    function setKycDapp(address _kycDapp) public virtual override onlyGovernance {
        _setKycDapp(_kycDapp);
    }

    function _setKycDapp(address _kycDapp) internal {
        kycDapp_ = IKycDapp(_kycDapp);
    }

    function resolveAddress(bytes32 _username) public virtual view returns (address) {
        return kycDapp_.resolveAddress(_username);
    }

    function resolveAddressStrict(bytes32 _username) public virtual view returns (address) {
        address _addr = resolveAddress(_username);
        require(_addr != address(0), "Registry: RESOLVED_ZERO_ADDR_IN_STRICT");
        return _addr;
    }

    function resolveUsername(address _wallet) public virtual view returns (bytes32) {
        return kycDapp_.resolveUsername(_wallet);
    }

    function resolveUsernameStrict(address _wallet) public virtual view returns (bytes32) {
        bytes32 _username = resolveUsername(_wallet);
        require(_username != bytes32(0), "Registry: RESOLVED_NULL_USERNAME_IN_STRICT");
        return _username;
    }

    function kycDapp() public virtual override view returns (IKycDapp) {
        return kycDapp_;
    }

    function nrtManager() public view returns (INRTManager) {
        return INRTManager(resolveAddressStrict("NRT_MANAGER"));
    }

    // TODO beta create interfaces of all contracts and put their functins here
    // most of show stopper ones have been added, more can be added if new project wants to consume it

    function timeallyManager() public view returns (ITimeAllyManager) {
        return ITimeAllyManager(resolveAddressStrict("TIMEALLY_MANAGER"));
    }

    function validatorManager() public view returns (IValidatorManager) {
        return IValidatorManager(resolveAddressStrict("VALIDATOR_MANAGER"));
    }

    function randomnessManager() public view returns (RandomnessManager) {
        return RandomnessManager(resolveAddressStrict("RANDOMNESS_MANAGER"));
    }

    function timeallyPromotionalBucket() public view returns (ITimeAllyPromotionalBucket) {
        return ITimeAllyPromotionalBucket(resolveAddressStrict("TIMEALLY_PROMOTIONAL_BUCKET"));
    }

    function timeallyClub() public view returns (ITimeAllyClub) {
        return ITimeAllyClub(resolveAddressStrict("TIMEALLY_CLUB"));
    }

    function prepaidEs() public view returns (IPrepaidEs) {
        return IPrepaidEs(resolveAddressStrict("PREPAID_ES"));
    }

    function dayswappers() public view returns (IDayswappers) {
        return IDayswappers(resolveAddressStrict("DAYSWAPPERS"));
    }
}
