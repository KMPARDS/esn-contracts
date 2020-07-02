import { Adjustment } from './Adjustment.test';
import { Randomness } from './Randomness.test';

export const Validator = () => {
  describe('Validator', () => {
    Adjustment();
    Randomness();
  });
};
