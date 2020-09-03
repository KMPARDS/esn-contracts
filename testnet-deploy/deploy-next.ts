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
  DayswappersWithMigrationFactory,
  KycDappFactory,
  TimeAllyClubFactory,
  TimeAllyPromotionalBucketFactory,
} from '../build/typechain/ESN';
import { parseEther, formatEther } from 'ethers/lib/utils';

// import { CustomWallet } from '../timeally-tsx/src/ethereum/custom-wallet';

import { existing } from './existing-contracts';

if (!process.argv[2]) {
  throw '\nNOTE: Please pass your private key as comand line argument';
}

const providerESN = new ethers.providers.JsonRpcProvider('http://13.127.185.136:80');
// const providerESN = new ethers.providers.JsonRpcProvider('http://localhost:8545');

const walletESN = new ethers.Wallet(process.argv[2]).connect(providerESN);
// const walletESN = new CustomWallet(process.argv[2]).connect(providerESN);

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
  const requiredAmount = ethers.utils.parseEther('819' + '0'.repeat(7));
  const balance = await walletESN.getBalance();
  console.log('balance', formatEther(balance));

  // assert.ok(balance.gte(requiredAmount), 'required amount does not exist');

  // 2. deploy NRT contract with some funds
  const nrtInstance = NrtManagerFactory.connect(
    await deployContract(NrtManagerFactory, 'Nrt Manager', existing.nrtManager, {
      value: requiredAmount,
    }),
    walletESN
  );

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

  const validatorSetInstance = ValidatorSetFactory.connect(
    await deployContract(ValidatorSetFactory, 'Validator Set', existing.validatorSet, {}, [
      validatorAddresses,
      ethers.constants.AddressZero,
    ]),
    walletESN
  );

  const validatorManagerInstance = ValidatorManagerFactory.connect(
    await deployContract(ValidatorManagerFactory, 'Validator Manager', existing.validatorManager),
    walletESN
  );

  const randomnessManagerInstance = RandomnessManagerFactory.connect(
    await deployContract(
      RandomnessManagerFactory,
      'Randomness Manager',
      existing.randomnessManager
    ),
    walletESN
  );

  const blockRewardInstance = BlockRewardFactory.connect(
    await deployContract(BlockRewardFactory, 'Block Reward', existing.blockRewardManager, {}, [
      ethers.constants.AddressZero,
    ]),
    walletESN
  );

  const prepaidEsInstance = PrepaidEsFactory.connect(
    await deployContract(PrepaidEsFactory, 'Prepaid Es', existing.prepaidEs),
    walletESN
  );

  const dayswappersInstance = DayswappersWithMigrationFactory.connect(
    await deployContract(DayswappersWithMigrationFactory, 'Dayswappers', existing.dayswappers, {}, [
      [
        { required: 0, distributionPercent: 0, leadershipPercent: 0 },
        { required: 5, distributionPercent: 20, leadershipPercent: 0 },
        { required: 20, distributionPercent: 40, leadershipPercent: 0 },
        { required: 100, distributionPercent: 52, leadershipPercent: 0 },
        { required: 500, distributionPercent: 64, leadershipPercent: 0 },
        { required: 2000, distributionPercent: 72, leadershipPercent: 4 },
        { required: 6000, distributionPercent: 84, leadershipPercent: 4 },
        { required: 10000, distributionPercent: 90, leadershipPercent: 2 },
      ],
    ]),
    walletESN
  );

  const kycInstance = KycDappFactory.connect(
    await deployContract(KycDappFactory, 'KYC Dapp', existing.kycdapp),
    walletESN
  );

  const timeallyclubInstance = TimeAllyClubFactory.connect(
    await deployContract(TimeAllyClubFactory, 'TimeAlly Club', existing.timeallyclub),
    walletESN
  );

  const timeAllyPromotionalBucketInstance = TimeAllyPromotionalBucketFactory.connect(
    await deployContract(
      TimeAllyPromotionalBucketFactory,
      'TimeAlly Promotional Bucket',
      existing.timeAllyPromotionalBucket
    ),
    walletESN
  );

  // 7. set initial values nrt manager
  {
    console.log('\nSetting initial values in NRT Manager...');
    const tx = await nrtInstance.setInitialValues(
      true,
      [timeallyInstance.address, walletESN.address],
      [150, 850]
      // [
      //   timeallyInstance.address,
      //   validatorManagerInstance.address,
      //   dayswappersInstance.address,
      //   timeallyclubInstance.address,
      //   walletESN.address,
      // ],
      // [150, 120, 100, 100, 530]
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
      dayswappersInstance.address,
      timeallyStakingTargetInstance.address,
      timeallyclubInstance.address
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  // init timeally staking target to prevent
  if (!existing.timeallyStakingTarget) {
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
      blockRewardInstance.address,
      prepaidEsInstance.address
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

  {
    console.log('\nSetting initial values in Dayswappers...');
    const tx = await dayswappersInstance.setInitialValues(
      nrtInstance.address,
      kycInstance.address,
      prepaidEsInstance.address,
      timeallyInstance.address,
      walletESN.address,
      parseEther('100')
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  {
    console.log('\nSetting initial values in KYC Dapp...');
    const tx = await kycInstance.setInitialValues(
      nrtInstance.address,
      dayswappersInstance.address,
      timeallyclubInstance.address,
      timeAllyPromotionalBucketInstance.address,
      '0xC8e1F3B9a0CdFceF9fFd2343B943989A22517b26' // charity pool
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  {
    console.log('\nSetting initial values in TimeAlly Club Dapp...');
    const tx = await timeallyclubInstance.setInitialValues(
      nrtInstance.address,
      dayswappersInstance.address,
      timeallyInstance.address,
      prepaidEsInstance.address,
      kycInstance.address
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  {
    console.log('\nSetting initial values in timeAlly Promotional Bucket Instance...');
    const tx = await timeAllyPromotionalBucketInstance.setInitialValues(
      timeallyInstance.address,
      kycInstance.address
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }
})();

async function deployContract(
  factory: any,
  name: string,
  existing: string | undefined,
  overrides?: ethers.PayableOverrides,
  args: any[] = []
): Promise<string> {
  console.log(`\nDeploying ${name}...`);
  const instance = existing
    ? factory.connect(existing, walletESN)
    : await new factory(walletESN).deploy(...args, overrides);
  if (instance.deployTransaction) await instance.deployTransaction.wait();
  if (existing) console.log('existing');
  console.log(`${name} is deployed at:`, instance.address);
  return instance.address;
}
