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
  TsgapFactory,
  PetLiquidTimeAllyPetFactory,
  PetPrepaidTimeAllyPetFactory,
} from '../../build/typechain/ESN';
import { ProxyAdminFactory } from '../../build/typechain/@openzeppelin';

import { parseEther, formatEther, formatBytes32String } from 'ethers/lib/utils';

// import { CustomWallet } from '../timeally-tsx/src/ethereum/custom-wallet';

///
/// ATTENTION
console.log(
  'ATTENTION: Please check NRT platforms before running the script to avoid a possible wrong setting'
);

import {
  existing,
  walletESN,
  validatorAddresses,
  deployContract,
  NULL_WALLET_DAYSWAPPERS,
} from '../commons';

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

  const proxyAdminInstance = ProxyAdminFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: ProxyAdminFactory,
      name: 'Proxy Admin',
      address: existing.proxyAdmin,
    }))
  );

  // 2. deploy NRT contract with some funds
  const nrtInstance = NrtManagerFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: NrtManagerFactory,
      name: 'Nrt Manager',
      address: existing.nrtManager,
      proxy: {
        admin: proxyAdminInstance.address,
        initializeOverrides: {
          value: requiredAmount,
        },
        dontInitializeImplementation: true,
      },
    }))
  );

  const timeallyInstance = TimeAllyManagerFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: TimeAllyManagerFactory,
      name: 'TimeAlly Manager',
      address: existing.timeallyManager,
      proxy: {
        admin: proxyAdminInstance.address,
      },
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
      proxy: {
        admin: proxyAdminInstance.address,
      },
    }))
  );

  const randomnessManagerInstance = RandomnessManagerFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: RandomnessManagerFactory,
      name: 'Randomness Manager',
      address: existing.randomnessManager,
      proxy: {
        admin: proxyAdminInstance.address,
      },
    }))
  );

  const blockRewardInstance = BlockRewardFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: BlockRewardFactory,
      name: 'Block Reward',
      address: existing.blockRewardManager,
      // args: [ethers.constants.AddressZero],
      proxy: {
        admin: proxyAdminInstance.address,
        initializeArgs: [ethers.constants.AddressZero],
      },
    }))
  );

  const prepaidEsInstance = PrepaidEsFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: PrepaidEsFactory,
      name: 'Prepaid Es',
      address: existing.prepaidEs,
      proxy: {
        admin: proxyAdminInstance.address,
      },
    }))
  );

  const dayswappersInstance = DayswappersWithMigrationFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: DayswappersWithMigrationFactory,
      name: 'Dayswappers',
      address: existing.dayswappers,
      proxy: {
        admin: proxyAdminInstance.address,
        initializeArgs: [
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
      },
    }))
  );

  const kycInstance = KycDappFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: KycDappFactory,
      name: 'KYC Dapp',
      address: existing.kycdapp,
      proxy: {
        admin: proxyAdminInstance.address,
      },
    }))
  );

  const timeallyclubInstance = TimeAllyClubFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: TimeAllyClubFactory,
      name: 'TimeAlly Club',
      address: existing.timeallyclub,
      proxy: {
        admin: proxyAdminInstance.address,
      },
    }))
  );

  const timeAllyPromotionalBucketInstance = TimeAllyPromotionalBucketFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: TimeAllyPromotionalBucketFactory,
      name: 'TimeAlly Promotional Bucket',
      address: existing.timeAllyPromotionalBucket,
      proxy: {
        admin: proxyAdminInstance.address,
      },
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

  const tsgapInstance = TsgapFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: TsgapFactory,
      name: 'TSGAP',
      address: existing.tsgap,
    }))
  );
  const petLiquidInstance = PetLiquidTimeAllyPetFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: PetLiquidTimeAllyPetFactory,
      name: 'PET Liquid',
      address: existing.petLiquid,
      args: [prepaidEsInstance.address, nrtInstance.address],
    }))
  );
  const petPrepaidInstance = PetPrepaidTimeAllyPetFactory.connect(
    ...(await deployContract({
      wallet: walletESN,
      factory: PetPrepaidTimeAllyPetFactory,
      name: 'PET Prepaid',
      address: existing.petPrepaid,
      args: [prepaidEsInstance.address, nrtInstance.address],
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
    [tsgapInstance, 'TSGAP'],
    [petLiquidInstance, 'PET_LIQUID'],
    [petPrepaidInstance, 'PET_PREPAID'],
  ];

  const identityOwners: [string, string][] = [
    ['ERASWAP_MIGRATION_WALLET', walletESN.address],
    ['DaySwappersTop_0.0', NULL_WALLET_DAYSWAPPERS],
  ];
  // if (existing.timeswappers) {
  //   identityOwners.push(['TIMESWAPPERS', existing.timeswappers]);
  // }
  // if (existing.buzcafe) {
  //   identityOwners.push(['BUZCAFE', existing.buzcafe]);
  // }
  // if (existing.powertoken) {
  //   identityOwners.push(['POWER_TOKEN', existing.powertoken]);
  // }

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
      [formatBytes32String('TIMEALLY_MANAGER'), formatBytes32String('ERASWAP_MIGRATION_WALLET')],
      [150, 850]

      // [
      //   'TIMEALLY_MANAGER', // 15%
      //   'VALIDATOR_MANAGER', // 12%
      //   'DAYSWAPPERS', // 10%
      //   'TIMEALLY_CLUB', // 10%
      //   'PowerToken_0.0', // 10%

      //   'AirDrop&Bounty_0.0', // 5%

      //   'CommunityWelfare_0.0', // 1%
      //   'NewTalentsAndPartnerships_0.0', // 3%
      //   '1LifeTimes_0.0', // 1%

      //   'MaintenanceSupport_0.0', // 5%

      //   'ResearchAndDevelopment_0.0', // 5%
      //   'OtherStakingPlan_0.0', // 3%

      //   'ContingencyFund_0.0', // 10%
      //   'KMPARDS_0.0', // 10%
      // ].map(formatBytes32String),
      // [150, 120, 100, 100, 100, 50, 10, 30, 10, 50, 50, 30, 100, 100]
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

  {
    console.log('\nSetting initial values in Prepaid ES...');
    {
      const tx = await prepaidEsInstance.updateAuthorization(
        formatBytes32String('TIMEALLY_MANAGER'),
        true
      );
      await tx.wait();
      console.log('Tx:', tx.hash);
    }
    {
      const tx = await prepaidEsInstance.updateAuthorization(
        formatBytes32String('PET_PREPAID'),
        true
      );
      await tx.wait();
      console.log('Tx:', tx.hash);
    }
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
      const tx = await dayswappersInstance.setNullWallet(NULL_WALLET_DAYSWAPPERS);
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
    {
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
      const tx = await kycInstance.updateKycFee(
        2,
        formatBytes32String('VALIDATOR_MANAGER'),
        formatBytes32String('ESNPOS'),
        parseEther('1000')
      );
      await tx.wait();
      console.log('Tx:', tx.hash);
    }
  }

  {
    console.log('\nAdding funds in TimeAlly Promotional Bucket...');
    const tx = await walletESN.sendTransaction({
      to: timeAllyPromotionalBucketInstance.address,
      value: parseEther('10000'),
    });
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
      const tx = await timeallyclubInstance.updateAuthorization(
        formatBytes32String('BUILD_SURVEY'),
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

  {
    console.log('\nSetting initial values in tsgap Instance...');
    const sipPlan = {
      minimumMonthlyCommitmentAmount: ethers.utils.parseEther('500'),
      accumulationPeriodMonths: 12,
      benefitPeriodYears: 9,
      gracePeriodSeconds: 864000, /// 10 days
      monthlyBenefitFactor: 200,
      gracePenaltyFactor: 10,
      defaultPenaltyFactor: 20,
    };
    const tx = await tsgapInstance.createSIPPlan(
      sipPlan.minimumMonthlyCommitmentAmount,
      sipPlan.accumulationPeriodMonths,
      sipPlan.benefitPeriodYears,
      sipPlan.gracePeriodSeconds,
      sipPlan.monthlyBenefitFactor,
      sipPlan.gracePenaltyFactor,
      sipPlan.defaultPenaltyFactor
    );
    await tx.wait();
    console.log('Tx:', tx.hash);
  }

  {
    console.log('\nSetting initial values in pet Instances...');
    const PETPlans = [
      { minimumMonthlyCommitmentAmount: '500', monthlyBenefitFactorPerThousand: '100' },
      { minimumMonthlyCommitmentAmount: '1000', monthlyBenefitFactorPerThousand: '105' },
      { minimumMonthlyCommitmentAmount: '2500', monthlyBenefitFactorPerThousand: '110' },
      { minimumMonthlyCommitmentAmount: '5000', monthlyBenefitFactorPerThousand: '115' },
      { minimumMonthlyCommitmentAmount: '10000', monthlyBenefitFactorPerThousand: '120' },
    ];

    for (const plan of PETPlans) {
      const minimumMonthlyCommitmentAmount = ethers.utils.parseEther(
        plan.minimumMonthlyCommitmentAmount
      );

      {
        const tx = await petLiquidInstance.createPETPlan(
          minimumMonthlyCommitmentAmount,
          plan.monthlyBenefitFactorPerThousand
        );
        await tx.wait();
        console.log('Tx:', tx.hash);
      }
      {
        const tx = await petPrepaidInstance.createPETPlan(
          minimumMonthlyCommitmentAmount,
          plan.monthlyBenefitFactorPerThousand
        );
        await tx.wait();
        console.log('Tx:', tx.hash);
      }
    }
  }
})();
