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
} from '../../build/typechain/ESN';
import { parseEther, formatEther, formatBytes32String } from 'ethers/lib/utils';

// import { CustomWallet } from '../timeally-tsx/src/ethereum/custom-wallet';

///
/// ATTENTION
console.log(
  'ATTENTION: Please check NRT platforms before running the script to avoid a possible wrong setting'
);

import { existing, walletESN, validatorAddresses } from '../commons';

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

  const betdeexInstance = BetDeExFactory.connect(
    await deployContract(BetDeExFactory, 'BetDeEx', existing.betdeex),
    walletESN
  );

  const buildSurveyInstance = BuildSurveyFactory.connect(
    await deployContract(BuildSurveyFactory, 'BuildSurvey', existing.buildSurvey),
    walletESN
  );

  const rentingInstance = RentingDappManagerFactory.connect(
    await deployContract(
      RentingDappManagerFactory,
      'RentingDappManager',
      existing.rentingDappManager
    ),
    walletESN
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
      [formatBytes32String('TIMEALLY_MANAGER'), formatBytes32String('ERASWAP_TEAM')],
      [150, 850]
      // [
      //   timeallyInstance.address,
      //   validatorManagerInstance.address,
      //   dayswappersInstance.address,
      //   timeallyclubInstance.address,
      //   walletESN.address,
      // ],
      // ['TIMEALLY_MANAGER', 'VALIDATOR_MANAGER', 'DAYSWAPPERS', 'TIMEALLY_CLUB', 'ERASWAP_TEAM'],
      // [150, 120, 100, 100, 530]
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
      const tx = await validatorSetInstance.setBlocksInterval(1);
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
