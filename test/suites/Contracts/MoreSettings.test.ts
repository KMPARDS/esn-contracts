import assert from 'assert';
import { ethers } from 'ethers';

const BUCKET_AMOUNT = ethers.utils.parseEther('50');

export const MoreSettings = () =>
  describe('Setting enviornment', () => {
    it('creates 10 blocks with 3 tx each for generating merkle root in later tests', async () => {
      const signer = global.providerESN.getSigner(0);

      for (let i = 0; i < 10; i++) {
        await global.providerESN.send('miner_stop', []);
        for (let j = 0; j < 3; j++) {
          await signer.sendTransaction({
            to: ethers.constants.AddressZero,
            value: ethers.BigNumber.from(0),
          });
        }
        await global.providerESN.send('miner_start', []);
      }
    });
  });
