import { EventName, GetCalendarCompetitionResults, SexName } from './types';
import { WaCalculator } from '@glaivepro/wa-calculator';
import { placeScoresFinal } from './constants';

export const markToSecs = (mark: string): number => {
  if (mark.includes('(')) mark = mark.slice(0, mark.indexOf('(')).trim();
  mark = mark.replaceAll('h', '').replaceAll('+', '').replaceAll('*', '').trim();
  const [iPart, fPart] = mark.split('.');
  const groups = iPart.split(':');
  let res: number;
  if (groups.length === 1) res = +iPart;
  if (groups.length === 2) res = +groups[0] * 60 + +groups[1];
  if (groups.length === 3) res = +groups[0] * 60 * 60 + +groups[1] * 60 + +groups[2];
  return Number(String(res!) + (fPart ? '.' + fPart : ''));
};

export const perfPoints = (mark: string, evt: EventName) => {};

export const getScores = (meet: GetCalendarCompetitionResults, evt: EventName, sex: SexName, time: string) => {
  let indoor = false;
  const timeSecs = markToSecs(time);
  const eventPossessive = `${sex[0].toUpperCase() + sex.slice(1)}'s ${evt}`;
  const scores = [];
  for (const { eventTitle, rankingCategory, events } of meet.eventTitles) {
    const myEvent = events.find((ev) => ev.event.startsWith(eventPossessive));
    if (!myEvent) continue;
    if (myEvent.event.includes('indoor')) indoor = true;
    const [heats, semis, finals] = ['Heat', 'Semifinal', 'Final'].map((round) => myEvent.races.filter((race) => race.race === round));
    let qualified = true;
    for (const round of [heats, semis]) {
      if (!round.length) continue;
      const qualifiers = round.flatMap((race) => {
        return race.results.filter((result) =>
          finals.find((finalRace) => finalRace.results.find((finalRes) => finalRes.competitor.name === result.competitor.name))
        );
      });
      const slowestQualifier = qualifiers.sort((a, b) => markToSecs(a.mark) - markToSecs(b.mark))[0];
      if (!slowestQualifier || markToSecs(slowestQualifier.mark) < timeSecs) {
        qualified = false;
        // TODO set heatResult here for points
        break;
      }
    }
    if (!qualified) continue;
    const finalsPerfs = finals.flatMap((race) => race.results);
    if (!finalsPerfs.length) continue;
    // strategy: filter to all perfs faster than you, then take the maximum place plus one (or 1)
    const place = finalsPerfs.filter((res) => markToSecs(res.mark) < timeSecs).length + 1;
    // TODO eliminate bumped out athletes? handle last place case?
    const points = new WaCalculator({
      edition: '2022',
      gender: sex === 'men' ? 'm' : 'w',
      venueType: indoor ? 'indoor' : 'outdoor',
      electronicMeasurement: true,
      discipline: evt,
    }).evaluate(timeSecs);
    const placeBonus = placeScoresFinal[rankingCategory][place - 1] ?? 0;
    scores.push({
      score: points + placeBonus,
      place,
      points,
      placeBonus,
      meet: meet.competition.name,
      meetId: meet.id,
      startDate: meet.competition.startDate,
    });
  }
  return scores;
};

export const ordinal = (number: number) => {
  return number + {
    zero: 'th',
    one: 'st',
    two: 'nd',
    few: 'rd',
    many: '',
    other: 'th',
  }[new Intl.PluralRules('en', { type: 'ordinal' }).select(number)];
};
