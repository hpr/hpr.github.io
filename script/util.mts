import { JSDOM } from 'jsdom';

export const getGraphql = async (url: string = 'https://www.worldathletics.org/404'): Promise<{ endpoint: string; apiKey: string }> => {
  const { window } = new JSDOM(await (await fetch(url)).text());
  const graphqlSrc = [...window.document.querySelectorAll('script[src]')]
    .filter((script) => script.getAttribute('src')!.match(/\/_next\/static\/chunks\/[a-z0-9]{40}\.[a-z0-9]{20}\.js/))[1]
    .getAttribute('src');
  const graphqlJs = await (await fetch(`https://worldathletics.org${graphqlSrc}`)).text();
  const { endpoint, apiKey } = JSON.parse(graphqlJs.match(/graphql:({.*?})/)![1].replace(/\s*(['"])?([a-z0-9A-Z_\.]+)(['"])?\s*:([^,\}]+)(,)?/g, '"$2": $4$5'));
  return { endpoint, apiKey };
};
