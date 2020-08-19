import assert from 'assert';
import { ethers } from 'ethers';

export const SetInitialValuesNext = () =>
  describe('Setting initial values to next deployed contracts', () => {
    it('sets initial values in NRT Manager Contract ESN', async () => {
      const platforms = [
        global.timeallyInstanceESN.address,
        global.validatorManagerESN.address,
        global.dayswappersInstanceESN.address,
        ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20))),
      ];
      const perThousands = [150, 120, 100, 630];
      await global.nrtInstanceESN.setInitialValues(false, platforms, perThousands);

      const { 0: _platforms, 1: _perThousands } = await global.nrtInstanceESN.getPlatformDetails();

      assert.deepEqual(platforms, _platforms, 'platforms should be set correctly');
      assert.deepEqual(
        perThousands,
        _perThousands.map((pT) => pT.toNumber()),
        'per thousands should be set correctly'
      );
    });

    it('sets initial values in TimeAlly Manager Contract ESN', async () => {
      await global.timeallyInstanceESN.setInitialValues(
        global.nrtInstanceESN.address,
        global.validatorManagerESN.address,
        global.prepaidEsInstanceESN.address,
        global.timeallyStakingTargetInstanceESN.address
      );

      const nrtAddress = await global.timeallyInstanceESN.nrtManager();
      assert.equal(
        nrtAddress,
        global.nrtInstanceESN.address,
        'nrt address should be set correctly'
      );

      const validatorManagerAddress = await global.timeallyInstanceESN.validatorManager();
      assert.equal(
        validatorManagerAddress,
        global.validatorManagerESN.address,
        'validator manager address should be set correctly'
      );
    });

    it('sets initial values in Validator Set Contract ESN', async () => {
      await global.validatorSetESN.setInitialValues(
        global.validatorManagerESN.address,
        5,
        51,
        4,
        1
      );

      const validatorManager = await global.validatorSetESN.validatorManager();
      assert.equal(
        validatorManager,
        global.validatorManagerESN.address,
        'validator manager address should be set correctly'
      );

      const BLOCKS_INTERVAL = await global.validatorSetESN.BLOCKS_INTERVAL();
      assert.strictEqual(BLOCKS_INTERVAL.toNumber(), 1, 'BLOCKS_INTERVAL should be 1 as set');
    });

    it('sets initial values in Block Reward Contract ESN', async () => {
      await global.blockRewardESN.setInitialValues(global.validatorManagerESN.address);

      const validatorManager = await global.blockRewardESN.validatorManager();
      assert.equal(
        validatorManager,
        global.validatorManagerESN.address,
        'validator manager address should be set correctly'
      );
    });

    it('sets initial values in Validator Manager Contract ESN', async () => {
      await global.validatorManagerESN.setInitialValues(
        global.validatorSetESN.address,
        global.nrtInstanceESN.address,
        global.timeallyInstanceESN.address,
        global.randomnessMangerESN.address,
        global.blockRewardESN.address,
        global.prepaidEsInstanceESN.address
      );

      const timeallyAddress = await global.validatorManagerESN.timeally();
      assert.equal(
        timeallyAddress,
        global.timeallyInstanceESN.address,
        'timeally manager address should be set correctly'
      );
    });

    it('initialize TimeAlly Staking Target Contract ESN', async () => {
      await global.timeallyStakingTargetInstanceESN.init(
        ethers.constants.AddressZero,
        12,
        0,
        global.nrtInstanceESN.address,
        global.validatorManagerESN.address,
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
      await global.dayswappersInstanceESN.setInitialValues(
        global.nrtInstanceESN.address,
        global.kycDappInstanceESN.address,
        global.prepaidEsInstanceESN.address,
        ethers.constants.AddressZero
      );

      const nrtAddress = await global.dayswappersInstanceESN.nrtManager();
      assert.equal(
        nrtAddress,
        global.nrtInstanceESN.address,
        'nrt manager address should be set correctly'
      );

      const kycDappAddress = await global.dayswappersInstanceESN.kycDapp();
      assert.equal(
        kycDappAddress,
        global.kycDappInstanceESN.address,
        'kyc dapp address should be set correctly'
      );
    });
  });
