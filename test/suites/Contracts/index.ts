import { ESContract } from './ERC20.test';
import { FundsManagerContractETH } from './FundsManagerETH.test';
import { PlasmaManagerContract } from './PlasmaManager.test';
import { ReversePlasmaContract } from './ReversePlasma.test';

export const Contracts = () => {
  describe('Contracts', () => {
    ESContract();
    FundsManagerContractETH(); // requires ESContract address
    PlasmaManagerContract(); // requires ESContract address
    ReversePlasmaContract(); // requires ESContract address
  });
};
