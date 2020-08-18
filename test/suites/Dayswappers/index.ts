import { Referral } from './Referral.test';
import { KycResolve } from './KycResolve.test';
import { Promotion } from './Promotion.test';
import { Distribution } from './Distribution.test';
import { SeatTransfer } from './SeatTransfer.test';

export const Dayswappers = () =>
  describe('Dayswappers', () => {
    Referral();
    KycResolve();
    Promotion();
    Distribution();
    SeatTransfer();
  });
