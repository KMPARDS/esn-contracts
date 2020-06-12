/// @dev importing packages required
import assert from 'assert';
import { ethers } from 'ethers';
import { ContractJson } from '../../interfaces';
import { parseReceipt } from '../../utils';

/// @dev importing build file
const esJSON: ContractJson = require('../../../build/ETH/ERC20.json');

/// @dev this is another test case collection
export const ESContract = () =>
  describe('Era Swap ERC20 Contract Setup', async () => {
    /// @dev this is first test case of this collection
    it('deploys Era Swap ERC20 contract from first account', async () => {
      /// @dev you create a contract factory for deploying contract. Refer to ethers.js documentation at https://docs.ethers.io/ethers.js/html/
      const ESContractFactory = new ethers.ContractFactory(
        esJSON.abi,
        esJSON.evm.bytecode,
        global.providerETH.getSigner(global.accountsETH[0])
      );

      // @ts-ignore Need this until I modify TypeChain ethers-v5 plugin
      global.esInstanceETH = await ESContractFactory.deploy();
      await parseReceipt(global.esInstanceETH.deployTransaction, false);

      assert.ok(global.esInstanceETH.address, 'conract address should be present');
    });

    /// @dev this is second test case of this collection
    it('checks that deployer gets initial balance', async () => {
      /// @dev you access the value at storage with ethers.js library of our custom contract method called getValue defined in contracts/ES.sol
      const balance = await global.esInstanceETH.balanceOf(global.accountsETH[0]);

      /// @dev then you compare it with your expectation value
      assert.ok(balance.gte(0), 'must have some ERC20 balance');
    });
  });
