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

### `npm run compile` or `yarn compile`

It simply compiles your contracts, places them in the build folder and generates typechain outputs.

### `npm run test` or `yarn test`

Initially it compiles your contracts and places them in a `build` folder. This step is skipped if no changes are made in the contracts source codes. Then it spins two ganache servers (one represents `ETH` and other `ESN`) and it runs your typescript test suite.

> In windows you may get this error
>  ``` ./clone-kami.sh
>'.' is not recognized as an internal or external command, ```

> So you have to config your terminal `cmd` to `git bash`
>
> `npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"`

### `npm run test:debug` or `yarn test:debug`

Runs the test cases in debug mode and prints out all logs emmitted by the contracts and the internal transactions / message calls (`STATICCALL`s, `DELEGATECALL`s and `CALL`s).

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

## Addresses of Era Swap Alpha Mainnet Smart Contracts

Commit used for deployment: 807ca3ec9c12018a678348c60ec393afee621670 ([Browse Files](https://github.com/KMPARDS/esn-contracts/tree/807ca3ec9c12018a678348c60ec393afee621670)).

```
- ERC20 ETH: 0x72108a8CC3254813C6BE2F1b77be53E185abFdD9

- Plasma Manager ETH: 0x952Aa6073386f4a23F72cC1012138a6aaFD02d81

- Funds Manager ETH: 0x933A43a0F6368B38212A725029314E74F8379EEa

- Reverse Plasma ESN: 0x952Aa6073386f4a23F72cC1012138a6aaFD02d81

- Funds Manager ESN: 0x933A43a0F6368B38212A725029314E74F8379EEa

- Proxy Admin ESN: 0xc3b32965b799E5f96d54A312ad3afA5E57044B20

- NRT Implementation ESN: 0x16052A9db5179Dd1cD4EA78396B4D6D474Ce0cc5
- NRT Proxy ESN: 0x44EeD9580aEa47405F98173377296E75765074C8

- TimeAlly Implementation ESN: 0x878DDaad357b60792A0a1837ba3960B687A1e8F9
- TimeAlly Proxy ESN: 0xF19Ea5D90cD8b9480f6B46880b020fe3eADd392F

- TimeAlly Staking Target ESN: 0xDA7c99e1c5b8f6B6983502953540e621b092a69e

- Validator Set ESN: 0x8433035CBb293b0e460E99ad6B42274FdcE7099F

- Validator Manager Implementation ESN: 0xcC947C44Aa53ed4964224465E06BDDf84CEEAa19
- Validator Manager Proxy ESN: 0xd014d4149A57b9126F67c03F93FBC078810972Ef

- Randomness Implementation ESN: 0x530cb20a8fca732c8Cbc98e5b3BC8C805ca1d066
- Randomness Proxy ESN: 0xB2D158fcc47320F580E96374c34394750EC07558

- Block Reward Implementation ESN: 0x6D6b6Bd31297B4Bb5a6b27c31FF391946743F0ec
- Block Reward Proxy ESN: 0x69601642417b3fE47E5f8Cc893696a410e8F7448

- Prepaid ES Implementation ESN: 0x37dAF0403F6d9512D7E3731433b8BEEc6Ba5c021
- Prepaid ES Proxy ESN: 0x6325e975a09E047720f6D8cF25bD2577fB706250

- Dayswappers Implementation ESN: 0x70A72eb88d4297B5d0A952C703c495Ad4e2AB7e2
- Dayswappers Proxy ESN: 0x38CB3aeF3aAD8fB063C03F5EFD067C992EEFfDEC

- KYC DApp Implementation ESN: 0x27A513a976Ed7C6b41Ef15795327929C9Beb78b0
- KYC DApp Proxy ESN: 0xe1347dAAffbd3102F6CD67edAEA9dfc8A8C4FaDB

- TimeAlly Club Implementation ESN: 0x6784a20F4d525a785a762902d9095Ea7A455258C
- TimeAlly Club Proxy ESN: 0x8422da7f9bd28868796545D0cd9c15483bD6d214

- TimeAlly Promotional Bucket Implementation ESN: 0x5B6503E7071821C400f22B9c11012f3aF7f89049
- TimeAlly Promotional Bucket Proxy ESN: 0xE30be1E70e944b800f4933A11EC90C8E44a42594

- BetDeEx: 0xEcEB558CB9B905674544AB393414Aa2E2D2004c7

- Bet Implementation: 0x0bD7e7a62Da3fE867E6dDae56801D79785E4FC0B

- BuildSurvey: 0x87D673fCc902EF19241633674f6617fcd5B95F15

- Renting DApp: 0xE79be7ba19d3fA67736A27EC0d0D30D6cfC146F7

- TSGAP: 0x3334690604871703d27DC0c25FE2f5A0A91551D1

- PET Liquid: 0x4125e6Ef70AbA4f4Ed7c4eB3d53a08DC53a9316D

- PET Prepaid: 0xEAFB2b46B523B5199311d46D160f1174BFfe9A9E
```



# Documentation
Visit [here](https://docs.google.com/document/d/1OCCu4eVxVG9lyvO-GhfrXjmJvSiBsIBCTvzV8mEPMjE/edit?usp=sharing)
