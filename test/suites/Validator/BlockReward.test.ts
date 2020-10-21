import assert from 'assert';
import { ethers } from 'ethers';
import { releaseNrt, parseReceipt } from '../../utils';
import { TimeAllyStakingFactory } from '../../../build/typechain/ESN';
import { formatEther } from 'ethers/lib/utils';

export const BlockReward = () =>
  describe('Block Reward', async () => {
    it('marks block reward to validator should increase count', async () => {
      const month = await global.nrtInstanceESN.currentNrtMonth();
      const vsBefore = await global.validatorManagerESN.getValidators(month);
      const blockRewardBefore = vsBefore.find(
        (vs) => vs.wallet === global.validatorWallets[0].address
      )?.blocksSealed;
      if (!blockRewardBefore) assert(false, 'validator does not exist before');
      const totalBlockRewardBefore = await global.validatorManagerESN.getTotalBlocksSealed(month);

      await global.blockRewardESN.reward([global.validatorWallets[0].address], [0]);

      const vsAfter = await global.validatorManagerESN.getValidators(month);
      const blockRewardAfter = vsAfter.find(
        (vs) => vs.wallet === global.validatorWallets[0].address
      )?.blocksSealed;
      if (!blockRewardAfter) assert(false, 'validator does not exist after');
      const totalBlockRewardAfter = await global.validatorManagerESN.getTotalBlocksSealed(month);

      assert.strictEqual(
        totalBlockRewardAfter.toNumber() - totalBlockRewardBefore.toNumber(),
        1,
        'should be increased by 1'
      );
    });

    it('marks block reward to other validator should increase count', async () => {
      const month = await global.nrtInstanceESN.currentNrtMonth();
      const vsBefore = await global.validatorManagerESN.getValidators(month);
      const blockRewardBefore = vsBefore.find(
        (vs) => vs.wallet === global.validatorWallets[1].address
      )?.blocksSealed;
      if (!blockRewardBefore) assert(false, 'validator does not exist before');
      const totalBlockRewardBefore = await global.validatorManagerESN.getTotalBlocksSealed(month);

      await global.blockRewardESN.reward([global.validatorWallets[1].address], [0]);

      const vsAfter = await global.validatorManagerESN.getValidators(month);
      const blockRewardAfter = vsAfter.find(
        (vs) => vs.wallet === global.validatorWallets[1].address
      )?.blocksSealed;
      if (!blockRewardAfter) assert(false, 'validator does not exist after');
      const totalBlockRewardAfter = await global.validatorManagerESN.getTotalBlocksSealed(month);

      assert.strictEqual(
        totalBlockRewardAfter.toNumber() - totalBlockRewardBefore.toNumber(),
        1,
        'should be increased by 1'
      );
    });

    it('marks block reward to unknown validator', async () => {
      const month = await global.nrtInstanceESN.currentNrtMonth();
      const totalBlockRewardBefore = await global.validatorManagerESN.getTotalBlocksSealed(month);

      await global.blockRewardESN.reward([ethers.utils.hexlify(ethers.utils.randomBytes(20))], [0]);

      const totalBlockRewardAfter = await global.validatorManagerESN.getTotalBlocksSealed(month);
      assert.strictEqual(
        totalBlockRewardAfter.toNumber() - totalBlockRewardBefore.toNumber(),
        1,
        'should be increased by 1'
      );
    });

    it('sets validator commission', async () => {
      const month = await global.nrtInstanceESN.currentNrtMonth();

      await parseReceipt(
        global.validatorManagerESN
          .connect(global.validatorWallets[0].connect(global.providerESN))
          .setCommission(month, 10)
        // true,
        // true
      );
      await parseReceipt(
        global.validatorManagerESN
          .connect(global.validatorWallets[1].connect(global.providerESN))
          .setCommission(month, 10)
        // true,
        // true
      );

      const validator0 = await global.validatorManagerESN.getValidatorByAddress(
        month,
        global.validatorWallets[0].address
      );
      const validator1 = await global.validatorManagerESN.getValidatorByAddress(
        month,
        global.validatorWallets[0].address
      );

      assert.strictEqual(validator0.perThousandCommission.toNumber(), 10, 'should be set 0');
      assert.strictEqual(validator1.perThousandCommission.toNumber(), 10, 'should be set 1');
    });

    // it('tries to set commission again expecting revert', async () => {
    //   // TODO: add this test case
    // });

    it('withdraws reward by delegator in next NRT month', async () => {
      await releaseNrt();

      const month = await global.nrtInstanceESN.currentNrtMonth();
      const validators = await global.validatorManagerESN.getValidators(month - 1);

      let validatorIndex: number | null = null;

      for (const [i, validator] of validators.entries()) {
        if (validator.wallet === global.validatorWallets[0].address) {
          validatorIndex = i;
          break;
        }
      }

      if (validatorIndex === null) {
        assert(false, 'validatorIndex should exist');
      }

      for (const [i, delegator] of validators[validatorIndex].delegators.entries()) {
        const stakingInstance = TimeAllyStakingFactory.connect(
          delegator.stakingContract,
          global.providerESN
        );

        const owner = await stakingInstance.owner();

        const _validatorManagerESN = global.validatorManagerESN.connect(
          global.providerESN.getSigner(owner)
        );

        const prepaidBefore = await global.prepaidEsInstanceESN.balanceOf(owner);

        await parseReceipt(
          _validatorManagerESN.withdrawDelegationShare(
            month - 1,
            validators[validatorIndex].wallet,
            delegator.stakingContract
          )
        );

        const prepaidAfter = await global.prepaidEsInstanceESN.balanceOf(owner);

        // console.log(formatEther(balanceAfter.sub(balanceBefore)));

        // TODO: Write exact reward amount checking. This will involve redelegation
        assert.ok(prepaidAfter.gt(prepaidBefore), 'should receive some reward');
      }
    });

    it('withdraws commission by validator', async () => {
      const month = await global.nrtInstanceESN.currentNrtMonth();

      const totalBlocks = await global.validatorManagerESN.getTotalBlocksSealed(month - 1);
      // console.log(totalBlocks.toNumber());

      const earning0 = await global.validatorManagerESN.callStatic.getValidatorEarning(
        month - 1,
        global.validatorWallets[0].address
      );

      // console.log(formatEther(totalBlocks), formatEther(earning0), formatEther(earning1));

      const prepaidBefore = await global.prepaidEsInstanceESN.balanceOf(
        global.validatorWallets[0].address
      );

      await parseReceipt(
        global.validatorManagerESN
          .connect(global.validatorWallets[0].connect(global.providerESN))
          .withdrawCommission(month - 1)
        // true,
        // true
      );

      const prepaidAfter = await global.prepaidEsInstanceESN.balanceOf(
        global.validatorWallets[0].address
      );

      assert.strictEqual(
        formatEther(prepaidAfter.sub(prepaidBefore)),
        formatEther(earning0.div(100)),
        'should get the commission 1%'
      );
    });
  });
