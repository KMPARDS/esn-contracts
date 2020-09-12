import { Referral } from './Referral.test';
import { KycResolve } from './KycResolve.test';
import { Promotion } from './Promotion.test';
import { Distribution } from './Distribution.test';
import { SeatTransfer } from './SeatTransfer.test';
import { Withdraw } from './Withdraw.test';
import { Migration } from './Migration.test';

export const Dayswappers = () =>
  describe('Dayswappers', () => {
    Referral();
    KycResolve();
    Promotion();
    Distribution();
    Withdraw();
    SeatTransfer();
    Migration();
  });
