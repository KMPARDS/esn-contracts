// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { BetDeEx } from "./BetDeEx.sol";

// import { BetInterface } from "./BetInterface.sol";
import { RegistryDependent } from "../KycDapp/RegistryDependent.sol";

/// @title Bet Smart Contract
/// @author The EraSwap Team
/// @notice This contract governs bettors and is deployed by BetDeEx Smart Contract

contract Bet is RegistryDependent {
    using SafeMath for uint256;

    BetDeEx betDeEx;

    string public description; /// @dev question text of the bet
    string public other; /// @dev question text of the bet
    bool public isDrawPossible; /// @dev if false then user cannot bet on draw choice
    uint8 public category; /// @dev sports, movies
    uint8 public subCategory; /// @dev cricket, football
    uint256 public upVotes;
    uint256 public downVotes;
    address public _owner;

    uint8 public finalResult; /// @dev given a value when manager ends bet
    address public endedBy; /// @dev address of manager who enters the correct choice while ending the bet

    uint256 public creationTimestamp; /// @dev set during bet creation
    uint256 public pauseTimestamp; /// @dev set as an argument by deployer
    uint256 public endTimestamp; /// @dev set when a manager ends bet and prizes are distributed

    uint256 public minimumBetInExaEs; /// @dev minimum amount required to enter bet
    uint256 public prizePercentPerThousand; /// @dev percentage of bet balance which will be dristributed to winners and rest is platform fee
    uint8 public Incentive;
    uint256[3] public totalBetTokensInExaEsByChoice = [0, 0, 0]; /// @dev array of total bet value of no, yes, draw voters
    uint256[3] public getNumberOfChoiceBettors = [0, 0, 0]; /// @dev stores number of bettors in a choice

    uint256 public totalPrize; /// @dev this is the prize (platform fee is already excluded)

    // mapping(address => uint256) public betBalanceInExaEs;
    mapping(address => uint256[3]) public bettorBetAmountInExaEsByChoice; /// @dev mapps addresses to array of betAmount by choice
    mapping(address => bool) public bettorHasClaimed; /// @dev set to true when bettor claims the prize

    event NewBetting(
        address indexed _betAddress,
        address indexed _bettorAddress,
        uint8 indexed _choice,
        uint256 _betTokensInExaEs
    );

    event EndBetContract(
        address indexed _ender,
        address indexed _contractAddress,
        uint8 _result,
        uint256 _platformFee
    );

    event TransferES(address indexed _to, uint256 _tokensInExaEs);

    /* /// @notice this is an internal functionality that is only for bet contracts to emit a event when a new bet is placed so that front end can get the information by subscribing to  contract
    function emitNewBettingEvent(address _bettorAddress, uint8 _choice, uint256 _betTokensInExaEs) public onlyBetContract {
        emit NewBetting(msg.sender, _bettorAddress, _choice, _betTokensInExaEs);
    }
    /// @notice this is an internal functionality that is only for bet contracts to emit event when a bet is ended so that front end can get the information by subscribing to  contract
    function emitEndEvent(address _ender, uint8 _result, uint256 _gasFee) public onlyBetContract {
        emit EndBetContract(_ender, msg.sender, _result, _gasFee);
    }*/

    /*modifier onlyManager() override{
        require(betDeEx.isManager(msg.sender), "only manager can call");
        _;
    }*/

    modifier onlyKycApproved() {
        require(kycDapp().isKycLevel1(msg.sender), "Bet: KYC_NOT_APPROVED");
        _;
    }

    modifier onlyGovernance() override {
        require(betDeEx.Admin(msg.sender), "Bet: ONLY_OWNER_CAN_CALL");
        _;
    }
    modifier onlyApproved() {
        require(betDeEx.isBetValid(address(this)), "Bet_NOT_APPROVED_YET");
        _;
    }

    function rejectBet() public onlyGovernance {
        require(!betDeEx.isBetValid(address(this)), "Bet_APPROVED_ALREADY");
        selfdestruct(msg.sender);
    }

    /// @notice this sets up Bet contract
    /// @param _description is the question of Bet in plain English, bettors have to understand the bet description and later choose to bet on yes no or draw according to their preference
    /// @param _category is the broad category for example Sports. Purpose of this is only to filter bets and show in UI, hence the name of the category is not stored in smart contract and category is repressented by a number (0, 1, 2, 3...)
    /// @param _subCategory is a specific category for example Football. Each category will have sub categories represented by a number (0, 1, 2, 3...)
    /// @param _minimumBetInExaEs is the least amount of ExaES that can be betted, any bet participant (bettor) will have to bet this amount or higher. Betting higher amount gives more share of winning amount
    /// @param _prizePercentPerThousand is a form of representation of platform fee. It is a number less than or equal to 1000. For eg 2% is to be collected as platform fee then this value would be 980. If 0.2% then 998.
    /// @param _isDrawPossible is functionality for allowing a draw option
    /// @param _pauseTimestamp Bet will be open for betting until this timestamp, after this timestamp, any user will not be able to place bet. and manager can only end bet after this time
    function initialize(
        address _owner1,
        string memory _description,
        uint8 _category,
        uint8 _subCategory,
        uint256 _minimumBetInExaEs,
        uint256 _prizePercentPerThousand,
        uint8 _incentive,
        bool _isDrawPossible,
        uint256 _pauseTimestamp,
        address _kycDapp
    ) public {
        require(_owner == address(0), "Bet: ALREADY_INITIALIZED");
        _owner = _owner1;
        // transferOwnership(_owner1);
        description = _description;
        isDrawPossible = _isDrawPossible;
        category = _category;
        subCategory = _subCategory;
        minimumBetInExaEs = _minimumBetInExaEs;
        prizePercentPerThousand = _prizePercentPerThousand;
        betDeEx = BetDeEx(msg.sender);
        creationTimestamp = block.timestamp;
        pauseTimestamp = _pauseTimestamp;
        upVotes = 0;
        downVotes = 0;
        Incentive = _incentive;
        _setKycDapp(_kycDapp);
    }

    // function setKycDapp(address _kycDapp) public override onlyGovernance {
    //     _setKycDapp(_kycDapp);
    // }

    /// @notice this function gives amount of ExaEs that is total betted on this bet
    //Remove
    function totalContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /// @notice this function is used to place a bet on available choice
    /// @param _choice should be 0, 1, 2; no => 0, yes => 1, draw => 2
    function enterBet(uint8 _choice) public payable onlyApproved {
        uint256 _betTokensInExaEs = msg.value;
        require(block.timestamp < pauseTimestamp, "Cannot enter after pause time");
        require(
            _betTokensInExaEs >= minimumBetInExaEs,
            "Betting tokens should be more than minimum"
        );
        betDeEx.payRewards{ value: _betTokensInExaEs.mul(1).div(100) }(
            msg.sender,
            _owner,
            _betTokensInExaEs,
            1
        );

        uint256 _effectiveBetTokens = _betTokensInExaEs.mul(99).div(100);

        // betBalanceInExaEs[msg.sender] = betBalanceInExaEs[msg.sender].add(_effectiveBetTokens);

        // @dev _choice can be 0 or 1 and it can be 2 only if isDrawPossible is true
        if (_choice > 2 || (_choice == 2 && !isDrawPossible)) {
            require(false, "This choice is not available");
        }

        getNumberOfChoiceBettors[_choice] = getNumberOfChoiceBettors[_choice].add(1);

        totalBetTokensInExaEsByChoice[_choice] = totalBetTokensInExaEsByChoice[_choice].add(
            _effectiveBetTokens
        );

        bettorBetAmountInExaEsByChoice[msg.sender][_choice] = bettorBetAmountInExaEsByChoice[
            msg.sender
        ][_choice]
            .add(_effectiveBetTokens);

        betDeEx.emitNewBettingEvent(msg.sender, _choice, _effectiveBetTokens);
    }

    /// @notice this function is used by manager to load correct answer
    /// @param _choice is the correct choice
    function endBet(uint8 _choice) public onlyGovernance {
        //require(now >= pauseTimestamp, "cannot end bet before pause time");
        require(endedBy == address(0), "Bet: ALREADY_ENDED");

        // @dev _choice can be 0 or 1 and it can be 2 only if isDrawPossible is true
        if (_choice < 2 || (_choice == 2 && isDrawPossible)) {
            finalResult = _choice;
        } else require(false, "Bet: CHOICE_NOT_AVAILABLE");

        endedBy = msg.sender;
        endTimestamp = block.timestamp;

        totalPrize = totalContractBalance().mul(prizePercentPerThousand).div(1000);

        // @dev this is the left platform fee according to the totalPrize variable above
        uint256 Fee = totalContractBalance().sub(totalPrize);

        betDeEx.payRewards{ value: Fee.mul(Incentive).div(100) }(
            _owner,
            msg.sender,
            Fee,
            Incentive
        );
        payable(_owner).transfer(Fee.mul(100 - Incentive).div(100));

        betDeEx.emitEndBetEvent(endedBy, _choice, Fee);
    }

    function upvote() public {
        ++upVotes;
    }

    function downvote() public {
        ++downVotes;
    }

    /// @notice this function can be called by anyone to see how much winners are getting
    /// @param _bettorAddress is address whose prize we want to see
    /// @return winner prize of input address
    function seeWinnerPrize(address _bettorAddress) public view returns (uint256) {
        require(endTimestamp > 0, "Bet: CANNOT_SEE_PRIZE_BEFORE_BET_ENDS");
        return
            bettorBetAmountInExaEsByChoice[_bettorAddress][finalResult].mul(totalPrize).div(
                totalBetTokensInExaEsByChoice[finalResult]
            );
    }

    /// @notice this function will be called after bet ends and winner bettors can withdraw their prize share
    function withdrawPrize(address payable _bettorAddress) public payable {
        require(endTimestamp > 0, "Bet: CANNOT_WITHDRAW_BEFORE_END_TIME");
        require(!bettorHasClaimed[msg.sender], "Bet: CANNOT_CLAIM_AGAIN");
        require(_bettorAddress == msg.sender, "Bet: ONLY_BETTOR_CAN_CLAIM_HIS_WINNINGS");
        require(
            bettorBetAmountInExaEsByChoice[msg.sender][finalResult] >= minimumBetInExaEs,
            "Bet: CALLER_SHOULD_HAVE_A_BETTING"
        ); // @dev to keep out option 0
        uint256 _winningAmount =
            bettorBetAmountInExaEsByChoice[msg.sender][finalResult].mul(totalPrize).div(
                totalBetTokensInExaEsByChoice[finalResult]
            );
        bettorHasClaimed[msg.sender] = true;
        bettorBetAmountInExaEsByChoice[msg.sender][finalResult] = 0;
        //msg.value == _winningAmount;
        payable(_bettorAddress).transfer(_winningAmount);
        emit TransferES(_bettorAddress, _winningAmount);
        /*betDeEx.sendTokensToAddress(
            msg.sender,
            _winningAmount
        );*/
    }
}
