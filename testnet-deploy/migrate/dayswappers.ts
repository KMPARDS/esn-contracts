import { existing, providerESN, walletESN } from '../commons';
import { ethers } from 'ethers';
import { DayswappersWithMigrationFactory } from '../../build/typechain/ESN';
import { formatBytes32String } from 'ethers/lib/utils';

if (!existing.dayswappers) {
  throw new Error('dayswappers does not exist');
}

const dayswappersInstance = DayswappersWithMigrationFactory.connect(
  existing.dayswappers,
  walletESN
);

(async () => {
  const excel: KycRow[] = require('./kyc.json');
  console.log('Current Block Number', await providerESN.getBlockNumber());

  let nonce: number = await walletESN.getTransactionCount();

  let continueFlag = true;

  console.log('started', { nonce });

  for (const [index, kycRow] of excel.entries()) {
    let { address, username, kycStatus, depth, introducer, belt } = parseKycRow(kycRow);

    // if (address === '0x97fadf25344acaf8262301b8a47e90e928746a27') {
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
        const tx = await dayswappersInstance.migrateSeats(
          [
            {
              owner: address,
              kycResolved: kycStatus,
              incompleteKycResolveSeatIndex: 0,
              depth,
              introducer: introducer ?? ethers.constants.AddressZero,
              beltIndex: belt ?? 0,
            },
          ],
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
        if (error.message.includes('Seat already alloted')) {
          skip = true;
          break;
        }
        if (error.message.includes('Transaction nonce is too low')) {
          nonce++;
          continue;
        }
        if (error.message.includes('bad address checksum')) {
          address = address.toLowerCase();
          continue;
        }

        console.log(error.message);
        await new Promise((res) => setTimeout(res, 1000));
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
