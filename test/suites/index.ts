import { Ganache } from './Ganache';
import { Contracts } from './Contracts';
import { Plasma } from './Plasma';
import { NRT } from './NRT';
import { TimeAlly } from './TimeAlly';

export const Suites = () => {
  // test cases for checking ganache server started correctly
  Ganache();

  // Add your test hooks between before and after hooks
  Contracts();
  Plasma();
  NRT();
  TimeAlly();
};
