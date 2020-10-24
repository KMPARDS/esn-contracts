import { NewStaking } from './NewStaking.test';
import { TopupStaking } from './Topup.test';
import { PrepaidES } from './PrepaidES.test';
import { MonthlyBenefit } from './MonthlyBenefit.test';
import { IssTime } from './IssTime.test';
import { ExtendStaking } from './ExtendStaking.test';
import { SplitStaking } from './SplitStaking.test';
import { Delegate } from './Delegate.test';
import { MergeStaking } from './MergeStaking.test';
import { Migration } from './Migration.test';

export const TimeAlly = () => {
  describe('TimeAlly', () => {
    NewStaking();
    TopupStaking();
    PrepaidES();
    MonthlyBenefit();
    IssTime();
    ExtendStaking();
    SplitStaking();
    MergeStaking();
    Delegate();
    Migration();
  });
};
