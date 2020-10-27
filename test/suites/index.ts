import { Ganache } from './Ganache';
import { Contracts } from './Contracts';
import { ERC20 } from './ERC20';
import { Plasma } from './Plasma';
import { NRT } from './NRT';
import { TimeAlly } from './TimeAlly';
import { Validator } from './Validator';
import { Dayswappers } from './Dayswappers';
import { TimeAllyClub } from './TimeAllyClub';
import { KycDapp } from './KycDapp';
import { BetDeEx } from './BetDeEx';
import { BuildSurvey } from './BuildSurvey';
import { RentingDappManager } from './RentingDappManager';

export const Suites = () => {
  // test cases for checking ganache server started correctly
  Ganache();

  // Add your test hooks between before and after hooks
  Contracts();
  ERC20();
  Plasma();
  NRT();
  TimeAlly();
  Validator();
  Dayswappers();
  KycDapp();
  TimeAllyClub();
  BetDeEx();
  BuildSurvey();
  RentingDappManager();
};
