<p align="center">
  <img height="1000%" src="https://eraswaptoken.io/images/es_newlogo.png">
  
  <p align="center">
    <a href="https://github.com/KMPARDS/esn-contracts/actions"><img alt="test status" src="https://github.com/KMPARDS/esn-contracts/workflows/tests/badge.svg"></a>
    <a href="https://solidity.readthedocs.io/en/v0.7.4/"><img alt="solidity v0.7.4" src="https://badgen.net/badge/solidity/v0.7.4/blue"></a>
    <a href="https://www.typescriptlang.org/"><img alt="typescript strict" src="https://badgen.net/badge/typescript/strict/blue?icon=typescript"></a>
    <a href="https://github.com/prettier/prettier"><img alt="styled with prettier" src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg"></a>
    <a href="https://hits.dwyl.com/kmpards/esn-contracts"><img alt="Hit count" src="https://hits.dwyl.com/kmpards/esn-contracts.svg"></a>
  </p>
  
  <p align="center">
    EraSwap Smart Contracts to be deployed on Ethereum and Era Swap Network. View project architecture <a href="https://github.com/KMPARDS/esn-contracts/issues/77">here</a>. You can find high level info about the smart contracts and their interconnection with each other in the <a href="https://eraswaptoken.io/pdf/eraswap_whitepaper.pdf">whitepaper</a>.
  </p>
</p>

## Directory Structure

This repo contains multiple smart contract projects associated with Era Swap on `ETH` and `ESN` chains.

- **`contracts`**: Contains all solidity contract files seperated by the chain on which it is to be deployed (`ETH` vs `ESN`).
- **`test`**: Contains test cases dirs for all projects in the `suites` directory.
- **`scripts`**: Contains scripts that are used to deploy contracts and migrate intial state.

## Tests

