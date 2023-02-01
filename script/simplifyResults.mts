import fs from 'fs';
import { GetCalendarCompetitionResults, CalendarEvent } from '../src/types';

const queries = [
  {
    startDate: '2021-07-14',
    endDate: '2022-06-26',
  },
];

for (const query of queries) {
  const { startDate, endDate } = query;
  const input = JSON.parse(fs.readFileSync(`./public/results/${startDate}_${endDate}.json`, 'utf-8'));
  const competitions = JSON.parse(fs.readFileSync(`./public/competitions/${startDate}_${endDate}.json`, 'utf-8')).competitions.data.getCalendarEvents.results;
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
    input.results[id] = {
      id: +id,
      competition: {
        startDate: competition.startDate,
        endDate: competition.endDate,
        venue: competition.venue,
        area: calendarEvent?.area,
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
  }

  fs.writeFileSync(`./public/results/${startDate}_${endDate}_simplified.json`, JSON.stringify(input));
}
