import { ok, strict, strictEqual } from 'assert';
import { ethers } from 'ethers';
import { formatBytes32String, formatEther, parseEther } from 'ethers/lib/utils';
import { parseReceipt } from '../../utils';
import { wallet1, wallet2 } from './wallets';
import { ProductManagerFactory } from '../../../build/typechain/ESN/ProductManagerFactory';
import { RentalAgreementFactory } from '../../../build/typechain/ESN/RentalAgreementFactory';

export const RentingOperation = () =>
  describe('Working of rental operation', () => {
    it('successful completion of rent with undamaged product return', async () => {
      //extracting product address from events log
      const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(
        wallet1.address,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );
      const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
      const parseLogs = logs.map((log) =>
        global.rentingDappManagerInstanceESN.interface.parseLog(log)
      );
      const productAll = parseLogs.map((ele) => ele.args);

      const productAddress = productAll[0][1];

      //creating ProductManager instance
      let productManagerInstanceESN = ProductManagerFactory.connect(
        productAddress,
        wallet2 ?? global.providerESN
      );

      const filter1 = productManagerInstanceESN.filters.NewRentalContract(
        null,
        wallet2.address,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );
      productManagerInstanceESN = productManagerInstanceESN.connect(global.providerESN);
      const logs1 = await productManagerInstanceESN.queryFilter(filter1);
      const parseLogs1 = logs1.map((log) => productManagerInstanceESN.interface.parseLog(log));
      const contractLogs = parseLogs1.map((ele) => ele.args);

      const rentalContract = contractLogs[0][2];

      let rentalAgreementESN_1 = RentalAgreementFactory.connect(
        rentalContract,
        wallet1 ?? global.providerESN
      );
      let rentalAgreementESN_2 = RentalAgreementFactory.connect(
        rentalContract,
        wallet2 ?? global.providerESN
      );

      // Initial check by lessor
      const receipt1 = await parseReceipt(
        rentalAgreementESN_1.connect(wallet1.connect(global.providerESN)).initialCheckByLessor(1)
        // true
      );
      const parsedLogs1 = receipt1.logs.map((log) => rentalAgreementESN_1.interface.parseLog(log));
      strictEqual(parsedLogs1[0].args[0], 0, 'Check should be lessor_confirmed for rent');

      // Initial check by lessee
      await global.providerESN.getSigner(0).sendTransaction({
        to: wallet2.address,
        value: parseEther('10000'),
      });
      const receipt2 = await parseReceipt(
        rentalAgreementESN_2
          .connect(wallet2.connect(global.providerESN))
          .initialCheckByLessee(1, { value: contractLogs[0][6] })
        //true
      );
      const parsedLogs2 = receipt2.logs.map((log) => rentalAgreementESN_2.interface.parseLog(log));
      strictEqual(parsedLogs2[0].args[0], 1, 'Check should be lessee_confirmed for rent');

      // Pay rent for once
      const receipt3 = await parseReceipt(
        rentalAgreementESN_2
          .connect(wallet2.connect(global.providerESN))
          .payRent({ value: contractLogs[0][5] })
        // true
      );
      const parsedLogs3 = (receipt3.logs
        .map((log) => {
          try {
            return rentalAgreementESN_2.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter((e) => e !== null) as unknown) as ethers.utils.LogDescription[];

      strictEqual(
        formatEther(parsedLogs3[0].args[0]),
        formatEther(contractLogs[0][5]),
        'Amount of rent paid is not correct'
      );

      // Final check by lessor
      const receipt4 = await parseReceipt(
        rentalAgreementESN_1.connect(wallet1.connect(global.providerESN)).finalCheckByLessor(1)
        // true
      );
      const parsedLogs4 = receipt4.logs.map((log) => rentalAgreementESN_1.interface.parseLog(log));
      strictEqual(parsedLogs4[0].args[0], 3, 'Check should be lessor_confirmed for return');

      // Final check by lessee
      const receipt5 = await parseReceipt(
        rentalAgreementESN_2.connect(wallet2.connect(global.providerESN)).finalCheckByLessee(1)
        //true
      );
      const parsedLogs5 = receipt5.logs.map((log) => rentalAgreementESN_2.interface.parseLog(log));
      strictEqual(parsedLogs5[0].args[0], 4, 'Check should be lessee_confirmed for return');

      // Termination of contract with penalty, expecting revert
      try {
        const receipt6 = await parseReceipt(
          rentalAgreementESN_1
            .connect(wallet1.connect(global.providerESN))
            .terminateWithAdditionalCharges(parseEther('6'))
          //true
        );

        ok(false, 'error should have been thrown, but not thrown');
      } catch (error) {
        ok(
          error?.message?.includes('You must terminate the contract normally'),
          'error is not related to abnormal contract termination'
        );
      }

      // Normal termination of contract
      const receipt7 = await parseReceipt(
        rentalAgreementESN_1.connect(wallet1.connect(global.providerESN)).terminateNormally()
        //true
      );
      const parsedLogs7 = receipt7.logs.map((log) => rentalAgreementESN_1.interface.parseLog(log));
    });

    it('successful completion of rent with damaged product return', async () => {
      //extracting product address from events log
      const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(
        wallet1.address,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );
      const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
      const parseLogs = logs.map((log) =>
        global.rentingDappManagerInstanceESN.interface.parseLog(log)
      );
      const productAll = parseLogs.map((ele) => ele.args);

      const productAddress = productAll[0][1];

      //creating ProductManager instance
      let productManagerInstanceESN = ProductManagerFactory.connect(
        productAddress,
        wallet2 ?? global.providerESN
      );

      const filter1 = productManagerInstanceESN.filters.NewRentalContract(
        null,
        wallet2.address,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );
      productManagerInstanceESN = productManagerInstanceESN.connect(global.providerESN);
      const logs1 = await productManagerInstanceESN.queryFilter(filter1);
      const parseLogs1 = logs1.map((log) => productManagerInstanceESN.interface.parseLog(log));
      const contractLogs = parseLogs1.map((ele) => ele.args);

      const rentalContract = contractLogs[1][2];

      let rentalAgreementESN_1 = RentalAgreementFactory.connect(
        rentalContract,
        wallet1 ?? global.providerESN
      );
      let rentalAgreementESN_2 = RentalAgreementFactory.connect(
        rentalContract,
        wallet2 ?? global.providerESN
      );

      // Initial check by lessor
      const receipt1 = await parseReceipt(
        rentalAgreementESN_1.connect(wallet1.connect(global.providerESN)).initialCheckByLessor(1)
        // true
      );
      const parsedLogs1 = receipt1.logs.map((log) => rentalAgreementESN_1.interface.parseLog(log));
      strictEqual(parsedLogs1[0].args[0], 0, 'Check should be lessor_confirmed for rent');

      // Initial check by lessee
      const receipt2 = await parseReceipt(
        rentalAgreementESN_2
          .connect(wallet2.connect(global.providerESN))
          .initialCheckByLessee(1, { value: contractLogs[1][6] })
        //true
      );
      const parsedLogs2 = receipt2.logs.map((log) => rentalAgreementESN_2.interface.parseLog(log));
      strictEqual(parsedLogs2[0].args[0], 1, 'Check should be lessee_confirmed for rent');

      // Pay rent for once
      const receipt3 = await parseReceipt(
        rentalAgreementESN_2
          .connect(wallet2.connect(global.providerESN))
          .payRent({ value: contractLogs[1][5] })
        //true
      );

      const parsedLogs3 = (receipt3.logs
        .map((log) => {
          try {
            return rentalAgreementESN_2.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter((e) => e !== null) as unknown) as ethers.utils.LogDescription[];

      strictEqual(
        formatEther(parsedLogs3[0].args[0]),
        formatEther(contractLogs[1][5]),
        'Amount of rent paid is not correct'
      );

      // Final check by lessor
      const receipt4 = await parseReceipt(
        rentalAgreementESN_1.connect(wallet1.connect(global.providerESN)).finalCheckByLessor(0)
        // true
      );
      const parsedLogs4 = receipt4.logs.map((log) => rentalAgreementESN_1.interface.parseLog(log));
      strictEqual(parsedLogs4[0].args[0], 3, 'Check should be lessor_confirmed for return');

      // Final check by lessee
      const receipt5 = await parseReceipt(
        rentalAgreementESN_2.connect(wallet2.connect(global.providerESN)).finalCheckByLessee(0)
        //true
      );
      const parsedLogs5 = receipt5.logs.map((log) => rentalAgreementESN_2.interface.parseLog(log));
      strictEqual(parsedLogs5[0].args[0], 4, 'Check should be lessee_confirmed for return');

      // Termination of contract normally, expecting revert
      try {
        const receipt6 = await parseReceipt(
          rentalAgreementESN_1.connect(wallet1.connect(global.providerESN)).terminateNormally()
          //true
        );

        ok(false, 'error should have been thrown, but not thrown');
      } catch (error) {
        ok(
          error?.message?.includes(
            "Please terminate contract using the 'terminatetWithAdditionalCharges' function"
          ),
          'error is not related to termination faults'
        );
      }

      // Termination of contract with penalty > security, expecting revert
      try {
        const receipt7 = await parseReceipt(
          rentalAgreementESN_1
            .connect(wallet1.connect(global.providerESN))
            .terminateWithAdditionalCharges(parseEther('60'))
          //true
        );

        ok(false, 'error should have been thrown, but not thrown');
      } catch (error) {
        ok(
          error?.message?.includes('You cannot charge penalty more than security'),
          'error is not related to penalty being greater than security'
        );
      }

      // Termination of contract with penalty
      const receipt8 = await parseReceipt(
        rentalAgreementESN_1
          .connect(wallet1.connect(global.providerESN))
          .terminateWithAdditionalCharges(parseEther('6'))
        // true
      );

      const parsedLogs8 = (receipt8.logs
        .map((log) => {
          try {
            return rentalAgreementESN_1.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter((e) => e !== null) as unknown) as ethers.utils.LogDescription[];
    });

    it('rental process ending in dispute', async () => {
      //extracting product address from events log
      const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(
        wallet1.address,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );
      const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
      const parseLogs = logs.map((log) =>
        global.rentingDappManagerInstanceESN.interface.parseLog(log)
      );
      const productAll = parseLogs.map((ele) => ele.args);

      const productAddress = productAll[0][1];

      //creating ProductManager instance
      let productManagerInstanceESN = ProductManagerFactory.connect(
        productAddress,
        wallet2 ?? global.providerESN
      );

      const filter1 = productManagerInstanceESN.filters.NewRentalContract(
        null,
        wallet2.address,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );
      productManagerInstanceESN = productManagerInstanceESN.connect(global.providerESN);
      const logs1 = await productManagerInstanceESN.queryFilter(filter1);
      const parseLogs1 = logs1.map((log) => productManagerInstanceESN.interface.parseLog(log));
      const contractLogs = parseLogs1.map((ele) => ele.args);

      const rentalContract = contractLogs[2][2];

      let rentalAgreementESN_1 = RentalAgreementFactory.connect(
        rentalContract,
        wallet1 ?? global.providerESN
      );
      let rentalAgreementESN_2 = RentalAgreementFactory.connect(
        rentalContract,
        wallet2 ?? global.providerESN
      );

      // Initial check by lessor
      const receipt1 = await parseReceipt(
        rentalAgreementESN_1.connect(wallet1.connect(global.providerESN)).initialCheckByLessor(1)
        // true
      );
      const parsedLogs1 = receipt1.logs.map((log) => rentalAgreementESN_1.interface.parseLog(log));
      strictEqual(parsedLogs1[0].args[0], 0, 'Check should be lessor_confirmed for rent');

      // Initial check by lessee
      const receipt2 = await parseReceipt(
        rentalAgreementESN_2
          .connect(wallet2.connect(global.providerESN))
          .initialCheckByLessee(1, { value: contractLogs[2][6] })
        //true
      );
      const parsedLogs2 = receipt2.logs.map((log) => rentalAgreementESN_2.interface.parseLog(log));
      strictEqual(parsedLogs2[0].args[0], 1, 'Check should be lessee_confirmed for rent');

      // Pay rent for once
      const receipt3 = await parseReceipt(
        rentalAgreementESN_2
          .connect(wallet2.connect(global.providerESN))
          .payRent({ value: contractLogs[2][5] })
        //true
      );

      const parsedLogs3 = (receipt3.logs
        .map((log) => {
          try {
            return rentalAgreementESN_2.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter((e) => e !== null) as unknown) as ethers.utils.LogDescription[];

      strictEqual(
        formatEther(parsedLogs3[0].args[0]),
        formatEther(contractLogs[2][5]),
        'Amount of rent paid is not correct'
      );

      // Final check by lessor
      const receipt4 = await parseReceipt(
        rentalAgreementESN_1.connect(wallet1.connect(global.providerESN)).finalCheckByLessor(0)
        // true
      );
      const parsedLogs4 = receipt4.logs.map((log) => rentalAgreementESN_1.interface.parseLog(log));
      strictEqual(parsedLogs4[0].args[0], 3, 'Check should be lessor_confirmed for return');

      // Final check by lessee
      try {
        const receipt5 = await parseReceipt(
          rentalAgreementESN_2.connect(wallet2.connect(global.providerESN)).finalCheckByLessee(1),
          true
        );
        const parsedLogs5 = receipt5.logs.map((log) =>
          rentalAgreementESN_2.interface.parseLog(log)
        );

        ok(false, 'error should have been thrown, but not thrown');
      } catch (error) {
        ok(
          error?.message?.includes('Dispute case: need for Faith Minus'),
          'error is not related to dispute'
        );
      }
    });

    it('successful cancellation of rent before paying rent', async () => {
      //extracting product address from events log
      const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(
        wallet1.address,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );
      const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
      const parseLogs = logs.map((log) =>
        global.rentingDappManagerInstanceESN.interface.parseLog(log)
      );
      const productAll = parseLogs.map((ele) => ele.args);

      const productAddress = productAll[0][1];

      //creating ProductManager instance
      let productManagerInstanceESN = ProductManagerFactory.connect(
        productAddress,
        wallet2 ?? global.providerESN
      );

      const filter1 = productManagerInstanceESN.filters.NewRentalContract(
        null,
        wallet2.address,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );
      productManagerInstanceESN = productManagerInstanceESN.connect(global.providerESN);
      const logs1 = await productManagerInstanceESN.queryFilter(filter1);
      const parseLogs1 = logs1.map((log) => productManagerInstanceESN.interface.parseLog(log));
      const contractLogs = parseLogs1.map((ele) => ele.args);

      const rentalContract = contractLogs[3][2];

      let rentalAgreementESN_1 = RentalAgreementFactory.connect(
        rentalContract,
        wallet1 ?? global.providerESN
      );
      let rentalAgreementESN_2 = RentalAgreementFactory.connect(
        rentalContract,
        wallet2 ?? global.providerESN
      );

      // Initial check by lessor
      const receipt1 = await parseReceipt(
        rentalAgreementESN_1.connect(wallet1.connect(global.providerESN)).initialCheckByLessor(1)
        // true
      );
      const parsedLogs1 = receipt1.logs.map((log) => rentalAgreementESN_1.interface.parseLog(log));
      strictEqual(parsedLogs1[0].args[0], 0, 'Check should be lessor_confirmed for rent');

      // Initial check by lessee
      const receipt2 = await parseReceipt(
        rentalAgreementESN_2
          .connect(wallet2.connect(global.providerESN))
          .initialCheckByLessee(1, { value: contractLogs[3][6] })
        //true
      );
      const parsedLogs2 = receipt2.logs.map((log) => rentalAgreementESN_2.interface.parseLog(log));
      strictEqual(parsedLogs2[0].args[0], 1, 'Check should be lessee_confirmed for rent');

      // Cancel rent before paying rent
      const receipt3 = await parseReceipt(
        rentalAgreementESN_2
          .connect(wallet2.connect(global.providerESN))
          .cancelRent({ value: contractLogs[3][7] })
        // true
      );
      const parsedLogs3 = receipt3.logs.map((log) => rentalAgreementESN_2.interface.parseLog(log));
      strictEqual(
        parsedLogs3[0].args[0],
        3,
        'Contract should have been terminated after cancel rent'
      );
    });

    it('tries to cancel rent at wrong times, expecting revert', async () => {
      //extracting product address from events log
      const filter = global.rentingDappManagerInstanceESN.filters.ProductDetails(
        wallet1.address,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );
      const logs = await global.rentingDappManagerInstanceESN.queryFilter(filter);
      const parseLogs = logs.map((log) =>
        global.rentingDappManagerInstanceESN.interface.parseLog(log)
      );
      const productAll = parseLogs.map((ele) => ele.args);

      const productAddress = productAll[0][1];

      //creating ProductManager instance
      let productManagerInstanceESN = ProductManagerFactory.connect(
        productAddress,
        wallet2 ?? global.providerESN
      );

      const filter1 = productManagerInstanceESN.filters.NewRentalContract(
        null,
        wallet2.address,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );
      productManagerInstanceESN = productManagerInstanceESN.connect(global.providerESN);
      const logs1 = await productManagerInstanceESN.queryFilter(filter1);
      const parseLogs1 = logs1.map((log) => productManagerInstanceESN.interface.parseLog(log));
      const contractLogs = parseLogs1.map((ele) => ele.args);

      const rentalContract = contractLogs[4][2];

      let rentalAgreementESN_1 = RentalAgreementFactory.connect(
        rentalContract,
        wallet1 ?? global.providerESN
      );
      let rentalAgreementESN_2 = RentalAgreementFactory.connect(
        rentalContract,
        wallet2 ?? global.providerESN
      );

      try {
        // Initial check by lessor
        const receipt1 = await parseReceipt(
          rentalAgreementESN_1.connect(wallet1.connect(global.providerESN)).initialCheckByLessor(1)
          // true
        );
        const parsedLogs1 = receipt1.logs.map((log) =>
          rentalAgreementESN_1.interface.parseLog(log)
        );
        strictEqual(parsedLogs1[0].args[0], 0, 'Check should be lessor_confirmed for rent');

        // Initial check by lessee
        const receipt2 = await parseReceipt(
          rentalAgreementESN_2
            .connect(wallet2.connect(global.providerESN))
            .initialCheckByLessee(0, { value: contractLogs[4][6] })
          //true
        );
        const parsedLogs2 = receipt2.logs.map((log) =>
          rentalAgreementESN_2.interface.parseLog(log)
        );
        strictEqual(parsedLogs2[0].args[0], 1, 'Check should be lessee_confirmed for rent');

        // Cancel rent before paying rent
        const receipt3 = await parseReceipt(
          rentalAgreementESN_2
            .connect(wallet2.connect(global.providerESN))
            .cancelRent({ value: contractLogs[4][7] })
          // true
        );
        const parsedLogs3 = receipt3.logs.map((log) =>
          rentalAgreementESN_2.interface.parseLog(log)
        );

        ok(false, 'error should have been thrown but not thrown');
      } catch (error) {
        ok(
          error?.message?.includes('You cannot cancel at this stage'),
          'error is not related to cancellation revert due to termination'
        );
      }

      try {
        // Initial check by lessor
        const receipt1 = await parseReceipt(
          rentalAgreementESN_1.connect(wallet1.connect(global.providerESN)).initialCheckByLessor(1)
          // true
        );
        const parsedLogs1 = receipt1.logs.map((log) =>
          rentalAgreementESN_1.interface.parseLog(log)
        );
        strictEqual(parsedLogs1[0].args[0], 0, 'Check should be lessor_confirmed for rent');

        // Initial check by lessee
        const receipt2 = await parseReceipt(
          rentalAgreementESN_2
            .connect(wallet2.connect(global.providerESN))
            .initialCheckByLessee(1, { value: contractLogs[4][6] })
          //true
        );
        const parsedLogs2 = receipt2.logs.map((log) =>
          rentalAgreementESN_2.interface.parseLog(log)
        );
        strictEqual(parsedLogs2[0].args[0], 1, 'Check should be lessee_confirmed for rent');

        // Pay rent for once
        const receipt3 = await parseReceipt(
          rentalAgreementESN_2
            .connect(wallet2.connect(global.providerESN))
            .payRent({ value: contractLogs[4][5] })
          //true
        );
        const parsedLogs3 = receipt3.logs.map((log) =>
          rentalAgreementESN_2.interface.parseLog(log)
        );
        strictEqual(
          formatEther(parsedLogs3[0].args[0]),
          formatEther(contractLogs[4][5]),
          'Amount of rent paid is not correct'
        );

        //tries to cancel rent at this point expecting revert
        const receipt4 = await parseReceipt(
          rentalAgreementESN_2
            .connect(wallet2.connect(global.providerESN))
            .cancelRent({ value: contractLogs[4][7] })
          // true
        );
        const parsedLogs4 = receipt3.logs.map((log) =>
          rentalAgreementESN_2.interface.parseLog(log)
        );

        ok(false, 'error should have been thrown but not thrown');
      } catch (error) {
        error?.message?.includes('You have already started paying your rent'),
          'error is not related to cancellation revert due to rent already paid';
      }
    });
  });
