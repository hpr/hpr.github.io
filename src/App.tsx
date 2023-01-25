import React from 'react';
import './App.css';

import Grid from '@mui/material/Unstable_Grid2';

import { CLUBS, WD } from './constants';
import Club from './Club';
import { WDEntities, WDItem } from './types';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { getWDFromStorage } from './util';

type ScoreOptionType = { label: string; getScore: (club: WDItem, athletes: WDEntities) => { value: number; context?: any } };

const scoreOptions: ScoreOptionType[] = [
  {
    label: 'number of members',
    getScore: (club: WDItem) => ({ value: club.claims[WD.P_HAS_PARTS].length }),
  },
  {
    label: 'highest scoring athlete',
    getScore: (club: WDItem, athletes: WDEntities) => {
      const maxScore = Math.max(
        ...club.claims[WD.P_HAS_PARTS].map((part) => {
          const pbs = athletes[part.value].claims[WD.P_PERSONAL_BEST];
          return Math.max(...pbs.map((pb) => +(pb.qualifiers[WD.P_POINTS_SCORED] ?? [])[0] || 0));
        })
      );
      const maxAthlete = Object.values(athletes).find((ath) => ath.claims[WD.P_PERSONAL_BEST].find((pb) => +(pb.qualifiers[WD.P_POINTS_SCORED] ?? [])[0] === maxScore));
      return { value: maxScore, context: maxAthlete };
    },
  },
];

function App() {
  const [clubs, setClubs] = React.useState<{ [k: string]: WDItem }>({});
  const [athletes, setAthletes] = React.useState<{ [k: string]: WDItem }>({});
  const [reverse, setReverse] = React.useState<boolean>(false);
  const [includeFormer, setIncludeFormer] = React.useState<boolean>(false);
  const [scoreMethod, setScoreMethod] = React.useState<ScoreOptionType>(scoreOptions[0]);
  React.useEffect(() => {
    (async () => {
      const clubs = await getWDFromStorage('clubs', Object.values(CLUBS));
      const athleteQids = Object.values(clubs).flatMap((club) => club.claims[WD.P_HAS_PARTS].map((part) => part.value));
      const athletes = await getWDFromStorage('athletes', athleteQids);
      setClubs(clubs);
      setAthletes(athletes);
    })();
  }, []);
  return (
    <div className="App" style={{ padding: 10 }}>
      <Grid container sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={2}>
        <Grid>
          <Autocomplete
            isOptionEqualToValue={(a, b) => a.label === b.label}
            value={scoreMethod}
            onChange={(e, val) => val && setScoreMethod(val)}
            sx={{ width: 300 }}
            options={scoreOptions}
            renderInput={(params) => <TextField {...params} label="Score Method" />}
          />
        </Grid>
        <Grid>
          <FormControlLabel control={<Checkbox value={reverse} onChange={(e) => setReverse(e.target.checked)} />} label="Reverse Sort" />
          <FormControlLabel
            control={<Checkbox value={includeFormer} onChange={(e) => setIncludeFormer(e.target.checked)} />}
            label="Include Former Members (incomplete)"
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        {Object.values<WDItem>(clubs)
          .map((club) => {
            const clubCopy = structuredClone(club) as WDItem;
            if (!includeFormer) clubCopy.claims[WD.P_HAS_PARTS] = club.claims[WD.P_HAS_PARTS].filter((part) => !part.qualifiers[WD.P_END_TIME]);
            return { ...clubCopy, score: scoreMethod.getScore(clubCopy, athletes) };
          })
          .sort((a, b) => (reverse ? a.score.value - b.score.value : b.score.value - a.score.value))
          .map((club) => (
            <Grid key={club.id}>
              <Club club={club} score={club.score.value} context={club.score.context} />
            </Grid>
          ))}
      </Grid>
    </div>
  );
}

export default App;
