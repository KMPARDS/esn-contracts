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
  esEth: '0x2C94a51e1ffc2a43c3d88B645c3de007eeaccB75',
  plasmaEth: '0x7c43dcA5752c59e12B79b605E7C6866E4bCAa4bE',
  fundsManEth: '0x7BdE3BfbFb22B6237C2145EbF3bACaF55Cd88000',
  rplasmaEsn: '0x3bEb087e33eC0B830325991A32E3F8bb16A51317',
  fundsManEsn: '0xc4cfb05119Ea1F59fb5a8F949288801491D00110',
  proxyAdmin: '0x89309551Fb7AbaaB85867ACa60404CDA649751d4',
  nrtManager: '0xA3C6cf908EeeebF61da6e0e885687Cab557b5e3F',
  timeallyManager: '0x44F70d80642998F6ABc424ceAf1E706a479De8Ce',
  timeallyStakingTarget: '0x2AA786Cd8544c50136e5097D5E19F6AE10E02543',
  validatorSet: '0x22E0940C1AE5D31B9efBaf7D674F7D62895FBde8',
  validatorManager: '0x6D57FaDF31e62E28Ab059f3dCd565df055428c57',
  randomnessManager: '0xC140E0cb11401A07fb92Aea5dD232ad1cFEa2739',
  blockRewardManager: '0xa5AAaA6b5E852433aCCE2f0c64595b286d8A4977',
  prepaidEs: '0x10082d2730BA943a8D9a8D5e890b6bA062e8d1e9',
  dayswappers: '0x2B7e1FF3D2D14c5b80907a61D70DA04Ae6DFEAEb',
  kycdapp: '0x56d38C60793b64aeab5E62630a2b690C695779da',
  timeallyclub: '0x25c315E657385467433005D051FB90BdA789ac56',
  timeAllyPromotionalBucket: '0xb9b7BEAA9276F8C79996a4B70C3BB4E01C886e6f',
  betdeex: '0x99660616e8922a1887E1683A6836f2cf916F4B2a',
  betImplementation: '0x238FA401068d4b4Ba186Da30e84023AA1a763d17',
  buildSurvey: '0x72e8c7B091b00d4be459357AC2c065079ADCa09B',
  rentingDappManager: '0x44B299D15Fa883216CD7c0e5a77901aEBB670c46',
  tsgap: '0x73861A6C82C9342E30744353216D1f597642AD71',
  petLiquid: '0xf6cA67cC19435A64a8D9911cF39Dc39dB63Ae1c8',
  petPrepaid: '0x427D4946eE290A49Ac215D1fC64e465C457D99De',
};
// local
// export const existing: ExistingContractAddresses = {
//   // nrtManager: '0x961D3860d840D6ACCeAA302fbF5C0bb83b801bb4',
//   // timeallyManager: '0x89309551Fb7AbaaB85867ACa60404CDA649751d4',
//   // timeallyStakingTarget: '0x961D3860d840D6ACCeAA302fbF5C0bb83b801bb4',
//   // validatorSet: '0x7eCb2899D9D66858D558391D448e6e4D1B4a86cF',
//   // validatorManager: '0xcA4d0578c5e07F0964C7E7ccc87E606A234625b8',
//   // randomnessManager: '0x89309551Fb7AbaaB85867ACa60404CDA649751d4',
//   // blockRewardManager: '0x7F87f9830baB8A591E6f94fd1A47EE87560B0bB0',
//   // prepaidEs: '0xCf535dB3c1EDbFbBdadbDe725119906BE20fb362',
//   // dayswappers: '0x8418249278d74D46014683A8029Fd6fbC88482a1',
//   // kycdapp: '0x56578Ff4c37Fd4e02C8d75FF9982A22C095dD3c5',
//   // timeallyclub: '0x44F70d80642998F6ABc424ceAf1E706a479De8Ce',
//   // timeAllyPromotionalBucket: '0x2AA786Cd8544c50136e5097D5E19F6AE10E02543',
//   // tsgap: '0xC85dE468d545eD44a986b31D1c5d604733FB4A33',
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
