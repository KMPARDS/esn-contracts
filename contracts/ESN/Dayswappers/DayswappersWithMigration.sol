// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { Dayswappers } from "./DayswappersCore.sol";
import { WithAdminMode } from "../Governance/AdminMode.sol";

contract DayswappersWithMigration is Dayswappers, WithAdminMode {
    struct SeatInput {
        address owner; // Address of seat owner.
        bool kycResolved; // whether upline referral is incremented after kyc approved.
        uint32 incompleteKycResolveSeatIndex; // upline's seat index after which process is pending
        uint32 depth; // tree depth, actual if kyc is completely resolved else upto which kyc was resolved. useful for giving rewards in iterator mode
        address introducer; // index of introducer, cannot be changed.
        uint32 beltIndex; // belt identifier
    }

    constructor(Belt[] memory _belts) Dayswappers(_belts) {}

    function migrateSeats(SeatInput[] memory _seats) public whenAdminMode onlyGovernance {
        for (uint256 i = 0; i < _seats.length; i++) {
            SeatInput memory _seat = _seats[i];

            uint32 _seatIndex = _createSeat(_seat.owner);
            Seat storage seat = seats[_seatIndex];

            uint32 _introducerSeatIndex = seatIndexes[_seat.introducer];
            require(
                seats[_introducerSeatIndex].owner == _seat.introducer,
                "Dayswappers: INTRODUCER_NOT_JOINED"
            );
            seat.introducerSeatIndex = _introducerSeatIndex;
            emit Introduce(_introducerSeatIndex, _seatIndex);

            if (_seat.kycResolved) {
                seat.kycResolved = _seat.kycResolved;
                emit KycResolve(_seatIndex);
            }

            if (_seat.depth > 0) {
                seat.depth = _seat.depth;
            }

            seat.beltIndex = _seat.beltIndex;
            emit Promotion(_seatIndex, _seat.beltIndex);
        }
    }
}
