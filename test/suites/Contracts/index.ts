import { ESContract } from './ERC20.test';
import { PlasmaManagerContract } from './PlasmaManager.test';
import { FundsManagerContractETH } from './FundsManagerETH.test';
import { ReversePlasmaContract } from './ReversePlasma.test';
import { FundsManagerContractESN } from './FundsManagerESN.test';

export const Contracts = () => {
  describe('Contracts', () => {
    ESContract();
    PlasmaManagerContract(); // requires ESContract address
    FundsManagerContractETH(); // requires ESContract address and PlasmaManagerContract
    ReversePlasmaContract(); // requires ESContract address
    FundsManagerContractESN(); // requires ESContract address and ReversePlasmaContract
  });
};
