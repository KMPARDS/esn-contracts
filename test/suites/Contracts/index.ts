import { ESContract } from './ERC20.test';
import { PlasmaManagerContract } from './PlasmaManager.test';
import { ReversePlasmaContract } from './ReversePlasma.test';

export const Contracts = () => {
  describe('Contracts', () => {
    ESContract();
    PlasmaManagerContract();
    ReversePlasmaContract(); // requires ESContract address
  });
};
