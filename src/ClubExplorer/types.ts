import { WD } from './constants';

export type WDProp = typeof WD[keyof typeof WD];
export type WDClaim = {
  value: string;
  qualifiers: { [k in WDProp]: string[] };
  references: { [k in WDProp]: string[] }[];
};

export type WDItem = {
  id: string;
  labels: {
    en: string;
  };
  claims: {
    [k in WDProp]: WDClaim[];
  };
};

export type WDEntities = { [qid: string]: WDItem };
