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

// const providerESN = new ethers.providers.JsonRpcProvider('http://13.127.185.136:80');

const walletESN = new ethers.Wallet(process.argv[2]).connect(
  new ethers.providers.JsonRpcProvider('http://13.127.185.136:80')
);

const validatorAddresses = [
  '0x08d85bd1004e3e674042eaddf81fb3beb4853a22',
  '0xb4fb9d198047fe763472d58045f1d9341161eb73',
  '0x36560493644fbb79f1c38d12ff096f7ec5d333b7',
];

(async () => {
  // 1. check if 819 crore funds are available
  // dev: however less funds can be sent for multiple temp deployment also same
  //      validator contract can be used only set initial values of it can be
  //      updated multiple times.
  // 1 monthly NRT release requires 6,75,00,000 ES
  const requiredAmount = ethers.utils.parseEther('20' + '0'.repeat(7));
  const balance = await walletESN.getBalance();
  assert.ok(balance.gt(requiredAmount), 'required amount does not exist');

  // 2. deploy NRT contract with some funds
  console.log('Deploying NRT Manager...');
  const nrtInstance = await new NrtManagerFactory().deploy();
  console.log('NRT Manager is deployed at:', nrtInstance.address);

  // 3. deploy TimeAlly
  console.log('Deploying TimeAlly Manager...');
  const timeallyInstance = await new TimeAllyManagerFactory().deploy();
  console.log('TimeAlly Manager is deployed at:', timeallyInstance.address);

  // /once/ 4. deploy validator set // ensure it exists before assuming
  console.log('Deploying Validator Set...');
  const validatorSetInstance = await new ValidatorSetFactory().deploy(
    validatorAddresses[0],
    ethers.constants.AddressZero
  );
  console.log('Validator Set is deployed at:', validatorSetInstance.address);

  // 5. deploy validator manager
  console.log('Deploying Validator Manager...');
  const validatorManagerInstance = await new ValidatorManagerFactory().deploy();
  console.log('Validator Manager is deployed at:', validatorManagerInstance.address);

  // /once/ 6. deploy random contract // ensure it exists before assuming
  console.log('Deploying Randomness Manager...');
  const randomnessManagerInstance = await new RandomnessManagerFactory().deploy();
  console.log('Randomness Manager is deployed at:', randomnessManagerInstance.address);

  // 7. set initial values nrt manager
  {
    console.log('Setting initial values in NRT Manager...');
    const tx = await nrtInstance.setInitialValues([timeallyInstance.address], [150]);
    console.log('Tx:', tx.hash);
  }

  // 8. set inital values in timeally
  {
    console.log('Setting initial values in TimeAlly Manager...');
    const tx = await timeallyInstance.setInitialValues(
      nrtInstance.address,
      validatorManagerInstance.address
    );
    console.log('Tx:', tx.hash);
  }

  // 9. set inital values in validator manager
  {
    console.log('Setting initial values in Validator Manager...');
    const tx = await validatorManagerInstance.setInitialValues(
      validatorSetInstance.address,
      nrtInstance.address,
      timeallyInstance.address,
      randomnessManagerInstance.address
    );
    console.log('Tx:', tx.hash);
  }

  // 10. set inital values in validator set
  {
    console.log('Setting initial values in Validator Set...');
    const tx = await validatorSetInstance.setInitialValues(validatorManagerInstance.address, 50);
    console.log('Tx:', tx.hash);
  }

  // 11. add staking plans to validator manager contract
  {
    console.log('Setting initial values in Validator Manager...');
    const tx = await validatorManagerInstance.setInitialValues(
      validatorSetInstance.address,
      nrtInstance.address,
      timeallyInstance.address,
      randomnessManagerInstance.address
    );
    console.log('Tx:', tx.hash);
  }
})();
