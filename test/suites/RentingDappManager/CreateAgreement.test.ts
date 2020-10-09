import { ok, strictEqual } from 'assert';
import { ethers } from 'ethers';
import { formatBytes32String } from 'ethers/lib/utils';
import { parseReceipt } from '../../utils';
import { wallet1, wallet2 } from './wallets';
import { ProductManagerFactory } from '../../../build/typechain/ESN/ProductManagerFactory';

export const CreateAgreement = () => 
    describe('Create rental agreement initially by booking item', () => {

        it('tries to book an item (first time with incentive = 0)', async () => {

            //extracting product address from events log
            const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(wallet1.address,null,null,null,null,null,null,null,null,null);
            const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
            const parseLogs = logs.map((log) => global.rentingDappManagerInstanceESN.interface.parseLog(log));
            const productAll = parseLogs.map(ele => ele.args);

            const productAddress = productAll[0][1];

            // console.log(filter);
            // console.log(logs);

            //creating 1st agreement for this product
            const productManagerInstanceESN = ProductManagerFactory.connect(
                productAddress,
                wallet2 ?? global.providerESN
            );

            const receipt = await parseReceipt(
                productManagerInstanceESN
                    .connect(wallet2.connect(global.providerESN))
                    .createAgreement(
                        0,
                        1000,
                        1050
                    ),
                //true
            );
            // console.log(receipt);
            const parsedLogs = receipt.logs.map((log) =>
                productManagerInstanceESN.interface.parseLog(log)
            );
            
            // console.log(parsedLogs[0]);

            ok(
                parsedLogs[0].args[0] === wallet1.address,
                "Lessor should match wallet1 address"
            );

            ok(
                parsedLogs[0].args[1] === wallet2.address,
                "Lessee should match wallet2 address"
            );

            ok(
                ethers.utils.isHexString(parsedLogs[0].args[2]),
                'Rental agreement address added should be hexstring'
            );
        });

        it('tries to book an item (second time with incentive = 0) but on overlapping timings expecting revert', async () => {
            //extracting product address from events log
            const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(wallet1.address,null,null,null,null,null,null,null,null,null);
            const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
            const parseLogs = logs.map((log) => global.rentingDappManagerInstanceESN.interface.parseLog(log));
            const productAll = parseLogs.map(ele => ele.args);

            const productAddress = productAll[0][1];

            //creating 2nd agreement for this product
            const productManagerInstanceESN = ProductManagerFactory.connect(
                productAddress,
                wallet2 ?? global.providerESN
            );
            
            try {
                const tx = await productManagerInstanceESN
                    .connect(wallet2.connect(global.providerESN))
                    .createAgreement(
                        0,
                        995,
                        1055
                    );
                    
                ok(false, 'error should have been thrown, but not thrown');                
            } catch (error) {
                ok(
                    error?.message?.includes('Not available on given range of timings'),
                    'error is not related to overlapping timings'
                );
            }
        });

        it('tries to book an item (third time with incentive = 0) but on overlapping timings expecting revert', async () => {
            //extracting product address from events log
            const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(wallet1.address,null,null,null,null,null,null,null,null,null);
            const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
            const parseLogs = logs.map((log) => global.rentingDappManagerInstanceESN.interface.parseLog(log));
            const productAll = parseLogs.map(ele => ele.args);

            const productAddress = productAll[0][1];

            //creating 3rd agreement for this product
            const productManagerInstanceESN = ProductManagerFactory.connect(
                productAddress,
                wallet2 ?? global.providerESN
            );
            
            try {
                const tx = await productManagerInstanceESN
                    .connect(wallet2.connect(global.providerESN))
                    .createAgreement(
                        0,
                        996,
                        1010
                    );
                    
                ok(false, 'error should have been thrown, but not thrown');                
            } catch (error) {
                ok(
                    error?.message?.includes('Not available on given range of timings'),
                    'error is not related to overlapping timings'
                );
            }
        });

        it('tries to book an item (fourth time with incentive = 0) but on overlapping timings expecting revert', async () => {
            //extracting product address from events log
            const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(wallet1.address,null,null,null,null,null,null,null,null,null);
            const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
            const parseLogs = logs.map((log) => global.rentingDappManagerInstanceESN.interface.parseLog(log));
            const productAll = parseLogs.map(ele => ele.args);

            const productAddress = productAll[0][1];

            //creating 4th agreement for this product
            const productManagerInstanceESN = ProductManagerFactory.connect(
                productAddress,
                wallet2 ?? global.providerESN
            );
            
            try {
                const tx = await productManagerInstanceESN
                    .connect(wallet2.connect(global.providerESN))
                    .createAgreement(
                        0,
                        1020,
                        1060
                    );
                    
                ok(false, 'error should have been thrown, but not thrown');                
            } catch (error) {
                ok(
                    error?.message?.includes('Not available on given range of timings'),
                    'error is not related to overlapping timings'
                );
            }
        });

        it('tries to book an item (fifth time with incentive = 0) but on overlapping timings expecting revert', async () => {
            //extracting product address from events log
            const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(wallet1.address,null,null,null,null,null,null,null,null,null);
            const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
            const parseLogs = logs.map((log) => global.rentingDappManagerInstanceESN.interface.parseLog(log));
            const productAll = parseLogs.map(ele => ele.args);

            const productAddress = productAll[0][1];

            //creating 5th agreement for this product
            const productManagerInstanceESN = ProductManagerFactory.connect(
                productAddress,
                wallet2 ?? global.providerESN
            );
            
            try {
                const tx = await productManagerInstanceESN
                    .connect(wallet2.connect(global.providerESN))
                    .createAgreement(
                        0,
                        1060,
                        1050
                    );
                    
                ok(false, 'error should have been thrown, but not thrown');                
            } catch (error) {
                ok(
                    error?.message?.includes('Not available on given range of timings'),
                    'error is not related to overlapping timings'
                );
            }
        });

        it('tries to book an item (sixth time with incentive = 0 in available timings)', async () => {

            //extracting product address from events log
            const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(wallet1.address,null,null,null,null,null,null,null,null,null);
            const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
            const parseLogs = logs.map((log) => global.rentingDappManagerInstanceESN.interface.parseLog(log));
            const productAll = parseLogs.map(ele => ele.args);

            const productAddress = productAll[0][1];

            //creating 6th agreement for this product
            const productManagerInstanceESN = ProductManagerFactory.connect(
                productAddress,
                wallet2 ?? global.providerESN
            );

            const receipt = await parseReceipt(
                productManagerInstanceESN
                    .connect(wallet2.connect(global.providerESN))
                    .createAgreement(
                        0,
                        1062,
                        1150
                    ),
                //true
            );

            const parsedLogs = receipt.logs.map((log) =>
                productManagerInstanceESN.interface.parseLog(log)
            );

            ok(
                parsedLogs[0].args[0] === wallet1.address,
                "Lessor should match wallet1 address"
            );

            ok(
                parsedLogs[0].args[1] === wallet2.address,
                "Lessee should match wallet2 address"
            );

            ok(
                ethers.utils.isHexString(parsedLogs[0].args[2]),
                'Rental agreement address added should be hexstring'
            );
        });


        it('tries to book an item (incentive = 0 in available timings)', async () => {

            //extracting product address from events log
            const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(wallet1.address,null,null,null,null,null,null,null,null,null);
            const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
            const parseLogs = logs.map((log) => global.rentingDappManagerInstanceESN.interface.parseLog(log));
            const productAll = parseLogs.map(ele => ele.args);

            const productAddress = productAll[0][1];

            //creating 7th agreement for this product
            const productManagerInstanceESN = ProductManagerFactory.connect(
                productAddress,
                wallet2 ?? global.providerESN
            );

            const receipt = await parseReceipt(
                productManagerInstanceESN
                    .connect(wallet2.connect(global.providerESN))
                    .createAgreement(
                        0,
                        1151,
                        1200
                    ),
                //true
            );

            const parsedLogs = receipt.logs.map((log) =>
                productManagerInstanceESN.interface.parseLog(log)
            );

            ok(
                parsedLogs[0].args[0] === wallet1.address,
                "Lessor should match wallet1 address"
            );

            ok(
                parsedLogs[0].args[1] === wallet2.address,
                "Lessee should match wallet2 address"
            );

            ok(
                ethers.utils.isHexString(parsedLogs[0].args[2]),
                'Rental agreement address added should be hexstring'
            );
        });

        it('tries to book an item (incentive = 0 in available timings)', async () => {

            //extracting product address from events log
            const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(wallet1.address,null,null,null,null,null,null,null,null,null);
            const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
            const parseLogs = logs.map((log) => global.rentingDappManagerInstanceESN.interface.parseLog(log));
            const productAll = parseLogs.map(ele => ele.args);

            const productAddress = productAll[0][1];

            //creating 7th agreement for this product
            const productManagerInstanceESN = ProductManagerFactory.connect(
                productAddress,
                wallet2 ?? global.providerESN
            );

            const receipt = await parseReceipt(
                productManagerInstanceESN
                    .connect(wallet2.connect(global.providerESN))
                    .createAgreement(
                        0,
                        1250,
                        1300
                    ),
                //true
            );

            const parsedLogs = receipt.logs.map((log) =>
                productManagerInstanceESN.interface.parseLog(log)
            );

            ok(
                parsedLogs[0].args[0] === wallet1.address,
                "Lessor should match wallet1 address"
            );

            ok(
                parsedLogs[0].args[1] === wallet2.address,
                "Lessee should match wallet2 address"
            );

            ok(
                ethers.utils.isHexString(parsedLogs[0].args[2]),
                'Rental agreement address added should be hexstring'
            );
        });


        it('tries to book an item (incentive = 0 in available timings)', async () => {

            //extracting product address from events log
            const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(wallet1.address,null,null,null,null,null,null,null,null,null);
            const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
            const parseLogs = logs.map((log) => global.rentingDappManagerInstanceESN.interface.parseLog(log));
            const productAll = parseLogs.map(ele => ele.args);

            const productAddress = productAll[0][1];

            //creating 7th agreement for this product
            const productManagerInstanceESN = ProductManagerFactory.connect(
                productAddress,
                wallet2 ?? global.providerESN
            );

            const receipt = await parseReceipt(
                productManagerInstanceESN
                    .connect(wallet2.connect(global.providerESN))
                    .createAgreement(
                        0,
                        1350,
                        1370
                    ),
                //true
            );

            const parsedLogs = receipt.logs.map((log) =>
                productManagerInstanceESN.interface.parseLog(log)
            );

            ok(
                parsedLogs[0].args[0] === wallet1.address,
                "Lessor should match wallet1 address"
            );

            ok(
                parsedLogs[0].args[1] === wallet2.address,
                "Lessee should match wallet2 address"
            );

            ok(
                ethers.utils.isHexString(parsedLogs[0].args[2]),
                'Rental agreement address added should be hexstring'
            );
        });
    });