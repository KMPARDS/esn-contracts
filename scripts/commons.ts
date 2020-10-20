//await kycDappInstanceESN.connect(new _ethers.Wallet('0x24C4FE6063E62710EAD956611B71825B778B041B18ED53118CE5DA5F02E494BA', providerESN)).setIdentityOwner(_ethers.utils.formatBytes32String('TIMESWAPPERS'), '0xC5E48826651017e1d8D113119B10Abb094D919B8', true, 1)

import { ethers } from 'ethers';
import { CustomProvider } from './custom-provider';
import { readFileSync } from 'fs-extra';

interface ExistingContractAddresses {
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
  tsgap?: string;
  betdeex?: string;
  betImplementation?: string;
  timeswappers?: string;
  buzcafe?: string;
  powertoken?: string;
  buildSurvey?: string;
  rentingDappManager?: string;
}

// ATTENTION: Ensure NRT SECONDS_IN_MONTH is 0 for testnet
// testnet chain
export const existing: ExistingContractAddresses = {
  nrtManager: '0x89309551Fb7AbaaB85867ACa60404CDA649751d4',
  timeallyManager: '0x7F87f9830baB8A591E6f94fd1A47EE87560B0bB0',
  timeallyStakingTarget: '0xA3C6cf908EeeebF61da6e0e885687Cab557b5e3F',
  validatorSet: '0x8418249278d74D46014683A8029Fd6fbC88482a1',
  validatorManager: '0xE14D14bd8D0E2c36f5E4D00106417d8cf1000e22',
  randomnessManager: '0x44F70d80642998F6ABc424ceAf1E706a479De8Ce',
  blockRewardManager: '0x2AA786Cd8544c50136e5097D5E19F6AE10E02543',
  prepaidEs: '0x22E0940C1AE5D31B9efBaf7D674F7D62895FBde8',
  dayswappers: '0xC677B02C7B63aD664cBf54EAe6fA3C759D072742',
  kycdapp: '0xC4336494606203e3907539d5b462A5cb7853B3C6',
  timeallyclub: '0x6D57FaDF31e62E28Ab059f3dCd565df055428c57',
  timeAllyPromotionalBucket: '0xaDbA96fDA88B0Cbcf11d668FF6f7A29d062eD050',
  tsgap: '0x98dD383CE722eFc881354cE38922d50017C3eE89',
  betdeex: '0x8Cef02AB53256439dBFC83C7845786b6E60af989',
  betImplementation: '0x27F13c6e064b892D0a36548487329Eb19fC164A2',
  timeswappers: '0xC5E48826651017e1d8D113119B10Abb094D919B8', // dont comment
  buzcafe: '0x35f97f35ba126677B3183B3b6a29f46CA8BC18sE3', // dont comment
  powertoken: '0xC94A1C28a0c10D52A9a7A1756693F9B92672d15C', // dont comment
  buildSurvey: '0xCf535dB3c1EDbFbBdadbDe725119906BE20fb362',
  rentingDappManager: '0x5854C0813b5692C8e0F232B1f84aF37f20E3571b',
};
// local
// export const existing: ExistingContractAddresses = {
// nrtManager: '0x3bEb087e33eC0B830325991A32E3F8bb16A51317',
// timeallyManager: '0xc4cfb05119Ea1F59fb5a8F949288801491D00110',
// timeallyStakingTarget: '0x961D3860d840D6ACCeAA302fbF5C0bb83b801bb4',
// validatorSet: '0x7eCb2899D9D66858D558391D448e6e4D1B4a86cF',
// validatorManager: '0xcA4d0578c5e07F0964C7E7ccc87E606A234625b8',
// randomnessManager: '0x89309551Fb7AbaaB85867ACa60404CDA649751d4',
// blockRewardManager: '0x7F87f9830baB8A591E6f94fd1A47EE87560B0bB0',
// prepaidEs: '0xA3C6cf908EeeebF61da6e0e885687Cab557b5e3F',
// dayswappers: '0x8418249278d74D46014683A8029Fd6fbC88482a1',
// kycdapp: '0xE14D14bd8D0E2c36f5E4D00106417d8cf1000e22',
// timeallyclub: '0x44F70d80642998F6ABc424ceAf1E706a479De8Ce',
// timeAllyPromotionalBucket: '0x2AA786Cd8544c50136e5097D5E19F6AE10E02543',
// tsgap: '0xC85dE468d545eD44a986b31D1c5d604733FB4A33',
// };

export const providerETH = new ethers.providers.InfuraProvider(
  'rinkeby',
  'b20d36f9ea564d3a9b3ac01578948856'
);

const network = {
  name: 'EraSwapNetwork',
  chainId: 5196,
  ensAddress: '0xC4336494606203e3907539d5b462A5cb7853B3C6',
};

export const providerESN = new CustomProvider(
  'https://node2.testnet.eraswap.network',
  // 'http://localhost:8545',
  network
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
