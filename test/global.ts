import { ethers } from 'ethers';
import ganache from 'ganache-core';

import { EraSwapToken } from '../build/typechain/ETH/EraSwapToken';
import { PlasmaManager } from '../build/typechain/ETH/PlasmaManager';
import { FundsManagerEth } from '../build/typechain/ETH/FundsManagerEth';

import { ReversePlasma } from '../build/typechain/ESN/ReversePlasma';
import { FundsManagerEsn } from '../build/typechain/ESN/FundsManagerEsn';
import { PrepaidEs } from '../build/typechain/ESN/PrepaidEs';

import { NrtManager } from '../build/typechain/ESN/NrtManager';
import { TimeAllyManager } from '../build/typechain/ESN/TimeAllyManager';
import { TimeAllyStaking } from '../build/typechain/ESN/TimeAllyStaking';
import { TimeAllyClub } from '../build/typechain/ESN/TimeAllyClub';
import { TimeAllyPromotionalBucket } from '../build/typechain/ESN/TimeAllyPromotionalBucket';

import { ValidatorSet } from '../build/typechain/ESN/ValidatorSet';
import { BlockReward } from '../build/typechain/ESN/BlockReward';
import { ValidatorManager } from '../build/typechain/ESN/ValidatorManager';
import { RandomnessManager } from '../build/typechain/ESN/RandomnessManager';

import { DayswappersWithMigration } from '../build/typechain/ESN/DayswappersWithMigration';
import { KycDapp } from '../build/typechain/ESN/KycDapp';

import { BetDeEx } from '../build/typechain/ESN/BetDeEx';
import { Bet } from '../build/typechain/ESN/Bet';
import { BuildSurvey } from '../build/typechain/ESN/BuildSurvey';
import { RentingDappManager } from '../build/typechain/ESN/RentingDappManager';

import { ProxyAdmin } from '../build/typechain/@openzeppelin';

import './types/eth-proof';

// @dev suffix "ETH" or "ESN" refers to the value context of which blockchain it refers to.

declare global {
  namespace NodeJS {
    interface Global {
      serverETH: ganache.Server;
      serverESN: ganache.Server;
      providerETH: ethers.providers.JsonRpcProvider;
      accountsETH: string[];
      providerESN: ethers.providers.JsonRpcProvider;
      accountsESN: string[];
      validatorWallets: ethers.Wallet[];

      esInstanceETH: EraSwapToken;
      plasmaManagerInstanceETH: PlasmaManager;
      fundsManagerInstanceETH: FundsManagerEth;
      reversePlasmaInstanceESN: ReversePlasma;
      fundsManagerInstanceESN: FundsManagerEsn;

      proxyAdminInstanceESN: ProxyAdmin;

      nrtInstanceESN: NrtManager;
      timeallyInstanceESN: TimeAllyManager;
      timeallyStakingTargetInstanceESN: TimeAllyStaking;
      timeallyClubInstanceESN: TimeAllyClub;
      timeallyPromotionalBucketESN: TimeAllyPromotionalBucket;
      prepaidEsInstanceESN: PrepaidEs;

      validatorSetESN: ValidatorSet;
      blockRewardESN: BlockReward;
      validatorManagerESN: ValidatorManager;
      randomnessMangerESN: RandomnessManager;

      dayswappersInstanceESN: DayswappersWithMigration;
      kycDappInstanceESN: KycDapp;

      betdeexInstanceESN: BetDeEx;
      betImplementaionInstanceESN: Bet;
      buildSurveyInstanceESN: BuildSurvey;
      rentingDappManagerInstanceESN: RentingDappManager;
    }

    interface ProcessEnv {
      DEBUG: boolean;
    }
  }
}
