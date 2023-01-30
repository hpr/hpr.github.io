import fs from 'fs';
import { GetCalendarCompetitionResults } from '../src/types';

const queries = [
  {
    startDate: '2021-07-14',
    endDate: '2022-06-26',
  },
];

for (const query of queries) {
  const { startDate, endDate } = query;
  const input = JSON.parse(fs.readFileSync(`./public/results/${startDate}_${endDate}.json`, 'utf-8'));
  for (const id in input.results) {
    if (!input.results[id]) continue;
    const { competition, eventTitles }: GetCalendarCompetitionResults = input.results[id].data.getCalendarCompetitionResults;
    input.results[id] = {
      competition: {
        startDate: competition.startDate,
        endDate: competition.endDate,
        venue: competition.venue,
        name: competition.name,
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
  }

  fs.writeFileSync(`./public/results/${startDate}_${endDate}_simplified.json`, JSON.stringify(input));
}
