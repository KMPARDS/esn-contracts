import assert from 'assert';
import { ethers } from 'ethers';
import {
  parseReceipt,
  getBlockFinalizedToESN,
  generateDepositProof,
  getTimeAllyStakings,
} from '../../utils';

export const TimeAllyStaking = () =>
  describe('TimeAlly Staking', () => {
    it('tries to stake 0 ES expecting revert', async () => {
      try {
        await parseReceipt(global.timeallyInstanceESN.stake(0));

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(msg.includes('TimeAlly: No value'), `Invalid error message: ${msg}`);
      }
    });

    it('stakes 100 ES tokens in TimeAlly', async () => {
      // STEP 1 depositing to fundsManagerETH
      const receipt = await parseReceipt(
        global.esInstanceETH.transfer(
          global.fundsManagerInstanceETH.address,
          ethers.utils.parseEther('1000')
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
          value: ethers.utils.parseEther('100'),
        })
      );

      const userBalanceAfter = await global.providerESN.getBalance(global.accountsESN[0]);
      const timeallyManagerBalanceAfter = await global.providerESN.getBalance(
        global.timeallyInstanceESN.address
      );

      assert.ok(
        userBalanceBefore.sub(userBalanceAfter).eq(ethers.utils.parseEther('100')),
        'user balance should be decresed'
      );
      assert.deepEqual(
        timeallyManagerBalanceBefore,
        timeallyManagerBalanceAfter,
        'timeally manager balance should stay the same'
      );

      const stakes = await getTimeAllyStakings(global.accountsESN[0]);
      assert.strictEqual(stakes.length, 1, 'should have one staking created');
      const stake = stakes[0];

      assert.deepEqual(
        await global.providerESN.getBalance(stake.address),
        ethers.utils.parseEther('100'),
        'stake amount should be transferred to new contract'
      );
      assert.strictEqual(
        await stake.nrtManager(),
        global.nrtInstanceESN.address,
        'nrt manager address should be set properly'
      );
      assert.strictEqual(
        await stake.timeAllyManager(),
        global.timeallyInstanceESN.address,
        'timeally manager address should be set properly'
      );
      assert.strictEqual(
        await stake.staker(),
        global.accountsESN[0],
        'staker should be set correctly'
      );
      assert.strictEqual(
        (await stake.stakingPlanId()).toNumber(),
        0,
        'plan id should be set correctly'
      );
      const stakingStartMonth = await stake.stakingStartMonth();
      assert.strictEqual(
        stakingStartMonth.toNumber(),
        2,
        'staking start month should be set correctly'
      );
      const stakingEndMonth = await stake.stakingEndMonth();
      assert.strictEqual(
        stakingEndMonth.toNumber(),
        13,
        'staking end month should be set correctly'
      );
      assert.deepEqual(
        await stake.unboundedBasicAmount(),
        ethers.utils.parseEther('100').mul(2).div(100),
        'unbounded basic amount should be set correctly'
      );

      const principalAmounts: ethers.BigNumber[] = [];
      for (let i = stakingStartMonth.toNumber() - 1; i <= stakingEndMonth.toNumber() + 1; i++) {
        principalAmounts.push(await stake.principalAmount(i));
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
          ethers.utils.parseEther('100'),
          'principal amount should be correct'
        );
      });
    });

    it('topups an existing staking by 200', async () => {
      const stakes = await getTimeAllyStakings(global.accountsESN[0]);
      const stake = stakes[0];

      const signer = global.providerESN.getSigner(global.accountsESN[0]);
      await signer.sendTransaction({
        to: stake.address,
        value: ethers.utils.parseEther('200'),
      });

      assert.deepEqual(
        await stake.unboundedBasicAmount(),
        ethers.utils.parseEther('300').mul(2).div(100),
        'unbounded basic amount should be set correctly'
      );

      const principalAmounts: ethers.BigNumber[] = [];
      const stakingStartMonth = await stake.stakingStartMonth();
      const stakingEndMonth = await stake.stakingEndMonth();

      for (let i = stakingStartMonth.toNumber(); i <= stakingEndMonth.toNumber(); i++) {
        principalAmounts.push(await stake.principalAmount(i));
      }

      principalAmounts.slice(1, principalAmounts.length - 1).map((principalAmount) => {
        assert.deepEqual(
          principalAmount,
          ethers.utils.parseEther('300'),
          'principal amount should be updated correctly'
        );
      });
    });
  });
