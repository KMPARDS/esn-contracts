// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

// import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { TimeAllyPET } from "./PETLiquid.sol";
import { PrepaidEs } from "../../PrepaidEs/PrepaidEs.sol";

contract PetTokenConvert {
    // using SafeMath for uint256;
    PrepaidEs public prepaidEs = PrepaidEs(0x6325e975a09E047720f6D8cF25bD2577fB706250);
    TimeAllyPET public pet = TimeAllyPET(0x0009006c385CE986A576D6ADCA928888AFC8cDDB);

    mapping(address => mapping(uint256 => uint256)) public lastWithdrawMonthID;
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) public powerBoosterId;

    mapping(address => uint256) public AllowedWES;
    mapping(address => uint256) public ClaimedWES;

    /// @dev selected for taking care of leap years such that 1 Year = 365.242 days holds
    uint256 constant EARTH_SECONDS_IN_MONTH = 2629744;

    // Init
    // prepaidEs = PrepaidEs(0x6325e975a09E047720f6D8cF25bD2577fB706250);
    // pet = TimeAllyPET(0x0009006c385CE986A576D6ADCA928888AFC8cDDB);

    // function getPet(address _stakerAddress,uint256 _petId) public view returns  (uint256 ,uint256 ,uint256 ,uint256 ,uint256 ,uint256 ){
    //     return pet.pets(_stakerAddress,_petId);
    // }

    function monthlyAnnuity(
        address _stakerAddress,
        uint256 _petId,
        uint256 _endAnnuityMonthId
    ) public returns (uint256) {
        (uint256 a, uint256 b, uint256 c, uint256 d, uint256 e, uint256 f) =
            pet.pets(_stakerAddress, _petId);

        if (msg.sender != _stakerAddress) {
            require(
                pet.viewNomination(_stakerAddress, _petId, msg.sender),
                "nomination should be there"
            );
        }
        uint256 _lastAnnuityWithdrawlMonthId = lastWithdrawMonthID[_stakerAddress][_petId];

        /// @notice enforcing withdrawls only once
        require(_lastAnnuityWithdrawlMonthId < _endAnnuityMonthId, "start should be before end");

        /// @notice enforcing only 60 withdrawls
        require(_endAnnuityMonthId <= 60, "only 60 Annuity withdrawls");

        // calculating allowed timestamp
        uint256 _allowedTimestamp =
            pet.getNomineeAllowedTimestamp(_stakerAddress, _petId, _endAnnuityMonthId);

        if (msg.sender == _stakerAddress) {
            if (e > f / 2) {
                _allowedTimestamp -= EARTH_SECONDS_IN_MONTH * 6;
            } else {
                _allowedTimestamp -= EARTH_SECONDS_IN_MONTH * 12;
            }
        }

        /// @notice enforcing withdrawls only after allowed timestamp
        require(block.timestamp >= _allowedTimestamp, "cannot withdraw early");

        // calculating sum of annuity of the months
        uint256 _annuityBenefit =
            pet.getSumOfMonthlyAnnuity(
                _stakerAddress,
                _petId,
                _lastAnnuityWithdrawlMonthId + 1,
                _endAnnuityMonthId
            );

        /// @notice updating last withdrawl month
        lastWithdrawMonthID[_stakerAddress][_petId] = _endAnnuityMonthId;

        // prepaidEs.transferFrom(msg.sender, address(this), _annuityBenefit);
        // prepaidEs.transferLiquid(msg.sender,_annuityBenefit);
        AllowedWES[msg.sender] += _annuityBenefit;

        return _annuityBenefit;
    }

    function powerBooster(
        address _stakerAddress,
        uint256 _petId,
        uint256 _powerBoosterId
    ) public {
        if (msg.sender != _stakerAddress) {
            require(
                pet.viewNomination(_stakerAddress, _petId, msg.sender),
                "nomination should be there"
            );
        }

        bool lastPowerBooster = powerBoosterId[_stakerAddress][_petId][_powerBoosterId];
        // PET storage _pet = pets[_stakerAddress][_petId];
        (uint256 a, uint256 b, uint256 c, uint256 d, uint256 e, uint256 f) =
            pet.pets(_stakerAddress, _petId);

        /// @notice enforcing 12 power booster withdrawls
        require(1 <= _powerBoosterId && _powerBoosterId <= 12, "id should be in range");

        /// @notice enforcing power booster withdrawl once
        require(!lastPowerBooster, "booster already withdrawn");

        /// @notice enforcing target to be acheived
        require(
            pet.getMonthlyDepositedAmount(_stakerAddress, _petId, 13 - _powerBoosterId) >= c,
            "target not achieve d"
        );

        // calculating allowed timestamp based on time and nominee
        uint256 _allowedTimestamp =
            pet.getNomineeAllowedTimestamp(_stakerAddress, _petId, _powerBoosterId * 5 + 1);

        if (msg.sender == _stakerAddress) {
            if (e > f / 2) {
                _allowedTimestamp -= EARTH_SECONDS_IN_MONTH * 6;
            } else {
                _allowedTimestamp -= EARTH_SECONDS_IN_MONTH * 12;
            }
        }

        /// @notice enforcing withdrawl after _allowedTimestamp
        require(block.timestamp >= _allowedTimestamp, "cannot withdraw early");

        // calculating power booster amount
        uint256 _powerBoosterAmount = pet.calculatePowerBoosterAmount(_stakerAddress, _petId);

        /// @notice marking power booster as withdrawn
        powerBoosterId[_stakerAddress][_petId][_powerBoosterId] = true;

        if (_powerBoosterAmount > 0) {
            // prepaidEs.transferFrom(msg.sender, address(this), _powerBoosterAmount);
            // prepaidEs.transferLiquid(msg.sender,_powerBoosterAmount);

            AllowedWES[msg.sender] += _powerBoosterAmount;
        }
    }

    function ConvertWES(uint256 _amount) public {
        require(
            AllowedWES[msg.sender] >= ClaimedWES[msg.sender] + _amount,
            "You Are not Allowed to these withdraw WES"
        );
        prepaidEs.transferFrom(msg.sender, address(this), _amount);
        prepaidEs.transferLiquid(msg.sender, _amount);
        ClaimedWES[msg.sender] += _amount;
    }
}
