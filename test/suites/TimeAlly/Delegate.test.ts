import { ethers } from 'ethers';
import assert from 'assert';
import { getTimeAllyStakings, parseReceipt } from '../../utils';
import { TimeAllyStakeFactory } from '../../../build/typechain/ESN';

export const Delegate = () =>
  describe('Delegate', () => {
    it('delegetes 50 ES to first validator on Validator Manager contract', async () => {
      const stakeInstances = await getTimeAllyStakings(global.accountsESN[0]);
      const stakeInstance = stakeInstances[0];

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const months = [currentMonth.add(1), currentMonth.add(2)];
      await parseReceipt(
        stakeInstance.delegate(
          global.validatorManagerESN.address,
          global.validatorWallets[0].address,
          ethers.utils.parseEther('50'),
          months
        )
      );

      await Promise.all(
        months.map(async (month) => {
          const firstDelegation = await stakeInstance.getDelegation(month, 0);
          assert.strictEqual(
            firstDelegation.platform,
            global.validatorManagerESN.address,
            'platform address should be set properly'
          );
          assert.strictEqual(
            firstDelegation.delegatee,
            global.validatorWallets[0].address,
            'delegatee address should be set properly'
          );
          assert.deepEqual(
            firstDelegation.amount,
            ethers.utils.parseEther('50'),
            'platform address should be set properly'
          );

          const validatorStake = await global.validatorManagerESN.getValidatorStake(month, 0);
          assert.strictEqual(validatorStake.validator, global.validatorWallets[0].address);
          assert.deepEqual(validatorStake.amount, ethers.utils.parseEther('50'));
        })
      );
    });

    it('delegetes 50 ES to second validator on Validator Manager contract', async () => {
      const stakeInstances = await getTimeAllyStakings(global.accountsESN[0]);
      const stakeInstance = stakeInstances[0];

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const months = [currentMonth.add(1), currentMonth.add(2)];
      await parseReceipt(
        stakeInstance.delegate(
          global.validatorManagerESN.address,
          global.validatorWallets[1].address,
          ethers.utils.parseEther('50'),
          months
        )
      );

      await Promise.all(
        months.map(async (month) => {
          const secondDelegation = await stakeInstance.getDelegation(month, 1);
          assert.strictEqual(
            secondDelegation.platform,
            global.validatorManagerESN.address,
            'platform address should be set properly'
          );
          assert.strictEqual(
            secondDelegation.delegatee,
            global.validatorWallets[1].address,
            'delegatee address should be set properly'
          );
          assert.deepEqual(
            secondDelegation.amount,
            ethers.utils.parseEther('50'),
            'platform address should be set properly'
          );

          const validatorStake = await global.validatorManagerESN.getValidatorStake(month, 1);
          assert.strictEqual(validatorStake.validator, global.validatorWallets[1].address);
          assert.deepEqual(validatorStake.amount, ethers.utils.parseEther('50'));
        })
      );
    });

    it('tries to delegate more than remaining limit expecting revert', async () => {
      const stakeInstances = await getTimeAllyStakings(global.accountsESN[0]);
      const stakeInstance = stakeInstances[0];

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();

      try {
        await parseReceipt(
          stakeInstance.delegate(
            global.validatorManagerESN.address,
            global.validatorWallets[0].address,
            await stakeInstance.getPrincipalAmount(currentMonth.add(1)),
            [currentMonth.add(1)]
          )
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(msg.includes('TAStake: delegate overflow'), `Invalid error message: ${msg}`);
      }
    });

    it('delegates 100 ES with other staking to first validator on Validator Manager contract', async () => {
      await global.providerESN.getSigner(global.accountsESN[0]).sendTransaction({
        to: global.accountsESN[1],
        value: ethers.utils.parseEther('100'),
      });

      const _timeallyInstanceESN = global.timeallyInstanceESN.connect(
        global.providerESN.getSigner(global.accountsESN[1])
      );

      const r = await parseReceipt(
        _timeallyInstanceESN.stake(0, {
          value: ethers.utils.parseEther('100'),
        })
      );
      const newStakingEvent = global.timeallyInstanceESN.interface.parseLog(r.logs[0]);
      const stakingContractAddress: string = newStakingEvent.args.staking;

      const stakeInstance = TimeAllyStakeFactory.connect(
        stakingContractAddress,
        global.providerESN.getSigner(global.accountsESN[1])
      );

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const month = currentMonth.add(1);
      await parseReceipt(
        stakeInstance.delegate(
          global.validatorManagerESN.address,
          global.validatorWallets[0].address,
          ethers.utils.parseEther('100'),
          [month]
        )
      );

      const firstDelegation = await stakeInstance.getDelegation(month, 0);
      assert.strictEqual(
        firstDelegation.platform,
        global.validatorManagerESN.address,
        'platform address should be set properly'
      );
      assert.strictEqual(
        firstDelegation.delegatee,
        global.validatorWallets[0].address,
        'delegatee address should be set properly'
      );
      assert.deepEqual(
        firstDelegation.amount,
        ethers.utils.parseEther('100'),
        'platform address should be set properly'
      );

      const validatorStake = await global.validatorManagerESN.getValidatorStake(month, 0);
      assert.strictEqual(validatorStake.validator, global.validatorWallets[0].address);
      assert.deepEqual(validatorStake.amount, ethers.utils.parseEther('150'));
    });
  });
