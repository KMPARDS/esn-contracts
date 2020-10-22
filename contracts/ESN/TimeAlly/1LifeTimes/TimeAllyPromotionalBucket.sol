// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { Governable } from "../../Governance/Governable.sol";
import { Authorizable } from "../../Governance/Authorizable.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { RegistryDependent } from "../../KycDapp/RegistryDependent.sol";
import { ITimeAllyPromotionalBucket } from "./ITimeAllyPromotionalBucket.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/Initializable.sol";

contract TimeAllyPromotionalBucket is
    ITimeAllyPromotionalBucket,
    Governable,
    RegistryDependent,
    Authorizable,
    Initializable
{
    using SafeMath for uint256;

    // TimeAllyManager public timeallyManager;

    uint256 public totalPendingRewards;

    mapping(address => uint256) public stakingRewards;

    event StakingReward(address indexed wallet, uint256 stakingReward);

    event FundsAdded(address source, uint256 amount);

    receive() external payable {
        emit FundsAdded(msg.sender, msg.value);
    }

    // function setInitialValues(TimeAllyManager _timeallyManager, address _kycDapp) public {
    //     timeallyManager = _timeallyManager;
    //     updateAuthorization("KYC_DAPP", true);
    // }

    // function setKycDapp(address _kycDapp) public override onlyGovernance {
    //     super.setKycDapp(_kycDapp);
    //     updateAuthorization("KYC_DAPP", true);
    // }

    function initialize() public payable initializer {
        _initializeGovernable();
    }

    function rewardToStaker(address _wallet, uint256 _stakingReward)
        public
        override
        onlyAuthorized
    {
        stakingRewards[_wallet] = stakingRewards[_wallet].add(_stakingReward);
        totalPendingRewards = totalPendingRewards.add(_stakingReward);

        emit StakingReward(_wallet, _stakingReward);
    }

    function claimReward(address stakingContract) public override {
        uint256 _reward = stakingRewards[msg.sender];
        require(_reward > 0, "TAProm: NO_PROMOTIONAL_STAKING_REWARD");

        require(_reward <= address(this).balance, "TAProm: INSUFFICIENT_BUCKET_BALANCE");

        require(
            timeallyManager().isStakingContractValid(stakingContract),
            "TAProm: INVALID_STAKING_CONTRACT"
        );

        stakingRewards[msg.sender] = 0;
        totalPendingRewards = totalPendingRewards.sub(_reward);

        (bool _success, ) = stakingContract.call{ value: _reward }("");
        require(_success, "TAProm: STAKING_TOPUP_FAILING");
    }
}
