import { ethers } from 'ethers';
import { GanacheServer } from './interfaces';

import { Erc20 } from './interfaces/ETH/Erc20';
import { PlasmaManager } from './interfaces/ETH/PlasmaManager';
import { FundsManager as FundsManagerETH } from './interfaces/ETH/FundsManager';

import { ReversePlasma } from './interfaces/ESN/ReversePlasma';
import { FundsManager as FundsManagerESN } from './interfaces/ESN/FundsManager';

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

    interface ProcessEnv {
      DEBUG: boolean;
    }
  }
}
