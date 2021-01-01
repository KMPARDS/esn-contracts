// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
// import { ProductManager } from "./ProductManager.sol";
import { IRentingDappManager } from "./IRentingDappManager.sol";

contract RentalAgreement {
    using SafeMath for uint256;

    // This declares a new complex type which will hold the paid rents
    struct PaidRent {
        uint256 id;
        uint256 value;
    }

    // Variables used

    PaidRent[] public paidrents;
    uint256 public createdTimestamp;
    uint256 public maxRent;
    uint256 public payingRent;
    uint256 public security;
    uint256 public cancellationFee;
    uint256 public incentive;
    uint256 public amt;
    uint256[] public possibleRents;

    string public item;
    address public lessor;
    address public lessee;
    address public productManager;
    address public manager;

    bool status;
    uint48 checkLessee;
    uint48 checkLessor;
    uint48 byLessor;
    uint48 byLessee;

    enum State { Created, Checked, Started, Terminated }
    enum Check {
        Lessor_Confirmed,
        Lessee_Confirmed,
        Initial_Check,
        Return_Lessor_Confirmed,
        Return_Lessee_Confirmed,
        Final_Check,
        DISPUTE,
        RESOLVED
    }
    State public state;
    Check public check;

    // Deployed by Lessor
    constructor(
        address _lessor,
        address _lessee,
        uint256 _maxrent,
        uint256 _security,
        uint256 _cancellationFee,
        uint256 _incentive,
        string memory _item,
        bool _status,
        uint256[] memory _possibleRents,
        address _manager
    ) {
        lessor = payable(_lessor);
        lessee = payable(_lessee);
        maxRent = _maxrent;
        item = _item;
        security = _security;
        cancellationFee = _cancellationFee;
        incentive = _incentive;
        status = _status;
        manager = _manager;

        possibleRents = _possibleRents;

        createdTimestamp = block.timestamp;
        state = State.Created;
    }

    // Modifiers used
    modifier onlyLessor() {
        require(msg.sender == lessor);
        _;
    }
    modifier onlyLessee() {
        require(msg.sender == lessee);
        _;
    }
    modifier inState(State _state) {
        require(state == _state, "Not in desired State for function execution");
        _;
    }
    modifier inCheck(Check _check) {
        require(check == _check, "Not in desired Check for function execution");
        _;
    }

    // Events for DApps to listen to
    event checked(Check);
    event agreementConfirmed();
    event paidRent(uint256);
    event contractTerminated(State);

    // Functions
    function initialCheckByLessor(uint48 _condition) public inState(State.Created) {
        //require(_condition==true, "Condition of item is bad -Lessor");
        require(lessor == msg.sender, "Only lessor can call");
        checkLessor = _condition;
        emit checked(Check.Lessor_Confirmed);
        check = Check.Lessor_Confirmed;
    }

    function initialCheckByLessee(uint48 _condition)
        public
        payable
        inCheck(Check.Lessor_Confirmed)
    {
        require(msg.sender != lessor, "Not lessee");
        //require(_condition==true, "Condition of item is bad -Lessee");
        checkLessee = _condition;
        emit checked(Check.Lessee_Confirmed);
        lessee = msg.sender;
        require(msg.value == security, "Security amount needed");
        check = Check.Lessee_Confirmed;

        initialCheck();
    }

    function initialCheck() public payable inState(State.Created) inCheck(Check.Lessee_Confirmed) {
        if (checkLessee == checkLessor && checkLessee == 1) {
            emit checked(Check.Initial_Check);
            check = Check.Initial_Check;
            state = State.Checked;

            confirmAgreement();
        } else {
            payable(lessee).transfer(security);

            state = State.Terminated;
        }
    }

    function confirmAgreement() public inState(State.Checked) inCheck(Check.Initial_Check) {
        require(msg.sender == lessee);
        emit agreementConfirmed();
        state = State.Started;
    }

    function cancelRent() public payable onlyLessee {
        require(state != State.Terminated, "You cannot cancel at this stage");
        require(amt == 0, "You have already started paying your rent");

        payable(lessee).transfer(security);
        require(msg.value == cancellationFee);
        emit contractTerminated(State.Terminated);
        payable(lessor).transfer(msg.value);
        amt = amt.add(cancellationFee);

        state = State.Terminated;
    }

    function payRent() public payable onlyLessee inState(State.Started) {
        //require(msg.value == rent);

        uint256 f = 0;

        for (uint256 i = 0; i < possibleRents.length; i++) {
            if (msg.value == possibleRents[i]) {
                f = 1;
                payingRent = possibleRents[i];
                break;
            }
        }

        require(f == 1, "Rent value doesn't come under available rents");

        //require(msg.value == payingRent);

        emit paidRent(payingRent);
        payable(lessor).transfer(msg.value.mul(99 - incentive).div(100));

        IRentingDappManager(manager).payRewards{ value: msg.value.mul(incentive + 1).div(100) }(
            msg.sender,
            lessor,
            msg.value,
            incentive + 1
        );

        amt = amt.add(payingRent);
        paidrents.push(PaidRent({ id: paidrents.length + 1, value: payingRent }));
    }

    function finalCheckByLessor(uint48 _condition) public onlyLessor inState(State.Started) {
        byLessor = _condition;
        //require(_condition==true, "Condition of item returned is damage -Lessor");
        emit checked(Check.Return_Lessor_Confirmed);
        check = Check.Return_Lessor_Confirmed;
    }

    function finalCheckByLessee(uint48 _condition)
        public
        onlyLessee
        inState(State.Started)
        inCheck(Check.Return_Lessor_Confirmed)
    {
        byLessee = _condition;
        //require(_condition==true, "Condition of item returned is damage -Lessee");
        emit checked(Check.Return_Lessee_Confirmed);
        check = Check.Return_Lessee_Confirmed;

        finalCheck();
    }

    function finalCheck() private inState(State.Started) inCheck(Check.Return_Lessee_Confirmed) {
        if (byLessor == byLessee) {
            emit checked(Check.Final_Check);
            check = Check.Final_Check;
        } else {
            //Dispute Case
            IRentingDappManager(manager).raiseDispute(
                productManager,
                address(this),
                "Raised depostite"
            );
            check = Check.DISPUTE;
        }
    }

    function resolveDispute(uint256 additionalCharges) public {
        require(IRentingDappManager(manager).isAdmin(msg.sender), "not authorized");
        emit contractTerminated(State.Terminated);
        require(additionalCharges <= security, "cannot charge penalty more than security");

        /*platform fees = 1% */

        payable(lessor).transfer(additionalCharges.mul(99).div(100));

        IRentingDappManager(manager).payRewards{ value: additionalCharges.mul(1).div(100) }(
            lessee,
            lessor,
            additionalCharges,
            1
        );

        uint256 refund = security.sub(additionalCharges);
        payable(lessee).transfer(refund);
        amt = amt.add(additionalCharges);

        state = State.Terminated;

        check = Check.RESOLVED;
    }

    function terminateNormally()
        public
        payable
        onlyLessor
        inState(State.Started)
        inCheck(Check.Final_Check)
    {
        emit contractTerminated(State.Terminated);
        require(
            byLessee == 1,
            "Please terminate contract using the 'terminatetWithAdditionalCharges' function"
        );
        payable(lessee).transfer(security);

        state = State.Terminated;
    }

    function terminateWithAdditionalCharges(uint256 additionalCharges)
        public
        payable
        onlyLessor
        inState(State.Started)
        inCheck(Check.Final_Check)
    {
        emit contractTerminated(State.Terminated);
        require(byLessee == 0, "You must terminate the contract normally");
        require(additionalCharges <= security, "You cannot charge penalty more than security");

        /*platform fees = 1% */

        payable(lessor).transfer(additionalCharges.mul(99).div(100));

        IRentingDappManager(manager).payRewards{ value: additionalCharges.mul(1).div(100) }(
            lessee,
            lessor,
            additionalCharges,
            1
        );

        uint256 refund = security.sub(additionalCharges);
        payable(lessee).transfer(refund);
        amt = amt.add(additionalCharges);

        state = State.Terminated;
    }
}
