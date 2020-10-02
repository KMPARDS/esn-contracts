import { DayswappersWithMigration } from '../../../build/typechain/ESN/DayswappersWithMigration';
import { DayswappersWithMigrationFactory } from '../../../build/typechain/ESN';
import { ethers } from 'ethers';
import { parseReceipt } from '../../utils';
import { strictEqual, deepStrictEqual } from 'assert';
import { formatEther, formatBytes32String, parseEther } from 'ethers/lib/utils';

let _dayswappersInstanceESN: DayswappersWithMigration;
const wallets: ethers.Wallet[] = [];
// let belts: number[];

const beltSettings = [
  { required: 0, distributionPercent: 0, leadershipPercent: 0 },
  { required: 3, distributionPercent: 20, leadershipPercent: 0 },
  { required: 6, distributionPercent: 40, leadershipPercent: 0 },
  { required: 9, distributionPercent: 52, leadershipPercent: 0 },
  { required: 12, distributionPercent: 64, leadershipPercent: 0 },
  { required: 15, distributionPercent: 72, leadershipPercent: 4 },
  { required: 18, distributionPercent: 84, leadershipPercent: 4 },
  { required: 21, distributionPercent: 90, leadershipPercent: 2 },
];

export const Distribution = () =>
  describe('Distribution', () => {
    before(async () => {
      // STEP 1: deploying dayswappers contract
      const dayswappersFactory = new DayswappersWithMigrationFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      _dayswappersInstanceESN = await dayswappersFactory.deploy(beltSettings);

      await _dayswappersInstanceESN.setKycDapp(global.kycDappInstanceESN.address);
      await _dayswappersInstanceESN.updateAuthorization(formatBytes32String('ERASWAP_TEAM'), true);

      // STEP 2: Settign initial value
      // await _dayswappersInstanceESN.setInitialValues(
      //   global.nrtInstanceESN.address,
      //   global.kycDappInstanceESN.address,
      //   global.prepaidEsInstanceESN.address,
      //   global.timeallyInstanceESN.address,
      //   ethers.constants.AddressZero,
      //   parseEther('100')
      // );

      const nrtMonth = await global.nrtInstanceESN.currentNrtMonth();
      const kycFee = nrtMonth / 12 > 0 ? '31.5' : '35'; // first year 35, every year 10% less.

      // STEP 3: join and resolve kyc
      for (let i = 0; i < 25; i++) {
        const wallet = ethers.Wallet.createRandom();

        const upline = wallets.slice(-1)[0]?.address ?? ethers.constants.AddressZero;

        // joins dayswappers
        await parseReceipt(
          _dayswappersInstanceESN.connect(wallet.connect(global.providerESN)).join(upline)
        );

        // create identity in kyc dapp
        await global.providerESN.getSigner(0).sendTransaction({
          to: wallet.address,
          value: parseEther(kycFee),
        });
        await parseReceipt(
          global.kycDappInstanceESN
            .connect(wallet.connect(global.providerESN))
            .register(formatBytes32String('wallet2' + i), {
              value: parseEther(kycFee),
            })
        );
        // approve kyc in kyc dapp
        await parseReceipt(
          global.kycDappInstanceESN.updateKycStatus(
            formatBytes32String('wallet2' + i),
            1,
            ethers.constants.HashZero,
            ethers.constants.HashZero,
            1
          )
        );

        // resolve kyc (dayswapper checks if kyc is approved)
        await parseReceipt(
          _dayswappersInstanceESN
            .connect(wallet.connect(global.providerESN))
            .resolveKyc(wallet.address)
        );

        wallets.push(wallet);
      }

      // STEP 4: promote self
      const month = await global.nrtInstanceESN.currentNrtMonth();
      for (const wallet of wallets) {
        try {
          await parseReceipt(
            _dayswappersInstanceESN
              .connect(wallet.connect(global.providerESN))
              .promoteBelt(wallet.address, month)
          );
        } catch {}

        // belts = (
        //   await Promise.all(
        //     wallets.map((wallet) => _dayswappersInstanceESN.getSeatByAddressStrict(wallet.address))
        //   )
        // ).map((seat) => seat.beltIndex);
      }
    });

    it('distributes 100 ES in entire liquid', async () => {
      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const amount = ethers.utils.parseEther('100');

      const seatsBefore = await Promise.all(
        wallets.map((wallet) => _dayswappersInstanceESN.getSeatByAddressStrict(wallet.address))
      ); //.map((seat) => seat.definiteEarnings);

      const seatsMonthlyDataBefore = await Promise.all(
        wallets.map((wallet) =>
          _dayswappersInstanceESN.getSeatMonthlyDataByAddress(wallet.address, currentMonth)
        )
      ); //.map((seat) => seat.definiteEarnings);

      await parseReceipt(
        _dayswappersInstanceESN.payToTree(wallets.slice(-1)[0].address, [100, 0, 0], {
          value: amount,
        })
      );

      const seatsMonthlyDataAfter = await Promise.all(
        wallets.map((wallet) =>
          _dayswappersInstanceESN.getSeatMonthlyDataByAddress(wallet.address, currentMonth)
        )
      ); //.map((seat) => seat.definiteEarnings);

      const liquidIncrease = seatsMonthlyDataAfter.map((seatAfter, i) =>
        seatAfter.definiteEarnings[0].sub(seatsMonthlyDataBefore[i].definiteEarnings[0])
      );

      let calculatedIncrease: ethers.BigNumber[] = [];
      let previousBelt = 0;
      let isSecondLeader = false;
      for (const seatBefore of seatsBefore.reverse()) {
        const belt = seatBefore.beltIndex;
        if (belt > previousBelt) {
          const distributionDiff =
            beltSettings[belt].distributionPercent - beltSettings[previousBelt].distributionPercent;
          calculatedIncrease.push(amount.mul(distributionDiff).div(100));
          if (beltSettings[belt].leadershipPercent > 0) {
            isSecondLeader = true;
          }
        } else if (belt === previousBelt && isSecondLeader) {
          isSecondLeader = false;
          calculatedIncrease.push(amount.mul(beltSettings[belt].leadershipPercent).div(100));
        } else {
          calculatedIncrease.push(ethers.constants.Zero);
        }
        previousBelt = belt;
      }
      calculatedIncrease = calculatedIncrease.reverse();

      // liquidIncrease.forEach((b, i) =>
      //   console.log(
      //     seatsBefore[i].beltIndex,
      //     ethers.utils.formatEther(b),
      //     ethers.utils.formatEther(calculatedIncrease[i])
      //   )
      // );

      deepStrictEqual(
        liquidIncrease.map(formatEther),
        calculatedIncrease.map(formatEther),
        'rewards should be correct'
      );
    });

    it('distributes 100 ES in 50% liquid, 10% prepaid, 40% stakes', async () => {
      const currentMonth = await global.nrtInstanceESN.currentNrtMonth();
      const amount = ethers.utils.parseEther('100');

      const seatsBefore = await Promise.all(
        wallets.map((wallet) => _dayswappersInstanceESN.getSeatByAddressStrict(wallet.address))
      ); //.map((seat) => seat.definiteEarnings);
      const seatsMonthlyDataBefore = await Promise.all(
        wallets.map((wallet) =>
          _dayswappersInstanceESN.getSeatMonthlyDataByAddress(wallet.address, currentMonth)
        )
      );

      await parseReceipt(
        _dayswappersInstanceESN.payToTree(wallets.slice(-1)[0].address, [5, 1, 4], {
          value: amount,
        })
      );

      const seatsMonthlyDataAfter = await Promise.all(
        wallets.map((wallet) =>
          _dayswappersInstanceESN.getSeatMonthlyDataByAddress(wallet.address, currentMonth)
        )
      );

      const liquidIncrease = seatsMonthlyDataAfter.map((seatAfter, i) =>
        seatAfter.definiteEarnings[0].sub(seatsMonthlyDataBefore[i].definiteEarnings[0])
      );
      const prepaidIncrease = seatsMonthlyDataAfter.map((seatAfter, i) =>
        seatAfter.definiteEarnings[1].sub(seatsMonthlyDataBefore[i].definiteEarnings[1])
      );
      const stakingIncrease = seatsMonthlyDataAfter.map((seatAfter, i) =>
        seatAfter.definiteEarnings[2].sub(seatsMonthlyDataBefore[i].definiteEarnings[2])
      );

      let calculatedIncrease: ethers.BigNumber[] = [];
      let previousBelt = 0;
      let isSecondLeader = false;
      for (const seatBefore of seatsBefore.reverse()) {
        const belt = seatBefore.beltIndex;
        if (belt > previousBelt) {
          const distributionDiff =
            beltSettings[belt].distributionPercent - beltSettings[previousBelt].distributionPercent;
          calculatedIncrease.push(amount.mul(distributionDiff).div(100));
          if (beltSettings[belt].leadershipPercent > 0) {
            isSecondLeader = true;
          }
        } else if (belt === previousBelt && isSecondLeader) {
          isSecondLeader = false;
          calculatedIncrease.push(amount.mul(beltSettings[belt].leadershipPercent).div(100));
        } else {
          calculatedIncrease.push(ethers.constants.Zero);
        }
        previousBelt = belt;
      }
      calculatedIncrease = calculatedIncrease.reverse();

      // liquidIncrease.forEach((b, i) =>
      //   console.log(
      //     seatsBefore[i].beltIndex,
      //     ethers.utils.formatEther(b),
      //     ethers.utils.formatEther(calculatedIncrease[i])
      //   )
      // );

      deepStrictEqual(
        liquidIncrease.map(formatEther),
        calculatedIncrease.map((b) => b.mul(50).div(100)).map(formatEther),
        'liquid rewards should be correct'
      );
      deepStrictEqual(
        prepaidIncrease.map(formatEther),
        calculatedIncrease.map((b) => b.mul(10).div(100)).map(formatEther),
        'prepaid rewards should be correct'
      );
      deepStrictEqual(
        stakingIncrease.map(formatEther),
        calculatedIncrease.map((b) => b.mul(40).div(100)).map(formatEther),
        'staking rewards should be correct'
      );
    });

    it('distributes NRT reward in 33% liquid, 33% prepaid and 33% stakes', async () => {
      // changing main dayswappers contract, since contracts won't recognize this local contract
      await global.kycDappInstanceESN.setIdentityOwner(
        formatBytes32String('DAYSWAPPERS'),
        _dayswappersInstanceESN.address,
        true,
        1
      );

      const amount = ethers.utils.parseEther('100');
      const month = await global.nrtInstanceESN.currentNrtMonth();

      const seatsBefore = await Promise.all(
        wallets.map((wallet) => _dayswappersInstanceESN.getSeatByAddressStrict(wallet.address))
      );

      const seatsMonthlyBefore = await Promise.all(
        wallets.map((wallet) =>
          _dayswappersInstanceESN.getSeatMonthlyDataByAddress(wallet.address, month)
        )
      ); //.map((seat) => seat.definiteEarnings);

      await parseReceipt(
        _dayswappersInstanceESN.rewardToTree(wallets.slice(-1)[0].address, amount, [1, 1, 1])
      );

      const seatsMonthlyAfter = await Promise.all(
        wallets.map((wallet) =>
          _dayswappersInstanceESN.getSeatMonthlyDataByAddress(wallet.address, month)
        )
      ); //.map((seat) => seat.definiteEarnings);

      const liquidIncrease = seatsMonthlyAfter.map((seatAfter, i) =>
        seatAfter.nrtEarnings[0].sub(seatsMonthlyBefore[i].nrtEarnings[0])
      );
      const prepaidIncrease = seatsMonthlyAfter.map((seatAfter, i) =>
        seatAfter.nrtEarnings[1].sub(seatsMonthlyBefore[i].nrtEarnings[1])
      );
      const stakingIncrease = seatsMonthlyAfter.map((seatAfter, i) =>
        seatAfter.nrtEarnings[2].sub(seatsMonthlyBefore[i].nrtEarnings[2])
      );

      let calculatedIncrease: ethers.BigNumber[] = [];
      let previousBelt = 0;
      let isSecondLeader = false;
      for (const seatBefore of seatsBefore.reverse()) {
        const belt = seatBefore.beltIndex;
        if (belt > previousBelt) {
          const distributionDiff =
            beltSettings[belt].distributionPercent - beltSettings[previousBelt].distributionPercent;
          calculatedIncrease.push(amount.mul(distributionDiff).div(100));
          if (beltSettings[belt].leadershipPercent > 0) {
            isSecondLeader = true;
          }
        } else if (belt === previousBelt && isSecondLeader) {
          isSecondLeader = false;
          calculatedIncrease.push(amount.mul(beltSettings[belt].leadershipPercent).div(100));
        } else {
          calculatedIncrease.push(ethers.constants.Zero);
        }
        previousBelt = belt;
      }
      calculatedIncrease = calculatedIncrease.reverse();

      // liquidIncrease.forEach((b, i) =>
      //   console.log(
      //     seatsBefore[i].beltIndex,
      //     ethers.utils.formatEther(b),
      //     ethers.utils.formatEther(calculatedIncrease[i])
      //   )
      // );

      deepStrictEqual(
        liquidIncrease.map(formatEther),
        calculatedIncrease.map((b) => b.div(3)).map(formatEther),
        'liquid rewards should be correct'
      );
      deepStrictEqual(
        prepaidIncrease.map(formatEther),
        calculatedIncrease.map((b) => b.div(3)).map(formatEther),
        'prepaid rewards should be correct'
      );
      deepStrictEqual(
        stakingIncrease.map(formatEther),
        calculatedIncrease.map((b) => b.div(3)).map(formatEther),
        'staking rewards should be correct'
      );

      // removing local contract, and setting original contract address as DAYSWAPPERS
      await global.kycDappInstanceESN.setIdentityOwner(
        formatBytes32String('DAYSWAPPERS'),
        global.dayswappersInstanceESN.address,
        true,
        1
      );
    });
  });
