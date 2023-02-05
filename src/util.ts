import { CompetitionGroup, EventName, FilterGroup, GetCalendarCompetitionResults, SexName, SimilarMarks } from './types';
import { WaCalculator } from '@glaivepro/wa-calculator';
import { evtDistance, filterGroups, placeScoresFinal, similarEvents, waCalculatorDisciplines } from './constants';
import { altitudeConvert } from 'tinman-altitude-conversion-calculator';

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

export const secsToMark = (secs: number): string => {
  secs = Math.round(secs * 100) / 100;
  const fPart = String(secs).includes('.') ? '.' + String(secs).split('.')[1].slice(0, 2).padEnd(2, '0') : '.00';
  if (secs < 60) return String(Math.floor(secs)) + fPart;
  const h = Math.floor(secs / (60 * 60));
  const m = Math.floor((secs - 60 * 60 * h) / 60);
  const s = secs - (60 * 60 * h + 60 * m);
  const stringSecs = String(Math.floor(s)).padStart(2, '0') + fPart;
  if (h) return String(h) + ':' + String(m).padStart(2, '0') + ':' + stringSecs;
  if (m) return String(m) + ':' + stringSecs;
  return stringSecs;
};

export const evtToWaCalculatorDiscipline = (evt: EventName): string => {
  if (evt in waCalculatorDisciplines) return waCalculatorDisciplines[evt]!;
  return evt;
};

export const reverseAltitudeConvert = (distanceInMeters: number, altitudeInFeet: number, targetConvertedTime: number) => {
  if (altitudeInFeet === 0) return targetConvertedTime;
  let guessTime = targetConvertedTime;
  let convertedTime = 0;
  while (Math.abs(convertedTime - targetConvertedTime) > 0.01) {
    convertedTime = altitudeConvert(distanceInMeters, altitudeInFeet, guessTime);
    const diff = Math.abs(convertedTime - targetConvertedTime);
    let delta = 0.01;
    if (diff > 10) delta = 1;
    if (convertedTime < targetConvertedTime) guessTime += delta;
    else guessTime -= delta;
  }
  return guessTime;
};

export const getScores = (meet: GetCalendarCompetitionResults, times: { [k in EventName]?: string }, sex: SexName, altitudeConversion: boolean) => {
  const timeSecs = Object.fromEntries(
    Object.keys(times).map((evt) => [
      evt,
      altitudeConversion
        ? reverseAltitudeConvert(evtDistance[evt as EventName], metresToFeet(meet.competition.altitude ?? 0), markToSecs(times[evt as EventName]!))
        : markToSecs(times[evt as EventName]!),
    ])
  );
  const genderPossessive = `${sex[0].toUpperCase() + sex.slice(1)}'s`;
  const eventPossessives = Object.keys(times).flatMap((evt) => [`${genderPossessive} ${evt}`, `${genderPossessive} ${evt} indoor`]);
  const scores = [];
  for (const { eventTitle, rankingCategory, events } of meet.eventTitles) {
    if ((eventTitle ?? '').toLowerCase() === 'split times') continue;
    const myEvents = events.filter((ev) => eventPossessives.some((eventPossessive) => ev.event === eventPossessive));
    if (!myEvents.length) continue;
    for (const myEvent of myEvents) {
      const evt: EventName = myEvent.event.split(genderPossessive)[1].replace('indoor', '').trim() as EventName;
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
        if (!slowestQualifier || markToSecs(slowestQualifier.mark) < timeSecs[evt]) {
          qualified = false;
          // TODO set heatResult here for points
          break;
        }
      }
      if (!qualified) continue;
      const finalsPerfs = finals.flatMap((race) => race.results);
      if (!finalsPerfs.length) continue;
      // strategy: filter to all perfs faster than you, then take the maximum place plus one (or 1)
      const place = finalsPerfs.filter((res) => markToSecs(res.mark) < timeSecs[evt]).length + 1;
      if (!heats.length && !semis.length && place === finalsPerfs.length) continue; // if you would be slower than last place in a finals-only race, assume you wouldn't be invited
      // TODO eliminate bumped out athletes? handle last place case?
      const points = new WaCalculator({
        edition: '2022',
        gender: sex === 'men' ? 'm' : 'w',
        venueType: myEvent.event.includes('indoor') ? 'indoor' : 'outdoor',
        electronicMeasurement: true,
        discipline: evtToWaCalculatorDiscipline(evt),
      }).evaluate(timeSecs[evt]);
      const placeBonus = placeScoresFinal[rankingCategory][place - 1] ?? 0;
      scores.push({
        score: points + placeBonus,
        event: evt,
        mark: secsToMark(timeSecs[evt]),
        place,
        points,
        placeBonus,
        meet: meet.competition.name,
        meetArea: meet.competition.area,
        meetVenue: meet.competition.venue,
        altitude: meet.competition.altitude,
        meetCategory: rankingCategory,
        meetId: meet.id,
        meetGroups: Object.keys(filterGroups).filter(
          (k) =>
            meet.competition.competitionGroups.some((g) => filterGroups[k as FilterGroup].includes(g as CompetitionGroup)) ||
            filterGroups[k as FilterGroup].includes(+meet.id)
        ),
        filtered: false as boolean | string,
        startDate: meet.competition.startDate,
      });
    }
  }
  return scores;
};

