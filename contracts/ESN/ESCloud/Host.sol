// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { IESCloud } from "./IESCloud.sol";

contract Host {
    using SafeMath for uint256;

    IESCloud iESCloud;
    bytes32 public details;
    address public _owner;
    uint256 public START;
    // uint256 public Incentive;
    address public manager;
    uint256[1200] public Balance;
    uint8 public rating;
    // manager ;
    mapping(address => uint8) public ratings;
    mapping(bytes32 => File) public files;
    mapping(bytes32 => Dispute) public disputes;

    uint256 public constant SECONDS_IN_MONTH = 2629744;
    uint256 public constant ETHER = 1 ether;
    bytes32[] internal allfiles;

    enum Dispute { noDispute, Processed, Dismissed, Refunded }
    struct File {
        address User;
        uint256 Time;
    }

    event newFile(address indexed user, bytes32 indexed Hash, uint256 Time);
    event remove(bytes32 indexed Hash);
    event Raised(bytes32 indexed Hash);

    modifier onlyHost() {
        require(_owner == msg.sender, "ONLY_Host");
        _;
    }

    function init(
        address _owner1,
        bytes32 _details,
        address _manager
    ) public {
        require(_owner == address(0), "Host: ALREADY_INITIALIZED");
        _owner = _owner1;
        details = _details;
        START = block.timestamp;
        manager = _manager;
        iESCloud = IESCloud(manager);
        // Incentive = 0;
    }

    function changeDetails(bytes32 _details) public onlyHost {
        details = _details;    
    }
    
    // function setIncentive(uint8 _incentive) public onlyHost {
    //     Incentive = _incentive;
    // }
    function addFiles(bytes32 Hash, uint256 month) public payable {
        require(files[Hash].User == address(0), "File has been already exist");
        uint256 id = (block.timestamp - START) / SECONDS_IN_MONTH;
        require(msg.value == ETHER.mul(month), "Host : Insufficient_Funds");
        for (uint256 i = id; i < (id + month); i++) {
            Balance[i] += 1;
        }
        // uint256 Fee = ETHER.mul(month);

        iESCloud.payRewards{ value: msg.value.mul(1).div(100) }(msg.sender, _owner, msg.value, 1);
        files[Hash].User = msg.sender;
        files[Hash].Time = block.timestamp + (SECONDS_IN_MONTH.mul(month));
        allfiles.push(Hash);
        emit newFile(msg.sender, Hash, files[Hash].Time);
    }

    function renewFile(bytes32 Hash, uint256 month) public payable {
        require(files[Hash].User != address(0), "File does not exist");
        uint256 id = (files[Hash].Time - START).div(SECONDS_IN_MONTH);
        require(msg.value == ETHER.mul(month), "Insufficient_Funds");
        for (uint256 i = id; i < id + month; i++) {
            Balance[i] += 1;
        }

        // uint256 Fee =ETHER.mul(month);
        iESCloud.payRewards{ value: msg.value.mul(1).div(100) }(msg.sender, _owner, msg.value, 1);
        // require(_success, "TRANSFER_FAILING");

        uint256 _time = (files[Hash].Time > block.timestamp) ? files[Hash].Time : block.timestamp;
        files[Hash].Time = _time + SECONDS_IN_MONTH.mul(month);
        // emit newFile(msg.sender,Hash,files[Hash].Time);
    }

    function removeFile(bytes32 Hash) public payable {
        uint256 month = (files[Hash].Time - block.timestamp) / SECONDS_IN_MONTH;
        require(files[Hash].User != address(0), "File does not exist");
        require(msg.sender == _owner || msg.sender == files[Hash].User, "NOT_AUTHORIZED");
        if (msg.sender == _owner && month > 0) {
            require(msg.value == ETHER.mul(month), "Insufficient_Funds");
            // payable(files[Hash].User).transfer(month*ETHER);
            // (bool _success, ) =  payable(files[Hash].User).call{ value: (ETHER.mul(month)).mul(99).div(100) }("");
            payable(files[Hash].User).transfer((ETHER.mul(month)).mul(99).div(100));
            // require(_success, "TRANSFER_FAILING");

            //if we want to refund balance
        }
        delete files[Hash];
        emit remove(Hash);
    }

    function disputeFile(bytes32 Hash) public {
        emit Raised(Hash);
        disputes[Hash] = Dispute.Processed;
        iESCloud.Dispute(address(this), Hash);
    }

    function resolveDispute(bytes32 Hash, bool isRefund) public {
        require(iESCloud.isAdmin(msg.sender), "not authorized");
        if (isRefund) {
            uint256 month = (block.timestamp - files[Hash].Time).div(SECONDS_IN_MONTH);
            disputes[Hash] = Dispute.Refunded;
            // payable(files[Hash].User).transfer(month*ETHER);
            payable(files[Hash].User).transfer((month * ETHER).mul(99).div(100));
            // require(_success, "TRANSFER_FAILING");
        } else {
            disputes[Hash] = Dispute.Dismissed;
        }
    }

    function withdrawFund(uint256 monthID) public onlyHost {
        uint256 current = (block.timestamp - START).div(SECONDS_IN_MONTH);
        require(msg.sender == _owner, "NOT_AUTHORIZED");
        require(current > monthID, "You can't withdraw before time");
        (bool _success, ) =
            msg.sender.call{ value: (Balance[monthID] * ETHER).mul(99).div(100) }("");
        require(_success, "TRANSFER_FAILING");
        Balance[monthID] = 0;
    }

    function setActiveFiles() public {
        for (uint256 i = 0; i < allfiles.length; i++) {
            if (files[allfiles[i]].Time < (block.timestamp - 604800)) {
                allfiles[i] = allfiles[allfiles.length - 1];
                allfiles.pop();
            }
        }
    }

    function getActiveFiles() public view returns (bytes32[] memory) {
        return allfiles;
    }
}
