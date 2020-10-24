import { ethers } from 'ethers';
import { ok, strictEqual } from 'assert';
import { formatBytes32String, parseEther } from 'ethers/lib/utils';
import { parseReceipt } from '../../utils';

const wallet = ethers.Wallet.createRandom();

export const AddSurvey = () =>
  describe('Add Survey', () => {
    it('tries to creates a survey with a non-kyc wallet expecting revert', async () => {
      try {
        await global.buildSurveyInstanceESN
          .connect(wallet.connect(global.providerESN))
          .addSurvey('hi', 'test1', 100, true);

        ok(false, 'error should be thrown but it was not thrown');
      } catch (error) {
        ok(
          error?.message?.includes('KYC_NOT_APPROVED'),
          'error should be related to kyc not approved'
        );
      }
    });

    it('creates a survey with a kyc approved wallet', async () => {
      await global.kycDappInstanceESN.setIdentityOwner(
        formatBytes32String('temporary_username'),
        wallet.address,
        true,
        1 // passing 1 here makes it kyc approved
      );

      // await global.kycDappInstanceESN.updateKycStatus(
      //   formatBytes32String('temporary_username'),
      //   1,
      //   ethers.constants.HashZero,
      //   ethers.constants.HashZero,
      //   1 // means kyc approved
      // );

      await global.providerESN.getSigner(0).sendTransaction({
        to: wallet.address,
        value: parseEther('100'),
      });

      const receipt = await parseReceipt(
        global.buildSurveyInstanceESN
          .connect(wallet.connect(global.providerESN))
          .addSurvey('hi', 100, true, { value: parseEther('10') })
      );

      const parsedLogs = receipt.logs
        .map((log) => {
          try {
            return global.buildSurveyInstanceESN.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter((l) => l !== null);

      if (parsedLogs.length === 0) {
        throw new Error('no logs');
      }

      if (parsedLogs[0] === null) {
        throw new Error('first log is null');
      }

      const surveyHash: string = parsedLogs[0].args.hash;
      // console.log({ surveyHash });
      ok(ethers.utils.isHexString(surveyHash), 'survey hash should be hex string');
      strictEqual(surveyHash.length, 66, 'survey hash shuold be bytes32');

      const survey = await global.buildSurveyInstanceESN.surveys(surveyHash);
      strictEqual(survey.title, 'hi', 'survey title should be set correctly by the contract');
      strictEqual(
        survey.author,
        wallet.address,
        'survey auther should be set correctly by the contract'
      );
      strictEqual(
        survey.time.toNumber(),
        100,
        'survey time should be set correctly by the contract'
      );
      strictEqual(survey.isPublic, true, 'survey isPublic should be set correctly by the contract');
    });
  });
