import { ethers } from 'ethers';

export const ValidatorWallets = () =>
  describe('Validator Wallets for commonly working on ETH and ESN', () => {
    const WALLETS_COUNT = 10;
    if (!global.validatorWallets) global.validatorWallets = [];

    it(`generates ${WALLETS_COUNT} validator wallets`, () => {
      for (let i = 0; i < WALLETS_COUNT; i++)
        global.validatorWallets.push(ethers.Wallet.createRandom());
    });
  });
