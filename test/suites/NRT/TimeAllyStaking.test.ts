import assert from 'assert';
import { ethers } from 'ethers';
import { parseReceipt, getBlockFinalizedToESN, generateDepositProof } from '../../utils';
import { TimeAllyStakeFactory } from '../../../build/typechain/ESN';
import { TimeAllyStake } from '../../../build/typechain/ESN/TimeAllyStake';

async function getTimeAllyStakings(staker: string): Promise<TimeAllyStake[]> {
  return (
    await global.timeallyInstance.queryFilter(
      global.timeallyInstance.filters.NewStaking(staker, null)
    )
  )
    .map((event) => global.timeallyInstance.interface.parseLog(event))
    .map((parsedLog) => {
      const stakingAddress: string = parsedLog.args[1];
      return TimeAllyStakeFactory.connect(
        stakingAddress,
        global.providerESN.getSigner(global.accountsESN[0])
      );
    });
}

export const TimeAllyStaking = () =>
  describe('TimeAlly Staking', () => {
    it('tries to stake 0 ES expecting revert', async () => {
      try {
        await parseReceipt(global.timeallyInstance.stake(0));

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

      // Step 5 staking
      await parseReceipt(
        global.timeallyInstance.stake(0, {
          value: ethers.utils.parseEther('100'),
        })
      );

      const stakes = await getTimeAllyStakings(global.accountsESN[0]);
      assert.strictEqual(stakes.length, 1, 'should have one staking created');
      const stake = stakes[0];
      assert.strictEqual(
        await stake.nrtManager(),
        global.nrtInstanceESN.address,
        'nrt manager address should be set properly'
      );
      assert.strictEqual(
        await stake.timeAllyManager(),
        global.timeallyInstance.address,
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
      assert.strictEqual(
        (await stake.stakingStartMonth()).toNumber(),
        1,
        'staking start month should be set correctly'
      );
      assert.strictEqual(
        (await stake.stakingEndMonth()).toNumber(),
        12,
        'staking end month should be set correctly'
      );
      assert.strictEqual(
        await stake.functions.unboundedBasicAmount(),
        ethers.utils.parseEther('100').mul(2).div(100),
        'unbounded basic amount should be set correctly'
      );
    });
  });
