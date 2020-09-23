import assert from 'assert';
import { ethers } from 'ethers';

export const ProofOfStake = () =>
  describe('Proof Of Stake', () => {
    it('picks Validator as per adjusted amount', async () => {
      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const validators = await global.validatorManagerESN.getValidators(currentMonth);
      const totalAdjustedStakings = await global.validatorManagerESN.getTotalAdjustedStakings(
        currentMonth
      );
      assert.ok(totalAdjustedStakings.gt(0), 'totalAdjustedStakings should be non zero');
      assert.ok(validators.length >= 2, 'there should be atleast two validators');

      const selectionCounts: number[] = [];
      validators.forEach((validator, index) => {
        assert.ok(
          validator.adjustedAmount.gt(0),
          `validator ${index} should have non zero adjusted staking`
        );

        selectionCounts.push(0);
      });

      for (let i = 0; i < validators.length * 200; i++) {
        const index = await global.validatorManagerESN.pickValidator(
          currentMonth,
          ethers.utils.randomBytes(32)
        );

        selectionCounts[index.toNumber()]++;
      }
      console.log(validators.map((v) => ethers.utils.formatEther(v.adjustedAmount)));
      console.log(selectionCounts);

      let minRatio = ethers.constants.MaxUint256;
      let maxRatio = ethers.constants.Zero;

      selectionCounts.forEach((selectionCount, index) => {
        const ratio = validators[index].adjustedAmount.div(selectionCount);
        if (ratio.gt(maxRatio)) {
          maxRatio = ratio;
        }
        if (ratio.lt(minRatio)) {
          minRatio = ratio;
        }
      });

      // console.log('max - min', ethers.utils.formatEther(maxRatio.sub(minRatio)));
      // console.log('min', ethers.utils.formatEther(minRatio));
      // console.log('max', ethers.utils.formatEther(maxRatio));

      const deviation = maxRatio.sub(minRatio).mul(100).div(maxRatio.add(minRatio).div(2));
      assert.ok(
        deviation.lt(15),
        'PoS deviation should be less than 15% (Note: This test case fails occassionaly and its fine, rerun the tests)'
      );
    });
  });
