import assert from 'assert';
import { ethers } from 'ethers';
import { ContractJson } from '../../interfaces';

const reversePlasmaJSON: ContractJson = require('../../../build/ESN/ReversePlasma.json');

export const ReversePlasmaContract = () =>
  describe('Reverse Plasma Contract Setup', async () => {
    it('deploys Reverse Plasma contract from first account with initial validators and ETH:ERC20 contract address', async () => {
      const ReversePlasmaContractFactory = new ethers.ContractFactory(
        reversePlasmaJSON.abi,
        reversePlasmaJSON.evm.bytecode,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // @ts-ignore
      global.reversePlasmaInstanceESN = await ReversePlasmaContractFactory.deploy(
        0,
        global.esInstanceETH.address,
        global.validatorWallets.map((w) => w.address)
      );

      assert.ok(global.reversePlasmaInstanceESN.address, 'conract address should be present');
    });

    it('checks validators set while deploying', async () => {
      const currentValidators = await global.reversePlasmaInstanceESN.getAllValidators();

      assert.deepEqual(
        currentValidators,
        global.validatorWallets.map((w) => w.address),
        'validators set while deploying must be visible when get'
      );
    });

    it('checks token contract set while deploying', async () => {
      const tokenAddress = await global.reversePlasmaInstanceESN.tokenOnETH();

      assert.equal(
        global.esInstanceETH.address,
        tokenAddress,
        'token address should be set properly'
      );
    });
  });
