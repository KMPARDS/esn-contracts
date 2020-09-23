// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { Governable } from "../../Governance/Governable.sol";
import { Authorizable } from "../../Governance/Authorizable.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { RegistryDependent } from "../../KycDapp/RegistryDependent.sol";
import { ITimeAllyPromotionalBucket } from "./ITimeAllyPromotionalBucket.sol";

contract TimeAllyPromotionalBucket is
    ITimeAllyPromotionalBucket,
    Governable,
    RegistryDependent,
    Authorizable
{
    using SafeMath for uint256;

    // TimeAllyManager public timeallyManager;

    mapping(address => uint256) public stakingRewards;

    event StakingReward(address indexed wallet, uint256 stakingReward);

    receive() external payable {}

    // function setInitialValues(TimeAllyManager _timeallyManager, address _kycDapp) public {
    //     timeallyManager = _timeallyManager;
    //     updateAuthorization("KYC_DAPP", true);
    // }

    // function setKycDapp(address _kycDapp) public override onlyGovernance {
    //     super.setKycDapp(_kycDapp);
    //     updateAuthorization("KYC_DAPP", true);
    // }

    function rewardToStaker(address _wallet, uint256 _stakingReward)
        public
        override
        onlyAuthorized
    {
        if (address(this).balance >= _stakingReward) {
            stakingRewards[_wallet] = stakingRewards[_wallet].add(_stakingReward);

            emit StakingReward(_wallet, _stakingReward);
        }
    }

    function claimReward(address stakingContract) public override {
        uint256 _reward = stakingRewards[msg.sender];
        require(_reward > 0, "TAProm: No promotional staking reward");

        require(
            timeallyManager().isStakingContractValid(stakingContract),
            "TAProm: Invalid staking contract"
        );

        stakingRewards[msg.sender] = 0;

        (bool _success, ) = stakingContract.call{ value: _reward }("");
        require(_success, "TAProm: Staking topup failing");
    }
}
