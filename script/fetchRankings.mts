import fs from 'fs';
import { JSDOM } from 'jsdom';

const rankQueries = [
  {
    event: '1500m',
    sex: 'men',
    regionType: 'world',
    page: '1',
    rankDate: '2022-06-26',
    limitByCountry: '3',
  },
];

for (const query of rankQueries) {
  const { event, sex, regionType, page, rankDate, limitByCountry } = query;
  const { window } = new JSDOM(
    await (
      await fetch(`https://www.worldathletics.org/world-rankings/${event}/${sex}?` + new URLSearchParams({ regionType, page, rankDate, limitByCountry }))
    ).text()
  );
  const rankings = [...window.document.querySelectorAll('table.records-table > tbody > tr')].map((tr) =>
    Object.fromEntries([...tr.querySelectorAll('td')].map((td) => [td.getAttribute('data-th'), td.textContent?.trim()]))
  );
  fs.writeFileSync(`./public/rankings/${event}_${sex}.json`, JSON.stringify({ query, rankings }, null, 2));
}
