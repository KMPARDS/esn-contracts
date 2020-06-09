import { ethers } from 'ethers';
import { GanacheServer } from './interfaces';
import { Erc20, PlasmaManager, FundsManager as FundsManagerETH } from './interfaces/ETH';
import { ReversePlasma, FundsManager as FundsManagerESN } from './interfaces/ESN';
import './types/eth-proof';

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
      validatorWallets: ethers.Wallet[];
      esInstanceETH: Erc20;
      plasmaManagerInstanceETH: PlasmaManager;
      fundsManagerInstanceETH: FundsManagerETH;
      reversePlasmaInstanceESN: ReversePlasma;
      fundsManagerInstanceESN: FundsManagerESN;
    }
  }
}
