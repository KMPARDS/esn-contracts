import { ethers } from 'ethers';
import { parseReceipt } from '../../utils';
import { strictEqual } from 'assert';

const testCases: { treeReferrals: number; resultBeltId: number }[] = [
  {
    treeReferrals: 0,
    resultBeltId: 0,
  },
  {
    treeReferrals: 4,
    resultBeltId: 0,
  },
  {
    treeReferrals: 5,
    resultBeltId: 1,
  },
  {
    treeReferrals: 19,
    resultBeltId: 1,
  },
  {
    treeReferrals: 20,
    resultBeltId: 2,
  },
  {
    treeReferrals: 99,
    resultBeltId: 2,
  },
  {
    treeReferrals: 100,
    resultBeltId: 3,
  },
  {
    treeReferrals: 499,
    resultBeltId: 3,
  },
  {
    treeReferrals: 500,
    resultBeltId: 4,
  },
  {
    treeReferrals: 1999,
    resultBeltId: 4,
  },
  {
    treeReferrals: 2000,
    resultBeltId: 5,
  },
  {
    treeReferrals: 5999,
    resultBeltId: 5,
  },
  {
    treeReferrals: 6000,
    resultBeltId: 6,
  },
  {
    treeReferrals: 9999,
    resultBeltId: 6,
  },
  {
    treeReferrals: 10000,
    resultBeltId: 7,
  },
];

const beltNames = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Red', 'Brown', 'Black'];

export const Promotion = () =>
  describe('Promotion', () => {
    it('gets promoted to yellow belt (after about 10 kyc referrals)', async () => {
      // const carry_fwd_wallet = new ethers.Wallet('0x' + '3'.repeat(64)).connect(global.providerESN);
      const currentMonth = (await global.nrtInstanceESN.currentNrtMonth()).toNumber();

      {
        const seat = await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[0]);
        strictEqual(seat.beltId, 0, 'should be white belt initially');
      }
      await parseReceipt(
        global.dayswappersInstanceESN
          .connect(global.providerESN.getSigner(0))
          .promoteSelf(currentMonth)
      );
      {
        const seat = await global.dayswappersInstanceESN.getSeatByAddress(global.accountsESN[0]);
        strictEqual(seat.beltId, 1, 'should be promoted to yellow belt');
      }
    });

    testCases.forEach((testCase) => {
      it(`checks ${testCase.treeReferrals} referrals in a month gives ${
        beltNames[testCase.resultBeltId]
      } belt`, async () => {
        const result = await global.dayswappersInstanceESN.getBeltIdFromTreeReferrals(
          testCase.treeReferrals
        );
        strictEqual(
          result,
          testCase.resultBeltId,
          `${testCase.treeReferrals} should give ${testCase.resultBeltId}`
        );
      });
    });
  });
