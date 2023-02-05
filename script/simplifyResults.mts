import fs from 'fs';
import { GetCalendarCompetitionResults, CalendarEvent } from '../src/types';
import WBK from 'wikibase-sdk';
import { WD } from './constants.mjs';
import { exit } from 'process';

const queries = [
  {
    startDate: '2021-07-14',
    endDate: '2022-06-26',
  },
];

const wdCache = JSON.parse(fs.readFileSync('./script/wdCache.json', 'utf-8'));
// for (const city in wdCache.cities) {
//   if (wdCache.cities[city].length > 5) wdCache.cities[city] = undefined;
// }
const wbk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
});

const sanitizeCity = (city: string) => {
  return city
    .split(' ')
    .map((word) => {
      if (word === 'St') return 'Saint';
      return word;
    })
    .join(' ');
};

for (const query of queries) {
  const { startDate, endDate } = query;
  const input = JSON.parse(fs.readFileSync(`./public/results/${startDate}_${endDate}.json`, 'utf-8'));
  const competitions = JSON.parse(fs.readFileSync(`./public/competitions/${startDate}_${endDate}.json`, 'utf-8')).competitions.data.getCalendarEvents.results;
  let i = 0;
  for (const id in input.results) {
    if (!input.results[id]) continue;
    const calendarEvent = competitions.find((c: CalendarEvent) => +c.id === +id);
    const competitionGroups = calendarEvent?.competitionGroup ? calendarEvent.competitionGroup.split(', ') : [];
    const { competition, eventTitles }: GetCalendarCompetitionResults = input.results[id].data.getCalendarCompetitionResults;
    // if (
    //   competition.name.toLowerCase().includes('championships') &&
    //   !Object.values(filterGroups)
    //     .flat()
    //     .some((g) => competitionGroups.includes(g) || +id === g)
    // ) {
    //   console.log(competition.name, competitionGroups, id);
    // }
    // competition.venue = 'The Nike Track & Field Center at The Armory, New York, NY (USA)';
    console.log(i, competition.venue);
    const iocCode = competition.venue.slice(competition.venue.lastIndexOf('(') + 1, -1);
    let qCountry =
      wdCache.countries[iocCode] ??
      console.log('fetching country') ??
      (wdCache.countries[iocCode] = (
        await (await fetch(wbk.cirrusSearchPages({ haswbstatement: `${WD.P_IOC_COUNTRY_CODE}=${iocCode}` }))).json()
      ).query.search[0].title);
    let qTerritory: string | undefined = undefined;
    if (Array.isArray(qCountry)) {
      // us territory
      [qCountry, qTerritory] = qCountry;
    }
    const venueNoCountry = competition.venue.slice(0, competition.venue.lastIndexOf('(')).trim();
    const city = sanitizeCity(
      qCountry === WD.Q_UNITED_STATES_OF_AMERICA && !qTerritory ? venueNoCountry.split(', ').at(-2)! : venueNoCountry.split(', ').at(-1)!
    );
    let qCity: string;
    let qStateOrTerritory: string | undefined = undefined;
    if (qCountry === WD.Q_UNITED_STATES_OF_AMERICA) {
      const state = venueNoCountry.split(' ').at(-1)!;
      qStateOrTerritory =
        qTerritory ??
        wdCache.states[state] ??
        console.log('fetching state') ??
        (wdCache.states[state] = (
          await (await fetch(wbk.cirrusSearchPages({ search: state, haswbstatement: `${WD.P_INSTANCE_OF}=${WD.Q_US_STATE}` }))).json()
        ).query.search[0].title);
    }
    const haswbstatement =
      (qStateOrTerritory ? `${WD.P_LOCATED_IN_THE_ADMINISTRATIVE_TERRITORIAL_ENTITY}=${qStateOrTerritory}` : `${WD.P_COUNTRY}=${qCountry}`) +
      `|${WD.P_ELEVATION_ABOVE_SEA_LEVEL}=*`;
    const citySearchUrl = wbk.cirrusSearchPages({ search: city, haswbstatement });
    console.log(' ', city, citySearchUrl);
    qCity =
      wdCache.cities[competition.venue] ??
      console.log('fetching city') ??
      (wdCache.cities[competition.venue] = (await (await fetch(citySearchUrl)).json()).query.search[0].title);
    const altitude =
      city in wdCache.altitude
        ? wdCache.altitude[qCity]
        : (wdCache.altitude[qCity] = +(
            wbk.simplify.entities(await (await fetch(wbk.getEntities(qCity))).json(), { keepRichValues: true })[qCity].claims[WD.P_ELEVATION_ABOVE_SEA_LEVEL] ??
            []
          ).find((claim: any) => claim.unit === WD.Q_METRE)?.amount);
    console.log(' ', qCity, altitude);
    // exit();
    input.results[id] = {
      id: +id,
      competition: {
        startDate: competition.startDate,
        endDate: competition.endDate,
        venue: competition.venue,
        area: calendarEvent?.area,
        altitude,
        name: competition.name,
        competitionGroups,
      },
      eventTitles: eventTitles.map((et) => ({
        rankingCategory: et.rankingCategory,
        eventTitle: et.eventTitle ?? undefined,
        events: et.events.map((ev) => ({
          ...ev,
          __typename: undefined,
          races: ev.races.map((race) => ({
            race: race.race,
            raceId: race.raceId,
            raceNumber: race.raceNumber,
            wind: race.wind,
            results: race.results.map((result) => ({
              mark: result.mark,
              place: result.place,
              points: result.points ?? undefined,
              wind: result.wind ?? undefined,
              competitor: {
                name: result.competitor.name,
                birthDate: result.competitor.birthDate,
                urlSlug: result.competitor.urlSlug,
              },
            })),
          })),
        })),
      })),
    };
    if (i++ % 50 === 0) fs.writeFileSync('./script/wdCache.json', JSON.stringify(wdCache, null, 2));
  }
  fs.writeFileSync('./script/wdCache.json', JSON.stringify(wdCache, null, 2));
  fs.writeFileSync(`./public/results/${startDate}_${endDate}_simplified.json`, JSON.stringify(input));
}
