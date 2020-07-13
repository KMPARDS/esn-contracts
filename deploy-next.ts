import { ethers } from 'ethers';
import assert from 'assert';

import {
  NrtManagerFactory,
  TimeAllyManagerFactory,
  ValidatorSetFactory,
  ValidatorManagerFactory,
  RandomnessManagerFactory,
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

const existingValidatorSet = '0xA3C6cf908EeeebF61da6e0e885687Cab557b5e3F';

(async () => {
  // 1. check if 819 crore funds are available
  // dev: however less funds can be sent for multiple temp deployment also same
  //      validator contract can be used only set initial values of it can be
  //      updated multiple times.
  // 1 monthly NRT release requires 6,75,00,000 ES
  const requiredAmount = ethers.utils.parseEther('2' + '0'.repeat(7));
  const balance = await walletESN.getBalance();
  assert.ok(balance.gt(requiredAmount), 'required amount does not exist');

  // 2. deploy NRT contract with some funds
  console.log('\nDeploying NRT Manager...');
  const nrtInstance = await new NrtManagerFactory(walletESN).deploy({
    value: requiredAmount,
  });
  await nrtInstance.deployTransaction.wait();
  console.log('NRT Manager is deployed at:', nrtInstance.address);

  // 3. deploy TimeAlly
  console.log('\nDeploying TimeAlly Manager...');
  const timeallyInstance = await new TimeAllyManagerFactory(walletESN).deploy();
  await timeallyInstance.deployTransaction.wait();
  console.log('TimeAlly Manager is deployed at:', timeallyInstance.address);

  // /once/ 4. deploy validator set // ensure it exists before assuming
  console.log('\nDeploying Validator Set...');
  const validatorSetInstance = existingValidatorSet
    ? ValidatorSetFactory.connect(existingValidatorSet, walletESN)
    : await new ValidatorSetFactory(walletESN).deploy(
        validatorAddresses[0],
        ethers.constants.AddressZero
      );
  if (validatorSetInstance.deployTransaction) await validatorSetInstance.deployTransaction.wait();
  console.log('Validator Set is deployed at:', validatorSetInstance.address);

  // 5. deploy validator manager
  console.log('\nDeploying Validator Manager...');
  const validatorManagerInstance = await new ValidatorManagerFactory(walletESN).deploy();
  await validatorManagerInstance.deployTransaction.wait();
  console.log('Validator Manager is deployed at:', validatorManagerInstance.address);

  // /once/ 6. deploy random contract // ensure it exists before assuming
  console.log('\nDeploying Randomness Manager...');
  const randomnessManagerInstance = await new RandomnessManagerFactory(walletESN).deploy();
  await randomnessManagerInstance.deployTransaction.wait();
  console.log('Randomness Manager is deployed at:', randomnessManagerInstance.address);

  // 7. set initial values nrt manager
  {
    console.log('\nSetting initial values in NRT Manager...');
    const tx = await nrtInstance.setInitialValues([timeallyInstance.address], [150]);
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  // 8. set inital values in timeally
  {
    console.log('\nSetting initial values in TimeAlly Manager...');
    const tx = await timeallyInstance.setInitialValues(
      nrtInstance.address,
      validatorManagerInstance.address
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
      randomnessManagerInstance.address
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  // 10. set inital values in validator set
  {
    console.log('\nSetting initial values in Validator Set...');
    const tx = await validatorSetInstance.setInitialValues(validatorManagerInstance.address, 50);
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  // 11. add staking plans to validator manager contract
  {
    console.log('\nSetting initial values in Validator Manager...');
    const tx = await validatorManagerInstance.setInitialValues(
      validatorSetInstance.address,
      nrtInstance.address,
      timeallyInstance.address,
      randomnessManagerInstance.address
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }
})();
