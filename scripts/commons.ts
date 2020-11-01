//await kycDappInstanceESN.connect(new _ethers.Wallet('0x24C4FE6063E62710EAD956611B71825B778B041B18ED53118CE5DA5F02E494BA', providerESN)).setIdentityOwner(_ethers.utils.formatBytes32String('TIMESWAPPERS'), '0xC5E48826651017e1d8D113119B10Abb094D919B8', true, 1)

import { ethers } from 'ethers';
import { CustomProvider } from './custom-provider';
import { readFileSync } from 'fs-extra';
import { TransparentUpgradeableProxyFactory } from '../build/typechain/@openzeppelin';

interface ExistingContractAddresses {
  esEth?: string;
  plasmaEth?: string;
  fundsManEth?: string;
  rplasmaEsn?: string;
  fundsManEsn?: string;

  proxyAdmin?: string;
  nrtManager?: string;
  timeallyManager?: string;
  timeallyStakingTarget?: string;
  validatorSet?: string;
  validatorManager?: string;
  randomnessManager?: string;
  blockRewardManager?: string;
  prepaidEs?: string;
  dayswappers?: string;
  kycdapp?: string;
  timeallyclub?: string;
  timeAllyPromotionalBucket?: string;
  betdeex?: string;
  betImplementation?: string;
  timeswappers?: string;
  buzcafe?: string;
  powertoken?: string;
  buildSurvey?: string;
  rentingDappManager?: string;
  tsgap?: string;
  petLiquid?: string;
  petPrepaid?: string;
}

export const NULL_WALLET_DAYSWAPPERS = '0xB2cbBC1315F3535131a7947d56830A7EB4877C6e';

// ATTENTION: Ensure NRT SECONDS_IN_MONTH is 0 for testnet
// testnet chain
export const existing: ExistingContractAddresses = {
  esEth: '0x237027559f6C07A20EBa97C837b60b9815840a42',
  plasmaEth: '0xaaF33029B457A773C14DFdab4eDc4039E80fC5BF',
  fundsManEth: '0x10A23bbfAfc7cc3b94fa268D965F8B78543eCFE0',
  rplasmaEsn: '0x3bEb087e33eC0B830325991A32E3F8bb16A51317',
  fundsManEsn: '0xc4cfb05119Ea1F59fb5a8F949288801491D00110',
  proxyAdmin: '0x89309551Fb7AbaaB85867ACa60404CDA649751d4',
  nrtManager: '0x8418249278d74D46014683A8029Fd6fbC88482a1',
  timeallyManager: '0x2AA786Cd8544c50136e5097D5E19F6AE10E02543',
  timeallyStakingTarget: '0x22E0940C1AE5D31B9efBaf7D674F7D62895FBde8',
  validatorSet: '0xF9FCb8678dB15A5507A5f5414D68aBB2f4568E27',
  validatorManager: '0xaDbA96fDA88B0Cbcf11d668FF6f7A29d062eD050',
  randomnessManager: '0xCf535dB3c1EDbFbBdadbDe725119906BE20fb362',
  blockRewardManager: '0x7DD7EDB18C271959156967bc7651D685E8C1B225',
  prepaidEs: '0x56578Ff4c37Fd4e02C8d75FF9982A22C095dD3c5',
  dayswappers: '0xee42b2Dcc3d32AD5E736df6245AD8A88a70ba6bF',
  kycdapp: '0x8b2C9732137bAD7e629139B1fDa9E6094368f6B4',
  timeallyclub: '0x9e805A912edf6Ce7A57790f2797835Ff6220E5b0',
  timeAllyPromotionalBucket: '0x99660616e8922a1887E1683A6836f2cf916F4B2a',
  betdeex: '0x238FA401068d4b4Ba186Da30e84023AA1a763d17',
  betImplementation: '0x3aE4071a068De6f00a34ACE0Aec43CAc8cb87077',
  buildSurvey: '0x99c691E9592255673AB5CB3a2497B25ef77206d3',
  rentingDappManager: '0x73861A6C82C9342E30744353216D1f597642AD71',
  tsgap: '0xf6cA67cC19435A64a8D9911cF39Dc39dB63Ae1c8',
  petLiquid: '0x427D4946eE290A49Ac215D1fC64e465C457D99De',
  petPrepaid: '0x527778e73eC371979F85826C50EF8758d60366F0',
};
// local
// export const existing: ExistingContractAddresses = {
//   nrtManager: '0x961D3860d840D6ACCeAA302fbF5C0bb83b801bb4',
//   timeallyManager: '0x89309551Fb7AbaaB85867ACa60404CDA649751d4',
//   timeallyStakingTarget: '0x961D3860d840D6ACCeAA302fbF5C0bb83b801bb4',
//   validatorSet: '0x7eCb2899D9D66858D558391D448e6e4D1B4a86cF',
//   validatorManager: '0xcA4d0578c5e07F0964C7E7ccc87E606A234625b8',
//   randomnessManager: '0x89309551Fb7AbaaB85867ACa60404CDA649751d4',
//   blockRewardManager: '0x7F87f9830baB8A591E6f94fd1A47EE87560B0bB0',
//   prepaidEs: '0xCf535dB3c1EDbFbBdadbDe725119906BE20fb362',
//   dayswappers: '0x8418249278d74D46014683A8029Fd6fbC88482a1',
//   kycdapp: '0x56578Ff4c37Fd4e02C8d75FF9982A22C095dD3c5',
//   timeallyclub: '0x44F70d80642998F6ABc424ceAf1E706a479De8Ce',
//   timeAllyPromotionalBucket: '0x2AA786Cd8544c50136e5097D5E19F6AE10E02543',
//   tsgap: '0xC85dE468d545eD44a986b31D1c5d604733FB4A33',
// };

