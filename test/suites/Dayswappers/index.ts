import { Referral } from './Referral.test';
import { KycResolve } from './KycResolve.test';

export const Dayswappers = () =>
  describe('Dayswappers', () => {
    Referral();
    KycResolve();
  });
