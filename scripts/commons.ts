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
  esEth: '0x72108a8CC3254813C6BE2F1b77be53E185abFdD9',
  plasmaEth: '0x952Aa6073386f4a23F72cC1012138a6aaFD02d81',
  fundsManEth: '0x933A43a0F6368B38212A725029314E74F8379EEa',
  rplasmaEsn: '0x952Aa6073386f4a23F72cC1012138a6aaFD02d81',
  fundsManEsn: '0x933A43a0F6368B38212A725029314E74F8379EEa',
  proxyAdmin: '0xc3b32965b799E5f96d54A312ad3afA5E57044B20',
  nrtManager: '0x44EeD9580aEa47405F98173377296E75765074C8',
  timeallyManager: '0xF19Ea5D90cD8b9480f6B46880b020fe3eADd392F',
  timeallyStakingTarget: '0xDA7c99e1c5b8f6B6983502953540e621b092a69e',
  validatorSet: '0x8433035CBb293b0e460E99ad6B42274FdcE7099F',
  validatorManager: '0xd014d4149A57b9126F67c03F93FBC078810972Ef',
  randomnessManager: '0xB2D158fcc47320F580E96374c34394750EC07558',
  blockRewardManager: '0x69601642417b3fE47E5f8Cc893696a410e8F7448',
  prepaidEs: '0x6325e975a09E047720f6D8cF25bD2577fB706250',
  dayswappers: '0x38CB3aeF3aAD8fB063C03F5EFD067C992EEFfDEC',
  kycdapp: '0xe1347dAAffbd3102F6CD67edAEA9dfc8A8C4FaDB',
  timeallyclub: '0x8422da7f9bd28868796545D0cd9c15483bD6d214',
  timeAllyPromotionalBucket: '0xE30be1E70e944b800f4933A11EC90C8E44a42594',
  betdeex: '0xEcEB558CB9B905674544AB393414Aa2E2D2004c7',
  betImplementation: '0x0bD7e7a62Da3fE867E6dDae56801D79785E4FC0B',
  buildSurvey: '0x87D673fCc902EF19241633674f6617fcd5B95F15',
  rentingDappManager: '0xE79be7ba19d3fA67736A27EC0d0D30D6cfC146F7',
  tsgap: '0x3334690604871703d27DC0c25FE2f5A0A91551D1',
  petLiquid: '0x4125e6Ef70AbA4f4Ed7c4eB3d53a08DC53a9316D',
  petPrepaid: '0xEAFB2b46B523B5199311d46D160f1174BFfe9A9E',
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

const MAINNET = true;
// const MAINNET = false;

export const providerETH = new ethers.providers.InfuraProvider(
  MAINNET ? 'homestead' : 'rinkeby',
  'b20d36f9ea564d3a9b3ac01578948856'
);

export const providerESN = new CustomProvider(
  // MAINNET ? 'https://mainnet.eraswap.network' : 'https://testnet.eraswap.network'
  // 'http://localhost:8545'
  'https://rpc-temp.mainnet.eraswap.network'
);

let wallet: ethers.Wallet | null = null;
export let password: string = '';

if (!process.argv[2]) {
  throw '\nNOTE: Please pass your private key or keystore as comand line argument';
} else if (ethers.utils.isHexString(process.argv[2])) {
  wallet = new ethers.Wallet(process.argv[2]);
} else {
  const keystorePath = process.argv[2];
  const keystoreContent = readFileSync(keystorePath, { encoding: 'utf-8' }).replace(/\\/g, '');
  password = require('prompt-sync')()('password: ', { echo: '*' });

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
  '0x664236321865100cA76323c80e604eD271D9cEc6',
  '0x01A1E61c5e993b4F2083c145FB4f2Dd294e23E87',
  '0xd64473841Ad909411Eb559e2afe5F447508CC78f',
];

export const gasPrice = ethers.utils.parseUnits('25', 'gwei');

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
