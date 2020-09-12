import { existing, providerESN, walletESN } from '../commons';
import { ethers } from 'ethers';
import { KycDappFactory } from '../../build/typechain/ESN';
import { formatBytes32String } from 'ethers/lib/utils';
import { CustomWallet } from '../custom-wallet';

if (!existing.kycdapp) {
  throw new Error('kycdapp does not exist');
}

const kycdappInstance = KycDappFactory.connect(existing.kycdapp, walletESN);

(async () => {
  const excel: KycRow[] = require('./kyc.json');
  console.log('Current Block Number', await providerESN.getBlockNumber());

  let nonce: number = await walletESN.getTransactionCount();

  let continueFlag = true;

  console.log('started', { nonce });

  for (const [index, kycRow] of excel.entries()) {
    const { address, username, kycStatus } = parseKycRow(kycRow);
    // console.log({ continueFlag });

    // if (address === '0xca2709184ee3ab8e28dfc23ed727aeaaeb8082ec') {
    //   continueFlag = false;
    //   continue;
    // }
    // if (continueFlag) {
    //   console.log(index, address, 'skipped');
    //   continue;
    // }

    if (!kycStatus) {
      // if kyc status is false then move on
      continue;
    }

    let skip = false;
    while (1) {
      try {
        const tx = await kycdappInstance.updateKycStatus(
          formatBytes32String(username),
          1,
          ethers.constants.AddressZero,
          ethers.constants.HashZero,
          1,
          {
            nonce,
          }
        );

        nonce++;
        break;
      } catch (error) {
        if (error.message.includes('IDENTITY_NOT_GOVERNANCE_CONTROLLABLE')) {
          skip = true;
          break;
        }
        if (error.message.includes('Transaction nonce is too low')) {
          nonce++;
          continue;
        }
        console.log(error.message);
      }
    }
    console.log(index, address, username, { nonce, skip });
    // receiptPromises.push((async () =>)());
  }
})();

interface KycRow {
  'Wallet Address': string;
  Introducer: string | '';
  Username: string | '';
  'KYC status': string | ''; //boolean
  Depth: number;
  Belt: string | ''; // number
}

interface ParsedKycRow {
  address: string; // A
  username: string; // P
  kycStatus: boolean;
  introducer: string | null;
  depth: number;
  belt: number | null;
}

function parseKycRow(input: KycRow): ParsedKycRow {
  return {
    address: input['Wallet Address'],
    username: input.Username || input['Wallet Address'].slice(2, 8),
    kycStatus: input['KYC status'] === 'TRUE',
    introducer: input.Introducer || null,
    depth: input.Depth,
    belt: input.Belt === '' ? null : +input.Belt,
  };
}
