import {
  Box,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import React, { useEffect, useState } from 'react';
import { areaChampionshipGroups, fieldSizes, nationalChampionshipGroups, nationalChampionshipOverrideIds } from './constants';
import { CalendarEvent, EventName, GetCalendarCompetitionResults, Ranking, RankingsQuery, SexName } from './types';
import { getScores, ordinal } from './util';

const App = () => {
  const [startDate] = useState('2021-07-14');
  const [endDate] = useState('2022-06-26');
  const [evt, setEvt] = useState<EventName>('1500m');
  const [sex, setSex] = useState<SexName>('men');
  const [time, setTime] = useState<string>('3:43.00');
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [rankingsQuery, setRankingsQuery] = useState<RankingsQuery | null>(null);
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
        const { rankings, query } = await (await fetch(`rankings/${evt}_${sex}.json`)).json();
        setRankings(rankings);
        setRankingsQuery(query);
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
      <FormControl sx={{ marginTop: 2 }}>
        <InputLabel id="sex-label">Sex</InputLabel>
        <Select labelId="sex-label" label="Sex" value={sex} onChange={(e) => setSex(e.target.value as SexName)}>
          {['men', 'women'].map((evt) => (
            <MenuItem key={evt} value={evt}>
              {evt}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField />
      <div>
        Target Score:{' '}
        {rankingsQuery && (
          <Link
            href={`https://www.worldathletics.org/world-rankings/${rankingsQuery.event}/${rankingsQuery.sex}?${new URLSearchParams({
              regionType: rankingsQuery.regionType,
              page: rankingsQuery.page,
              rankDate: rankingsQuery.rankDate,
              limitByCountry: rankingsQuery.limitByCountry,
            })}`}
          >
            {targetScore} (#{fieldSizes[evt]})
          </Link>
        )}
      </div>
      <div>
        {evt} PB: {time}
      </div>

      <div>Strategic Top 5:</div>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Meet</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Place</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Calculation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {meetPoints.map(({ meet, startDate, place, points, score, placeBonus, meetId }, i) => {
              return (
                <TableRow key={meetId}>
                  <TableCell>
                    <Link href={`https://www.worldathletics.org/competition/calendar-results/results/${meetId}`}>
                      {meet} (#{meetId})
                    </Link>
                  </TableCell>
                  <TableCell>{startDate}</TableCell>
                  <TableCell>{ordinal(place)}</TableCell>
                  <TableCell>{score}</TableCell>
                  <TableCell>
                    ({points} + {placeBonus})
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <div>Average score: {meetPoints.reduce((acc, x) => acc + x.score, 0) / 5}</div>
    </Box>
  );
};

export default App;
