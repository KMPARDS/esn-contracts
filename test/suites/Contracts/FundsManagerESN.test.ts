import assert from 'assert';
import { ethers } from 'ethers';
import { ContractJson } from '../../interfaces';
import { parseTx } from '../../utils';

const fundsManagerJSON: ContractJson = require('../../../build/ESN/FundsManager.json');

export const FundsManagerContractESN = () =>
  describe('Funds Manager Contract ESN Setup', async () => {
    it('deploys Funds Manager contract from first account with ESN:ERC20 contract address', async () => {
      const FundsManagerContractFactory = new ethers.ContractFactory(
        fundsManagerJSON.abi,
        fundsManagerJSON.evm.bytecode,
        global.providerESN.getSigner(global.accountsESN[0])
      );

      // @ts-ignore
      global.fundsManagerInstanceESN = await FundsManagerContractFactory.deploy(
        global.esInstanceETH.address,
        global.reversePlasmaInstanceESN.address,
        {
          value: ethers.utils.parseEther('50'), // TODO: plsn and update this
        }
      );
      await parseTx(global.fundsManagerInstanceESN.deployTransaction, false);

      assert.ok(global.fundsManagerInstanceESN.address, 'conract address should be present');
    });

    it('checks token address set while deploying', async () => {
      const tokenAddress = await global.fundsManagerInstanceESN.tokenOnETH();

      assert.equal(
        global.esInstanceETH.address,
        tokenAddress,
        'token address should be set properly'
      );
    });

    it('checks reverse plasma address set while deploying', async () => {
      const reversePlasmaAddress = await global.fundsManagerInstanceESN.reversePlasma();

      assert.equal(
        global.reversePlasmaInstanceESN.address,
        reversePlasmaAddress,
        'reverse plasma address should be set properly'
      );
    });

    it('sets FundsManagerETH address', async () => {
      await global.fundsManagerInstanceESN.setFundsManagerETHAddress(
        global.fundsManagerInstanceETH.address
      );

      assert.strictEqual(
        await global.fundsManagerInstanceESN.fundsManagerETH(),
        global.fundsManagerInstanceETH.address,
        'fundsManagerETH address must be set'
      );
    });
  });
