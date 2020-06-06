import { ethers } from 'ethers';
import { GanacheServer } from './interface';

// @dev suffix "ETH" or "ESN" refers to the value context of which blockchain it refers to.

declare global {
  namespace NodeJS {
    interface Global {
      serverETH: GanacheServer;
      serverESN: GanacheServer;
      providerETH: ethers.providers.JsonRpcProvider;
      accountsETH: string[];
      providerESN: ethers.providers.JsonRpcProvider;
      accountsESN: string[];
      esInstanceETH: ethers.Contract;
      plasmaManagerInstanceETH: ethers.Contract;
      validatorWallets: ethers.Wallet[];
    }
  }
}
