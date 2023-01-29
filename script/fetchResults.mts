import fs from 'fs';
import { getCalendarCompetitionResults_query } from './constants.mjs';
import { getGraphql } from './util.mjs';

const queries = [
  {
    startDate: '2021-07-14',
    endDate: '2022-06-26',
  },
];

const { endpoint, apiKey } = await getGraphql();

for (const query of queries) {
  const { startDate, endDate } = query;
  const fileName = `./public/results/${startDate}_${endDate}.json`;
  let results: { [k: number]: object | null } = {};
  try {
    ({ results } = JSON.parse(fs.readFileSync(fileName, 'utf-8')));
  } catch {}
  const { competitions } = JSON.parse(fs.readFileSync(`./public/competitions/${startDate}_${endDate}.json`, 'utf-8'));
  console.log(competitions.data.getCalendarEvents.results.length);
  let i = 0;
  for (const calEvent of competitions.data.getCalendarEvents.results) {
    console.log(++i);
    if (calEvent.id in results) continue;
    const eventResults = await (
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: JSON.stringify({
          operationName: 'getCalendarCompetitionResults',
          query: getCalendarCompetitionResults_query,
          variables: {
            competitionId: calEvent.id,
            day: null,
            eventId: null,
          },
        }),
      })
    ).json();
    if (eventResults.data.getCalendarCompetitionResults === null) {
      results[calEvent.id] = null;
      continue;
    }
    const days: number[] = eventResults.data.getCalendarCompetitionResults.options.days.map((d: { day: number }) => d.day);
    const firstDay: number = eventResults.data.getCalendarCompetitionResults.parameters.day;
    for (const day of days) {
      if (day === firstDay) continue;
      const dayResults = await (
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'x-api-key': apiKey },
          body: JSON.stringify({
            operationName: 'getCalendarCompetitionResults',
            query: getCalendarCompetitionResults_query,
            variables: {
              competitionId: calEvent.id,
              day,
              eventId: null,
            },
          }),
        })
      ).json();
      for (const eventTitleObj of dayResults.data.getCalendarCompetitionResults.eventTitles) {
        const matchingEventTitle = eventResults.data.getCalendarCompetitionResults.eventTitles.find(
          (et: { eventTitle: string; rankingCategory: string }) =>
            et.eventTitle === eventTitleObj.eventTitle && et.rankingCategory === eventTitleObj.rankingCategory
        );
        if (!matchingEventTitle) eventResults.data.getCalendarCompetitionResults.eventTitles.push(eventTitleObj);
        else {
          for (const eventObj of eventTitleObj.events) {
            const matchingEvent = matchingEventTitle.events.find((evt: { eventId: number }) => evt.eventId === eventObj.eventId);
            if (!matchingEvent) matchingEventTitle.events.push(eventObj);
            else matchingEvent.races.push(...eventObj.races);
          }
        }
      }
    }
    results[calEvent.id] = eventResults;
    if (i % 10 === 0) fs.writeFileSync(fileName, JSON.stringify({ query, results }));
  }
  fs.writeFileSync(fileName, JSON.stringify({ query, results }));
}
