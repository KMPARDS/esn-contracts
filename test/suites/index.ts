import { Ganache } from './Ganache';
import { Contracts } from './Contracts';

export const Suites = () => {
  // test cases for checking ganache server started correctly
  Ganache();

  // Add your test hooks between before and after hooks
  Contracts();
};
