import WBK from 'wikibase-sdk';
import { WDClaim, WDEntities, WDItem, WDProp } from './types';

const wbk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
});

export const fetchAll = async (urls: string[]) => {
  let result = { entities: {} };
  for (const url of urls) {
    result = { ...result, entities: { ...result.entities, ...(await (await fetch(url)).json()).entities } };
  }
  return result;
};

export const getWDFromStorage = async (key: string, qids: string[]): Promise<WDEntities> => {
  if (localStorage.getItem(key)) {
    return JSON.parse(localStorage.getItem(key)!);
  } else {
    const entities = wbk.simplify.entities(await fetchAll(wbk.getManyEntities(qids)), {
      keepQualifiers: true,
      keepReferences: true,
    });
    localStorage.setItem(key, JSON.stringify(entities));
    return entities;
  }
};

export const fmtTime = (time: number) => {
  const decimal = String(time).split('.')[1];
  const suffix = decimal ? '.' + decimal : '';
  const qty = Math.floor(time);
  const hrs = Math.floor(qty / (60 * 60));
  const mins = Math.floor(qty / 60) % 60;
  const secs = qty % 60;
  if (hrs) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}${suffix}`;
  if (mins) return `${mins}:${String(secs).padStart(2, '0')}${mins < 10 ? '.' + (decimal ?? '0').padEnd(2, '0') : suffix}`;
  return secs + '.' + decimal.padEnd(2, '0');
};

export const getQual = (claim: WDClaim, qualifier: WDProp) => {
  return (claim.qualifiers[qualifier] ?? [])[0];
};

export const getClaim = (entity: WDItem, claim: WDProp) => {
  return (entity.claims[claim] ?? [])[0]?.value;
};
