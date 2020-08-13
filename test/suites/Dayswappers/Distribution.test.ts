import { Dayswappers } from '../../../build/typechain/ESN/Dayswappers';
import { DayswappersFactory } from '../../../build/typechain/ESN';
import { ethers } from 'ethers';
import { parseReceipt } from '../../utils';
import { strictEqual } from 'assert';
import { formatEther } from 'ethers/lib/utils';

let _dayswappersInstanceESN: Dayswappers;
const wallets: ethers.Wallet[] = [];
let belts: number[];

export const Distribution = () =>
  describe('Distribution', () => {
    before(async () => {
      // STEP 1: deploying dayswappers contract
      const dayswappersFactory = new DayswappersFactory(
        global.providerESN.getSigner(global.accountsESN[0])
      );

      _dayswappersInstanceESN = await dayswappersFactory.deploy([
        { required: 0, distributionPercent: 0, leadershipPercent: 0 },
        { required: 3, distributionPercent: 20, leadershipPercent: 0 },
        { required: 6, distributionPercent: 40, leadershipPercent: 0 },
        { required: 9, distributionPercent: 52, leadershipPercent: 0 },
        { required: 12, distributionPercent: 64, leadershipPercent: 0 },
        { required: 15, distributionPercent: 72, leadershipPercent: 4 },
        { required: 18, distributionPercent: 84, leadershipPercent: 4 },
        { required: 21, distributionPercent: 90, leadershipPercent: 2 },
      ]);

      // STEP 2: Settign initial value
      await _dayswappersInstanceESN.setInitialValues(
        global.nrtInstanceESN.address,
        global.kycDappInstanceESN.address
      );

      // STEP 3: join and resolve kyc
      for (let i = 0; i < 25; i++) {
        const wallet = ethers.Wallet.createRandom();

        const upline = wallets.slice(-1)[0]?.address ?? ethers.constants.AddressZero;

        await parseReceipt(
          _dayswappersInstanceESN.connect(wallet.connect(global.providerESN)).join(upline)
        );
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
            _dayswappersInstanceESN.connect(wallet.connect(global.providerESN)).promoteSelf(month)
          );
        } catch {}

        belts = (
          await Promise.all(
            wallets.map((wallet) => _dayswappersInstanceESN.getSeatByAddress(wallet.address))
          )
        ).map((seat) => seat.beltId);
      }
    });

    it('distributes 100 ES', async () => {
      const amount = ethers.utils.parseEther('100');

      const balancesBefore = await Promise.all(
        wallets.map((wallet) => global.providerESN.getBalance(wallet.address))
      );
      await parseReceipt(
        _dayswappersInstanceESN.distributeToTree(wallets.slice(-1)[0].address, {
          value: amount,
        })
      );
      const balancesAfter = await Promise.all(
        wallets.map((wallet) => global.providerESN.getBalance(wallet.address))
      );

      const balanceIncrease = balancesAfter.map((balanceAfter, i) =>
        balanceAfter.sub(balancesBefore[i])
      );

      balanceIncrease.forEach((b, i) => console.log(belts[i], ethers.utils.formatEther(b)));
    });
  });
