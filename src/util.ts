import WBK from 'wikibase-sdk';
import { WDEntities } from './types';

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
