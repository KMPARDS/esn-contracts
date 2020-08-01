import { BasicFunctionality } from './BasicFunctionality.test';
import { Ownership } from './Ownership.test';
import { Pauser } from './Pauser.test';

export const ERC20 = () => {
  describe('Era Swap ERC20 Token', () => {
    BasicFunctionality();
    Ownership();
    Pauser();
  });
};
