import fs from 'fs';

const queries = [
  {
    startDate: '2021-07-14',
    endDate: '2022-06-26',
  },
];

type Competitor = {
  name: string;
  birthDate: string;
  urlSlug: string;
};

type Result = {
  mark: string;
  place: string;
  points?: string;
  wind?: string;
  competitor: Competitor;
};

type Race = {
  race: string;
  raceId: number;
  raceNumber: number;
  wind?: string;
  results: Result[];
};

type Event = {
  races: Race[];
};

type EventTitle = {
  rankingCategory: string;
  events: Event[];
};

for (const query of queries) {
  const { startDate, endDate } = query;
  const input = JSON.parse(fs.readFileSync(`./public/results/${startDate}_${endDate}.json`, 'utf-8'));
  for (const id in input.results) {
    if (!input.results[id]) continue;
    const eventTitles = input.results[id].data.getCalendarCompetitionResults.eventTitles as EventTitle[];
    input.results[id] = {
      id,
      eventTitles: eventTitles.map((et) => ({
        rankingCategory: et.rankingCategory,
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
