import { ethers } from 'ethers';
import { GanacheServer } from './interfaces';

import { EraSwapToken } from '../build/typechain/ETH/EraSwapToken';
import { PlasmaManager } from '../build/typechain/ETH/PlasmaManager';
import { FundsManager as FundsManagerETH } from '../build/typechain/ETH/FundsManager';

import { ReversePlasma } from '../build/typechain/ESN/ReversePlasma';
import { FundsManager as FundsManagerESN } from '../build/typechain/ESN/FundsManager';
import { PrepaidEs } from '../build/typechain/ESN/PrepaidEs';

import { NrtManager } from '../build/typechain/ESN/NrtManager';
import { TimeAllyManager } from '../build/typechain/ESN/TimeAllyManager';
import { TimeAllyStaking } from '../build/typechain/ESN/TimeAllyStaking';

import { ValidatorSet } from '../build/typechain/ESN/ValidatorSet';
import { BlockReward } from '../build/typechain/ESN/BlockReward';
import { ValidatorManager } from '../build/typechain/ESN/ValidatorManager';
import { RandomnessManager } from '../build/typechain/ESN/RandomnessManager';

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
      esInstanceETH: EraSwapToken;
      plasmaManagerInstanceETH: PlasmaManager;
      fundsManagerInstanceETH: FundsManagerETH;
      reversePlasmaInstanceESN: ReversePlasma;
      fundsManagerInstanceESN: FundsManagerESN;
      nrtInstanceESN: NrtManager;
      timeallyInstanceESN: TimeAllyManager;
      timeallyStakingTargetInstanceESN: TimeAllyStaking;
      validatorSetESN: ValidatorSet;
      blockRewardESN: BlockReward;
      validatorManagerESN: ValidatorManager;
      randomnessMangerESN: RandomnessManager;
      prepaidEsInstanceESN: PrepaidEs;
    }

    interface ProcessEnv {
      DEBUG: boolean;
    }
  }
}
