import { GanacheETH } from './GanacheETH.test';
import { GanacheESN } from './GanacheESN.test';
import { ValidatorWallets } from './ValidatorWallets.test';

export const Ganache = () => {
  describe('Ganache', () => {
    GanacheETH();
    GanacheESN();
    ValidatorWallets();
  });
};
