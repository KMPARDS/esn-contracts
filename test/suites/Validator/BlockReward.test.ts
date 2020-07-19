import assert from 'assert';
import { ethers } from 'ethers';
import { releaseNrt, parseReceipt } from '../../utils';
import { TimeAllyStakingFactory } from '../../../build/typechain/ESN';

export const BlockReward = () =>
  describe('Block Reward', async () => {
    it('marks block reward to validator should increase count', async () => {
      const month = await global.nrtInstanceESN.currentNrtMonth();
      const vsBefore = await global.validatorManagerESN.getValidatorStakings(month);
      const blockRewardBefore = vsBefore.find(
        (vs) => vs.validator === global.validatorWallets[0].address
      )?.blockRewards;
      if (!blockRewardBefore) assert(false, 'validator does not exist before');
      const totalBlockRewardBefore = await global.validatorManagerESN.getTotalBlockReward(month);

      await global.blockRewardESN.reward([global.validatorWallets[0].address], [0]);

      const vsAfter = await global.validatorManagerESN.getValidatorStakings(month);
      const blockRewardAfter = vsAfter.find(
        (vs) => vs.validator === global.validatorWallets[0].address
      )?.blockRewards;
      if (!blockRewardAfter) assert(false, 'validator does not exist after');
      const totalBlockRewardAfter = await global.validatorManagerESN.getTotalBlockReward(month);

      assert.strictEqual(
        totalBlockRewardAfter.toNumber() - totalBlockRewardBefore.toNumber(),
        1,
        'should be increased by 1'
      );
    });

    it('marks block reward to unknown validator', async () => {
      const month = await global.nrtInstanceESN.currentNrtMonth();
      const totalBlockRewardBefore = await global.validatorManagerESN.getTotalBlockReward(month);

      await global.blockRewardESN.reward([ethers.utils.hexlify(ethers.utils.randomBytes(20))], [0]);

      const totalBlockRewardAfter = await global.validatorManagerESN.getTotalBlockReward(month);
      assert.strictEqual(
        totalBlockRewardAfter.toNumber() - totalBlockRewardBefore.toNumber(),
        1,
        'should be increased by 1'
      );
    });

    it('withdraws reward in next NRT month', async () => {
      await releaseNrt();

      const month = await global.nrtInstanceESN.currentNrtMonth();
      const vs = await global.validatorManagerESN.getValidatorStakings(month.sub(1));

      let validatorIndex: number | null = null;

      for (const [i, _vs] of vs.entries()) {
        if (_vs.validator === global.validatorWallets[0].address) {
          validatorIndex = i;
          break;
        }
      }

      if (validatorIndex === null) {
        assert(false, 'validatorIndex should exist');
      }

      for (const [i, delegator] of vs[validatorIndex].delegators.entries()) {
        const stakingInstance = TimeAllyStakingFactory.connect(
          delegator.stakingContract,
          global.providerESN
        );

        const owner = await stakingInstance.owner();

        const _validatorManagerESN = global.validatorManagerESN.connect(
          global.providerESN.getSigner(owner)
        );

        const balanceBefore = await global.providerESN.getBalance(owner);

        await parseReceipt(
          _validatorManagerESN.withdrawBlockReward(month.sub(1), validatorIndex, i)
          // true,
          // true
        );

        const balanceAfter = await global.providerESN.getBalance(owner);

        // TODO: Write exact reward amount checking. This will involve redelegation
        assert.ok(balanceAfter.gt(balanceBefore), 'should receive some reward');
      }
    });
  });
