import { Referral } from './Referral.test';
import { KycResolve } from './KycResolve.test';
import { Promotion } from './Promotion.test';

export const Dayswappers = () =>
  describe('Dayswappers', () => {
    Referral();
    KycResolve();
    Promotion();
  });
