# Kyc, Dayswapper and TimeAlly Club Integration

The purpose of this document is to guide new platform contracts to call methods on KycDapp, Dayswappers and TimeAlly Club as per need.

There is an abstract contract ([docs](https://docs.soliditylang.org/en/v0.7.4/contracts.html#abstract-contracts)) called 
[RegistryDependent](https://github.com/KMPARDS/esn-contracts/blob/master/contracts/ESN/KycDapp/RegistryDependent.sol). This contract 
needs to be imported in and inherited in your contract. (If you have a factory pattern, it is suggested to only inherit on factory 
contract and not in child contracts).

```solidity
import { RegistryDependent } from "./RegistryDependent.sol";

contract MyDapp is RegistryDependent {

}
```

`RegistryDependent` basically means that your contract relies on KycDapp smart contract's Identity registry to get address of 
other contracts. Thats why for this to work, AFTER DEPLOYING YOUR CONTRACT, YOU NEED TO CALL 
[`setKycDapp`](https://github.com/KMPARDS/esn-contracts/blob/master/contracts/ESN/KycDapp/RegistryDependent.sol#L20) METHOD PASSING IN
ADDRESS OF KYC DAPP.

When you inherit RegistryDependent, this exposes a bunch of methods marked as `public` or `internal` in your contract which 
you can find in the `RegistryDependent.sol` file.

## Kyc Integration

For example, there is a public method called [`kycDapp()`](https://github.com/KMPARDS/esn-contracts/blob/master/contracts/ESN/KycDapp/RegistryDependent.sol#L48) 
that returns a `IKycDapp` contract object. Now we need to also know what methods exist in `IKycDapp` which you can see by finding the file from which it was 
[imported `./IKycDapp.sol`](https://github.com/KMPARDS/esn-contracts/blob/master/contracts/ESN/KycDapp/RegistryDependent.sol#L5).
There you can see some methods that you can call on `kycDapp()`. One of them is 
[`isKycLevel1`](https://github.com/KMPARDS/esn-contracts/blob/master/contracts/ESN/KycDapp/IKycDapp.sol#L36)
method.

```solidity
import { RegistryDependent } from "./RegistryDependent.sol";

contract MyDapp is RegistryDependent {
  function myFunction() public {
    bool isKycDone = kycDapp().isKycLevel1(msg.sender); // This line makes a internal message call to kyc dapp contract.
    require(isKycDone, "Kyc is not done");
  }
}
```

## Dayswapper Reward Integration

Similarly you can send dayswapper rewards using `dayswappers()` method that is exposed due to inheritance. It returns a `IDayswappers` object.
So you need to browse to [import](https://github.com/KMPARDS/esn-contracts/blob/master/contracts/ESN/KycDapp/RegistryDependent.sol#L13) path 
`../Dayswappers/IDayswappers.sol` if you want to see what methods are available to call.

For example, you want to pay to the introducer of your user, you can use 
[`payToIntroducer`](https://github.com/KMPARDS/esn-contracts/blob/master/contracts/ESN/Dayswappers/IDayswappers.sol#L62) method.

```solidity
import { RegistryDependent } from "./RegistryDependent.sol";

contract MyCoffeeDapp is RegistryDependent {
  function buyCoffee() public payable { // Note that this function is payable and amount is important to be received here
    // sending 10% of amount received as incentive. Reward ratio as 50% liquid, 0% prepaid, 50% staked.
    dayswappers().payToIntroducer{value: msg.value.mul(10).div(100)}(msg.sender, [50, 0, 50]);
  }
}
```

## TimeAlly Club Integration

This is not a straight forward process. Your contract methods will revert while giving TimeAlly Club rewards if you contract
is not authorized in TimeAlly Club.

1. Your platform needs it's incentive structure set in TimeAlly Club ([solidity](https://github.com/KMPARDS/esn-contracts/blob/master/contracts/ESN/TimeAlly/Club/TimeAllyClub.sol#L70),
[example js code in testcases](https://github.com/KMPARDS/esn-contracts/blob/master/test/suites/Contracts/SetInitialValuesNext.test.ts#L143-L201)).

Method that you can call for giving rewards are [rewardToIntroducer](https://github.com/KMPARDS/esn-contracts/blob/master/contracts/ESN/TimeAlly/Club/TimeAllyClub.sol#L82)
and [rewardToNetworker](https://github.com/KMPARDS/esn-contracts/blob/master/contracts/ESN/TimeAlly/Club/TimeAllyClub.sol#L90). But these
methods are locked by `onlyAuthorized` modifier. Your contract needs to be authorized.

2. Your smart contract needs it's Kyc to be done from Bhakti mam's wallet (admin/governance wallet). Is would be done using 
[`setIdentityOwner`](https://github.com/KMPARDS/esn-contracts/blob/master/contracts/ESN/KycDapp/KycDapp.sol#L76) method on KycDApp 
(UI is also integrated in kyc's admin panel for this). This will create a username for your smart contract.

3. Call [updateAuthorization](https://github.com/KMPARDS/esn-contracts/blob/master/contracts/ESN/Governance/Authorizable.sol#L29-L33) method 
which is available on TimeAlly Club smart contract (since `Authorizable` is inherited) using admin/governance wallet. Now your platform is 
authorized to give TimeAlly Club rewards.

It is highly suggested that you write test cases for your platform contract about this procedure for better clarity and prevent 
wasting time trying to figure this out manually on Remix. Also note that the order of the steps followed also matters.
