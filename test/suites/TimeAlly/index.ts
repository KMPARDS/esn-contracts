import { NewStaking } from './NewStaking.test';
import { TopupStaking } from './Topup.test';
import { PrepaidES } from './PrepaidES.test';
import { MonthlyBenefit } from './MonthlyBenefit.test';
import { Delegate } from './Delegate.test';

export const TimeAlly = () => {
  describe('TimeAlly', () => {
    NewStaking();
    TopupStaking();
    PrepaidES();
    MonthlyBenefit();
    Delegate();
  });
};
