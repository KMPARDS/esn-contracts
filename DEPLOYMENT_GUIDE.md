# Deployment Guide

There are two guides:

- Running a listner node that syncs to the Era Swap Network Alpha Mainnet.
- Setting up a fresh, seperate instance of Era Swap Network, which can be used as a testnet.

## Running a listner node

This is generally required by exchanges who are considering to list Era Swap token. They can either list the ERC20 Era Swaps or Native Era Swaps based on their preference. An ESN node setup is required only if an exchange wants to list Native Era Swaps. Other reasons you might want to run a listner node is to run a analyser tool (like block explorer).

There is no seperate/forked codebase for Era Swap Network node. Era Swap Network utilises the original codebase of OpenEthereum. You can download a binary for your operating system from their [releases](https://github.com/openethereum/openethereum/releases) or [archived releases](https://github.com/openethereum/parity-ethereum/releases). It is advised to use `v2.7.2-stable` or higher.

The below steps are given for Ubuntu OS.

> TODO: Add deployment guide for Windows and macOS

Just download the appropriate binary on your server.

```
$ curl -O https://take-url-of-binary-from-releases
```

If that is a zip file, you will want an unzip tool

```
$ sudo apt-get install zip unzip
$ unzip path/to/your/file.zip
```

Give the binary execution permission

```
$ chmod +x path/to/parity
```

Then you need the chain specification for Era Swap Network which is available in this [repo](https://github.com/KMPARDS/chain-spec). Please switch to the appropriate branch `testnet` or `mainnet`. If you need to sync to mainnet, you will need `mainnet` branch.

```
$ git clone https://github.com/KMPARDS/chain-spec.git
$ cd chain-spec
$ git checkout mainnet
```

This should contain `spec.json`, `config.toml` and `reserved_peers.txt` files. Copy these files to the directory where the parity binary is.

```
$ ls
parity spec.json config.toml reserved_peers.txt

$ ./parity --config config.toml
```

This should start your node. Also make sure that port `30300` is open for allowing the node to interact with other nodes on the internet.

### Troubleshooting

Running a OpenEthereum or Parity node is something not specific to Era Swap and there is a lot of content available on the internet for troubleshooting.

You can checkout great guides setting up nodes which contain elaborated information on the topic:

- https://www.quiknode.io/guides/infrastructure/how-to-run-a-openethereum-ex-parity-client-node
- https://medium.com/quiknode/running-a-parity-ethereum-node-in-2019-aedad24976e0

## Setting up fresh instance of Era Swap Network

You could be doing this if:

- You work for Era Swap and you need a new testnet.
- You are a security researcher and want to audit the system.

To do an independent testnet setup of Era Swap Network, following high level steps to be executed:

1. Setup nodes.
2. Deploy `first` group contracts.
3. Transfer 909 crore ES from Ethereum to Era Swap Network (using Plasma bridge).
4. Deploy `next` group contracts.
5. Run migration scripts.
6. Deactivate admin mode in smart contracts.

### 1. Setup nodes

Use Parity or OpenEthereum binaries from their [releases](https://github.com/openethereum/openethereum/releases) or [archived releases](https://github.com/openethereum/parity-ethereum/releases). Some issues have been encoundered by many people with OpenEthereum (`v3`), but Parity (`v2`) works fine. During the development of Era Swap Network project, we have used `v2.7.2-stable`. So this version is guaranteed to work.

#### Follow the steps in `Running a listner node` above along with some more steps:

- The development was done on 3 nodes, so you can simulate the same by creating 3 servers on AWS (though you can use different number of nodes if you want, but 3 is recommended to get started).
- Download the `parity` binary on all the servers.
- You should be using the `testnet` branch of the `chain-spec` repo.
- Create a deployer wallet (for deploying contracts) and add it's address in the chain spec (replace the address in the bottom of the `spec.json` file with your address for getting initial funds of 910 crore which you would be locking in smart contracts in subsequent steps).

#### Create accounts to be used as validators on each of the servers

```
./parity --config config.toml account new
```

You will need to create a new file called `node.pwds` in the binary file's and write the password in that.

```
$ ls
parity spec.json config.toml reserved_peers.txt node.pwds
```

You also need to locate the path of keystore, it should be available inside `esn/chains/Era_Swap_Network/keys/`. This keystore is required by Kami which will be setup in the next step.

#### Setup for Kami

This is a co-ordinator node, which does the validator jobs required for ESN. This requires the port `15986` for testnet and `25986` for mainnet, to be open, to allow a Kami connect with other peer Kamis.

```
$ git clone https://github.com/KMPARDS/kami
$ cd kami
$ npm ci
$ npm run build
```

Kami needs a config to work with, you can take a template of config from `test/test-configs/kami_live`

```
$ mkdir config
$ cp -r test/test-configs/kami_live config/.
```

- `kami-config.json`: Change the value of `ETH_URL` to your infura.
- `keystore.json`: Remove this keystore and add your keystore that you created earlier.
- `password.txt`: Add your password of the keystore in this file.
- `seed-peers.txt`: Add correct IP and ports of Kamis in your network.

So now your nodes setup should be done.

### 2. Deploy `first` group contracts.

#### About `scripts/commons.ts`

This script file contains node urls, addresses of deployed contract and is commonly used in all the deploy and migration scripts that need these variables. Please have a look at these scripts. In `commons.ts`, you can find an object called `existing`, this contains existing contracts which are already deployed (for use in migration or redeployment). If an address exists then the script will not deploy the contract and insteaed use the address and pass it on futher. When you want to deploy contracts, then there should be properties in the `existing` object, you can basically comment them out.

The please read the above before you proceed.

You will need to update node url for `providerETH`, `providerESN` variables and comment the addresses in the `existing` obj.

These contracts can be deployed using a deploy script in this repo. You will need a new wallet with some test ethers. This should be a wallet other than validators, you can call it deployment wallet. Pass it's private key or local path to the keystore file.

```
ts-node scripts/deploy/first.ts 0xPrivateKey

or

ts-node scripts/deploy/first.ts /path/to/keystore
```

This will deploy the following contracts:

- ERC20 contract on ETH
- Plasma Manager on ETH
- Funds Manager on ETH
- Reverse Plasma on ESN
- Funds Manager on ESN

Note for deploying Funds manager contract on ESN, the deployer wallet needs to have 910 crore ES. You can configure that in the `spec.json` file.

It will display the addresses of these contracts on the console. Please copy these addresses and add them to `existing` object in the `commons.ts` file and in Kami's config on each of the servers.

### 3. Transfer 909 crore ES from Ethereum to Era Swap Network (using Plasma bridge).

To deploy `next` group contracts you need at least 819 crore ES (NRT contract requires this to be initialized).

To do this, you can use [Merkle Swap user interface](https://github.com/KMPARDS/merkle-swap), you will need to setup it locally and run it.

On a lower level the steps go like this:

1. You already have 910 crore funds in your deployer wallet, send 909 crore funds ERC20 tokens to the `Funds Manager ETH` address.
2. Kami should be running, and posting ethereum block roots to ESN.
3. Once the block is confirmed, you will need to generate a merkle proof (see `test/utils/proof.ts`) and submit it to the `Funds Manager ESN` contract, and it will send you.

### 4. Deploy `next` group contracts.

The previous step will get you balance of 909 crore ES native tokens. This step requires you to lock 819 crore tokens in NRT Manager smart contract.

To deploy the contracts,

```
ts-node scripts/deploy/next.ts 0xPrivateKey

or

ts-node scripts/deploy/next.ts /path/to/keystore
```

This will deploy the following contracts:

- NRT Implementation ESN
- NRT Proxy ESN

- TimeAlly Implementation ESN
- TimeAlly Proxy ESN

- TimeAlly Staking Target ESN

- Validator Set ESN

- Validator Manager Implementation ESN
- Validator Manager Proxy ESN

- Randomness Implementation ESN
- Randomness Proxy ESN

- Block Reward Implementation ESN
- Block Reward Proxy ESN

- Prepaid ES Implementation ESN
- Prepaid ES Proxy ESN

- Dayswappers Implementation ESN
- Dayswappers Proxy ESN

- KYC DApp Implementation ESN
- KYC DApp Proxy ESN

- TimeAlly Club Implementation ESN
- TimeAlly Club Proxy ESN

- TimeAlly Promotional Bucket Implementation ESN
- TimeAlly Promotional Bucket Proxy ESN

- BetDeEx
- Bet Implementation

- BuildSurvey

- Renting DApp

- TSGAP

- PET Liquid

- PET Prepaid

Please update these addresses in `commons.ts` and required addresses in Kami config.

### 5. Run migration scripts.

Once contracts are deployed, their admin modes are on by default. Admin mode is used for migrating initial state to the contracts. After the migration step, you can disable the admin mode. After that it cannot be turned on again.

```
ts-node scripts/migrate/stakings-create.ts /path/to/keystore
ts-node scripts/migrate/stakings-extend.ts /path/to/keystore

ts-node scripts/migrate/liquid.ts /path/to/keystore
ts-node scripts/migrate/prepaid.ts /path/to/keystore

ts-node scripts/migrate/kyc-register.ts /path/to/keystore
ts-node scripts/migrate/dayswappers.ts /path/to/keystore
```

### 6. Deactivate admin mode in smart contracts.

> TODO: Add this script
