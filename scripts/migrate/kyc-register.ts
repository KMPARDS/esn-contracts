import { existing, providerESN, walletESN } from '../commons';
import { ethers } from 'ethers';
import { KycDappFactory } from '../../build/typechain/ESN';
import { formatBytes32String } from 'ethers/lib/utils';

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

    // if (address === '0x493b071350ebCE48D5C8E8aA08640E510B807c02') {
    //   continueFlag = false;
    //   continue;
    // }
    // if (continueFlag) {
    //   console.log(index, address, 'skipped');
    //   continue;
    // }

    let skip = false;
    while (1) {
      try {
        // console.log(formatBytes32String(username), address, false);

        const tx = await kycdappInstance.setIdentityOwner(
          formatBytes32String(username),
          address.toLowerCase(),
          false,
          kycStatus ? 1 : 0,
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
        if (error.message.includes('bytes32 string must be less than 32 bytes')) {
          throw new Error(`username contains more than 32 chars (${username})`);
        }
        if (
          error.message.includes('network does not support ENS') ||
          error.message.includes('invalid address')
        ) {
          throw new Error('Invalid address found:' + address);
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
    username: input.Username || 'TEMP_USERNAME_' + input['Wallet Address'].slice(2, 8),
    kycStatus: input['KYC status'] === 'TRUE',
    introducer: input.Introducer || null,
    depth: input.Depth,
    belt: input.Belt === '' ? null : +input.Belt,
  };
}
