// SPDX-License-Identifier: MIT
// File: contracts/ESN/CertiDapp/BuildSurvey.sol


pragma solidity ^0.7.0;
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}


/**
 * @title Storage
 * @dev Store & retreive value in a variable
 */
contract BuildSurvey  {
    using SafeMath for uint256;

    address owner;

    struct Survey {
        string title;
        string surveyTitle;
        address author;
        uint256 time;
        bool isPublic;
    }
    enum State { START, PRIVATE, COMPLETE, PUBLISH }

    mapping(bytes32 => mapping(address => uint8)) public accessUser; // 0- no access , 1- access can vote,  2-  access already voted
    mapping(bytes32 => Survey) public surveys;
    mapping(address => uint256) public Incentives;
    mapping(bytes32 => uint256) public Funds;
    mapping(address => bool) public KYC; //proxy
    // kyc-1 needed for user .

    event NewSurvey(address indexed user, bytes32 hash);
    event SentSurvey(bytes32 indexed hash, uint16[] answers);
    event User(address indexed user, bytes32 hash);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyKycApproved() {
        require(KYC[msg.sender], "you need to complete your KYC");
        // require(kycDapp().isKycLevel1(msg.sender), "BuildSurvery: KYC_NOT_APPROVED");
        _;
    }

    modifier Govern() {
        require(msg.sender == owner, "you are not Authorized");
        _;
    }

    function setKYC(address user) public Govern {
        KYC[user] = true;
    }

    function announceIncentive(uint256 _value) public {
        Incentives[msg.sender] = _value;
    }

    function addSurvey(
        string memory _title,
        string memory _surveyTitle,
        uint256 _time,
        bool _ispublic
    ) public payable onlyKycApproved returns (bytes32) {
        //   bytes memory source_b = toBytes(msg.sender);
        //   bytes memory source = abi.encodePacked(msg.sender);
        bytes32 hashedinput = keccak256(abi.encodePacked(_title, msg.sender));
        require((surveys[hashedinput].time == 0), "you have already build a Survey with this name");
        surveys[hashedinput].title = _title;
        surveys[hashedinput].surveyTitle = _surveyTitle;
        surveys[hashedinput].time = _time;
        surveys[hashedinput].author = msg.sender;
        surveys[hashedinput].isPublic = _ispublic;
        emit NewSurvey(msg.sender, hashedinput);

        

        return hashedinput;
    }

    function addUsers(bytes32 _survey, address[] memory users) public payable onlyKycApproved {
        require(msg.value == users.length, "Insufficient Funds");
        Funds[_survey] = Funds[_survey] + users.length;
        for (uint256 i = 0; i < users.length; i++) {
            accessUser[_survey][users[i]] = 1;
            emit User(msg.sender, _survey);
        }
    }

    function sendSurvey(bytes32 _survey, uint16[] memory _feedback) public payable {
        require(surveys[_survey].time >= block.timestamp, "Survey has Ended");
        if (surveys[_survey].isPublic == false) {
            require(accessUser[_survey][msg.sender] != 1, "You have no access for this survey");
            Funds[_survey] = Funds[_survey] - 1;
            msg.sender.transfer(1 ether);
        }
        require(accessUser[_survey][msg.sender] != 2, "You have already voted  for this survey");
        // surveys[_survey].feedback.push(_feedback);
        emit SentSurvey(_survey, _feedback);
        require(msg.value == 1 ether, "Insufficient Funds");
        accessUser[_survey][msg.sender] = 2;
    }

    function collectFunds(bytes32 _survey) public payable {
        require(surveys[_survey].author == msg.sender, "You are not Authorized");
        msg.sender.transfer(Funds[_survey]);
    }
}