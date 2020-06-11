/// @dev importing packages required
import assert from 'assert';
import { ethers, Contract } from 'ethers';
import { ContractJson } from '../../interfaces';
import { parseReceipt } from '../../utils';

/// @dev importing build file
const plasmaManagerJSON: ContractJson = require('../../../build/ETH/PlasmaManager.json');

/// @dev this is another test case collection
export const PlasmaManagerContract = () =>
  describe('Plasma Manager Contract Setup', async () => {
    /// @dev this is first test case of this collection
    it('deploys Plasma Manager contract from first account with initial validators and ERC20 contract address', async () => {
      /// @dev you create a contract factory for deploying contract. Refer to ethers.js documentation at https://docs.ethers.io/ethers.js/html/
      const PlasmaManagerContractFactory = new ethers.ContractFactory(
        plasmaManagerJSON.abi,
        plasmaManagerJSON.evm.bytecode,
        global.providerETH.getSigner(global.accountsETH[0])
      );

      // @ts-ignore
      global.plasmaManagerInstanceETH = await PlasmaManagerContractFactory.deploy(
        global.validatorWallets.map((w) => w.address),
        global.esInstanceETH.address
      );
      await parseReceipt(global.plasmaManagerInstanceETH.deployTransaction, false);

      assert.ok(global.plasmaManagerInstanceETH.address, 'conract address should be present');
    });

    /// @dev this is second test case of this collection
    it('checks validators set while deploying', async () => {
      /// @dev you access the value at storage with ethers.js library of our custom contract method called getValue defined in contracts/PlasmaManager.sol
      const currentValidators = await global.plasmaManagerInstanceETH.getAllValidators();

      /// @dev then you compare it with your expectation value
      assert.deepEqual(
        currentValidators,
        global.validatorWallets.map((w) => w.address),
        'validators set while deploying must be visible when get'
      );
    });

    it('checks token contract set while deploying', async () => {
      const tokenAddress = await global.plasmaManagerInstanceETH.token();

      assert.equal(
        global.esInstanceETH.address,
        tokenAddress,
        'token address should be set properly'
      );
    });
  });
