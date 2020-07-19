import { ethers } from 'ethers';
import { parseReceipt, getTimeAllyStakings } from '../../utils';
import assert from 'assert';

export const PrepaidES = () =>
  describe('PrepaidES', () => {
    it('converts liquid ES into PrepaidES', async () => {
      const amount = ethers.utils.parseEther('100');

      const prepaidBefore = await global.prepaidEsInstanceESN.balanceOf(global.accountsESN[0]);
      await parseReceipt(
        global.prepaidEsInstanceESN.convertToESP(global.accountsESN[0], {
          value: amount,
        })
      );
      const prepaidAfter = await global.prepaidEsInstanceESN.balanceOf(global.accountsESN[0]);

      assert.deepEqual(prepaidAfter.sub(prepaidBefore), amount, 'prepaid should be credited');
    });

    it('transfers to ordinary wallets', async () => {
      const amount = ethers.utils.parseEther('1');

      const prepaidBefore = await global.prepaidEsInstanceESN.balanceOf(global.accountsESN[1]);
      await parseReceipt(global.prepaidEsInstanceESN.transfer(global.accountsESN[1], amount));
      const prepaidAfter = await global.prepaidEsInstanceESN.balanceOf(global.accountsESN[1]);

      assert.deepEqual(prepaidAfter.sub(prepaidBefore), amount, 'prepaid should be transferred');
    });

    it('transfers to smart contracts that have tokenFallback', async () => {
      const amount = ethers.utils.parseEther('1');

      const staking = (await getTimeAllyStakings(global.accountsESN[0]))[0];

      // here the staking contract doesn't keep the prepaid ES, it gets it converted to liquid and locks it
      const prepaidBefore = await global.prepaidEsInstanceESN.balanceOf(global.accountsESN[0]);
      await parseReceipt(global.prepaidEsInstanceESN.transfer(staking.address, amount), true, true);
      const prepaidAfter = await global.prepaidEsInstanceESN.balanceOf(global.accountsESN[0]);

      assert.deepEqual(prepaidBefore.sub(prepaidAfter), amount, 'prepaid should be transferred');
    });

    it('tries to transfer to smart contract that do not have tokenFallback expecting revert', async () => {
      const amount = ethers.utils.parseEther('1');

      try {
        await parseReceipt(
          global.prepaidEsInstanceESN.transfer(global.randomnessMangerESN.address, amount)
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(
          msg.includes(
            "revert ESP: Receiver doesn't implement prepaidFallback or the execution failed"
          ),
          `Invalid error message: ${msg}`
        );
      }
    });
  });
