import { BunchPosting } from './BunchPosting.test';
import { ReversePosting } from './ReversePosting.test';
import { Deposits } from './Deposits.test';
import { Withdrawals } from './Withdrawals.test';

export const Plasma = () => {
  describe('Plasma', () => {
    BunchPosting();
    ReversePosting();
    Deposits();
    Withdrawals();
  });
};
