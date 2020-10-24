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

## Useful links

- [Solidity Documentation](https://solidity.readthedocs.io/en/v0.7.0/).
- [Ethers.js Documentation](https://docs.ethers.io/ethers.js/html/).
- [Mocha Documentation](https://devdocs.io/mocha-api/).
- [TypeScript Documentation](https://www.typescriptlang.org/docs/home).
- [Typechain Docummentation](https://github.com/ethereum-ts/TypeChain#typechain)

## More Information

- You can customise to a specific `solc` version by doing `npm i solc@0.5.10`, but it's not recommended. Note: `solc@0.4.*` will not work with this template, because it has a different compile.js structure. It is recommended that you upgrade your smart contract code to be able to be compiled by a `solc@0.5.*` and above compiler. You can check out [breaking changes](https://solidity.readthedocs.io/en/v0.5.0/050-breaking-changes.html) in `0.5.*` and [breaking changes](https://solidity.readthedocs.io/en/v0.6.0/060-breaking-changes.html) in `0.6.*`and upgrade your smart contracts accordingly.
- If something doesn't work, [file an issue here](https://github.com/zemse/create-solidity-project/issues/new).
