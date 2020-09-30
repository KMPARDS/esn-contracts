import { CreateBet } from './CreateBet.test';
import { EnterBet } from './EnterBet.test';

export const BetDeEx = () =>
  describe('BetDeEx', () => {
    CreateBet();
    EnterBet();
  });
