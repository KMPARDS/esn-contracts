import { Deploy } from './Deploy.test';
import { SetInitialValues } from './SetInitialValues.test';
import { MoreSettings } from './MoreSettings.test';

export const Contracts = () => {
  describe('Contracts', () => {
    Deploy();
    SetInitialValues();
    MoreSettings();
  });
};
