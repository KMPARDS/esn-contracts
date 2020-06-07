import { BunchPosting } from './BunchPosting.test';
import { ReversePosting } from './ReversePosting.test';

export const Plasma = () => {
  describe('Plasma', () => {
    BunchPosting();
    ReversePosting();
  });
};