// const MAINNET = true;
const MAINNET = false;

export const providerETH = new ethers.providers.InfuraProvider(
  MAINNET ? 'homestead' : 'rinkeby',
  'b20d36f9ea564d3a9b3ac01578948856'
);

export const providerESN = new CustomProvider(
  MAINNET ? 'https://mainnet.eraswap.network' : 'https://testnet.eraswap.network'
  // 'http://localhost:8545'
);

let wallet: ethers.Wallet | null = null;

if (!process.argv[2]) {
  throw '\nNOTE: Please pass your private key or keystore as comand line argument';
} else if (ethers.utils.isHexString(process.argv[2])) {
  wallet = new ethers.Wallet(process.argv[2]);
} else {
  const keystorePath = process.argv[2];
  const keystoreContent = readFileSync(keystorePath, { encoding: 'utf-8' }).replace(/\\/g, '');
  const password: string = require('prompt-sync')()('password: ', { echo: '*' });

  console.log('\nUnlocking the keystore...');
  try {
    // console.log(keystoreContent);

    wallet = ethers.Wallet.fromEncryptedJsonSync(keystoreContent, password);
    console.log(`Unlock success! ${wallet.address}\n`);
  } catch (error) {
    throw 'There was error while unlocking keystore: ' + error.message + '\n';
  }
}

if (wallet === null) {
  throw '\nThere was an issue, wallet instance is not created';
}

export const walletETH = wallet.connect(providerETH);

export const walletESN = wallet.connect(providerESN);

export const validatorAddresses = [
  '0x08d85bd1004e3e674042eaddf81fb3beb4853a22',
  '0xb4fb9d198047fe763472d58045f1d9341161eb73',
  '0x36560493644fbb79f1c38d12ff096f7ec5d333b7',
];

export async function deployContract(options: {
  wallet: ethers.Wallet;
  factory: any;
  name: string;
  address: string | undefined;
  overrides?: ethers.PayableOverrides;
  args?: any[];
  proxy?: {
    admin: string;
    initializeOverrides?: ethers.PayableOverrides;
    initializeArgs?: any[];
    dontInitializeImplementation?: boolean;
  };
}): Promise<[string, ethers.Wallet]> {
  options.args = options.args ?? [];

  console.log(`\nDeploying ${options.name}...`);
  let instance = options.address
    ? options.factory.connect(options.address, options.wallet)
    : await new options.factory(options.wallet).deploy(...options.args, options.overrides);
  if (instance.deployTransaction) await instance.deployTransaction.wait();

  if (options.address) {
    console.log('existing');
  } else if (options.proxy) {
    console.log('Preparing to setup proxy...');

    options.proxy.initializeArgs = options.proxy.initializeArgs ?? [];
    const implementation = instance;
    console.log('Implementation:', implementation.address);

    if (implementation.initialize && !options.proxy.dontInitializeImplementation) {
      const tx = await implementation.initialize(
        ...options.proxy.initializeArgs
        // options.proxy.initializeOverrides
      );
      await tx.wait();
    }
    const proxyFactory = new TransparentUpgradeableProxyFactory(options.wallet);

    const { data } = (implementation?.populateTransaction?.initialize &&
      (await implementation?.populateTransaction?.initialize(...options.proxy.initializeArgs))) ?? {
      data: '0x',
    };

    instance = await proxyFactory.deploy(
      implementation.address,
      options.proxy.admin,
      data ?? '0x',
      options.proxy.initializeOverrides
    );
    if (instance.deployTransaction) await instance.deployTransaction.wait();
  }

  console.log(`${options.name} is deployed at:`, instance.address);
  return [instance.address, options.wallet];
}
