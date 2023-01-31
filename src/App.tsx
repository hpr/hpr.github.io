import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { areaChampionshipGroups, fieldSizes, nationalChampionshipGroups, nationalChampionshipOverrideIds } from './constants';
import { CalendarEvent, EventName, GetCalendarCompetitionResults, Ranking, SexName } from './types';
import { getScores } from './util';

const App = () => {
  const [startDate] = useState('2021-07-14');
  const [endDate] = useState('2022-06-26');
  const [evt, setEvt] = useState<EventName>('1500m');
  const [sex, setSex] = useState<SexName>('men');
  const [time, setTime] = useState<string>('3:45.00');
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [results, setResults] = useState<{ [meetId: string]: GetCalendarCompetitionResults }>({});
  const [competitions, setCompetitions] = useState<CalendarEvent[]>([]);
  const [targetScore, setTargetScore] = useState(0);
  useEffect(
    () =>
      void (async () => {
        const { results } = await (await fetch(`results/${startDate}_${endDate}_simplified.json`)).json();
        setResults(results);
        const { competitions } = await (await fetch(`competitions/${startDate}_${endDate}.json`)).json();
        setCompetitions(competitions.data.getCalendarEvents.results);
      })(),
    []
  );
  useEffect(
    () =>
      void (async () => {
        const { rankings } = await (await fetch(`rankings/${evt}_${sex}.json`)).json();
        setRankings(rankings);
      })(),
    [evt, sex]
  );
  useEffect(() => {
    if (rankings.length) setTargetScore(+rankings[fieldSizes[evt] - 1].score);
  }, [rankings]);

  const meetPoints = Object.values(results)
    .filter((x) => x)
    .flatMap((meet) => getScores(meet, evt, sex, time))
    .sort((a, b) => b.score - a.score)
    .filter(({ meetId }) => {
      const meet = competitions.find((meet) => meet.id === +meetId);
      if ([...areaChampionshipGroups, ...nationalChampionshipGroups].includes(meet?.competitionGroup!)) return false;
      if (nationalChampionshipOverrideIds.includes(+meetId)) return false;
      return true;
    })
    .slice(0, 5);

  return (
    <Box sx={{ minWidth: 120, textAlign: 'center' }}>
      <FormControl sx={{ marginTop: 2 }}>
        <InputLabel id="event-label">Event</InputLabel>
        <Select labelId="event-label" label="Event" value={evt} onChange={(e) => setEvt(e.target.value as EventName)}>
          {['800m', '1500m', '5000m'].map((evt) => (
            <MenuItem key={evt} value={evt}>
              {evt}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <div>Target Score: {targetScore}</div>
      <div>{evt} PB: {time}</div>
      <div>Strategic Top 5:</div>
      <ol>
        {meetPoints.map(({ meet, startDate, place, points, score, placeBonus, meetId }, i) => {
          return (
            <li key={i}>
              {meet} {startDate} (#{meetId}): {place} place, {score} ({points} + {placeBonus})
            </li>
          );
        })}
      </ol>
      <div>Average score: {meetPoints.reduce((acc, x) => acc + x.score, 0) / 5}</div>
    </Box>
  );
};

export default App;
