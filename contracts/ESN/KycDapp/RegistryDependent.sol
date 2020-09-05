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
        kycDapp_ = IKycDapp(_kycDapp);
    }

    function resolveAddress(bytes32 _username) public virtual view returns (address) {
        return kycDapp_.resolveAddress(_username);
    }

    function resolveAddressStrict(bytes32 _username) internal virtual view returns (address) {
        address _addr = resolveAddress(_username);
        require(_addr != address(0), renderRevertReason(_username));
        return _addr;
    }

    function resolveUsername(address _wallet) public virtual view returns (bytes32) {
        return kycDapp_.resolveUsername(_wallet);
    }

    function kycDapp() public virtual override view returns (IKycDapp) {
        return kycDapp_;
    }

    function nrtManager() public view returns (INRTManager) {
        return INRTManager(resolveAddressStrict("NRT_MANAGER"));
    }

    // TODO create interfaces of all contracts and put their functins here
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

    function renderRevertReason(bytes32 _username) private pure returns (string memory) {
        bytes memory sss = abi.encodePacked("Registry: ZERO_ADDR for ", _username);
        return string(sss);
    }
}
