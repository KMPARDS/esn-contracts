import { Register } from './Register.test';
import { UpdateKycStatus } from './UpdateKycStatus.test';

export const KycDapp = () =>
  describe('KycDapp', () => {
    Register();
    UpdateKycStatus();
  });
