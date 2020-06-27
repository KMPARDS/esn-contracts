import { NewStaking } from './NewStaking.test';
import { TopupStaking } from './Topup.test';

export const TimeAlly = () => {
  describe('TimeAlly', () => {
    NewStaking();
    TopupStaking();
  });
};
