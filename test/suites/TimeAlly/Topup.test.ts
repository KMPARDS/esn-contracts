import assert from 'assert';
import { ethers } from 'ethers';
import { getTimeAllyStakings } from '../../utils';

export const TopupStaking = () =>
  describe('Topup Staking', () => {
    const topupAmount = 200;
    it(`topups an existing staking by ${topupAmount}`, async () => {
      const stakingInstances = await getTimeAllyStakings(global.accountsESN[0]);
      const stakingInstance = stakingInstances[0];

      const stakingAmount = await stakingInstance.getPrincipalAmount(
        (await global.nrtInstanceESN.currentNrtMonth()) + 1
      );

      const totalActiveStakingsBefore: ethers.BigNumber[] = [];
      const startMonth = await stakingInstance.startMonth();
      const endMonth = await stakingInstance.endMonth();

      for (let i = startMonth; i <= endMonth; i++) {
        totalActiveStakingsBefore.push(await global.timeallyInstanceESN.getTotalActiveStaking(i));
      }

      const signer = global.providerESN.getSigner(global.accountsESN[0]);
      await signer.sendTransaction({
        to: stakingInstance.address,
        value: ethers.utils.parseEther(String(topupAmount)),
      });

      const principalAmounts: ethers.BigNumber[] = [];
      const totalActiveStakingsAfter: ethers.BigNumber[] = [];

      for (let i = startMonth; i <= endMonth; i++) {
        principalAmounts.push(await stakingInstance.getPrincipalAmount(i));
        totalActiveStakingsAfter.push(await global.timeallyInstanceESN.getTotalActiveStaking(i));
      }

      principalAmounts.map((principalAmount) => {
        assert.deepEqual(
          principalAmount,
          stakingAmount.add(ethers.utils.parseEther(String(topupAmount))),
          'principal amount should be updated correctly'
        );
      });

      totalActiveStakingsAfter.map((totalActive, i) => {
        assert.deepEqual(
          totalActive,
          totalActiveStakingsBefore[i].add(ethers.utils.parseEther(String(topupAmount))),
          'total active stakings should be updated correctly'
        );
      });
    });
  });
