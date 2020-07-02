import assert from 'assert';
import { ethers } from 'ethers';

const BASE = '170000';
const PREMIUM_FACTOR = '170';

interface TestCase {
  input: string;
  adjustment: string;
}

const testCases: TestCase[] = [
  {
    input: '0',
    adjustment: '0',
  },
  {
    input: '170000',
    adjustment: '0',
  },
  {
    input: '85000',
    adjustment: '0',
  },
  {
    input: '340000',
    adjustment: '170',
  },
  {
    input: '255000',
    adjustment: '85',
  },
  {
    input: '510000',
    adjustment: '510',
  },
  {
    input: '425000',
    adjustment: '340',
  },
];

export const Adjustment = () =>
  describe('Adjustment', () => {
    testCases.forEach((testCase) => {
      it(`gives adjustment amount for ${testCase.input} as ${
        +testCase.input - +testCase.adjustment
      } ES`, async () => {
        const amount = ethers.utils.parseEther(testCase.input);

        const result = await global.validatorManagerESN.getAdjustedAmount(
          amount,
          ethers.utils.parseEther(BASE),
          ethers.utils.parseEther(PREMIUM_FACTOR)
        );

        assert.deepEqual(result, amount.sub(ethers.utils.parseEther(testCase.adjustment)));
      });
    });
  });

// for (let i = 0; i < 200; i++) {
//   const amount = ethers.utils.parseEther(String(i * 10 ** 4));

//   const result = await global.validatorManagerESN.getAdjustedAmount(
//     ethers.utils.parseEther(String(i * 10 ** 4)),
//     ethers.utils.parseEther(BASE),
//     ethers.utils.parseEther(PREMIUM_FACTOR)
//   );
//   console.log(ethers.utils.formatEther(amount), ethers.utils.formatEther(result));
// }
