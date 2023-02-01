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
  {
    event: '1500m',
    sex: 'women',
    regionType: 'world',
    page: '1',
    rankDate: '2022-06-26',
    limitByCountry: '3',
  },
  {
    event: '800m',
    sex: 'men',
    regionType: 'world',
    page: '1',
    rankDate: '2022-06-26',
    limitByCountry: '3',
  },
  {
    event: '800m',
    sex: 'women',
    regionType: 'world',
    page: '1',
    rankDate: '2022-06-26',
    limitByCountry: '3',
  },
  {
    event: '5000m',
    sex: 'men',
    regionType: 'world',
    page: '1',
    rankDate: '2022-06-26',
    limitByCountry: '3',
  },
  {
    event: '5000m',
    sex: 'women',
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
  const rankings = await Promise.all(
    [...window.document.querySelectorAll('table.records-table > tbody > tr')].map(async (tr) => ({
      ...Object.fromEntries([...tr.querySelectorAll('td')].map((td) => [td.getAttribute('data-th'), td.textContent?.trim()])),
      RankingScoreCalculation: JSON.parse(
        await (
          await fetch(
            `https://www.worldathletics.org/WorldRanking/RankingScoreCalculation?${new URLSearchParams({ competitorId: tr.getAttribute('data-id')! })}`
          )
        ).json()
      ),
    }))
  );
  fs.writeFileSync(`./public/rankings/${event}_${sex}.json`, JSON.stringify({ query, rankings }, null, 2));
}
