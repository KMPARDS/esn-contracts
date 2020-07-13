import assert from 'assert';
import { parseReceipt, releaseNrt } from '../../utils';

export const ValidatorSet = () =>
  describe('Validator Set', () => {
    it('gives initial validator address before first finalize', async () => {
      const validators = await global.validatorSetESN.getValidators();

      assert.deepEqual(
        validators,
        [global.validatorWallets[0].address],
        'should give a single initial validator as set while deploying'
      );
    });

    it('calls finalizeChange first time by system should set lastFinalizeChangeBlock', async () => {
      const lastFinalizeChangeBlockBefore = await global.validatorSetESN.lastFinalizeChangeBlock();
      assert.strictEqual(
        lastFinalizeChangeBlockBefore.toNumber(),
        0,
        'lastFinalizeChangeBlock should be zero initially'
      );

      await global.validatorSetESN.functions.finalizeChange();
      const lastFinalizeChangeBlockAfter = await global.validatorSetESN.lastFinalizeChangeBlock();

      assert.notStrictEqual(
        lastFinalizeChangeBlockAfter.toNumber(),
        0,
        'lastFinalizeChangeBlockAfter should have been set'
      );
    });

    it('calls initiate change', async () => {
      await global.providerESN.send('evm_mine', []);

      const receipt = await parseReceipt(global.validatorSetESN.initiateChange());

      assert.strictEqual(receipt.logs.length, 1, 'Only one event should be emitted');

      const parsedLog = global.validatorSetESN.interface.parseLog(receipt.logs[0]);
      // console.log(parsedLog);

      assert.strictEqual(
        parsedLog.name,
        'InitiateChange',
        'InitiateChange event should be emitted'
      );

      const lastFinalizeChangeBlockAfter = await global.validatorSetESN.lastFinalizeChangeBlock();
      assert.strictEqual(
        lastFinalizeChangeBlockAfter.toNumber(),
        0,
        'lastFinalizeChangeBlockAfter should be set zero after initiate change'
      );
    });

    it('calls finalizeChange through system address', async () => {
      const receipt = await parseReceipt(global.validatorSetESN.finalizeChange());

      const lastFinalizeChangeBlockAfter = await global.validatorSetESN.lastFinalizeChangeBlock();
      assert.strictEqual(
        lastFinalizeChangeBlockAfter.toNumber(),
        receipt.blockNumber,
        'lastFinalizeChangeBlockAfter should be set to current block number'
      );
    });

    it('checks if first 3 validators are seed validators', async () => {
      const validators = await global.validatorSetESN.getValidators();
      console.log(validators);

      assert.deepEqual(
        validators.slice(0, 3),
        global.validatorWallets.map((w) => w.address).slice(0, 3)
      );
    });
  });
