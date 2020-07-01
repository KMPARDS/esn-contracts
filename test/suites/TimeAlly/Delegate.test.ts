import { ethers } from 'ethers';
import assert from 'assert';
import { getTimeAllyStakings, parseReceipt, releaseNrt } from '../../utils';
import { TimeAllyStakingFactory } from '../../../build/typechain/ESN';

interface DelegateTestCase {
  amount: string;
  delegatorAccount: number;
  validatorAccount: number;
  monthsAfterCurrent: number[];
  doNewStakingOfAmount?: string;
  goToFuture?: boolean;
}

const delegateTestCases: DelegateTestCase[] = [
  {
    amount: '50',
    delegatorAccount: 0,
    validatorAccount: 0,
    monthsAfterCurrent: [0, 1, 2],
    goToFuture: true,
  },
  {
    amount: '60',
    delegatorAccount: 0,
    validatorAccount: 1,
    monthsAfterCurrent: [1, 2],
  },
  {
    amount: '80',
    delegatorAccount: 1,
    validatorAccount: 0,
    monthsAfterCurrent: [1, 2],
    doNewStakingOfAmount: '100',
  },
];

export const Delegate = () =>
  describe('Delegate', () => {
    delegateTestCases.forEach((delegateTestCase, index) => {
      it(`delegetes ${delegateTestCase.amount} ES using ESN's account${
        delegateTestCase.delegatorAccount + 1
      } to validator${
        delegateTestCase.validatorAccount + 1
      } on Validator Manager contract`, async () => {
        if (delegateTestCase.goToFuture) {
          await releaseNrt();
        }

        const amount = ethers.utils.parseEther(delegateTestCase.amount);

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
            _timeallyInstanceESN.stake(0, {
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

        const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
        const months = delegateTestCase.monthsAfterCurrent.map((month) => currentMonth.add(month));

        const validatorStakingsBeforeAllMonths = await Promise.all(
          months.map((month) => global.validatorManagerESN.getValidatorStakings(month))
        );

        await parseReceipt(
          stakingInstance.delegate(
            global.validatorManagerESN.address,
            global.validatorWallets[delegateTestCase.validatorAccount].address,
            amount,
            months
          )
        );

        for (const [index, month] of months.entries()) {
          const delegations = await stakingInstance.getDelegations(month);
          assert.ok(delegations.length > 0, 'there should be a delegation');

          const lastDelegation = delegations[delegations.length - 1];
          assert.strictEqual(
            lastDelegation.platform,
            global.validatorManagerESN.address,
            'platform address should be set properly'
          );
          assert.strictEqual(
            lastDelegation.delegatee,
            global.validatorWallets[delegateTestCase.validatorAccount].address,
            'delegatee address should be set properly'
          );
          assert.deepEqual(
            lastDelegation.amount,
            amount,
            'platform address should be set properly'
          );

          const validatorStakings = await global.validatorManagerESN.getValidatorStakings(month);
          assert.ok(validatorStakings.length > 0, 'there should be a validator staking');

          // console.log(
          //   month.toNumber(),
          //   require('util').inspect(
          //     validatorStakings.map((a) => ({
          //       validator: a.validator,
          //       amount: a.amount,
          //       delegators: a.delegators,
          //     })),
          //     false,
          //     null,
          //     true
          //   )
          // );

          const filteredVS = validatorStakings.filter((validatorStaking) => {
            return (
              validatorStaking.validator ===
              global.validatorWallets[delegateTestCase.validatorAccount].address
            );
          });
          assert.strictEqual(
            filteredVS.length,
            1,
            'there should be only one validator staking for address'
          );

          const validatorStaking = filteredVS[0];
          const validatorStakingBefore = validatorStakingsBeforeAllMonths[index].find(
            (validatorStaking) => {
              return (
                validatorStaking.validator ===
                global.validatorWallets[delegateTestCase.validatorAccount].address
              );
            }
          );
          assert.strictEqual(
            validatorStaking.validator,
            global.validatorWallets[delegateTestCase.validatorAccount].address,
            'validator address should be correct'
          );
          assert.deepEqual(
            validatorStaking.amount.sub(validatorStakingBefore?.amount ?? 0),
            ethers.utils.parseEther(delegateTestCase.amount),
            'total delegated amount should be correct'
          );

          const filteredDG = validatorStaking.delegators.filter((delegator) => {
            return delegator.stakingContract === stakingInstance.address;
          });
          assert.strictEqual(filteredDG.length, 1, 'there should be on delegation');
          assert.strictEqual(
            filteredDG[0].delegationIndex.toNumber(),
            delegations.length - 1,
            'should have correct delegation index'
          );
        }
      });
    });

    it('tries to delegate more than remaining limit expecting revert', async () => {
      const stakingInstances = await getTimeAllyStakings(global.accountsESN[0]);
      const stakingInstance = stakingInstances[0];

      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();

      try {
        await parseReceipt(
          stakingInstance.delegate(
            global.validatorManagerESN.address,
            global.validatorWallets[0].address,
            await stakingInstance.getPrincipalAmount(currentMonth.add(1)),
            [currentMonth.add(1)]
          )
        );

        assert(false, 'should have thrown error');
      } catch (error) {
        const msg = error.error?.message || error.message;

        assert.ok(msg.includes('TAStaking: delegate overflow'), `Invalid error message: ${msg}`);
      }
    });
  });
