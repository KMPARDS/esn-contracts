import { NewStaking } from './NewStaking.test';
import { TopupStaking } from './Topup.test';
import { Delegate } from './Delegate.test';
import { MonthlyBenefit } from './MonthlyBenefit.test';

export const TimeAlly = () => {
  describe('TimeAlly', () => {
    NewStaking();
    TopupStaking();
    MonthlyBenefit();
    Delegate();
  });
};
