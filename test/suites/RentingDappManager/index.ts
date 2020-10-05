import { AddItem } from './AddItem.test';
import { CreateAgreement } from './CreateAgreement.test';

export const RentingDappManager = () =>
  describe('Renting Dapp Manager', () => {
    AddItem();
    CreateAgreement();
  });
