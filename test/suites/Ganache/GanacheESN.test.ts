import assert from 'assert';
import { ethers } from 'ethers';

/// @dev initialising development blockchain
const getProvider = () => new ethers.providers.JsonRpcProvider('http://localhost:8545');

/// @dev this is a test case collection
export const GanacheESN = () =>
  describe('GanacheESN Setup', async () => {
    it('checks if ganache server is initiated', async () => {
      await new Promise(async (resolve, reject) => {
        while (true) {
          try {
            await global.providerESN.getNetwork();
            break;
          } catch (error) {
            console.log('\x1b[2m%s\x1b[0m', '      waiting for ganache to start...');
            global.providerESN = getProvider();
          }
          await new Promise((res) => setTimeout(res, 1000));
        }
        resolve();
      });
    });

    /// @dev this is a test case. You first fetch the present state, and compare it with an expectation. If it satisfies the expectation, then test case passes else an error is thrown.
    it('initiates ganache and generates a bunch of demo accounts', async () => {
      /// @dev for example in this test case we are fetching accounts array.
      global.accountsESN = await global.providerESN.listAccounts();

      /// @dev then we have our expection that accounts array should be at least having 1 accounts
      assert.ok(
        global.accountsESN.length >= 1,
        'atleast 1 accounts should be present in the array'
      );

      const balanceOfFirstAccount = await global.providerESN.getBalance(global.accountsESN[0]);
      assert.deepEqual(
        balanceOfFirstAccount,
        ethers.utils.parseEther('910' + '0'.repeat(7)),
        'should get 910 crore'
      );
    });
  });
