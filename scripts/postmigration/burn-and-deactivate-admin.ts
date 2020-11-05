import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import {
  TimeAllyManagerFactory,
  NrtManagerFactory,
  DayswappersWithMigrationFactory,
} from '../../build/typechain/ESN';
import { formatEther, parseEther } from 'ethers/lib/utils';
import { existing, providerESN, walletESN } from '../commons';

if (!existing.nrtManager) {
  throw new Error('nrtManager does not exist');
}
if (!existing.timeallyManager) {
  throw new Error('timeallyManager does not exist');
}
if (!existing.dayswappers) {
  throw new Error('dayswappers does not exist');
}

const nrtManagerInstance = NrtManagerFactory.connect(existing.nrtManager, walletESN);
const timeallyManagerInstance = TimeAllyManagerFactory.connect(existing.timeallyManager, walletESN);
const dayswappersInstance = DayswappersWithMigrationFactory.connect(
  existing.dayswappers,
  walletESN
);

const TA_CLAIM_AMOUNT = parseEther('78202378.89962694');

(async () => {
  {
    console.log('\nWithdrawing tokens from Timeally and deactivating mode...');
    try {
      const tx = await timeallyManagerInstance.withdrawClaimedNrt(TA_CLAIM_AMOUNT);
      await tx.wait();
      console.log('Tx:', tx.hash);
    } catch (error) {
      console.log(error);
    }
  }
  // await nrtManagerInstance.releaseMonthlyNRT();
  // dayswappers
  // {
  //   console.log('\nDayswappers deactivating mode...');
  //   const tx = await dayswappersInstance.re;
  // }
  // nrt contract
})();
