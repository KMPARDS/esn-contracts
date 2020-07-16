import { assert } from 'console';

export const BlockReward = () =>
  describe('Block Reward', async () => {
    it('gives reward to validator should increase count', async () => {
      const month = await global.nrtInstanceESN.currentNrtMonth();
      const vsBefore = await global.validatorManagerESN.getValidatorStakings(month);
      const blockRewardBefore = vsBefore.find(
        (vs) => vs.validator === global.validatorWallets[0].address
      )?.blockRewards;
      if (!blockRewardBefore) assert(false, 'validator does not exist before');

      await global.blockRewardESN.reward([global.validatorWallets[0].address], [0]);

      const vsAfter = await global.validatorManagerESN.getValidatorStakings(month);
      const blockRewardAfter = vsAfter.find(
        (vs) => vs.validator === global.validatorWallets[0].address
      )?.blockRewards;
      if (!blockRewardAfter) assert(false, 'validator does not exist after');
    });
  });
