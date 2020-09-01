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
}

// ATTENTION: Ensure NRT SECONDS_IN_MONTH is 0 for testnet
// testnet chain
const existing: ExistingContractAddresses = {
  nrtManager: '0xcA4d0578c5e07F0964C7E7ccc87E606A234625b8',
  timeallyManager: '0x89309551Fb7AbaaB85867ACa60404CDA649751d4',
  timeallyStakingTarget: '0x7F87f9830baB8A591E6f94fd1A47EE87560B0bB0',
  validatorSet: '0xA3C6cf908EeeebF61da6e0e885687Cab557b5e3F',
  validatorManager: '0x8418249278d74D46014683A8029Fd6fbC88482a1',
  randomnessManager: '0xE14D14bd8D0E2c36f5E4D00106417d8cf1000e22',
  blockRewardManager: '0x44F70d80642998F6ABc424ceAf1E706a479De8Ce',
  prepaidEs: '0x2AA786Cd8544c50136e5097D5E19F6AE10E02543',
  dayswappers: '0x0a369809a81B7874a85f529c925349c1956d8248',
  kycdapp: '0xb07A91765505214d86DD35595035a56d2a2DFb75',
  timeallyclub: '0xd80b818977E56A2A5c3EC4FbC55f80Cda92256CC',
  timeAllyPromotionalBucket: '0xDEEcdDc440D0410F55d4A932b23Ce4D9cAd01702',
};
// local
// const existing: ExistingContractAddresses = {
//   nrtManager: '0xAE519FC2Ba8e6fFE6473195c092bF1BAe986ff90',
//   timeallyManager: '0x73b647cbA2FE75Ba05B8e12ef8F8D6327D6367bF',
//   timeallyStakingTarget: '0x7d73424a8256C0b2BA245e5d5a3De8820E45F390',
//   validatorSet: '0x08425D9Df219f93d5763c3e85204cb5B4cE33aAa',
//   validatorManager: '0xA10A3B175F0f2641Cf41912b887F77D8ef34FAe8',
//   randomnessManager: '0x6E05f58eEddA592f34DD9105b1827f252c509De0',
//   blockRewardManager: '0x79EaFd0B5eC8D3f945E6BB2817ed90b046c0d0Af',
//   prepaidEs: '0x2Ce636d6240f8955d085a896e12429f8B3c7db26',
// };

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
