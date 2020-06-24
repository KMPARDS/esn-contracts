import { Deploy } from './Deploy.test';
import { SetInitialValues } from './SetInitialValues.test';
import { MoreSettings } from './MoreSettings.test';
import { DeployNext } from './DeployNext.test';

export const Contracts = () => {
  describe('Contracts', () => {
    Deploy();
    SetInitialValues();
    MoreSettings();
    DeployNext();
  });
};
