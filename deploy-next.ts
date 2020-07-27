import { ethers } from 'ethers';
import assert from 'assert';

import {
  NrtManagerFactory,
  TimeAllyManagerFactory,
  TimeAllyStakingFactory,
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
  timeallyStakingTarget?: string;
  validatorSet?: string;
  validatorManager?: string;
  randomnessManager?: string;
  blockRewardManager?: string;
  prepaidEs?: string;
}

// ATTENTION: Ensure NRT SECONDS_IN_MONTH is 0 for testnet
const existing: ExistingContractAddresses = {
  // nrtManager: '0x0Ae4241f8E7Fc914a4763e6454382D1d99848E36',
  // timeallyManager: '0x0269f9BE76A6e55A3c8dC099e7c157bA60Cb3F16',
  // timeallyStakingTarget: '0x4CdEC678773c79a4dBE995aDaa857Da3D10c04c1',
  validatorSet: '0xF3b22b71F534F6aa6EEfae0dBB7b53e693b8BC07',
  // validatorManager: '0x7c03EfdA4E55244174De5fF6336139cC162fad25',
  randomnessManager: '0xf620b0F20F90Ef5bF8C05aD65981F26775f8a32B',
  blockRewardManager: '0xe021bf70cE7C47d9744b2BdbFC7bdA1b4C7cAbD9',
  prepaidEs: '0x3b2a928bd4Ab36Dd46C4C44C4d3C2dbD60B6c092',
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
  // console.log('\nDeploying NRT Manager...');
  // const nrtInstance = existing.nrtManager
  //   ? NrtManagerFactory.connect(existing.nrtManager, walletESN)
  //   : await new NrtManagerFactory(walletESN).deploy({
  //       value: requiredAmount,
  //     });
  // if (nrtInstance.deployTransaction) await nrtInstance.deployTransaction.wait();
  // if (existing.nrtManager) console.log('existing');
  // console.log('NRT Manager is deployed at:', nrtInstance.address);
  const nrtInstance = NrtManagerFactory.connect(
    await deployContract(NrtManagerFactory, 'Nrt Manager', existing.nrtManager, {
      value: requiredAmount,
    }),
    walletESN
  );

  // 3. deploy TimeAlly
  // console.log('\nDeploying TimeAlly Manager...');
  // const timeallyInstance = existing.timeallyManager
  //   ? TimeAllyManagerFactory.connect(existing.timeallyManager, walletESN)
  //   : await new TimeAllyManagerFactory(walletESN).deploy();
  // if (timeallyInstance.deployTransaction) await timeallyInstance.deployTransaction.wait();
  // if (existing.timeallyManager) console.log('existing');
  // console.log('TimeAlly Manager is deployed at:', timeallyInstance.address);
  const timeallyInstance = TimeAllyManagerFactory.connect(
    await deployContract(TimeAllyManagerFactory, 'TimeAlly Manager', existing.timeallyManager),
    walletESN
  );

  const timeallyStakingTargetInstance = TimeAllyStakingFactory.connect(
    await deployContract(
      TimeAllyStakingFactory,
      'TimeAlly Staking Target',
      existing.timeallyStakingTarget
    ),
    walletESN
  );

  // /once/ 4. deploy validator set // ensure it exists before assuming
  // console.log('\nDeploying Validator Set...');
  // const validatorSetInstance = existing.validatorSet
  //   ? ValidatorSetFactory.connect(existing.validatorSet, walletESN)
  //   : await new ValidatorSetFactory(walletESN).deploy(
  //       validatorAddresses,
  //       ethers.constants.AddressZero
  //     );
  // if (validatorSetInstance.deployTransaction) await validatorSetInstance.deployTransaction.wait();
  // if (existing.validatorSet) console.log('existing');
  // console.log('Validator Set is deployed at:', validatorSetInstance.address);
  const validatorSetInstance = ValidatorSetFactory.connect(
    await deployContract(ValidatorSetFactory, 'Validator Set', existing.validatorSet),
    walletESN
  );

  // 5. deploy validator manager
  // console.log('\nDeploying Validator Manager...');
  // const validatorManagerInstance = existing.validatorManager
  //   ? ValidatorManagerFactory.connect(existing.validatorManager, walletESN)
  //   : await new ValidatorManagerFactory(walletESN).deploy();
  // if (validatorManagerInstance.deployTransaction)
  //   await validatorManagerInstance.deployTransaction.wait();
  // if (existing.validatorManager) console.log('existing');
  // console.log('Validator Manager is deployed at:', validatorManagerInstance.address);
  const validatorManagerInstance = ValidatorManagerFactory.connect(
    await deployContract(ValidatorManagerFactory, 'Validator Manager', existing.validatorManager),
    walletESN
  );

  // /once/ 6. deploy random contract // ensure it exists before assuming
  // console.log('\nDeploying Randomness Manager...');
  // const randomnessManagerInstance = existing.randomnessManager
  //   ? RandomnessManagerFactory.connect(existing.randomnessManager, walletESN)
  //   : await new RandomnessManagerFactory(walletESN).deploy();
  // if (randomnessManagerInstance.deployTransaction)
  //   await randomnessManagerInstance.deployTransaction.wait();
  // if (existing.randomnessManager) console.log('existing');
  // console.log('Randomness Manager is deployed at:', randomnessManagerInstance.address);
  const randomnessManagerInstance = RandomnessManagerFactory.connect(
    await deployContract(
      RandomnessManagerFactory,
      'Randomness Manager',
      existing.randomnessManager
    ),
    walletESN
  );

  // console.log('\nDeploying Block Reward Manager...');
  // const blockRewardInstance = existing.blockRewardManager
  //   ? BlockRewardFactory.connect(existing.blockRewardManager, walletESN)
  //   : await new BlockRewardFactory(walletESN).deploy(ethers.constants.AddressZero);
  // if (blockRewardInstance.deployTransaction) await blockRewardInstance.deployTransaction.wait();
  // if (existing.blockRewardManager) console.log('existing');
  // console.log('Block Reward Manager is deployed at:', blockRewardInstance.address);
  const blockRewardInstance = BlockRewardFactory.connect(
    await deployContract(BlockRewardFactory, 'Block Reward', existing.blockRewardManager),
    walletESN
  );

  // console.log('\nDeploying PrepaidES...');
  // const prepaidEsInstance = existing.prepaidEs
  //   ? PrepaidEsFactory.connect(existing.prepaidEs, walletESN)
  //   : await new PrepaidEsFactory(walletESN).deploy();
  // if (prepaidEsInstance.deployTransaction) await prepaidEsInstance.deployTransaction.wait();
  // if (existing.prepaidEs) console.log('existing');
  // console.log('PrepaidEs is deployed at:', prepaidEsInstance.address);
  const prepaidEsInstance = PrepaidEsFactory.connect(
    await deployContract(PrepaidEsFactory, 'Prepaid Es', existing.prepaidEs),
    walletESN
  );

  // 7. set initial values nrt manager
  {
    console.log('\nSetting initial values in NRT Manager...');
    const tx = await nrtInstance.setInitialValues(
      true,
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
      prepaidEsInstance.address,
      timeallyStakingTargetInstance.address
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  // init timeally staking target to prevent
  {
    const tx = await timeallyStakingTargetInstance.init(
      ethers.constants.AddressZero,
      12,
      0,
      nrtInstance.address,
      validatorManagerInstance.address,
      []
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

async function deployContract(
  factory: any,
  name: string,
  existing: string | undefined,
  overrides?: ethers.PayableOverrides
): Promise<string> {
  console.log(`\nDeploying ${name}...`);
  const instance = existing
    ? factory.connect(existing, walletESN)
    : await new factory(walletESN).deploy(overrides);
  if (instance.deployTransaction) await instance.deployTransaction.wait();
  if (existing) console.log('existing');
  console.log(`${name} is deployed at:`, instance.address);
  return instance.address;
}
