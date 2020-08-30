import assert from 'assert';
import { ethers } from 'ethers';
import {
  parseReceipt,
  getBlockFinalizedToESN,
  generateDepositProof,
  getTimeAllyStakings,
} from '../../utils';

export const NewStaking = () =>
  describe('New Staking', () => {
    it('tries to stake 0 ES expecting revert', async () => {
      try {
        await parseReceipt(global.timeallyInstanceESN.stake());

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(msg.includes('TimeAlly: No value'), `Invalid error message: ${msg}`);
      }
    });

    const stakingAmount = 800000;
    it(`stakes ${stakingAmount} ES tokens in TimeAlly`, async () => {
      // STEP 1 depositing to fundsManagerETH
      const receipt = await parseReceipt(
        global.esInstanceETH.transfer(
          global.fundsManagerInstanceETH.address,
          ethers.utils.parseEther(String(stakingAmount * 2))
        )
      );

      // STEP 2 getting the bunch posted
      await getBlockFinalizedToESN(receipt.blockNumber);

      // Step 3 generate proof
      const depositProof = await generateDepositProof(receipt.transactionHash);

      // Step 4 submit proof to ETH
      await parseReceipt(global.fundsManagerInstanceESN.claimDeposit(depositProof));

      const userBalanceBefore = await global.providerESN.getBalance(global.accountsESN[0]);
      const timeallyManagerBalanceBefore = await global.providerESN.getBalance(
        global.timeallyInstanceESN.address
      );

      // Step 5 staking
      await parseReceipt(
        global.timeallyInstanceESN.stake({
          value: ethers.utils.parseEther(String(stakingAmount)),
        })
      );

      const userBalanceAfter = await global.providerESN.getBalance(global.accountsESN[0]);
      const timeallyManagerBalanceAfter = await global.providerESN.getBalance(
        global.timeallyInstanceESN.address
      );

      assert.deepEqual(
        userBalanceBefore.sub(userBalanceAfter),
        ethers.utils.parseEther(String(stakingAmount)),
        'user balance should be decresed'
      );
      assert.deepEqual(
        timeallyManagerBalanceBefore,
        timeallyManagerBalanceAfter,
        'timeally manager balance should stay the same'
      );

      const stakingInstances = await getTimeAllyStakings(global.accountsESN[0]);
      assert.strictEqual(stakingInstances.length, 1, 'should have one staking created');
      const stakingInstance = stakingInstances[0];

      assert.deepEqual(
        await global.providerESN.getBalance(stakingInstance.address),
        ethers.utils.parseEther(String(stakingAmount)),
        'stake amount should be transferred to new contract'
      );
      assert.strictEqual(
        await stakingInstance.nrtManager(),
        global.nrtInstanceESN.address,
        'nrt manager address should be set properly'
      );
      assert.strictEqual(
        await stakingInstance.timeAllyManager(),
        global.timeallyInstanceESN.address,
        'timeally manager address should be set properly'
      );
      assert.strictEqual(
        await stakingInstance.owner(),
        global.accountsESN[0],
        'staker should be set correctly'
      );

      const currentMonth = (await global.nrtInstanceESN.currentNrtMonth()).toNumber();
      const startMonth = await stakingInstance.startMonth();
      assert.strictEqual(
        startMonth.toNumber(),
        currentMonth + 1,
        'staking start month should be set correctly'
      );
      const endMonth = await stakingInstance.endMonth();
      assert.strictEqual(
        endMonth.toNumber(),
        currentMonth + 12,
        'staking end month should be set correctly'
      );

      const principalAmounts: ethers.BigNumber[] = [];
      const totalActiveStakings: ethers.BigNumber[] = [];
      for (let i = startMonth.toNumber() - 1; i <= endMonth.toNumber() + 1; i++) {
        principalAmounts.push(await stakingInstance.getPrincipalAmount(i));
        totalActiveStakings.push(await global.timeallyInstanceESN.getTotalActiveStaking(i));
      }

      assert.deepEqual(
        principalAmounts[0],
        ethers.BigNumber.from(0),
        'should have no principal amount on staking month'
      );
      assert.deepEqual(
        principalAmounts[principalAmounts.length - 1],
        ethers.BigNumber.from(0),
        'should have no principal amount after the month'
      );

      principalAmounts.slice(1, principalAmounts.length - 1).map((principalAmount) => {
        assert.deepEqual(
          principalAmount,
          ethers.utils.parseEther(String(stakingAmount)),
          'principal amount should be correct'
        );
      });
      totalActiveStakings.slice(1, totalActiveStakings.length - 1).map((totalActive) => {
        assert.deepEqual(
          totalActive,
          ethers.utils.parseEther(String(stakingAmount)),
          'total active stakings should be updated correctly'
        );
      });
    });

    it('stakes using prepaid es', async () => {
      const tempWallet = ethers.Wallet.createRandom();
      const amount = ethers.utils.parseEther('100');

      const stakingInstancesBefore = await getTimeAllyStakings(tempWallet.address);
      assert.strictEqual(stakingInstancesBefore.length, 0, 'should now have stakings before');

      await global.prepaidEsInstanceESN.convertToESP(tempWallet.address, {
        value: amount,
      });

      await parseReceipt(
        global.prepaidEsInstanceESN
          .connect(tempWallet.connect(global.providerESN))
          .transfer(global.timeallyInstanceESN.address, amount)
      );

      const stakingInstances = await getTimeAllyStakings(tempWallet.address);
      const stakingInstance = stakingInstances[0];
      const owner = await stakingInstance.owner();
      assert.strictEqual(owner, tempWallet.address, 'should get a staking');
    });
  });
