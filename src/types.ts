import { WD } from './constants';

type WDProp = typeof WD[keyof typeof WD];

export type WDItem = {
  id: string;
  labels: {
    en: string;
  };
  claims: {
    [k in WDProp]: {
      value: string;
      qualifiers: { [k in WDProp]: string[] };
      references: { [k in WDProp]: string[] }[];
    }[];
  };
};

export type WDEntities = { [qid: string]: WDItem };
