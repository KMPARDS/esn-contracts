import { ok, strictEqual } from 'assert';
import { ethers } from 'ethers';
import { formatBytes32String, parseEther } from 'ethers/lib/utils';
import { parseReceipt } from '../../utils';
import { wallet1, wallet2 } from './wallets';

export const AddItem = () =>
  describe('Add Item', () => {
    it('tries to list an item with a non-KYC wallet expecting revert', async () => {
      try {
        const tx = await global.rentingDappManagerInstanceESN
          .connect(wallet1.connect(global.providerESN))
          .addItem(
            'Test_Item',
            'India',
            parseEther('30'),
            parseEther('50'),
            parseEther('10'),
            'Getting item listing checked',
            formatBytes32String('1_1'),
            100
          );

        ok(false, 'error should have been thrown, but not thrown');
      } catch (error) {
        ok(
          error?.message?.includes('RentingDapp: KYC_NOT_APPROVED'),
          'error is not related to KYC not being approved'
        );
      }
    });

    it('tries to list an item with a KYC approved wallet with incorrect details expecting revert', async () => {
      await global.kycDappInstanceESN.setIdentityOwner(
        formatBytes32String('rentingdapp_user_1'),
        wallet1.address,
        true,
        1
      );

      try {
        const tx = await global.rentingDappManagerInstanceESN
          .connect(wallet1.connect(global.providerESN))
          .addItem(
            'Test_Item',
            'India',
            parseEther('0'),
            parseEther('50'),
            parseEther('10'),
            'Getting item listing checked',
            formatBytes32String('1_1'),
            100
          );

        ok(false, 'error should have been thrown, but not thrown');
      } catch (error) {
        ok(
          error?.message?.includes('RentingDapp: You cannot list an item with rent = 0'),
          'error is not related to rent price'
        );
      }
    });

    it('lists an item with a KYC approved wallet with correct details', async () => {
      const receipt = await parseReceipt(
        global.rentingDappManagerInstanceESN
          .connect(wallet1.connect(global.providerESN))
          .addItem(
            'Test_Item',
            'India',
            parseEther('30'),
            parseEther('50'),
            parseEther('10'),
            'Getting item listing checked',
            formatBytes32String('1_1'),
            100
          )
        //true
      );

      //const receipt = await tx.wait();
      // console.log(receipt);
      const parsedLogs = receipt.logs.map((log) =>
        global.rentingDappManagerInstanceESN.interface.parseLog(log)
      );

      // console.log(parsedLogs[0]);

      strictEqual(
        parsedLogs[0].args.lessor,
        wallet1.address,
        'Address of lessor should match with wallet1'
      );

      ok(
        ethers.utils.isHexString(parsedLogs[0].args.item),
        'item address added should be hexstring'
      );
      //strictEqual(parsedLogs[0].args.item.length, 66, 'item address added should be bytes32');
    });
  });
