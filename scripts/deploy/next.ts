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
  BetDeExFactory,
  BuildSurveyFactory,
  RentingDappManagerFactory,
  BetFactory,
} from '../../build/typechain/ESN';
import { parseEther, formatEther, formatBytes32String } from 'ethers/lib/utils';

// import { CustomWallet } from '../timeally-tsx/src/ethereum/custom-wallet';

///
/// ATTENTION
console.log(
  'ATTENTION: Please check NRT platforms before running the script to avoid a possible wrong setting'
);

import { existing, walletESN, validatorAddresses, deployContract } from '../commons';

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
    ...(await deployContract({
      wallet: walletESN,
      factory: NrtManagerFactory,
      name: 'Nrt Manager',
      address: existing.nrtManager,
      overrides: {
        value: requiredAmount,
      },
    }))
  );

  const timeallyInstance = TimeAllyManagerFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: TimeAllyManagerFactory,
      name: 'TimeAlly Manager',
      address: existing.timeallyManager,
    }))
  );

  const timeallyStakingTargetInstance = TimeAllyStakingFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: TimeAllyStakingFactory,
      name: 'TimeAlly Staking Target',
      address: existing.timeallyStakingTarget,
    }))
  );

  const validatorSetInstance = ValidatorSetFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: ValidatorSetFactory,
      name: 'Validator Set',
      address: existing.validatorSet,
      args: [validatorAddresses, ethers.constants.AddressZero],
    }))
  );

  const validatorManagerInstance = ValidatorManagerFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: ValidatorManagerFactory,
      name: 'Validator Manager',
      address: existing.validatorManager,
    }))
  );

  const randomnessManagerInstance = RandomnessManagerFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: RandomnessManagerFactory,
      name: 'Randomness Manager',
      address: existing.randomnessManager,
    }))
  );

  const blockRewardInstance = BlockRewardFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: BlockRewardFactory,
      name: 'Block Reward',
      address: existing.blockRewardManager,
      args: [ethers.constants.AddressZero],
    }))
  );

  const prepaidEsInstance = PrepaidEsFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: PrepaidEsFactory,
      name: 'Prepaid Es',
      address: existing.prepaidEs,
    }))
  );

  const dayswappersInstance = DayswappersWithMigrationFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: DayswappersWithMigrationFactory,
      name: 'Dayswappers',
      address: existing.dayswappers,
      args: [
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
      ],
    }))
  );

  const kycInstance = KycDappFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: KycDappFactory,
      name: 'KYC Dapp',
      address: existing.kycdapp,
    }))
  );

  const timeallyclubInstance = TimeAllyClubFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: TimeAllyClubFactory,
      name: 'TimeAlly Club',
      address: existing.timeallyclub,
    }))
  );

  const timeAllyPromotionalBucketInstance = TimeAllyPromotionalBucketFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: TimeAllyPromotionalBucketFactory,
      name: 'TimeAlly Promotional Bucket',
      address: existing.timeAllyPromotionalBucket,
    }))
  );

  const betdeexInstance = BetDeExFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: BetDeExFactory,
      name: 'BetDeEx',
      address: existing.betdeex,
    }))
  );

  const betImplementationInstance = BetFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: BetDeExFactory,
      name: 'Bet Implementation',
      address: existing.betImplementation,
    }))
  );

  const buildSurveyInstance = BuildSurveyFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: BuildSurveyFactory,
      name: 'BuildSurvey',
      address: existing.buildSurvey,
    }))
  );

  const rentingInstance = RentingDappManagerFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: RentingDappManagerFactory,
      name: 'RentingDappManager',
      address: existing.rentingDappManager,
    }))
  );

  const contracts: [ethers.Contract, string][] = [
    [nrtInstance, 'NRT_MANAGER'],
    [timeallyInstance, 'TIMEALLY_MANAGER'],
    [timeallyStakingTargetInstance, 'TIMEALLY_STAKING_TARGET'],
    [validatorSetInstance, 'VALIDATOR_SET'],
    [validatorManagerInstance, 'VALIDATOR_MANAGER'],
    [randomnessManagerInstance, 'RANDOMNESS_MANAGER'],
    [blockRewardInstance, 'BLOCK_REWARD'],
    [prepaidEsInstance, 'PREPAID_ES'],
    [dayswappersInstance, 'DAYSWAPPERS'],
    [kycInstance, 'KYC_DAPP'],
    [timeallyclubInstance, 'TIMEALLY_CLUB'],
    [timeAllyPromotionalBucketInstance, 'TIMEALLY_PROMOTIONAL_BUCKET'],
    [betdeexInstance, 'BETDEEX'],
    [betImplementationInstance, 'BET_IMPLEMENTATION'],
    [buildSurveyInstance, 'BUILD_SURVEY'],
    [rentingInstance, 'RENTING_DAPP'],
  ];

  const identityOwners: [string, string][] = [['ERASWAP_TEAM', walletESN.address]];
  if (existing.timeswappers) {
    identityOwners.push(['TIMESWAPPERS', existing.timeswappers]);
  }
  if (existing.buzcafe) {
    identityOwners.push(['BUZCAFE', existing.buzcafe]);
  }
  if (existing.powertoken) {
    identityOwners.push(['POWER_TOKEN', existing.powertoken]);
  }

  for (const identity of identityOwners) {
    try {
      console.log('\nkycInstance.setIdentityOwner for', identity[0]);
      const tx = await kycInstance.setIdentityOwner(
        formatBytes32String(identity[0]),
        identity[1],
        true,
        1
      );
      await tx.wait();
      console.log('Tx:', tx.hash);
    } catch (error) {
      console.log(error.message);
    }
  }

  for (const [contract, kycname] of contracts) {
    if ('setKycDapp' in contract) {
      console.log('\nsetKycDapp method called in', kycname);
      const tx = await contract.setKycDapp(kycInstance.address);
      await tx.wait();
      console.log('Tx:', tx.hash);
    }
    try {
      console.log('\nkycInstance.setIdentityOwner for', kycname);
      const tx = await kycInstance.setIdentityOwner(
        formatBytes32String(kycname),
        contract.address,
        true,
        1
      );
      await tx.wait();
      console.log('Tx:', tx.hash);
    } catch (error) {
      console.log(error.message);
    }
  }

  // 7. set platforms in nrt manager
  {
    console.log('\nSetting platforms in NRT Manager...');
    const tx = await nrtInstance.setPlatforms(
      // [timeallyInstance.address, walletESN.address],
      // [formatBytes32String('TIMEALLY_MANAGER'), formatBytes32String('ERASWAP_TEAM')],
      // [150, 850]
      // [
      //   timeallyInstance.address,
      //   validatorManagerInstance.address,
      //   dayswappersInstance.address,
      //   timeallyclubInstance.address,
      //   walletESN.address,
      // ],
      [
        'TIMEALLY_MANAGER',
        'VALIDATOR_MANAGER',
        'DAYSWAPPERS',
        'TIMEALLY_CLUB',
        'POWER_TOKEN',
        'ERASWAP_TEAM',
      ].map(formatBytes32String),
      [150, 120, 100, 100, 100, 430]
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  // 8. set inital values in timeally
  {
    console.log('\nSetting initial values in TimeAlly Manager...');
    const tx = await timeallyInstance.setStakingTarget(timeallyStakingTargetInstance.address);
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  // init timeally staking target to prevent
  if (!existing.timeallyStakingTarget) {
    const tx = await timeallyStakingTargetInstance.init(
      ethers.constants.AddressZero,
      12,
      0,
      kycInstance.address,
      nrtInstance.address,
      []
    );

    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  // 9. set inital values in validator manager
  // actually kycdapp registry is enough
  // {
  //   console.log('\nSetting initial values in Validator Manager...');

  //   console.log('done');
  // }

  // 10. set inital values in validator set
  {
    console.log('\nSetting initial values in Validator Set...');
    {
      const tx = await validatorSetInstance.setMaxValidators(5);
      await tx.wait();
      console.log('Tx:', tx.hash);
    }

    {
      const tx = await validatorSetInstance.setPercentUnique(51);
      await tx.wait();
      console.log('Tx:', tx.hash);
    }

    {
      const tx = await validatorSetInstance.setLuckTries(4);
      await tx.wait();
      console.log('Tx:', tx.hash);
    }

    {
      const tx = await validatorSetInstance.setBlocksInterval(40);
      await tx.wait();
      console.log('Tx:', tx.hash);
    }
    console.log('done');
  }

  // {
  //   console.log('\nSetting initial values in Block Reward Manager...');
  //   const tx = await blockRewardInstance.setInitialValues(validatorManagerInstance.address);
  //   await tx.wait();
  //   console.log('Tx:', tx.hash);
  // }

  {
    console.log('\nSetting initial values in Dayswappers...');
    {
      const tx = await dayswappersInstance.updateAuthorization(
        formatBytes32String('KYC_DAPP'),
        true
      );
      await tx.wait();
      console.log('Tx:', tx.hash);
    }
    {
      const tx = await dayswappersInstance.updateAuthorization(
        formatBytes32String('TIMEALLY_MANAGER'),
        true
      );
      await tx.wait();
      console.log('Tx:', tx.hash);
    }
    {
      const tx = await dayswappersInstance.setNullWallet(walletESN.address);
      await tx.wait();
      console.log('Tx:', tx.hash);
    }
    {
      const tx = await dayswappersInstance.setVolumeTarget(parseEther('100'));
      await tx.wait();
      console.log('Tx:', tx.hash);
    }
  }

  {
    console.log('\nSetting initial values in KYC Dapp...');
    const tx = await kycInstance.updateKycFee(
      1,
      ethers.constants.HashZero,
      ethers.constants.HashZero,
      parseEther('35')
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  {
    console.log('\nSetting initial values in TimeAlly Club Dapp...');
    {
      const tx = await timeallyclubInstance.updateAuthorization(
        formatBytes32String('TIMEALLY_MANAGER'),
        true
      );
      await tx.wait();
      console.log('Tx:', tx.hash);
    }
    {
      const tx = await timeallyclubInstance.updateAuthorization(
        formatBytes32String('KYC_DAPP'),
        true
      );
      await tx.wait();
      console.log('Tx:', tx.hash);
    }
    {
      const tx = await timeallyclubInstance.setPlatformIncentives(timeallyInstance.address, [
        {
          label: 'Coral',
          target: parseEther('0'),
          directBountyPerTenThousand: 600,
          treeBountyPerTenThousand: 700,
        },
        {
          label: 'Silver',
          target: parseEther('35000'),
          directBountyPerTenThousand: 700,
          treeBountyPerTenThousand: 700,
        },
        {
          label: 'Pearl',
          target: parseEther('50000'),
          directBountyPerTenThousand: 800,
          treeBountyPerTenThousand: 700,
        },
        {
          label: 'Gold',
          target: parseEther('75000'),
          directBountyPerTenThousand: 900,
          treeBountyPerTenThousand: 700,
        },
        {
          label: 'Platinum',
          target: parseEther('100000'),
          directBountyPerTenThousand: 1000,
          treeBountyPerTenThousand: 700,
        },
        {
          label: 'Sapphire',
          target: parseEther('200000'),
          directBountyPerTenThousand: 1100,
          treeBountyPerTenThousand: 700,
        },
        {
          label: 'Diamond',
          target: parseEther('300000'),
          directBountyPerTenThousand: 1200,
          treeBountyPerTenThousand: 700,
        },
        {
          label: 'Emerald',
          target: parseEther('400000'),
          directBountyPerTenThousand: 1300,
          treeBountyPerTenThousand: 700,
        },
        {
          label: 'Ruby',
          target: parseEther('500000'),
          directBountyPerTenThousand: 1400,
          treeBountyPerTenThousand: 700,
        },
      ]);
      await tx.wait();
      console.log('Tx:', tx.hash);
    }
  }

  {
    console.log('\nSetting initial values in timeAlly Promotional Bucket Instance...');
    const tx = await timeAllyPromotionalBucketInstance.updateAuthorization(
      formatBytes32String('KYC_DAPP'),
      true
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  {
    console.log(
      '\nSetting implementation address in betdeex Instance, impl addr:',
      betImplementationInstance.address
    );

    const tx = await betdeexInstance.storageFactory(betImplementationInstance.address);
    await tx.wait();
    console.log('Tx:', tx.hash);
  }
})();
