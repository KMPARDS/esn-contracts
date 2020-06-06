import { ESContract } from './ERC20.test';
import { PlasmaManagerContract } from './PlasmaManager.test';

export const Contracts = () => {
  describe('Contracts', () => {
    ESContract();
    PlasmaManagerContract();
  });
};
