import assert from 'assert';

export const Randomness = () =>
  describe('Randomness', () => {
    it('generates unique random bytes for every call within same block', async () => {
      const randomByte32s = splitBytesIntoBytes32(
        await global.randomnessMangerESN.callStatic.getMultipleRandomBytes(10)
      );

      for (const randomByte32 of randomByte32s) {
        assert.strictEqual(
          randomByte32s.filter((r) => r === randomByte32).length,
          1,
          'there should be unique random bytes32s'
        );
      }
    });

    it('generates unique random bytes for every call across blocks', async () => {
      const randomBytes32Before = await global.randomnessMangerESN.callStatic.getRandomBytes32();
      await global.providerESN.send('evm_mine', []);
      const randomBytes32After = await global.randomnessMangerESN.callStatic.getRandomBytes32();
      console.log(randomBytes32Before, randomBytes32After);

      assert.notStrictEqual(
        randomBytes32Before,
        randomBytes32After,
        'random bytes should not be same'
      );
    });
  });

function splitBytesIntoBytes32(hex: string): string[] {
  if (hex.slice(0, 2) !== '0x') {
    throw new Error('hex string should start with 0x');
  }

  hex = hex.slice(2);

  if (hex.length % 64 !== 0) {
    throw new Error(
      `Invalid length of hex string: ${hex.length}, should be in multiples of 64 (32 bytes)`
    );
  }

  const bytes32Arr: string[] = [];

  while (hex) {
    bytes32Arr.push('0x' + hex.slice(0, 64));
    hex = hex.slice(64);
  }

  return bytes32Arr;
}
