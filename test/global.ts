import { ethers } from 'ethers';
import { GanacheServer } from './interfaces';

import { Erc20 } from '../build/typechain/ETH/Erc20';
import { PlasmaManager } from '../build/typechain/ETH/PlasmaManager';
import { FundsManager as FundsManagerETH } from '../build/typechain/ETH/FundsManager';

import { ReversePlasma } from '../build/typechain/ESN/ReversePlasma';
import { FundsManager as FundsManagerESN } from '../build/typechain/ESN/FundsManager';

import { NrtManager } from '../build/typechain/ESN/NrtManager';
import { TimeAllyManager } from '../build/typechain/ESN/TimeAllyManager';

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
      nrtInstanceESN: NrtManager;
      timeallyInstanceESN: TimeAllyManager;
    }

    interface ProcessEnv {
      DEBUG: boolean;
    }
  }
}
