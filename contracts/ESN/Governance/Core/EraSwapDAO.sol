// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { MultiSigWallet } from "./MultiSigWallet.sol";
import { RegistryDependent } from "../../KycDapp/RegistryDependent.sol";
import { ITimeAllyStaking } from "../../TimeAlly/1LifeTimes/ITimeAllyStaking.sol";

contract EraSwapDAO is MultiSigWallet, RegistryDependent {
    struct Proposal {
        bytes32 descriptionIPFS;
        uint32 nrtMonth; // snapshots prevents double voting
        uint256[] txIds;
        uint256 esVoted;
    }

    function required() public view returns (uint256) {
        uint32 _month = nrtManager().currentNrtMonth();
        return required(_month);
    }

    function required(uint32 _month) public view returns (uint256) {
        return timeallyManager().getTotalActiveStaking(_month);
    }

    function getVotingPreviledge(address _staking, uint32 _month) public view returns (uint256) {
        ITimeAllyStaking staking_ = ITimeAllyStaking(_staking);
        uint32 _startMonth = staking_.startMonth();
        require(_month >= _startMonth, "Governance: NEWER_STAKING_NOT_ALLOWED");

        return staking_.principal();
    }

    // TODO: do something to prevent spaming
    // probably put a cost, of like 1000 ES PoS power subtracted for the month
    // function createTransaction()

    // function createProposal(description, txTds[])

    // function voteProposal()

    // function unvoteProposal()

    // function executeProposal()
}
