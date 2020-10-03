import { ok, strictEqual } from "assert";
import { ethers } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { parseReceipt } from "../../utils";

const wallet = ethers.Wallet.createRandom();

export const AddItem = () => 
    describe('Add Item', () => {

        it('tries to list an item with a non-KYC wallet expecting revert', async () => {
            try {
                const tx = await global.rentingDappManagerInstanceESN
                .connect(wallet.connect(global.providerESN))
                .addItem('Test_Item', 'India', 30, 50, 10, 'Getting item listing checked', formatBytes32String('1_1'), 100); 
                
                ok(false, 'error should have been thrown, but not thrown');
            } catch (error) {
                ok(
                    error?.message?.includes('KYC_NOT_APPROVED'), 
                    'error is not related to KYC not being approved'
                );
            }
        });

        it('tries to list an item with a KYC approved wallet', async () => {
            await global.kycDappInstanceESN.setIdentityOwner(
                formatBytes32String('test_username'), 
                wallet.address, 
                true,
                1
            ); 

            /*await global.kycDappInstanceESN.updateKycStatus(
                formatBytes32String('test_username'), 
                1, 
                ethers.constants.HashZero, 
                ethers.constants.HashZero,
                1 // means KYC approved
            );*/

            const receipt = await parseReceipt(
                global.rentingDappManagerInstanceESN
                    .connect(wallet.connect(global.providerESN))
                    .addItem('Test_Item', 'India', 30, 50, 10, 'Getting item listing checked', formatBytes32String('1_1'), 100),
                true
            );
            
            //const receipt = await tx.wait();
    
            const parsedLogs = receipt.logs.map((log) => 
                global.rentingDappManagerInstanceESN.interface.parseLog(log)
            );
    
            ok(ethers.utils.isHexString(parsedLogs[0].args.item), 'item address added should be hexstring');
            //strictEqual(parsedLogs[0].args.item.length, 66, 'item address added should be bytes32');
        });
});