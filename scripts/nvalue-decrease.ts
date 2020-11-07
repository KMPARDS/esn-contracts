import { walletESN, password } from './commons';
import { writeFileSync } from 'fs-extra';

(async () => {
  const N = 64;
  console.log(`Encrypting keystore with N value of ${N}`);
  const str = await walletESN.encrypt(password, { scrypt: { N } });
  console.log(`Replacing the keystore file with new one`);
  writeFileSync(process.argv[2], str, { encoding: 'utf-8' });
  console.log(`Done!`);
})();
