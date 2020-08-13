import { Referral } from './Referral.test';
import { KycResolve } from './KycResolve.test';
import { Promotion } from './Promotion.test';
import { Distribution } from './Distribution.test';

export const Dayswappers = () =>
  describe('Dayswappers', () => {
    Referral();
    KycResolve();
    Promotion();
    Distribution();
  });