export const ordinal = (number: number) => {
  return (
    number +
    {
      zero: 'th',
      one: 'st',
      two: 'nd',
      few: 'rd',
      many: '',
      other: 'th',
    }[new Intl.PluralRules('en', { type: 'ordinal' }).select(number)]
  );
};

export const getMonths = (fromDate: Date, toDate: Date) => {
  const fromYear = fromDate.getFullYear();
  const fromMonth = fromDate.getMonth();
  const toYear = toDate.getFullYear();
  const toMonth = toDate.getMonth();
  const months: string[] = [];

  for (let year = fromYear; year <= toYear; year++) {
    let monthNum = year === fromYear ? fromMonth : 0;
    const monthLimit = year === toYear ? toMonth : 11;

    for (; monthNum <= monthLimit; monthNum++) {
      const month = monthNum + 1;
      let day = '01';
      if (year === fromYear && month === fromMonth) day = String(fromDate.getDate()).padStart(2, '0');
      if (year === toYear && month === toMonth) day = String(toDate.getDate()).padStart(2, '0');
      months.push(`${year}-${String(month).padStart(2, '0')}-${day}`);
    }
  }
  return months;
};

export const getSimilarMarks = (evt: EventName, sex: SexName, mark: string, generousConversion: boolean = false): SimilarMarks => {
  const score = new WaCalculator({
    edition: '2022',
    gender: sex === 'men' ? 'm' : 'w',
    venueType: generousConversion ? 'indoor' : 'outdoor',
    electronicMeasurement: true,
    discipline: evt,
  }).evaluate(markToSecs(mark));
  const scoreForMile = generousConversion
    ? new WaCalculator({
        edition: '2022',
        gender: sex === 'men' ? 'm' : 'w',
        venueType: 'outdoor',
        electronicMeasurement: true,
        discipline: evt,
      }).evaluate(markToSecs(mark))
    : score;
  const similarMarks: SimilarMarks = {};
  for (const similarEvt of similarEvents[evt] ?? []) {
    const targetScore = similarEvt === 'Mile' ? scoreForMile : score;
    const calc = new WaCalculator({
      edition: '2022',
      gender: sex === 'men' ? 'm' : 'w',
      venueType: 'outdoor',
      electronicMeasurement: true,
      discipline: evtToWaCalculatorDiscipline(similarEvt as EventName),
    });
    let similarScore = 0;
    let similarSecs = 120;
    let iterations = 0;
    const iterationLimit = 10000;
    while (similarScore !== targetScore) {
      if (iterations++ > iterationLimit) break;
      const diff = Math.abs(similarScore - targetScore);
      let delta = 1;
      if (diff < 1000) delta = 0.1;
      if (diff < 100) delta = 0.01;
      if (similarScore < targetScore) similarSecs -= delta;
      else similarSecs += delta;
      similarScore = calc.evaluate(similarSecs) ?? 0;
    }
    if (iterations > iterationLimit) continue;
    similarMarks[similarEvt as EventName] = secsToMark(similarSecs);
  }
  return similarMarks;
};

export const metresToFeet = (metres: number) => {
  return metres * 3.28084;
};
