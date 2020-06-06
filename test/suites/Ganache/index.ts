import { GanacheETH } from './GanacheETH.test';
import { GanacheESN } from './GanacheESN.test';

export const Ganache = () => {
  describe('Ganache', () => {
    GanacheETH();
    GanacheESN();
  });
};
