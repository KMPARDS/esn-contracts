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
  const kavish_excel: KycRow[] = require('./kyc.json');
  const bhaktimam_excel: KycOrderredRow[] = require('./kyc-orderred.json');

  console.log('kavish excel', kavish_excel.length);
  console.log('bhaktimam excel', bhaktimam_excel.length);

  // const fixed_excel = fixKycOrder(kavish_excel, bhaktimam_excel);
  const fixed_excel = fixKavishOrder(kavish_excel);

  console.log('fixed excel', fixed_excel.length);

  console.log('Current Block Number', await providerESN.getBlockNumber());

  let nonce: number = await walletESN.getTransactionCount();

  let continueFlag = true;

  console.log('started', { nonce });

  for (const [index, kycRow] of fixed_excel.entries()) {
    let { address, username, kycStatus, depth, introducer, belt } = parseKycRow(kycRow);

    // if (address === '0x2888c09701667e4f487d88d6445cfb8cc75a39e7') {
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
        const obj = {
          owner: address,
          kycResolved: kycStatus,
          incompleteKycResolveSeatIndex: 0,
          depth,
          introducer: introducer ?? ethers.constants.AddressZero,
          beltIndex: belt ?? 0,
        };
        // if (obj.introducer === '0xe96f0F5a5eeA662292C06A0069a9B7aedf1550b6')
        //   obj.introducer = '0xC8e1F3B9a0CdFceF9fFd2343B943989A22517b26';
        // console.log(obj);
        const tx = await dayswappersInstance.migrateSeats([obj], {
          nonce,
        });

        nonce++;
        break;
      } catch (error) {
        // console.log(error.message);

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

        console.log('sleep');
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
    console.log(index, address, introducer, username, { nonce, skip });
    // receiptPromises.push((async () =>)());
  }
})();

interface KycRow {
  'Wallet Address': string;
  Introducer: string | '';
  Username: string | '';
  'KYC status': string | ''; //boolean
  Depth: number;
  Belt: string | number | ''; // number
}

interface KycOrderredRow {
  Wallet: string;
  'Ref Wallet': string;
  Username: string;
  'KYC Status': string;
  Depth: string;
  Belt: string;
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

function fixKycOrder(kavishExcel: KycRow[], bhaktimamExcel: KycOrderredRow[]): KycRow[] {
  const kycs: KycRow[] = [];
  for (const rawkyc of bhaktimamExcel) {
    const findedEntry = kavishExcel.find((entry) => {
      return entry['Wallet Address'].toLowerCase() === rawkyc.Wallet.toLowerCase();
    });
    if (findedEntry) {
      kycs.push(findedEntry);
    }
  }

  return kycs;
}

function fixKavishOrder(kavishExcel: KycRow[]): KycRow[] {
  const orderred: KycRow[] = [];
  orderred.push({
    'Wallet Address': '0xe96f0F5a5eeA662292C06A0069a9B7aedf1550b6',
    Introducer: '0xC8e1F3B9a0CdFceF9fFd2343B943989A22517b26',
    Username: 'kunjimudra',
    'KYC status': 'TRUE',
    Depth: 0,
    Belt: 4,
  });

  let current: KycRow[] = kavishExcel;
  let waiting: KycRow[] = [];

  // console.log(current.length);

  while (current.length > 0) {
    console.log(current.length);
    // if (current.length < 4) {
    //   console.log(current);
    // }
    if (current.length === waiting.length) {
      throw new Error('Waiting are not being resolved');
    }

    for (const rawkyc of current) {
      const finded = orderred.find((entry) => {
        return entry['Wallet Address'].toLowerCase() === rawkyc.Introducer.toLowerCase();
      });

      if (finded) {
        // console.log('finded', !!finded);
        orderred.push(rawkyc);
      } else {
        waiting.push(rawkyc);
      }
    }

    current = waiting;
    waiting = [];
  }

  return orderred;
}
