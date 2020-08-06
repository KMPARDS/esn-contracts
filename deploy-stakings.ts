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
import { NonceManager } from './kami/src/informer/to-esn/nonce-manager';

const existing = {
  nrtManager: '0x332c509103798b58E9f70C133493013Edf1A21aA',
  timeallyManager: '0x3A7814a61A5907E8cb66D970ab8590b424b75a9d',
  timeallyStakingTarget: '0x2D3B6A1e62B1F5c1a373810be03D562FE876fa3E',
  validatorSet: '0x51F3af8f51952578c31A75aD718599eE9F8Fd688',
  validatorManager: '0xcbA64449f6D2294447DF29827Bc2EA13ba46fC07',
  randomnessManager: '0xF9FCb8678dB15A5507A5f5414D68aBB2f4568E27',
  blockRewardManager: '0xC4336494606203e3907539d5b462A5cb7853B3C6',
  prepaidEs: '0x6D57FaDF31e62E28Ab059f3dCd565df055428c57',

  // local
  // nrtManager: '0xAE519FC2Ba8e6fFE6473195c092bF1BAe986ff90',
  // timeallyManager: '0x73b647cbA2FE75Ba05B8e12ef8F8D6327D6367bF',
  // timeallyStakingTarget: '0x7d73424a8256C0b2BA245e5d5a3De8820E45F390',
  // validatorSet: '0x08425D9Df219f93d5763c3e85204cb5B4cE33aAa',
  // validatorManager: '0xA10A3B175F0f2641Cf41912b887F77D8ef34FAe8',
  // randomnessManager: '0x6E05f58eEddA592f34DD9105b1827f252c509De0',
  // blockRewardManager: '0x79EaFd0B5eC8D3f945E6BB2817ed90b046c0d0Af',
  // prepaidEs: '0x2Ce636d6240f8955d085a896e12429f8B3c7db26',
};

// const providerESN = new JsonRpcProvider('http://localhost:8545');
const providerESN = new JsonRpcProvider('https://node0.testnet.eraswap.network');

if (!process.argv[2]) {
  throw '\nNOTE: Please pass your private key as comand line argument';
}
const wallet = new ethers.Wallet(process.argv[2], providerESN);

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

  let nrtMonth = (await nrtManagerInstance.currentNrtMonth()).toNumber();
  let nonce: number = await wallet.getTransactionCount();

  let continueFlag = true;

  for (const [index, stakingRow] of excel.stakings.entries()) {
    const { address, amount, stakingMonth, claimedMonths } = parseStakingRow(stakingRow);

    // if (
    //   address === '0x2Cbf3Adb40C302f7689e9C1E3213227074F0441C' &&
    //   formatEther(amount) === '130.0'
    // ) {
    //   continueFlag = false;
    // }
    // if (continueFlag) continue;

    // if stakingMonth has incremented then release the NRT until it reaches staking month
    while (nrtMonth < stakingMonth) {
      nrtMonth++;
      const tx = await nrtManagerInstance.releaseMonthlyNRT({
        nonce: nonce++,
      });
      await tx.wait();
      // const newNrtMonth = await nrtManagerInstance.currentNrtMonth();
      // console.log('\n', 'NRT released', newNrtMonth.toNumber(), '\n');
      console.log('\n', 'NRT released', nrtMonth, '\n');
    }

    while (1) {
      try {
        const tx = await timeallyManagerInstance.sendStake(address, 0, claimedMonths, {
          value: amount,
          nonce: nonce++,
          gasLimit: 1000000,
          gasPrice: 0,
        });
        break;
      } catch (error) {}
    }
    // receiptPromises.push((async () =>)());

    console.log(address, stakingMonth, formatEther(amount));
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
