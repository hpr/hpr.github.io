import fs from 'fs';
import { JSDOM } from 'jsdom';

const queries = [
  {
    startDate: '2021-07-14',
    endDate: '2022-06-26',
    hideCompetitionsWithNoResults: 'true',
  },
];

const PAGE_SIZE = 100;

for (const query of queries) {
  const { startDate, endDate, hideCompetitionsWithNoResults } = query;
  const { window } = new JSDOM(await (await fetch('https://www.worldathletics.org/competition/calendar-results?' + new URLSearchParams(query))).text());
  const graphqlSrc = [...window.document.querySelectorAll('script[src]')]
    .filter((script) => script.getAttribute('src')!.match(/\/_next\/static\/chunks\/[a-z0-9]{40}\.[a-z0-9]{20}\.js/))[1]
    .getAttribute('src');
  const graphqlJs = await (await fetch(`https://worldathletics.org${graphqlSrc}`)).text();
  const { endpoint, apiKey } = JSON.parse(graphqlJs.match(/graphql:({.*?})/)![1].replace(/\s*(['"])?([a-z0-9A-Z_\.]+)(['"])?\s*:([^,\}]+)(,)?/g, '"$2": $4$5'));
  const fetchComps = async (offset: number) =>
    await (
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: JSON.stringify({
          operationName: 'getCalendarEvents',
          query: `query getCalendarEvents($startDate: String, $endDate: String, $query: String, $regionType: String, $regionId: Int, $currentSeason: Boolean, $disciplineId: Int, $rankingCategoryId: Int, $permitLevelId: Int, $competitionGroupId: Int, $competitionSubgroupId: Int, $competitionGroupSlug: String, $limit: Int, $offset: Int, $showOptionsWithNoHits: Boolean, $hideCompetitionsWithNoResults: Boolean, $orderDirection: OrderDirectionEnum) {
          getCalendarEvents(startDate: $startDate, endDate: $endDate, query: $query, regionType: $regionType, regionId: $regionId, currentSeason: $currentSeason, disciplineId: $disciplineId, rankingCategoryId: $rankingCategoryId, permitLevelId: $permitLevelId, competitionGroupId: $competitionGroupId, competitionSubgroupId: $competitionSubgroupId, competitionGroupSlug: $competitionGroupSlug, limit: $limit, offset: $offset, showOptionsWithNoHits: $showOptionsWithNoHits, hideCompetitionsWithNoResults: $hideCompetitionsWithNoResults, orderDirection: $orderDirection) {
            hits
            paginationPage
            defaultOffset
            options {
              regions {
                world {
                  id
                  name
                  count
                  __typename
                }
                area {
                  id
                  name
                  count
                  __typename
                }
                country {
                  id
                  name
                  count
                  __typename
                }
                __typename
              }
              disciplines {
                id
                name
                count
                __typename
              }
              rankingCategories {
                id
                name
                count
                __typename
              }
              disciplines {
                id
                name
                count
                __typename
              }
              permitLevels {
                id
                name
                count
                __typename
              }
              competitionGroups {
                id
                name
                count
                __typename
              }
              competitionSubgroups {
                id
                name
                count
                __typename
              }
              __typename
            }
            parameters {
              startDate
              endDate
              query
              regionType
              regionId
              disciplineId
              rankingCategoryId
              permitLevelId
              competitionGroupId
              competitionSubgroupId
              limit
              offset
              showOptionsWithNoHits
              hideCompetitionsWithNoResults
              __typename
            }
            results {
              id
              iaafId
              hasResults
              hasApiResults
              hasStartlist
              name
              venue
              area
              rankingCategory
              disciplines
              competitionGroup
              competitionSubgroup
              startDate
              endDate
              dateRange
              hasCompetitionInformation
              undeterminedCompetitionPeriod {
                status
                label
                remark
                __typename
              }
              season
              wasUrl
              __typename
            }
            __typename
          }
        }`,
          variables: {
            competitionGroupId: null,
            competitionSubgroupId: null,
            disciplineId: null,
            endDate,
            hideCompetitionsWithNoResults: hideCompetitionsWithNoResults === 'true',
            limit: PAGE_SIZE,
            offset,
            orderDirection: 'Ascending',
            permitLevelId: null,
            query: null,
            rankingCategoryId: null,
            regionId: null,
            regionType: 'world',
            showOptionsWithNoHits: false,
            startDate,
          },
        }),
      })
    ).json();
  let offset = 0;
  const competitions = await fetchComps(offset);
  let curComp = competitions;
  while (curComp.data.getCalendarEvents.results.length === PAGE_SIZE) {
    offset += PAGE_SIZE;
    curComp = await fetchComps(offset);
    competitions.data.getCalendarEvents.results.push(...curComp.data.getCalendarEvents.results);
  }
  fs.writeFileSync(`./public/competitions/${startDate}_${endDate}.json`, JSON.stringify({ query, competitions }, null, 2));
}
