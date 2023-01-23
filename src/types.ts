import { WD } from './constants';

export type ClubItem = {
  id: string;
  labels: {
    en: string;
  };
  claims: {
    [k in typeof WD[keyof typeof WD]]: any[];
  };
};
