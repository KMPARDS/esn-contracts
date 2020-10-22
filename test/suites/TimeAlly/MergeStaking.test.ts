import { ethers } from 'ethers';
import { parseReceipt, getTimeAllyStakings, releaseNrt } from '../../utils';
import assert from 'assert';

let tempWallet = ethers.Wallet.createRandom();

const {
  utils: { formatEther },
} = ethers;

export const MergeStaking = () =>
  describe('Merge Staking', () => {
    it('creates two stakings and merges them', async () => {
      await global.providerESN.getSigner(0).sendTransaction({
        to: tempWallet.address,
        value: ethers.utils.parseEther('100'),
      });

      tempWallet = tempWallet.connect(global.providerESN);

      await parseReceipt(
        global.timeallyInstanceESN.connect(tempWallet).stake({
          value: ethers.utils.parseEther('40'),
        })
      );

      await parseReceipt(
        global.timeallyInstanceESN.connect(tempWallet).stake({
          value: ethers.utils.parseEther('30'),
        })
      );

      const stakingInstances = await getTimeAllyStakings(tempWallet.address);
      assert.strictEqual(stakingInstances.length, 2, 'there should be 2 stakings for this wallet');

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const totalActiveStakingsBefore = await Promise.all(
        Object.keys([...Array(15)])
          .map((key) => currentMonth + +key)
          .map((month) => global.timeallyInstanceESN.getTotalActiveStaking(month))
      );

      // merging staking 1 into staking 0
      await parseReceipt(
        stakingInstances[1].connect(tempWallet).mergeIn(stakingInstances[0].address)
      );

      const totalActiveStakingsAfter = await Promise.all(
        Object.keys([...Array(15)])
          .map((key) => currentMonth + +key)
          .map((month) => global.timeallyInstanceESN.getTotalActiveStaking(month))
      );

      assert.deepEqual(
        totalActiveStakingsBefore,
        totalActiveStakingsAfter,
        'total active stakings should be same since stakings have same endMonth'
      );

      const principalAfter0 = await stakingInstances[0].principal();
      assert.strictEqual(formatEther(principalAfter0), '70.0', '30 should get added to 40');
    });

    it('creates new staking and merges old staking with iss time into this', async () => {
      await releaseNrt();

      await parseReceipt(
        global.timeallyInstanceESN.connect(tempWallet).stake({
          value: ethers.utils.parseEther('10'),
        })
      );

      const stakingInstances = await getTimeAllyStakings(tempWallet.address);
      assert.strictEqual(stakingInstances.length, 3, 'there should be 3 stakings for this wallet');

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      await parseReceipt(
        stakingInstances[0].connect(tempWallet).withdrawMonthlyNRT([currentMonth], 2)
      );

      const issTimeLimit0 = await stakingInstances[0].issTimeLimit();
      const issTimeLimitBefore2 = await stakingInstances[2].issTimeLimit();

      const totalActiveStakingsBefore = await Promise.all(
        Object.keys([...Array(15)])
          .map((key) => currentMonth + (+key - 1))
          .map((month) => global.timeallyInstanceESN.getTotalActiveStaking(month))
      );

      const principal0 = await stakingInstances[0].principal();

      await parseReceipt(
        stakingInstances[0].connect(tempWallet).mergeIn(stakingInstances[2].address)
      );

      const totalActiveStakingsAfter = await Promise.all(
        Object.keys([...Array(15)])
          .map((key) => currentMonth + (+key - 1))
          .map((month) => global.timeallyInstanceESN.getTotalActiveStaking(month))
      );

      const issTimeLimitAfter2 = await stakingInstances[2].issTimeLimit();
      assert.strictEqual(
        formatEther(issTimeLimit0.add(issTimeLimitBefore2)),
        formatEther(issTimeLimitAfter2),
        'iss time should be added'
      );

      for (const [key] of totalActiveStakingsBefore.entries()) {
        if (key === 13) {
          assert.strictEqual(
            formatEther(totalActiveStakingsBefore[key].add(principal0)),
            formatEther(totalActiveStakingsAfter[key]),
            'should increase total active stakings if childs endMonth is lower'
          );
        } else {
          assert.strictEqual(
            formatEther(totalActiveStakingsBefore[key]),
            formatEther(totalActiveStakingsAfter[key]),
            'should not change any total active stakings for common months'
          );
        }
      }
    });

    it('creates new staking and merges it into old staking with iss time', async () => {
      await releaseNrt();

      let stakingInstances = await getTimeAllyStakings(tempWallet.address);

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      await parseReceipt(
        stakingInstances[2].connect(tempWallet).withdrawMonthlyNRT([currentMonth], 2)
      );

      await parseReceipt(
        global.timeallyInstanceESN.connect(tempWallet).stake({
          value: ethers.utils.parseEther('10'),
        })
      );
      stakingInstances = await getTimeAllyStakings(tempWallet.address);
      assert.strictEqual(stakingInstances.length, 4, 'there should be 4 stakings for this wallet');

      const issTimeLimit2Before = await stakingInstances[2].issTimeLimit();

      const totalActiveStakingsBefore = await Promise.all(
        Object.keys([...Array(15)])
          .map((key) => currentMonth + (+key - 1))
          .map((month) => global.timeallyInstanceESN.getTotalActiveStaking(month))
      );

      const principal3 = await stakingInstances[3].principal();

      await parseReceipt(
        stakingInstances[3].connect(tempWallet).mergeIn(stakingInstances[2].address)
      );

      const totalActiveStakingsAfter = await Promise.all(
        Object.keys([...Array(15)])
          .map((key) => currentMonth + (+key - 1))
          .map((month) => global.timeallyInstanceESN.getTotalActiveStaking(month))
      );

      const issTimeLimit2After = await stakingInstances[2].issTimeLimit();
      assert.strictEqual(
        formatEther(issTimeLimit2Before),
        formatEther(issTimeLimit2After),
        'should retain existing isstime'
      );

      for (const [key] of totalActiveStakingsBefore.entries()) {
        if (key === 13) {
          assert.strictEqual(
            formatEther(totalActiveStakingsBefore[key].sub(principal3)),
            formatEther(totalActiveStakingsAfter[key]),
            'should increase total active stakings if childs endMonth is lower'
          );
        } else {
          assert.strictEqual(
            formatEther(totalActiveStakingsBefore[key]),
            formatEther(totalActiveStakingsAfter[key]),
            'should not change any total active stakings for common months'
          );
        }
      }
    });

    it('tries to merge with self expecting revert', async () => {
      const stakingInstances = await getTimeAllyStakings(tempWallet.address);
      try {
        await parseReceipt(
          stakingInstances[2].connect(tempWallet).mergeIn(stakingInstances[2].address)
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(msg.includes('TAS: CANT_MERGE_WITH_SELF'), `Invalid error message: ${msg}`);
      }
    });
  });
