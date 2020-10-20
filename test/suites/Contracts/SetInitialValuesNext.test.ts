import assert, { strictEqual, ok } from 'assert';
import { ethers } from 'ethers';
import { parseEther, formatEther, parseBytes32String, formatBytes32String } from 'ethers/lib/utils';
import { parseReceipt } from '../../utils';

export const SetInitialValuesNext = () =>
  describe('Setting initial values to next deployed contracts', () => {
    before(async () => {
      // registering team kyc
      await parseReceipt(
        global.kycDappInstanceESN.setIdentityOwner(
          formatBytes32String('ERASWAP_TEAM'),
          global.accountsESN[0],
          true,
          1
        )
      );
    });

    it('sets initial values in NRT Manager Contract ESN', async () => {
      await setKycDapp(global.nrtInstanceESN);

      // const platforms = [
      //   global.timeallyInstanceESN.address,
      //   global.validatorManagerESN.address,
      //   global.dayswappersInstanceESN.address,
      //   global.timeallyClubInstanceESN.address,
      //   ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20))),
      // ];

      const platformIdentifiers = [
        'TIMEALLY_MANAGER',
        'VALIDATOR_MANAGER',
        'DAYSWAPPERS',
        'TIMEALLY_CLUB',
        'ERASWAP_TEAM',
      ];

      const perThousands = [150, 120, 100, 50, 580];
      await global.nrtInstanceESN.setPlatforms(
        platformIdentifiers.map(formatBytes32String),
        perThousands
      );

      const { 0: _platforms, 1: _perThousands } = await global.nrtInstanceESN.getPlatformDetails();

      assert.deepEqual(
        platformIdentifiers,
        _platforms.map(parseBytes32String),
        'platforms should be set correctly'
      );
      assert.deepEqual(
        perThousands,
        _perThousands.map((pT) => pT.toNumber()),
        'per thousands should be set correctly'
      );
    });

    it('sets initial values in TimeAlly Manager Contract ESN', async () => {
      await setKycDapp(global.timeallyInstanceESN);

      await global.timeallyInstanceESN.setStakingTarget(
        global.timeallyStakingTargetInstanceESN.address
      );
      const stakingTarget = await global.timeallyInstanceESN.stakingTarget();
      strictEqual(
        stakingTarget,
        global.timeallyStakingTargetInstanceESN.address,
        'staking target is set'
      );

      // await global.timeallyInstanceESN.setInitialValues(
      //   global.nrtInstanceESN.address,
      //   global.validatorManagerESN.address,
      //   global.prepaidEsInstanceESN.address,
      //   global.dayswappersInstanceESN.address,
      //   global.timeallyStakingTargetInstanceESN.address,
      //   global.timeallyClubInstanceESN.address
      // );
      // const nrtAddress = await global.timeallyInstanceESN.nrtManager();
      // assert.equal(
      //   nrtAddress,
      //   global.nrtInstanceESN.address,
      //   'nrt address should be set correctly'
      // );
      // const validatorManagerAddress = await global.timeallyInstanceESN.validatorManager();
      // assert.equal(
      //   validatorManagerAddress,
      //   global.validatorManagerESN.address,
      //   'validator manager address should be set correctly'
      // );
    });

    it('sets initial values in TimeAlly Club ESN', async () => {
      await setKycDapp(global.timeallyClubInstanceESN);

      {
        await global.timeallyClubInstanceESN.updateAuthorization(
          formatBytes32String('TIMEALLY_MANAGER'),
          true
        );
        const isAuthorised = await global.timeallyClubInstanceESN['isAuthorized(address)'](
          global.timeallyInstanceESN.address
        );
        strictEqual(
          isAuthorised,
          true,
          'timeally manager should be authorised in timeallyClubInstanceESN'
        );
      }
      {
        await global.timeallyClubInstanceESN.updateAuthorization(
          formatBytes32String('KYC_DAPP'),
          true
        );
        const isAuthorised = await global.timeallyClubInstanceESN['isAuthorized(address)'](
          global.kycDappInstanceESN.address
        );
        strictEqual(isAuthorised, true, 'kyc dapp should be authorised in timeallyClubInstanceESN');
      }
      // await global.timeallyClubInstanceESN.setInitialValues(
      //   global.nrtInstanceESN.address,
      //   global.dayswappersInstanceESN.address,
      //   global.timeallyInstanceESN.address,
      //   global.prepaidEsInstanceESN.address,
      //   global.kycDappInstanceESN.address
      // );

      // const nrtAddress = await global.timeallyClubInstanceESN.nrtManager();
      // assert.equal(
      //   nrtAddress,
      //   global.nrtInstanceESN.address,
      //   'nrt address should be set correctly'
      // );

      // const dayswappersAddress = await global.timeallyClubInstanceESN.dayswappers();
      // assert.equal(
      //   dayswappersAddress,
      //   global.dayswappersInstanceESN.address,
      //   'dayswappers address should be set correctly'
      // );

      await global.timeallyClubInstanceESN.setPlatformIncentives(
        global.timeallyInstanceESN.address,
        [
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
        ]
      );
    });

    it('sets initial values in Validator Set Contract ESN', async () => {
      await setKycDapp(global.validatorSetESN);

      await global.validatorSetESN.setMaxValidators(5);
      const MAX_VALIDATORS = await global.validatorSetESN.MAX_VALIDATORS();
      strictEqual(MAX_VALIDATORS.toNumber(), 5, 'MAX_VALIDATORS should be 5 as set');

      await global.validatorSetESN.setPercentUnique(51);
      const PERCENT_UNIQUE = await global.validatorSetESN.PERCENT_UNIQUE();
      strictEqual(PERCENT_UNIQUE.toNumber(), 51, 'PERCENT_UNIQUE should be 51 as set');

      await global.validatorSetESN.setLuckTries(4);
      const LUCK_TRIES = await global.validatorSetESN.LUCK_TRIES();
      strictEqual(LUCK_TRIES.toNumber(), 4, 'LUCK_TRIES should be 4 as set');

      await global.validatorSetESN.setBlocksInterval(1);
      const BLOCKS_INTERVAL = await global.validatorSetESN.BLOCKS_INTERVAL();
      strictEqual(BLOCKS_INTERVAL.toNumber(), 1, 'BLOCKS_INTERVAL should be 1 as set');
    });

    it('sets initial values in Block Reward Contract ESN', async () => {
      await setKycDapp(global.blockRewardESN);
    });

    it('sets initial values in Validator Manager Contract ESN', async () => {
      await setKycDapp(global.validatorManagerESN);

      // await global.validatorManagerESN.setInitialValues(
      //   global.validatorSetESN.address,
      //   global.nrtInstanceESN.address,
      //   global.timeallyInstanceESN.address,
      //   global.randomnessMangerESN.address,
      //   global.blockRewardESN.address,
      //   global.prepaidEsInstanceESN.address
      // );

      // const timeallyAddress = await global.validatorManagerESN.timeally();
      // assert.equal(
      //   timeallyAddress,
      //   global.timeallyInstanceESN.address,
      //   'timeally manager address should be set correctly'
      // );
    });

    it('initialize TimeAlly Staking Target Contract ESN', async () => {
      await global.timeallyStakingTargetInstanceESN.init(
        ethers.constants.AddressZero,
        12,
        0,
        global.kycDappInstanceESN.address,
        global.nrtInstanceESN.address,
        []
      );

      const owner = await global.timeallyStakingTargetInstanceESN.owner();
      assert.strictEqual(
        owner,
        ethers.constants.AddressZero,
        'target should have zero address as owner'
      );
    });

    it('sets initial values in Dayswappers Contract ESN', async () => {
      await setKycDapp(global.dayswappersInstanceESN);

      {
        await global.dayswappersInstanceESN.updateAuthorization(
          formatBytes32String('TIMEALLY_MANAGER'),
          true
        );
        const isAuthorised = await global.dayswappersInstanceESN['isAuthorized(address)'](
          global.timeallyInstanceESN.address
        );
        strictEqual(isAuthorised, true, 'timeally should be authorised in dayswappersInstanceESN');
      }

      {
        await global.dayswappersInstanceESN.updateAuthorization(
          formatBytes32String('KYC_DAPP'),
          true
        );

        const isAuthorised = await global.dayswappersInstanceESN['isAuthorized(address)'](
          global.kycDappInstanceESN.address
        );
        strictEqual(isAuthorised, true, 'kyc dapp should be authorised in dayswappersInstanceESN');
      }

      // await global.dayswappersInstanceESN.setInitialValues(
      //   global.nrtInstanceESN.address,
      //   global.kycDappInstanceESN.address,
      //   global.prepaidEsInstanceESN.address,
      //   global.timeallyInstanceESN.address,
      //   ethers.constants.AddressZero,
      //   parseEther('100')
      // );

      // const nrtAddress = await global.dayswappersInstanceESN.nrtManager();
      // assert.equal(
      //   nrtAddress,
      //   global.nrtInstanceESN.address,
      //   'nrt manager address should be set correctly'
      // );

      // const kycDappAddress = await global.dayswappersInstanceESN.kycDapp();
      // assert.equal(
      //   kycDappAddress,
      //   global.kycDappInstanceESN.address,
      //   'kyc dapp address should be set correctly'
      // );
    });

    it('sets initial values in TimeAlly Promotional Bucket Contract ESN', async () => {
      await setKycDapp(global.timeallyPromotionalBucketESN);

      await global.timeallyPromotionalBucketESN.updateAuthorization(
        formatBytes32String('KYC_DAPP'),
        true
      );
      const isAuthorised = await global.timeallyPromotionalBucketESN['isAuthorized(address)'](
        global.kycDappInstanceESN.address
      );
      strictEqual(
        isAuthorised,
        true,
        'kyc dapp should be authorised in timeally promotional bucket'
      );
    });

    it('sets initial values in Kyc Dapp Contract ESN', async () => {
      await setKycDapp(global.timeallyPromotionalBucketESN);

      const charityAddressTemporary = ethers.Wallet.createRandom().address;
      // await global.kycDappInstanceESN.setInitialValues(
      //   global.nrtInstanceESN.address,
      //   global.dayswappersInstanceESN.address,
      //   global.timeallyClubInstanceESN.address,
      //   global.timeallyPromotionalBucketESN.address,
      //   charityAddressTemporary
      // );

      // const nrtAddress = await global.kycDappInstanceESN.nrtManager();
      // assert.equal(
      //   nrtAddress,
      //   global.nrtInstanceESN.address,
      //   'nrt manager address should be set correctly'
      // );

      // const dayswappersAddress = await global.kycDappInstanceESN.dayswappers();
      // assert.equal(
      //   dayswappersAddress,
      //   global.dayswappersInstanceESN.address,
      //   'dayswappers address should be set correctly'
      // );

      // const charityPoolAddress = await global.kycDappInstanceESN.charityPool();
      // strictEqual(
      //   charityAddressTemporary,
      //   charityPoolAddress,
      //   'charity pool address should be set correctly'
      // );

      await global.kycDappInstanceESN.updateKycFee(
        1,
        ethers.constants.HashZero,
        ethers.constants.HashZero,
        parseEther('35')
      );

      const kycLevel1Fee = await global.kycDappInstanceESN.getKycFee(
        1,
        ethers.constants.HashZero,
        ethers.constants.HashZero
      );
      strictEqual(formatEther(kycLevel1Fee), '35.0', 'kyc level 1 fee should be 35 ES');
    });

    it('sets initial values in BetDeEx Contract ESN', async () => {
      await setKycDapp(global.betdeexInstanceESN);

      const owner = await global.betdeexInstanceESN.owner();
      strictEqual(owner, global.accountsESN[0], 'owner should be first account');

      // setting implementation contract
      await parseReceipt(
        global.betdeexInstanceESN.storageFactory(global.betImplementaionInstanceESN.address)
      );
    });

    it('sets initial values in BuildSurvey Contract ESN', async () => {
      await setKycDapp(global.buildSurveyInstanceESN);

      const owner = await global.buildSurveyInstanceESN.owner();
      strictEqual(owner, global.accountsESN[0], 'owner should be first account');
    });

    it('sets intial values in RentingDappManager Contract ESN', async () => {
      await setKycDapp(global.rentingDappManagerInstanceESN);

      const owner = await global.rentingDappManagerInstanceESN.owner();
      strictEqual(owner, global.accountsESN[0], 'owner should be first account');
    });
  });

async function setKycDapp(contract: ethers.Contract) {
  await parseReceipt(contract.setKycDapp(global.kycDappInstanceESN.address));
  const kycDappAddress = await contract.kycDapp();
  strictEqual(kycDappAddress, global.kycDappInstanceESN.address, 'kyc dapp address should be set');
}
