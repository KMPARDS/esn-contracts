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
        await parseReceipt(global.timeallyInstanceESN.stake(0));

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
        global.timeallyInstanceESN.stake(0, {
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

      const stakeInstances = await getTimeAllyStakings(global.accountsESN[0]);
      assert.strictEqual(stakeInstances.length, 1, 'should have one staking created');
      const stakeInstance = stakeInstances[0];

      assert.deepEqual(
        await global.providerESN.getBalance(stakeInstance.address),
        ethers.utils.parseEther(String(stakingAmount)),
        'stake amount should be transferred to new contract'
      );
      assert.strictEqual(
        await stakeInstance.nrtManager(),
        global.nrtInstanceESN.address,
        'nrt manager address should be set properly'
      );
      assert.strictEqual(
        await stakeInstance.timeAllyManager(),
        global.timeallyInstanceESN.address,
        'timeally manager address should be set properly'
      );
      assert.strictEqual(
        await stakeInstance.staker(),
        global.accountsESN[0],
        'staker should be set correctly'
      );
      assert.strictEqual(
        (await stakeInstance.stakingPlanId()).toNumber(),
        0,
        'plan id should be set correctly'
      );
      const stakingStartMonth = await stakeInstance.stakingStartMonth();
      assert.strictEqual(
        stakingStartMonth.toNumber(),
        2,
        'staking start month should be set correctly'
      );
      const stakingEndMonth = await stakeInstance.stakingEndMonth();
      assert.strictEqual(
        stakingEndMonth.toNumber(),
        13,
        'staking end month should be set correctly'
      );
      assert.deepEqual(
        await stakeInstance.unboundedBasicAmount(),
        ethers.utils.parseEther(String(stakingAmount)).mul(2).div(100),
        'unbounded basic amount should be set correctly'
      );

      const principalAmounts: ethers.BigNumber[] = [];
      const totalActiveStakings: ethers.BigNumber[] = [];
      for (let i = stakingStartMonth.toNumber() - 1; i <= stakingEndMonth.toNumber() + 1; i++) {
        principalAmounts.push(await stakeInstance.getPrincipalAmount(i));
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
  });
