import { NrtRelease } from './NrtRelease.test';
import { TimeAllyStaking } from './TimeAllyStaking.test';

export const NRT = () => {
  describe('NRT Framework', () => {
    NrtRelease();
    TimeAllyStaking();
  });
};
