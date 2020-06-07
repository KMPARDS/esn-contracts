import { ethers } from 'ethers';

export const ValidatorWallets = () =>
  describe('Validator Wallets for commonly working on ETH and ESN', () => {
    const WALLETS_COUNT = 10;
    if (!global.validatorWallets) global.validatorWallets = [];

    for (let i = 0; i < WALLETS_COUNT; i++)
      it(`generates validator ${i}`, () => {
        global.validatorWallets.push(ethers.Wallet.createRandom());
      });
  });
