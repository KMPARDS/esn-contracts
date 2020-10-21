import assert from 'assert';

export const SetInitialValues = () =>
  describe('Setting initial values to deployed contracts', () => {
    it('sets initial values in Plasma Manager Contract ETH', async () => {
      await global.plasmaManagerInstanceETH.setInitialValidators(
        global.validatorWallets.map((w) => w.address)
      );

      const currentValidators = await global.plasmaManagerInstanceETH.getAllValidators();
      assert.deepEqual(
        currentValidators,
        global.validatorWallets.map((w) => w.address),
        'validators set while deploying must be visible when get'
      );
    });

    it('sets initial values in Funds Manager Contract ETH', async () => {
      await global.fundsManagerInstanceETH.setToken(global.esInstanceETH.address);
      await global.fundsManagerInstanceETH.setPlasmaManagerAddress(
        global.plasmaManagerInstanceETH.address
      );
      await global.fundsManagerInstanceETH.setFundsManagerESNAddress(
        global.fundsManagerInstanceESN.address
      );

      const tokenAddress = await global.fundsManagerInstanceETH.token();
      assert.strictEqual(
        tokenAddress,
        global.esInstanceETH.address,
        'token address should be set properly'
      );

      const plasmaAddress = await global.fundsManagerInstanceETH.plasmaManager();
      assert.strictEqual(
        plasmaAddress,
        global.plasmaManagerInstanceETH.address,
        'plasma manager address should be set properly'
      );

      const fundsManagerESNAdd = await global.fundsManagerInstanceETH.fundsManagerESN();
      assert.strictEqual(
        fundsManagerESNAdd,
        global.fundsManagerInstanceESN.address,
        'fundsManagerETH address must be set'
      );
    });

    it('sets initial values in Reverse Plasma Contract ESN', async () => {
      await global.reversePlasmaInstanceESN.setInitialValues(
        2,
        global.validatorWallets.map((w) => w.address)
      );

      const startBlockNumber = await global.reversePlasmaInstanceESN.latestBlockNumber();
      assert.equal(
        startBlockNumber,
        1, // since it stores startBlockNumber - 1
        'latestBlockNumber should be set properly according to startBlockNumber'
      );

      const currentValidators = await global.reversePlasmaInstanceESN.getAllValidators();
      assert.deepEqual(
        currentValidators,
        global.validatorWallets.map((w) => w.address),
        'validators set while deploying must be visible when get'
      );
    });

    it('sets initial values in funds Manager ESN', async () => {
      await global.fundsManagerInstanceESN.setInitialValues(
        global.reversePlasmaInstanceESN.address,
        global.esInstanceETH.address,
        global.fundsManagerInstanceETH.address
      );

      const reversePlasmaAddress = await global.fundsManagerInstanceESN.reversePlasma();
      assert.strictEqual(
        reversePlasmaAddress,
        global.reversePlasmaInstanceESN.address,
        'reverse plasma address should be set properly'
      );

      const tokenAddress = await global.fundsManagerInstanceESN.tokenOnETH();
      assert.strictEqual(
        tokenAddress,
        global.esInstanceETH.address,
        'token address should be set properly'
      );

      const fundsManagerETHAdd = await global.fundsManagerInstanceESN.fundsManagerETH();
      assert.strictEqual(
        fundsManagerETHAdd,
        global.fundsManagerInstanceETH.address,
        'fundsManagerETH address must be set'
      );
    });
  });