The tests are order dependent. This is done by calling the test hook in the appropriate order in [`test/suites/index.ts`](https://github.com/KMPARDS/esn-contracts/blob/master/test/suites/index.ts).

Contract instances are stored as [global](https://github.com/KMPARDS/esn-contracts/blob/master/test/global.ts#L36) variables for reuse across test cases. There are two chains (`ETH` and `ESN`), hence there are two provider instances `providerETH` and `providerESN`.

All contracts are deployed (during the initial test cases in the [`Contracts()`](https://github.com/KMPARDS/esn-contracts/blob/master/test/suites/index.ts#L19) hook) in two parts: `first` and `next` following by setting initial values in the contracts which takes place in the same hook.

## Adding new project

If you want to add a new smart contract that works with Era Swap Ecosystem to this project:

1. You can a create directory with your contract name inside `contracts/ESN` if you intend the contract to be deployed on ESN or `contracts/ETH` if it is to be deployed on Ethereum.
2. After that you can add some tests, you can start with declaring the contract in the [`test/global.ts`](https://github.com/KMPARDS/esn-contracts/blob/master/test/global.ts#L65).
3. You can add it to test deploy script in [`test/suites/Contracts/DeployNext.test.ts`](https://github.com/KMPARDS/esn-contracts/blob/master/test/suites/Contracts/DeployNext.test.ts#L337).
4. You can create a seperate directory for your project in [`test/suites/`](https://github.com/KMPARDS/esn-contracts/tree/master/test/suites), you can see examples of tests written for other projects like TimeAlly, Dayswappers, BetDeEx, ..., etc.

## Available Scripts

In the project directory, you can run:

### `npm run test`

Initially it compiles your contracts and places them in a `build` folder. This step is skipped if no changes are made in the contracts source codes. Then it spins two ganache servers (one represents `ETH` and other `ESN`) and it runs your typescript test suite.

### `npm run compile`

It simply compiles your contracts, places them in the build folder and generates typechain outputs.

## Era Swap Network Deployment Guide

You can find it [here](DEPLOYMENT_GUIDE.md).

## Useful links

- [Solidity Documentation](https://solidity.readthedocs.io/en/v0.7.0/).
- [Ethers.js Documentation](https://docs.ethers.io/ethers.js/html/).
- [Mocha Documentation](https://devdocs.io/mocha-api/).
- [TypeScript Documentation](https://www.typescriptlang.org/docs/home).
- [Typechain Docummentation](https://github.com/ethereum-ts/TypeChain#typechain)

## Addresses of Finale Testnet

```
- ERC20 ETH: 0x237027559f6C07A20EBa97C837b60b9815840a42

- Plasma Manager ETH: 0xaaF33029B457A773C14DFdab4eDc4039E80fC5BF
- Funds Manager ETH: 0x10A23bbfAfc7cc3b94fa268D965F8B78543eCFE0

- Reverse Plasma ESN: 0x3bEb087e33eC0B830325991A32E3F8bb16A51317
- Funds Manager ESN: 0xc4cfb05119Ea1F59fb5a8F949288801491D00110

- Proxy Admin ESN: 0x7F87f9830baB8A591E6f94fd1A47EE87560B0bB0

- NRT Implementation ESN: 0xA3C6cf908EeeebF61da6e0e885687Cab557b5e3F
- NRT Proxy ESN: 0x8418249278d74D46014683A8029Fd6fbC88482a1

- TimeAlly Implementation ESN: 0xE14D14bd8D0E2c36f5E4D00106417d8cf1000e22
- TimeAlly Proxy ESN: 0x2AA786Cd8544c50136e5097D5E19F6AE10E02543

- TimeAlly Staking Target ESN: 0x22E0940C1AE5D31B9efBaf7D674F7D62895FBde8

- Validator Set ESN: 0xF9FCb8678dB15A5507A5f5414D68aBB2f4568E27

- Validator Manager Implementation ESN: 0xC4336494606203e3907539d5b462A5cb7853B3C6
- Validator Manager Proxy ESN: 0xaDbA96fDA88B0Cbcf11d668FF6f7A29d062eD050

- Randomness Implementation ESN: 0xC140E0cb11401A07fb92Aea5dD232ad1cFEa2739
- Randomness Proxy ESN: 0xCf535dB3c1EDbFbBdadbDe725119906BE20fb362

- Block Reward Implementation ESN: 0x5854C0813b5692C8e0F232B1f84aF37f20E3571b
- Block Reward Proxy ESN: 0x7DD7EDB18C271959156967bc7651D685E8C1B225

- Prepaid ES Implementation ESN: 0xF168F55FA4113a0462c41C916d1f8FCB7B4d035e
- Prepaid ES Proxy ESN: 0x56578Ff4c37Fd4e02C8d75FF9982A22C095dD3c5

- Dayswappers Implementation ESN: 0x77596e12dFFb9984FfB14c43Fd46A5c6Bd083646
- Dayswappers Proxy ESN: 0xee42b2Dcc3d32AD5E736df6245AD8A88a70ba6bF

- KYC DApp Implementation ESN: 0x7b0E5aCA6F088691561022A0dB37830b56cb581a
- KYC DApp Proxy ESN: 0x8b2C9732137bAD7e629139B1fDa9E6094368f6B4

- TimeAlly Club Implementation ESN: 0xe021bf70cE7C47d9744b2BdbFC7bdA1b4C7cAbD9
- TimeAlly Club Proxy ESN: 0x9e805A912edf6Ce7A57790f2797835Ff6220E5b0

- TimeAlly Promotional Bucket Implementation ESN: 0xCEAFbf96deCB0435CF7AD7AaA87ABdAFFE7D5356
- TimeAlly Promotional Bucket Proxy ESN: 0x99660616e8922a1887E1683A6836f2cf916F4B2a

- BetDeEx: 0x238FA401068d4b4Ba186Da30e84023AA1a763d17
- Bet Implementation: 0x3aE4071a068De6f00a34ACE0Aec43CAc8cb87077

- BuildSurvey: 0x99c691E9592255673AB5CB3a2497B25ef77206d3

- Renting DApp: 0x73861A6C82C9342E30744353216D1f597642AD71

- TSGAP: 0xf6cA67cC19435A64a8D9911cF39Dc39dB63Ae1c8

- PET Liquid: 0x427D4946eE290A49Ac215D1fC64e465C457D99De

- PET Prepaid: 0x527778e73eC371979F85826C50EF8758d60366F0
```
