import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
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
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import React, { useEffect, useState } from 'react';
import { countryCodes, fieldSizes, filterGroups, perfsToAverage } from './constants';
import { Area, CalendarEvent, CompetitionGroup, EventName, FilterGroup, GetCalendarCompetitionResults, Ranking, RankingsQuery, SexName } from './types';
import { getScores, markToSecs, ordinal } from './util';

const App = () => {
  const [startDate] = useState('2021-07-14');
  const [endDate] = useState('2022-06-26');
  const [evt, setEvt] = useState<EventName>('1500m');
  const [sex, setSex] = useState<SexName>('men');
  const [time, setTime] = useState<string>('3:43.00');
  const [country, setCountry] = useState<string>('USA');
  const [area, setArea] = useState<Area | undefined>('North and Central America');
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [rankingsQuery, setRankingsQuery] = useState<RankingsQuery | null>(null);
  const [results, setResults] = useState<{ [meetId: string]: GetCalendarCompetitionResults }>({});
  const [excludeIds, setExcludeIds] = useState<number[]>([]);
  // const [competitions, setCompetitions] = useState<CalendarEvent[]>([]);
  const [filterChecks, setFilterChecks] = useState<{ [k in FilterGroup]: boolean }>(
    Object.fromEntries(Object.keys(filterGroups).map((key) => [key, true])) as { [k in FilterGroup]: boolean }
  );
  const [targetScore, setTargetScore] = useState(0);
  useEffect(
    () =>
      void (async () => {
        const { results } = await (await fetch(`results/${startDate}_${endDate}_simplified.json`)).json();
        setResults(results);
        // const { competitions } = await (await fetch(`competitions/${startDate}_${endDate}.json`)).json();
        // setCompetitions(competitions.data.getCalendarEvents.results);
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
    setExcludeIds([]);
  }, [evt, sex, time, country]);
  useEffect(() => {
    const meetInCountry = Object.values(results).find((c) => c && c.competition.venue.endsWith(`(${country})`));
    setArea(meetInCountry?.competition.area ?? undefined);
  }, [country]);
  useEffect(() => {
    if (rankings.length) setTargetScore(+rankings[fieldSizes[evt] - 1].score);
  }, [rankings]);

  const meetScores = Object.values(results)
    .filter((x) => x)
    .flatMap((meet) => getScores(meet, evt, sex, time))
    .sort((a, b) => b.score - a.score);

  const meetsToDisplay = [];
  const targetSize = perfsToAverage[evt];
  let numValidMeets = 0;
  for (const meet of meetScores) {
    if (numValidMeets === targetSize) break;
    const { meetGroups, meetArea, meetVenue, meetId } = meet;
    if (excludeIds.includes(meetId)) meet.filtered = true;
    for (const key in filterChecks) {
      if (filterChecks[key as FilterGroup] && meetGroups.includes(key)) {
        if (key.includes('Area') && area === meetArea) continue;
        if ((key.includes('National') || key === 'NCAA Championships') && meetVenue.endsWith(`(${country})`)) continue;
        meet.filtered = true;
        break;
      }
    }
    if (!meet.filtered) numValidMeets++;
    meetsToDisplay.push(meet);
  }

  const averageScore = meetsToDisplay.reduce((acc, x) => acc + (x.filtered ? 0 : x.score), 0) / targetSize;

  return (
    <div style={{ textAlign: 'center' }}>
      <Typography sx={{ marginTop: 2 }} variant="h4">
        2022 World Athletics Rankings Explorer
      </Typography>
      <Box sx={{ minWidth: 120, marginTop: 2 }}>
        <FormControl>
          <InputLabel id="event-label">Event</InputLabel>
          <Select labelId="event-label" label="Event" value={evt} onChange={(e) => setEvt(e.target.value as EventName)}>
            {['800m', '1500m', '5000m'].map((evt) => (
              <MenuItem key={evt} value={evt}>
                {evt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel id="sex-label">Sex</InputLabel>
          <Select labelId="sex-label" label="Sex" value={sex} onChange={(e) => setSex(e.target.value as SexName)}>
            {['men', 'women'].map((evt) => (
              <MenuItem key={evt} value={evt}>
                {evt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField variant="outlined" label="Time" value={time} onChange={(e) => markToSecs(time) && setTime(e.target.value)} />
        <FormControl>
          <InputLabel id="country-label">Nationality</InputLabel>
          <Select labelId="country-label" label="Nationality" value={country} onChange={(e) => setCountry(e.target.value)}>
            {countryCodes.map((cc) => (
              <MenuItem key={cc} value={cc}>
                {cc}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <div>
          {Object.keys(filterGroups).map((key) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  size="small"
                  defaultChecked
                  value={filterChecks[key as FilterGroup]}
                  onChange={(e) => setFilterChecks({ ...filterChecks, [key]: e.target.checked })}
                />
              }
              label={`Exclude ${key}`}
            />
          ))}
        </div>
        <div>
          <Typography variant="h5" sx={{ marginBottom: 2 }}>
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
          </Typography>
        </div>

        <div>Strategic Top {targetSize}:</div>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Meet</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Place</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Calculation</TableCell>
                <TableCell>Exclude</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meetsToDisplay.map(({ meet, meetVenue, startDate, place, points, score, placeBonus, meetId, filtered }, i) => {
                return (
                  <TableRow key={meetId} sx={{ textDecoration: filtered ? 'line-through' : undefined }}>
                    <TableCell>
                      <Link href={`https://www.worldathletics.org/competition/calendar-results/results/${meetId}`}>
                        {meet} (#{meetId})
                      </Link>
                    </TableCell>
                    <TableCell>{meetVenue}</TableCell>
                    <TableCell>{startDate}</TableCell>
                    <TableCell>{ordinal(place)}</TableCell>
                    <TableCell>{score}</TableCell>
                    <TableCell>
                      ({points} perf. + {placeBonus} place)
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => setExcludeIds([...excludeIds, meetId])} disabled={filtered}>
                        Exclude
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="h4" sx={{ marginTop: 2 }}>
          Average score: {averageScore}
        </Typography>
        <Typography variant="h5" sx={{ marginBottom: 2 }}>
          {averageScore > targetScore ? (
            <>
              <CheckCircleIcon /> Qualified
            </>
          ) : (
            <>
              <HighlightOffIcon /> Not Qualified
            </>
          )}
        </Typography>
        <div>
          Contact: <Link href="mailto:habs@sdf.org">habs@sdf.org</Link>
        </div>
      </Box>
    </div>
  );
};

export default App;