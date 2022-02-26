// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

contract Chat {
    address Expert;
    address Patient;
    uint256 blocknumber = 0;
    // address patient;

    event messageSentEvent(address indexed Sender, string message, uint256 Time);

    modifier onlyMember() {
        require(msg.sender == Patient || msg.sender == Expert, "Not Allowed");
        _;
    }

    function init(
        address _expert,
        address _patient,
        uint256 _blocknumber
    ) public {
        Expert = _expert;
        Patient = _patient;
        blocknumber = _blocknumber;
    }

    function sendMessage(string memory message) public onlyMember {
        if (blocknumber == 0) {
            blocknumber = block.number;
        }
        emit messageSentEvent(msg.sender, message, block.timestamp);
    }
}
