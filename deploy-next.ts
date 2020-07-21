import { ethers } from 'ethers';
import assert from 'assert';

import {
  NrtManagerFactory,
  TimeAllyManagerFactory,
  ValidatorSetFactory,
  ValidatorManagerFactory,
  RandomnessManagerFactory,
  BlockRewardFactory,
  PrepaidEsFactory,
} from './build/typechain/ESN';

if (!process.argv[2]) {
  throw '\nNOTE: Please pass your private key as comand line argument';
}

const providerESN = new ethers.providers.JsonRpcProvider('http://13.127.185.136:80');

const walletESN = new ethers.Wallet(process.argv[2]).connect(providerESN);

const validatorAddresses = [
  '0x08d85bd1004e3e674042eaddf81fb3beb4853a22',
  '0xb4fb9d198047fe763472d58045f1d9341161eb73',
  '0x36560493644fbb79f1c38d12ff096f7ec5d333b7',
];

interface ExistingContractAddresses {
  nrtManager?: string;
  timeallyManager?: string;
  validatorSet?: string;
  validatorManager?: string;
  randomnessManager?: string;
  blockRewardManager?: string;
  prepaidEs?: string;
}

const existing: ExistingContractAddresses = {
  nrtManager: '0x94FE8BAC9C897D5c51D189796A0D7cEA749Aa209',
  timeallyManager: '0xcECa8ebe0C574ab34CBC3228E9a89C8214CCe211',
  validatorSet: '0xF3b22b71F534F6aa6EEfae0dBB7b53e693b8BC07',
  validatorManager: '0x6fb6BA974e630E577cEFffEca6058c2C399940AE',
  randomnessManager: '0xf620b0F20F90Ef5bF8C05aD65981F26775f8a32B',
  blockRewardManager: '0xe021bf70cE7C47d9744b2BdbFC7bdA1b4C7cAbD9',
  prepaidEs: '0x8Eb81e05dbeB960909eb2e672EAd940D3B1d2649',
};

(async () => {
  // 1. check if 819 crore funds are available
  // dev: however less funds can be sent for multiple temp deployment also same
  //      validator contract can be used only set initial values of it can be
  //      updated multiple times.
  // 1 monthly NRT release requires 6,75,00,000 ES
  const requiredAmount = ethers.utils.parseEther('10' + '0'.repeat(7));
  const balance = await walletESN.getBalance();
  assert.ok(balance.gt(requiredAmount), 'required amount does not exist');

  // 2. deploy NRT contract with some funds
  console.log('\nDeploying NRT Manager...');
  const nrtInstance = existing.nrtManager
    ? NrtManagerFactory.connect(existing.nrtManager, walletESN)
    : await new NrtManagerFactory(walletESN).deploy({
        value: requiredAmount,
      });
  if (nrtInstance.deployTransaction) await nrtInstance.deployTransaction.wait();
  if (existing.nrtManager) console.log('existing');
  console.log('NRT Manager is deployed at:', nrtInstance.address);

  // 3. deploy TimeAlly
  console.log('\nDeploying TimeAlly Manager...');
  const timeallyInstance = existing.timeallyManager
    ? TimeAllyManagerFactory.connect(existing.timeallyManager, walletESN)
    : await new TimeAllyManagerFactory(walletESN).deploy();
  if (timeallyInstance.deployTransaction) await timeallyInstance.deployTransaction.wait();
  if (existing.timeallyManager) console.log('existing');
  console.log('TimeAlly Manager is deployed at:', timeallyInstance.address);

  // /once/ 4. deploy validator set // ensure it exists before assuming
  console.log('\nDeploying Validator Set...');
  const validatorSetInstance = existing.validatorSet
    ? ValidatorSetFactory.connect(existing.validatorSet, walletESN)
    : await new ValidatorSetFactory(walletESN).deploy(
        validatorAddresses,
        ethers.constants.AddressZero
      );
  if (validatorSetInstance.deployTransaction) await validatorSetInstance.deployTransaction.wait();
  if (existing.validatorSet) console.log('existing');
  console.log('Validator Set is deployed at:', validatorSetInstance.address);

  // 5. deploy validator manager
  console.log('\nDeploying Validator Manager...');
  const validatorManagerInstance = existing.validatorManager
    ? ValidatorManagerFactory.connect(existing.validatorManager, walletESN)
    : await new ValidatorManagerFactory(walletESN).deploy();
  if (validatorManagerInstance.deployTransaction)
    await validatorManagerInstance.deployTransaction.wait();
  if (existing.validatorManager) console.log('existing');
  console.log('Validator Manager is deployed at:', validatorManagerInstance.address);

  // /once/ 6. deploy random contract // ensure it exists before assuming
  console.log('\nDeploying Randomness Manager...');
  const randomnessManagerInstance = existing.randomnessManager
    ? RandomnessManagerFactory.connect(existing.randomnessManager, walletESN)
    : await new RandomnessManagerFactory(walletESN).deploy();
  if (randomnessManagerInstance.deployTransaction)
    await randomnessManagerInstance.deployTransaction.wait();
  if (existing.randomnessManager) console.log('existing');
  console.log('Randomness Manager is deployed at:', randomnessManagerInstance.address);

  console.log('\nDeploying Block Reward Manager...');
  const blockRewardInstance = existing.blockRewardManager
    ? BlockRewardFactory.connect(existing.blockRewardManager, walletESN)
    : await new BlockRewardFactory(walletESN).deploy(ethers.constants.AddressZero);
  if (blockRewardInstance.deployTransaction) await blockRewardInstance.deployTransaction.wait();
  if (existing.blockRewardManager) console.log('existing');
  console.log('Block Reward Manager is deployed at:', blockRewardInstance.address);

  console.log('\nDeploying PrepaidES...');
  const prepaidEsInstance = existing.prepaidEs
    ? PrepaidEsFactory.connect(existing.prepaidEs, walletESN)
    : await new PrepaidEsFactory(walletESN).deploy();
  if (prepaidEsInstance.deployTransaction) await prepaidEsInstance.deployTransaction.wait();
  if (existing.prepaidEs) console.log('existing');
  console.log('PrepaidEs is deployed at:', prepaidEsInstance.address);

  // 7. set initial values nrt manager
  {
    console.log('\nSetting initial values in NRT Manager...');
    const tx = await nrtInstance.setInitialValues(
      [timeallyInstance.address, validatorManagerInstance.address],
      [150, 120]
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  // 8. set inital values in timeally
  {
    console.log('\nSetting initial values in TimeAlly Manager...');
    const tx = await timeallyInstance.setInitialValues(
      nrtInstance.address,
      validatorManagerInstance.address,
      prepaidEsInstance.address
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  // 9. set inital values in validator manager
  {
    console.log('\nSetting initial values in Validator Manager...');
    const tx = await validatorManagerInstance.setInitialValues(
      validatorSetInstance.address,
      nrtInstance.address,
      timeallyInstance.address,
      randomnessManagerInstance.address,
      blockRewardInstance.address
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  // 10. set inital values in validator set
  {
    console.log('\nSetting initial values in Validator Set...');
    const tx = await validatorSetInstance.setInitialValues(
      validatorManagerInstance.address,
      3,
      51,
      4,
      40
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  {
    console.log('\nSetting initial values in Block Reward Manager...');
    const tx = await blockRewardInstance.setInitialValues(validatorManagerInstance.address);
    await tx.wait();
    console.log('Tx:', tx.hash);
  }
})();
