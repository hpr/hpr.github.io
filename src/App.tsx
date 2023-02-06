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
import React, { useEffect, useState } from 'react';
import { countryCodes, fieldSizes, filterGroups, MAX_INDOOR_MEETS, perfsToAverage } from './constants';
import { Area, EventName, FilterGroup, GetCalendarCompetitionResults, Ranking, RankingsQuery, SexName, SimilarMarks } from './types';
import { getMonths, getScores, getSimilarMarks, ordinal } from './util';
// import { WaCalculator } from '@glaivepro/wa-calculator';

// import WBK from 'wikibase-sdk';
// const wbk = WBK({
//   instance: 'https://www.wikidata.org',
//   sparqlEndpoint: 'https://query.wikidata.org/sparql',
// });
// console.log(wbk);

// console.log(WaCalculator)

const App = () => {
  const [startDate] = useState('2021-07-14');
  const [endDate] = useState('2022-06-26');
  const [dateRange, setDateRange] = useState('2021-07-14–2022-06-26');
  const [startRange, endRange] = dateRange.split('–');
  const [evt, setEvt] = useState<EventName>('1500m');
  const [sex, setSex] = useState<SexName>('men');
  const [time, setTime] = useState<string>('3:41.28');
  const [country, setCountry] = useState<string>('USA');
  const [onlyMeetsInCountry, setOnlyMeetsInCountry] = useState<boolean>(false);
  const [includeSimilarMarks, setIncludeSimilarMarks] = useState<boolean>(true);
  const [similarMarks, setSimilarMarks] = useState<SimilarMarks>({});
  const [showExcludedMeets, setShowExcludedMeets] = useState<boolean>(false);
  const [generousConversion, setGenerousConversion] = useState<boolean>(false);
  const [altitudeConversion, setAltitudeConversion] = useState<boolean>(false);
  const [area, setArea] = useState<Area | undefined>('North and Central America');
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [rankingsQuery, setRankingsQuery] = useState<RankingsQuery | null>(null);
  const [results, setResults] = useState<{ [meetId: string]: GetCalendarCompetitionResults }>({});
  const [excludeIds, setExcludeIds] = useState<number[]>([]);
  const [maxIndoorMeets, setMaxIndoorMeets] = useState<boolean>(true);
  const [meetScores, setMeetScores] = useState<ReturnType<typeof getScores>>([]);
  // const [competitions, setCompetitions] = useState<CalendarEvent[]>([]);
  const [filterChecks, setFilterChecks] = useState<{ [k in FilterGroup]: boolean }>(
    () => Object.fromEntries(Object.keys(filterGroups).map((key) => [key, true])) as { [k in FilterGroup]: boolean }
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
    [startDate, endDate]
  );
  useEffect(() => {
    setSimilarMarks(getSimilarMarks(evt, sex, time, generousConversion));
  }, [evt, sex, time, generousConversion]);
  useEffect(() => {
    setMeetScores(
      Object.values(results)
        .filter((x) => x)
        .filter(({ competition }) => {
          const endDate = new Date(competition.endDate ?? competition.startDate);
          return new Date(competition.startDate) >= new Date(startRange) && endDate <= new Date(endRange);
        })
        .flatMap((meet) => getScores(meet, { [evt]: time, ...similarMarks }, sex, altitudeConversion))
        .sort((a, b) => b.score - a.score)
    );
  }, [evt, sex, time, country, dateRange, results, similarMarks, startRange, endRange, altitudeConversion]);
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
  }, [evt, sex, time, country, dateRange]);
  useEffect(() => {
    const meetInCountry = Object.values(results).find((c) => c && c.competition.venue.endsWith(`(${country})`));
    setArea(meetInCountry?.competition.area ?? undefined);
  }, [country, results]);
  useEffect(() => {
    if (rankings.length) setTargetScore(+rankings[fieldSizes[evt]! - 1].score);
  }, [rankings, evt]);

  const meetsToDisplay = [];
  const targetSize = perfsToAverage[evt]!;
  let numValidMeets = 0;
  let validIndoorMeets = 0;
  for (let meet of meetScores) {
    meet = structuredClone(meet);
    if (numValidMeets === targetSize) break;
    const { meetGroups, meetArea, meetVenue, meetId, indoor } = meet;
    if (excludeIds.includes(meetId)) meet.filtered = 'Manual';
    if (onlyMeetsInCountry && meet.meetVenue.endsWith(`(${country})`)) meet.filtered = 'Out of country';
    for (const key in filterChecks) {
      if (filterChecks[key as FilterGroup] && meetGroups.includes(key)) {
        if (key.includes('Area') && area === meetArea) continue;
        if (key.includes('National') && meetVenue.endsWith(`(${country})`)) continue;
        meet.filtered = key;
        break;
      }
    }
    if (meet.event !== evt && !includeSimilarMarks) meet.filtered = 'Similar mark';
    if (!meet.filtered) {
      if (maxIndoorMeets) {
        if (indoor) validIndoorMeets++;
        if (validIndoorMeets > MAX_INDOOR_MEETS && indoor) meet.filtered = `Too many indoor meets (max ${MAX_INDOOR_MEETS})`;
      }
      if (!meet.filtered) numValidMeets++;
    }
    meetsToDisplay.push(meet);
  }

  const qualifyingPerformances = meetsToDisplay.filter((x) => !x.filtered).length;
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
            {['800m', '1500m', '5000m'/*, '10000m'*/].map((evt) => (
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
        <TextField variant="outlined" label="Time" value={time} onChange={(e) => setTime(e.target.value)} />
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
        <FormControl>
          <InputLabel id="dateRange-label">Date Range</InputLabel>
          <Select labelId="dateRange-label" label="Date Range" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <MenuItem value={`${startDate}–${endDate}`}>
              2022 Worlds Qualification Period ({startDate} – {endDate})
            </MenuItem>
            {getMonths(new Date(startDate), new Date(endDate)).map((start, i, arr) => {
              if (i === arr.length - 1) return null;
              const end = arr[i + 1];
              const range = `${start}–${end}`;
              return (
                <MenuItem key={range} value={range}>
                  {start} – {end}
                </MenuItem>
              );
            })}
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
          <FormControlLabel
            control={<Checkbox size="small" value={onlyMeetsInCountry} onChange={(e) => setOnlyMeetsInCountry(e.target.checked)} />}
            label="Only show meets in nationality country"
          />
          <FormControlLabel
            control={<Checkbox size="small" defaultChecked value={includeSimilarMarks} onChange={(e) => setIncludeSimilarMarks(e.target.checked)} />}
            label={`Include similar marks (${Object.keys(similarMarks)
              .map((evt) => `${similarMarks[evt as EventName]!} ${evt}`)
              .join(', ')})`}
          />
          <FormControlLabel
            control={<Checkbox size="small" value={generousConversion} onChange={(e) => setGenerousConversion(e.target.checked)} />}
            label="Use more generous conversion for similar marks"
          />
          <FormControlLabel
            control={<Checkbox size="small" value={altitudeConversion} onChange={(e) => setAltitudeConversion(e.target.checked)} />}
            label="Altitude-adjust performances"
          />
          <FormControlLabel
            control={<Checkbox size="small" defaultChecked value={maxIndoorMeets} onChange={(e) => setMaxIndoorMeets(e.target.checked)} />}
            label={`Only use max ${MAX_INDOOR_MEETS} indoor meets (per WA rules)`}
          />
          <FormControlLabel
            control={<Checkbox size="small" value={showExcludedMeets} onChange={(e) => setShowExcludedMeets(e.target.checked)} />}
            label="Show excluded meets in table"
          />
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TableContainer component={Paper} sx={{ width: '95%' }}>
            <Table sx={{ minWidth: 650 }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Meet</TableCell>
                  <TableCell>Venue</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Place</TableCell>
                  <TableCell>Altitude</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Calculation</TableCell>
                  <TableCell>Exclude (Reason)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetsToDisplay
                  .filter((m) => (showExcludedMeets ? true : !m.filtered))
                  .map(({ meet, meetVenue, startDate, place, points, score, placeBonus, meetId, filtered, meetCategory, event, mark, altitude }, i) => {
                    return (
                      <TableRow key={`${meetId}-${i}`} sx={{ backgroundColor: filtered ? 'pink' : undefined }}>
                        <TableCell>
                          <Link href={`https://www.worldathletics.org/competition/calendar-results/results/${meetId}`}>
                            {meet} (#{meetId})
                          </Link>
                        </TableCell>
                        <TableCell>{meetVenue}</TableCell>
                        <TableCell>{meetCategory}</TableCell>
                        <TableCell>{startDate}</TableCell>
                        <TableCell>{event}</TableCell>
                        <TableCell>{mark}</TableCell>
                        <TableCell>{ordinal(place)}</TableCell>
                        <TableCell>{altitude && `${altitude} m`}</TableCell>
                        <TableCell>{score}</TableCell>
                        <TableCell>
                          {points} perf. + {placeBonus} place
                        </TableCell>
                        <TableCell>
                          {filtered ? (
                            filtered
                          ) : (
                            <Button size="small" onClick={() => setExcludeIds([...excludeIds, meetId])} disabled={!!filtered}>
                              Exclude
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <Typography variant="h4" sx={{ marginTop: 2 }}>
          Average score:{' '}
          {qualifyingPerformances < targetSize
            ? 'Not enough meets'
            : String(averageScore).includes('.')
            ? String(averageScore).slice(0, String(averageScore).indexOf('.') + 3)
            : averageScore}
        </Typography>
        <Typography variant="h5" sx={{ marginBottom: 2 }}>
          {averageScore > targetScore && qualifyingPerformances >= targetSize ? (
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
          Contact: Harry Prevor, <Link href="mailto:habs@sdf.org">habs@sdf.org</Link>
        </div>
      </Box>
    </div>
  );
};

export default App;
