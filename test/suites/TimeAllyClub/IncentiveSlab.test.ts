import { parseEther } from 'ethers/lib/utils';
import { strictEqual } from 'assert';

const testCases: { volume: number; expectedLevel: string }[] = [
  {
    volume: 0,
    expectedLevel: 'Coral',
  },
  {
    volume: 34999,
    expectedLevel: 'Coral',
  },
  {
    volume: 35000,
    expectedLevel: 'Silver',
  },
  {
    volume: 49999,
    expectedLevel: 'Silver',
  },
  {
    volume: 50000,
    expectedLevel: 'Pearl',
  },
  {
    volume: 74999,
    expectedLevel: 'Pearl',
  },
  {
    volume: 75000,
    expectedLevel: 'Gold',
  },
  {
    volume: 99999,
    expectedLevel: 'Gold',
  },
  {
    volume: 100000,
    expectedLevel: 'Platinum',
  },
  {
    volume: 199999,
    expectedLevel: 'Platinum',
  },
  {
    volume: 200000,
    expectedLevel: 'Sapphire',
  },
  {
    volume: 299999,
    expectedLevel: 'Sapphire',
  },
  {
    volume: 300000,
    expectedLevel: 'Diamond',
  },
  {
    volume: 399999,
    expectedLevel: 'Diamond',
  },
  {
    volume: 400000,
    expectedLevel: 'Emerald',
  },
  {
    volume: 499999,
    expectedLevel: 'Emerald',
  },
  {
    volume: 500000,
    expectedLevel: 'Ruby',
  },
  {
    volume: 9000000,
    expectedLevel: 'Ruby',
  },
];

export const IncentiveSlab = () =>
  describe('Incentive Slab', () => {
    testCases.forEach((testCase) =>
      it(`checks if incentive slab for ${testCase.volume} is ${testCase.expectedLevel}`, async () => {
        const result = await global.timeallyClubInstanceESN.getIncentiveSlab(
          parseEther(String(testCase.volume)),
          global.timeallyInstanceESN.address
        );

        strictEqual(
          result.label,
          testCase.expectedLevel,
          `expected ${testCase.expectedLevel} but got ${result.label} for ${testCase.volume} ES`
        );
      })
    );
  });
