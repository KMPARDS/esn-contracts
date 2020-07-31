/*
Instructions to run this:

ts-node test-chain.ts
ts-node deploy-next.ts
ts-node deploy-stakings.ts

*/

import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { TimeAllyManagerFactory, NrtManagerFactory } from './build/typechain/ESN';
import { formatEther } from 'ethers/lib/utils';

const existing = {
  nrtManager: '0xAE519FC2Ba8e6fFE6473195c092bF1BAe986ff90',
  timeallyManager: '0x73b647cbA2FE75Ba05B8e12ef8F8D6327D6367bF',
  timeallyStakingTarget: '0x7d73424a8256C0b2BA245e5d5a3De8820E45F390',
  validatorSet: '0x08425D9Df219f93d5763c3e85204cb5B4cE33aAa',
  validatorManager: '0xA10A3B175F0f2641Cf41912b887F77D8ef34FAe8',
  randomnessManager: '0x6E05f58eEddA592f34DD9105b1827f252c509De0',
  blockRewardManager: '0x79EaFd0B5eC8D3f945E6BB2817ed90b046c0d0Af',
  prepaidEs: '0x2Ce636d6240f8955d085a896e12429f8B3c7db26',
};

const providerESN = new JsonRpcProvider('http://localhost:8545');
const wallet = new ethers.Wallet(
  '0x1111111111111111111111111111111111111111111111111111111111111111',
  providerESN
);

const nrtManagerInstance = NrtManagerFactory.connect(existing.nrtManager, wallet);
const timeallyManagerInstance = TimeAllyManagerFactory.connect(existing.timeallyManager, wallet);

(async () => {
  const excel: { stakings: StakingRow[] } = require('./stakings.json');
  console.log('Current Block Number', await providerESN.getBlockNumber());
  console.log('NRT Month', (await nrtManagerInstance.currentNrtMonth()).toNumber());
  console.log('Staking Default Months', (await timeallyManagerInstance.defaultMonths()).toNumber());

  // sorting the stakings based on stakingMonth
  excel.stakings = excel.stakings.sort((a, b) => {
    return (a.stakingMonth ? +a.stakingMonth : 12) > (b.stakingMonth ? +b.stakingMonth : 12)
      ? 1
      : -1;
  });

  let nrtMonth = 0;
  let nonce: number = await wallet.getTransactionCount();
  for (const [index, stakingRow] of excel.stakings.entries()) {
    const { address, amount, stakingMonth, claimedMonths } = parseStakingRow(stakingRow);

    const tx = await timeallyManagerInstance.sendStake(address, 0, claimedMonths, {
      value: amount,
      nonce: nonce++,
    });
    // await tx.wait();
    console.log(address, stakingMonth, formatEther(amount));

    // if stakingMonth has incremented then release the NRT until it reaches staking month
    while (nrtMonth < stakingMonth) {
      nrtMonth++;
      const tx = await nrtManagerInstance.releaseMonthlyNRT({
        nonce: nonce++,
      });
      // await tx.wait();
      const newNrtMonth = await nrtManagerInstance.currentNrtMonth();
      console.log('\n', 'NRT released', newNrtMonth.toNumber(), '\n');
    }
  }
})();

interface StakingRow {
  address: string;
  stakingId: string;
  planId: string;
  amount: string;
  stakingMonth?: string;
  monthlyBenefits__1?: string;
  monthlyBenefits__2?: string;
  monthlyBenefits__3?: string;
  monthlyBenefits__4?: string;
  monthlyBenefits__5?: string;
  monthlyBenefits__6?: string;
  monthlyBenefits__7?: string;
  monthlyBenefits__8?: string;
  monthlyBenefits__9?: string;
  monthlyBenefits__10?: string;
  monthlyBenefits__11?: string;
  WA: string;
  Amount: string;
  date: string;
  Check: string;
}

interface ParsedStaking {
  address: string;
  amount: ethers.BigNumber;
  stakingMonth: number; // number of nrt releases
  claimedMonths: boolean[];
}

function parseStakingRow(input: StakingRow): ParsedStaking {
  try {
    const address = ethers.utils.getAddress(input.address);
    const amount = ethers.utils.parseEther(input.amount);
    const stakingMonth = input.stakingMonth ? +input.stakingMonth : 12;
    if (isNaN(stakingMonth)) {
      throw new Error(`staking month is NaN`);
    }
    const claimedMonths: boolean[] = [];
    for (let i = stakingMonth + 1; i < 12; i++) {
      // @ts-ignore
      let unclaimedBenefit: string = input[`monthlyBenefits__${i}`];
      if (!unclaimedBenefit) {
        unclaimedBenefit = '1';
      }

      claimedMonths.push(ethers.utils.parseEther(unclaimedBenefit).eq(0));
    }
    return {
      address,
      amount,
      stakingMonth,
      claimedMonths,
    };
  } catch (error) {
    console.log('Error in:', input);
    throw error;
  }
}
