import { Adjustment } from './Adjustment.test';
import { Randomness } from './Randomness.test';
import { ProofOfStake } from './ProofOfStake.test';
import { ValidatorSet } from './ValidatorSet.test';

export const Validator = () => {
  describe('Validator', () => {
    Adjustment();
    Randomness();
    ProofOfStake();
    ValidatorSet();
  });
};
