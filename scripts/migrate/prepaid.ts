import { ethers } from 'ethers';
import { existing, providerESN, walletESN } from '../commons';
import { formatEther } from 'ethers/lib/utils';
import { PrepaidEsFactory } from '../../kami/src/typechain/ESN';

if (!existing.prepaidEs) {
  throw new Error('prepaidEs does not exist');
}

const prepaidEsInstance = PrepaidEsFactory.connect(existing.prepaidEs, walletESN);

(async () => {
  let excel: PrepaidRow[] = require('./prepaid.json');
  console.log('Current Block Number', await providerESN.getBlockNumber());

  let nonce: number = await walletESN.getTransactionCount();
  console.log('started', { nonce });

  console.log('balance of wallet', formatEther(await walletESN.getBalance()));

  let tamount = ethers.constants.Zero;

  for (const [index, prepaidRow] of excel.entries()) {
    const { address, amount } = parsePrepaidRow(prepaidRow);
    if (amount.eq(0)) {
      continue;
    }

    while (1) {
      try {
        // console.log({ address, claimedMonths, amount });

        const tx = await prepaidEsInstance.convertToESP(address, {
          value: amount,
          nonce,
        });

        nonce++;

        break;
      } catch (error) {
        console.log(error.message);
        await new Promise((res) => setTimeout(res, 1000));

        if (error.message.includes('Transaction nonce is too low')) {
          nonce++;
        }
      }
    }

    tamount = tamount.add(amount);

    console.log(
      // tx.hash,
      nonce,
      address,
      formatEther(amount)
    );
  }

  console.log('total', formatEther(tamount));
})();

interface PrepaidRow {
  Wallet: string;
  Amount: number;
}

interface PrepaidParsed {
  address: string;
  amount: ethers.BigNumber;
}

function parsePrepaidRow(input: PrepaidRow): PrepaidParsed {
  const address = ethers.utils.getAddress(input.Wallet);
  const amount = ethers.utils.parseEther(String(input.Amount));

  return { address, amount };
}
