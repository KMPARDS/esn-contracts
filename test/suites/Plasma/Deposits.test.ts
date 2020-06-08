import { ethers } from 'ethers';

export const Deposits = () =>
  describe('Deposits (from ETH to ESN)', () => {
    it('making a deposit and getting blocks posted', async () => {
      // transfer ES ERC20 into a fund manager contract on ETH
      await global.esInstanceETH.transfer(
        global.fundsManagerInstanceETH.address,
        ethers.utils.parseEther('10')
      );

      // get the block submitted into ReversePlasma

      // generate a merkle proof

      // submit it to the fund manager contract on ESN to get funds credited
    });
  });
