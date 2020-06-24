import { Deploy } from './Deploy.test';
import { SetInitialValues } from './SetInitialValues.test';
import { SetInitialValuesNext } from './SetInitialValuesNext.test';
import { DeployNext } from './DeployNext.test';

export const Contracts = () => {
  describe('Contracts', () => {
    Deploy();
    SetInitialValues();
    DeployNext();
    SetInitialValuesNext();
  });
};
