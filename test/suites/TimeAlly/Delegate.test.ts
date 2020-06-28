import { ethers } from 'ethers';
import assert from 'assert';
import { getTimeAllyStakings, parseReceipt } from '../../utils';

export const Delegate = () =>
  describe('Delegate', () => {
    it('delegetes 50 ES to first validator on Validator Manager contract', async () => {
      const stakes = await getTimeAllyStakings(global.accountsESN[0]);
      const stake = stakes[0];

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const months = [currentMonth.add(1), currentMonth.add(2)];
      await parseReceipt(
        stake.delegate(
          global.validatorManagerESN.address,
          global.validatorWallets[0].address,
          ethers.utils.parseEther('50'),
          months
        )
      );

      await Promise.all(
        months.map(async (month) => {
          const firstDelegation = await stake.delegation(month, 0);
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

          const monthVS = await global.validatorManagerESN.monthVS(month, 0);
          assert.strictEqual(monthVS.validator, global.validatorWallets[0].address);
          assert.deepEqual(monthVS.amount, ethers.utils.parseEther('50'));
        })
      );
    });

    it('delegetes 50 ES to second validator on Validator Manager contract', async () => {
      const stakes = await getTimeAllyStakings(global.accountsESN[0]);
      const stake = stakes[0];

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const months = [currentMonth.add(1), currentMonth.add(2)];
      await parseReceipt(
        stake.delegate(
          global.validatorManagerESN.address,
          global.validatorWallets[1].address,
          ethers.utils.parseEther('50'),
          months
        )
      );

      await Promise.all(
        months.map(async (month) => {
          const secondDelegation = await stake.delegation(month, 1);
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

          const monthVS = await global.validatorManagerESN.monthVS(month, 1);
          assert.strictEqual(monthVS.validator, global.validatorWallets[1].address);
          assert.deepEqual(monthVS.amount, ethers.utils.parseEther('50'));
        })
      );
    });
  });
