import { ethers } from 'ethers';
import assert from 'assert';
import { getTimeAllyStakings, parseReceipt, releaseNrt } from '../../utils';
import { TimeAllyStakingFactory } from '../../../build/typechain/ESN';
import { formatEther } from 'ethers/lib/utils';

interface DelegateTestCase {
  // amount: string;
  delegatorAccount: number;
  validatorAccount: number;
  monthsAfterCurrent: number[];
  doNewStakingOfAmount?: string;
  goToFuture?: boolean;
}

const delegateTestCases: DelegateTestCase[] = [
  {
    // amount: '200000',
    delegatorAccount: 0,
    validatorAccount: 0,
    monthsAfterCurrent: [1, 2],
    goToFuture: true,
  },
  // {
  //   amount: '300000',
  //   delegatorAccount: 0,
  //   validatorAccount: 1,
  //   monthsAfterCurrent: [1, 2],
  // },
  {
    // amount: '80',
    delegatorAccount: 1,
    validatorAccount: 1,
    monthsAfterCurrent: [1, 2],
    doNewStakingOfAmount: '5000000',
  },
];

export const Delegate = () =>
  describe('Delegate', () => {
    delegateTestCases.forEach((delegateTestCase, index) => {
      it(`delegetes using ESN's account${delegateTestCase.delegatorAccount + 1} to validator${
        delegateTestCase.validatorAccount + 1
      } on Validator Manager contract`, async () => {
        if (delegateTestCase.goToFuture) {
          await releaseNrt();
        }

        let stakingInstances = await getTimeAllyStakings(
          global.accountsESN[delegateTestCase.delegatorAccount]
        );

        // incase there is no staking deploy
        if (delegateTestCase.doNewStakingOfAmount) {
          await global.providerESN.getSigner(global.accountsESN[0]).sendTransaction({
            to: global.accountsESN[delegateTestCase.delegatorAccount],
            value: ethers.utils.parseEther(delegateTestCase.doNewStakingOfAmount),
          });

          const _timeallyInstanceESN = global.timeallyInstanceESN.connect(
            global.providerESN.getSigner(global.accountsESN[delegateTestCase.delegatorAccount])
          );

          const r = await parseReceipt(
            _timeallyInstanceESN.stake({
              value: ethers.utils.parseEther(delegateTestCase.doNewStakingOfAmount),
            })
          );
          const newStakingEvent = global.timeallyInstanceESN.interface.parseLog(r.logs[0]);
          const stakingContractAddress: string = newStakingEvent.args.staking;

          const stakingInstance = TimeAllyStakingFactory.connect(
            stakingContractAddress,
            global.providerESN.getSigner(global.accountsESN[1])
          );
          stakingInstances = [stakingInstance];
        }

        const stakingInstance = stakingInstances[0];

        const principal = await stakingInstance.nextMonthPrincipalAmount();
        const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
        const months = delegateTestCase.monthsAfterCurrent.map((month) => currentMonth.add(month));

        const validatorsBeforeAllMonths = await Promise.all(
          months.map((month) => global.validatorManagerESN.getValidators(month))
        );

        await parseReceipt(
          stakingInstance.delegate(
            global.validatorManagerESN.address,
            global.validatorWallets[delegateTestCase.validatorAccount].address,
            months
          )
        );

        for (const [index, month] of months.entries()) {
          const delegation = await stakingInstance.getDelegation(month);
          assert.strictEqual(
            delegation,
            global.validatorManagerESN.address,
            'platform address should be set properly'
          );
          // assert.strictEqual(
          //   lastDelegation.delegatee,
          //   global.validatorWallets[delegateTestCase.validatorAccount].address,
          //   'delegatee address should be set properly'
          // );
          // assert.deepEqual(
          //   lastDelegation.amount,
          //   amount,
          //   'platform address should be set properly'
          // );

          const validators = await global.validatorManagerESN.getValidators(month);
          assert.ok(validators.length > 0, 'there should be a validator staking');

          // console.log(
          //   month.toNumber(),
          //   require('util').inspect(
          //     validators.map((a) => ({
          //       validator: a.validator,
          //       amount: a.amount,
          //       adjustedAmount: a.adjustedAmount,
          //       delegators: a.delegators,
          //     })),
          //     false,
          //     null,
          //     true
          //   )
          // );

          const filteredValidators = validators.filter((validator) => {
            return (
              validator.wallet ===
              global.validatorWallets[delegateTestCase.validatorAccount].address
            );
          });
          assert.strictEqual(
            filteredValidators.length,
            1,
            'there should be only one validator staking for address'
          );

          const validator = filteredValidators[0];
          const validatorBefore = validatorsBeforeAllMonths[index].find((validator) => {
            return (
              validator.wallet ===
              global.validatorWallets[delegateTestCase.validatorAccount].address
            );
          });
          assert.strictEqual(
            validator.wallet,
            global.validatorWallets[delegateTestCase.validatorAccount].address,
            'validator address should be correct'
          );
          assert.deepEqual(
            validator.amount.sub(validatorBefore?.amount ?? 0),
            principal,
            'total delegated amount should be correct'
          );

          const filteredDG = validator.delegators.filter((delegator) => {
            return delegator.stakingContract === stakingInstance.address;
          });
          assert.strictEqual(filteredDG.length, 1, 'there should be on delegation');
          assert.strictEqual(
            formatEther(filteredDG[0].amount),
            formatEther(principal),
            'should have correct delegation amount'
          );

          const totalAdjustedAmount = await global.validatorManagerESN.getTotalAdjustedStakings(
            month
          );
          let sum = ethers.constants.Zero;
          for (const validator of validators) {
            sum = sum.add(validator.adjustedAmount);
          }
          assert.deepEqual(
            totalAdjustedAmount,
            sum,
            'total adjusted amount should be sum of all adjusted amounts of validators'
          );
        }
      });
    });

    it('tries to delegate the staking again expecting revert', async () => {
      const stakingInstances = await getTimeAllyStakings(global.accountsESN[0]);
      const stakingInstance = stakingInstances[0];

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();

      try {
        await parseReceipt(
          stakingInstance.delegate(
            global.validatorManagerESN.address,
            global.validatorWallets[0].address,
            [currentMonth.add(1)]
          )
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(
          msg.includes('TAStaking: Already delegated for the month'),
          `Invalid error message: ${msg}`
        );
      }
    });

    it('tries to delegate for past month expecting revert', async () => {
      await releaseNrt();

      const stakingInstances = await getTimeAllyStakings(global.accountsESN[0]);
      const stakingInstance = stakingInstances[0];

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();

      try {
        await parseReceipt(
          stakingInstance.delegate(
            global.validatorManagerESN.address,
            global.validatorWallets[0].address,
            [currentMonth.sub(1)]
          )
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(msg.includes('TAStaking: Only future months'), `Invalid error message: ${msg}`);
      }
    });

    // Test case for bug: https://github.com/KMPARDS/esn-contracts/issues/81
    // it('topups existing delegation should correctly increase value in ValidatorManager', async () => {
    //   const validatorAddress =
    //     global.validatorWallets[delegateTestCases[0].validatorAccount].address;

    //   const stakingInstance = (
    //     await getTimeAllyStakings(global.accountsESN[delegateTestCases[0].delegatorAccount])
    //   )[0];
    //   const nextMonth = (await global.nrtInstanceESN.currentNrtMonth()).add(1);
    //   const principalAmount = await stakingInstance.getPrincipalAmount(nextMonth);
    //   const delegations = await stakingInstance.getDelegations(nextMonth);
    //   const totalDelegations = delegations.reduce((accumulator: ethers.BigNumber, currentValue) => {
    //     return currentValue.amount.add(accumulator);
    //   }, ethers.BigNumber.from(0));

    //   const leftOverDelegatableAmount = principalAmount.sub(totalDelegations);

    //   const vsBefore = (await global.validatorManagerESN.getValidatorStakings(nextMonth)).find(
    //     (vs) => {
    //       return vs.validator === validatorAddress;
    //     }
    //   );
    //   if (!vsBefore) return assert(false, 'validator should be present');

    //   await parseReceipt(
    //     stakingInstance.delegate(global.validatorManagerESN.address, validatorAddress, [nextMonth])
    //   );

    //   const vsAfter = (await global.validatorManagerESN.getValidatorStakings(nextMonth)).find(
    //     (vs) => {
    //       return vs.validator === validatorAddress;
    //     }
    //   );
    //   if (!vsAfter) return assert(false, 'validator should be present');

    //   assert.strictEqual(
    //     ethers.utils.formatEther(vsAfter.amount.sub(vsBefore.amount)),
    //     ethers.utils.formatEther(leftOverDelegatableAmount),
    //     'increase in delegated amount should be correct'
    //   );
    // });
  });
