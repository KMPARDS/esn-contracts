/*
Instructions to run this:

ts-node test-chain.ts
ts-node deploy-next.ts
ts-node deploy-stakings.ts

*/

import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { TimeAllyManagerFactory, NrtManagerFactory } from '../build/typechain/ESN';
import { formatEther } from 'ethers/lib/utils';
import { NonceManager } from '../kami/src/informer/to-esn/nonce-manager';
import { existing } from './contracts';

// const existing = {
//   nrtManager: '0xcA4d0578c5e07F0964C7E7ccc87E606A234625b8',
//   timeallyManager: '0x89309551Fb7AbaaB85867ACa60404CDA649751d4',
//   timeallyStakingTarget: '0x7F87f9830baB8A591E6f94fd1A47EE87560B0bB0',
//   validatorSet: '0xA3C6cf908EeeebF61da6e0e885687Cab557b5e3F',
//   validatorManager: '0x8418249278d74D46014683A8029Fd6fbC88482a1',
//   randomnessManager: '0xE14D14bd8D0E2c36f5E4D00106417d8cf1000e22',
//   blockRewardManager: '0x44F70d80642998F6ABc424ceAf1E706a479De8Ce',
//   prepaidEs: '0x2AA786Cd8544c50136e5097D5E19F6AE10E02543',
//   dayswappers: '0x22E0940C1AE5D31B9efBaf7D674F7D62895FBde8',
//   kycdapp: '0xF9FCb8678dB15A5507A5f5414D68aBB2f4568E27',
//   timeallyclub: '0xC4336494606203e3907539d5b462A5cb7853B3C6',

//   // local
//   // nrtManager: '0xAE519FC2Ba8e6fFE6473195c092bF1BAe986ff90',
//   // timeallyManager: '0x73b647cbA2FE75Ba05B8e12ef8F8D6327D6367bF',
//   // timeallyStakingTarget: '0x7d73424a8256C0b2BA245e5d5a3De8820E45F390',
//   // validatorSet: '0x08425D9Df219f93d5763c3e85204cb5B4cE33aAa',
//   // validatorManager: '0xA10A3B175F0f2641Cf41912b887F77D8ef34FAe8',
//   // randomnessManager: '0x6E05f58eEddA592f34DD9105b1827f252c509De0',
//   // blockRewardManager: '0x79EaFd0B5eC8D3f945E6BB2817ed90b046c0d0Af',
//   // prepaidEs: '0x2Ce636d6240f8955d085a896e12429f8B3c7db26',
// };

// const providerESN = new JsonRpcProvider('http://localhost:8545');
const providerESN = new JsonRpcProvider('https://node0.testnet.eraswap.network');

if (!process.argv[2]) {
  throw '\nNOTE: Please pass your private key as comand line argument';
}
const wallet = new ethers.Wallet(process.argv[2], providerESN);

if (!existing.nrtManager) {
  throw new Error('nrtManager does not exist');
}

if (!existing.timeallyManager) {
  throw new Error('timeallyManager does not exist');
}

const nrtManagerInstance = NrtManagerFactory.connect(existing.nrtManager, wallet);
const timeallyManagerInstance = TimeAllyManagerFactory.connect(existing.timeallyManager, wallet);

(async () => {
  const excel: { stakings: StakingRow[] } = require('./stakings.json');
  console.log('Current Block Number', await providerESN.getBlockNumber());
  console.log('NRT Month', await nrtManagerInstance.currentNrtMonth());
  console.log('Staking Default Months', (await timeallyManagerInstance.defaultMonths()).toNumber());

  // sorting the stakings based on stakingMonth
  excel.stakings = excel.stakings.sort((a, b) => {
    return (a.stakingMonth ? +a.stakingMonth : 12) > (b.stakingMonth ? +b.stakingMonth : 12)
      ? 1
      : -1;
  });

  let nrtMonth = await nrtManagerInstance.currentNrtMonth();
  let nonce: number = await wallet.getTransactionCount();

  let continueFlag = true;

  console.log('started', { nonce });

  for (const [index, stakingRow] of excel.stakings.entries()) {
    const { address, amount, stakingMonth, claimedMonths } = parseStakingRow(stakingRow);

    // for some reason 11th NRT reverts, that's why it gets stuck at below staking
    // if (
    //   address === '0x5886A9B3a7f85637c13910aC11f7C72D0D7077f2' &&
    //   formatEther(amount) === '720.9659473'
    // ) {
    //   continueFlag = false;
    //   continue;
    // }
    // if (continueFlag) {
    //   console.log(index, address, stakingMonth, formatEther(amount), 'skipped');
    //   continue;
    // }

    // if stakingMonth has incremented then release the NRT until it reaches staking month
    while (nrtMonth < stakingMonth) {
      try {
        const tx = await nrtManagerInstance.releaseMonthlyNRT({
          nonce,
        });
        nonce++;
        await tx.wait();
        nrtMonth++;
        const newNrtMonth = await nrtManagerInstance.currentNrtMonth();
        console.log('\n', 'NRT released', newNrtMonth, { nonce }, '\n');
        // console.log('\n', 'NRT released', nrtMonth, '\n');
      } catch (error) {
        console.log(error.message);
      }
    }

    while (1) {
      try {
        const tx = await timeallyManagerInstance.sendStake(address, 0, claimedMonths, {
          value: amount,
          nonce,
          gasLimit: 1000000,
          gasPrice: 0,
        });
        nonce++;
        break;
      } catch (error) {
        console.log(error.message);
      }
    }
    // receiptPromises.push((async () =>)());

    console.log(index, address, stakingMonth, formatEther(amount), { nonce });
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
