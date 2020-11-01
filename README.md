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

### `npm run test` or `yarn test`

Initially it compiles your contracts and places them in a `build` folder. This step is skipped if no changes are made in the contracts source codes. Then it spins two ganache servers (one represents `ETH` and other `ESN`) and it runs your typescript test suite.

### `npm run compile` or `yarn compile`

It simply compiles your contracts, places them in the build folder and generates typechain outputs.

### `npm run flatten <file-path>` or `yarn flatten <file-path>`

Pass a contract file path to this command and it will output the flattened contract. This could be useful if you're verifing on Etherscan or need the contract source code to play with in Remix IDE.

```sh
yarn flatten contracts/ESN/KycDapp/KycDapp.sol

# or

yarn flatten contracts/ESN/KycDapp/KycDapp.sol --output Temp.sol
```

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
- ERC20 ETH: 0x2C94a51e1ffc2a43c3d88B645c3de007eeaccB75

- Plasma Manager ETH: 0x7c43dcA5752c59e12B79b605E7C6866E4bCAa4bE
- Funds Manager ETH: 0x7BdE3BfbFb22B6237C2145EbF3bACaF55Cd88000

- Reverse Plasma ESN: 0x3bEb087e33eC0B830325991A32E3F8bb16A51317
- Funds Manager ESN: 0xc4cfb05119Ea1F59fb5a8F949288801491D00110

- Proxy Admin ESN: 0x89309551Fb7AbaaB85867ACa60404CDA649751d4

- NRT Implementation ESN: 0x7F87f9830baB8A591E6f94fd1A47EE87560B0bB0
- NRT Proxy ESN: 0xA3C6cf908EeeebF61da6e0e885687Cab557b5e3F

- TimeAlly Implementation ESN: 0x8418249278d74D46014683A8029Fd6fbC88482a1
- TimeAlly Proxy ESN: 0x44F70d80642998F6ABc424ceAf1E706a479De8Ce

- TimeAlly Staking Target ESN: 0x2AA786Cd8544c50136e5097D5E19F6AE10E02543

- Validator Set ESN: 0x22E0940C1AE5D31B9efBaf7D674F7D62895FBde8

- Validator Manager Implementation ESN: 0xF9FCb8678dB15A5507A5f5414D68aBB2f4568E27
- Validator Manager Proxy ESN: 0x6D57FaDF31e62E28Ab059f3dCd565df055428c57

- Randomness Implementation ESN: 0xaDbA96fDA88B0Cbcf11d668FF6f7A29d062eD050
- Randomness Proxy ESN: 0xC140E0cb11401A07fb92Aea5dD232ad1cFEa2739

- Block Reward Implementation ESN: 0xCf535dB3c1EDbFbBdadbDe725119906BE20fb362
- Block Reward Proxy ESN: 0xa5AAaA6b5E852433aCCE2f0c64595b286d8A4977

- Prepaid ES Implementation ESN: 0x7DD7EDB18C271959156967bc7651D685E8C1B225
- Prepaid ES Proxy ESN: 0x10082d2730BA943a8D9a8D5e890b6bA062e8d1e9

- Dayswappers Implementation ESN: 0x56578Ff4c37Fd4e02C8d75FF9982A22C095dD3c5
- Dayswappers Proxy ESN: 0x2B7e1FF3D2D14c5b80907a61D70DA04Ae6DFEAEb

- KYC DApp Implementation ESN: 0xee42b2Dcc3d32AD5E736df6245AD8A88a70ba6bF
- KYC DApp Proxy ESN: 0x56d38C60793b64aeab5E62630a2b690C695779da

- TimeAlly Club Implementation ESN: 0x8b2C9732137bAD7e629139B1fDa9E6094368f6B4
- TimeAlly Club Proxy ESN: 0x25c315E657385467433005D051FB90BdA789ac56

- TimeAlly Promotional Bucket Implementation ESN: 0x9e805A912edf6Ce7A57790f2797835Ff6220E5b0
- TimeAlly Promotional Bucket Proxy ESN: 0xb9b7BEAA9276F8C79996a4B70C3BB4E01C886e6f

- BetDeEx: 0x99660616e8922a1887E1683A6836f2cf916F4B2a
- Bet Implementation: 0x238FA401068d4b4Ba186Da30e84023AA1a763d17

- BuildSurvey: 0x72e8c7B091b00d4be459357AC2c065079ADCa09B

- Renting DApp: 0x44B299D15Fa883216CD7c0e5a77901aEBB670c46

- TSGAP: 0x73861A6C82C9342E30744353216D1f597642AD71

- PET Liquid: 0xf6cA67cC19435A64a8D9911cF39Dc39dB63Ae1c8

- PET Prepaid: 0x427D4946eE290A49Ac215D1fC64e465C457D99De
```
