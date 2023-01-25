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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { fmtTime, getClaim, getQual, getWDFromStorage } from './util';

type ScoreSettingsType = { [key: string]: any };

type ScoreOptionType = {
  label: string;
  getScore: (club: WDItem, settings: ScoreSettingsType, athletes: WDEntities, disciplines: WDEntities) => { value: number; context?: any };
  settings?: ScoreSettingsType;
};

const scoreOptions: ScoreOptionType[] = [
  {
    label: 'number of members',
    getScore: (club: WDItem) => ({ value: club.claims[WD.P_HAS_PARTS].length }),
  },
  {
    label: 'highest scoring athlete (legal marks)',
    settings: {
      gender: ['male', 'female', 'combined'],
    },
    getScore: (club: WDItem, settings: ScoreSettingsType, athletes: WDEntities, disciplines: WDEntities) => {
      const { maxScore, athId, pbIdx } = club.claims[WD.P_HAS_PARTS].reduce(
        ({ maxScore, athId, pbIdx }, part) => {
          const curAthlete = athletes[part.value];
          if (settings.gender === 'male' && getClaim(curAthlete, WD.P_SEX_OR_GENDER) === WD.Q_FEMALE) return { maxScore, athId, pbIdx };
          if (settings.gender === 'female' && getClaim(curAthlete, WD.P_SEX_OR_GENDER) === WD.Q_MALE) return { maxScore, athId, pbIdx };
          const { pts, curPbIdx } = curAthlete.claims[WD.P_PERSONAL_BEST].reduce(
            ({ pts, curPbIdx }, pb, i: number) => {
              if (+getQual(pb, WD.P_POINTS_SCORED) > pts) return { pts: +getQual(pb, WD.P_POINTS_SCORED), curPbIdx: i };
              return { pts, curPbIdx };
            },
            { pts: 0, curPbIdx: -1 }
          );
          if (pts > maxScore) {
            return { athId: part.value, pbIdx: curPbIdx, maxScore: pts };
          }
          return { athId, pbIdx, maxScore };
        },
        { maxScore: 0, athId: '', pbIdx: -1 }
      );
      if (maxScore === 0) return { value: 0, context: <>No matching athletes</> };
      const pb = athletes[athId].claims[WD.P_PERSONAL_BEST][pbIdx];
      const qDiscipline = getQual(pb, WD.P_SPORTS_DISCIPLINE_COMPETED_IN);
      return {
        value: maxScore,
        context: (
          <>
            {athletes[athId].labels.en} ran a time of {fmtTime(+pb.value)} in the {disciplines[qDiscipline].labels.en}
          </>
        ),
      };
    },
  },
];

function App() {
  const [clubs, setClubs] = React.useState<WDEntities>({});
  const [athletes, setAthletes] = React.useState<WDEntities>({});
  const [disciplines, setDisciplines] = React.useState<WDEntities>({});
  const [reverse, setReverse] = React.useState<boolean>(false);
  const [includeFormer, setIncludeFormer] = React.useState<boolean>(false);
  const [scoreMethod, setScoreMethod] = React.useState<ScoreOptionType>(scoreOptions[0]);
  const [scoreSettings, setScoreSettings] = React.useState<ScoreSettingsType>({});
  React.useEffect(() => {
    (async () => {
      const clubs = await getWDFromStorage('clubs', Object.values(CLUBS));
      setClubs(clubs);
      const athleteQids = Object.values(clubs).flatMap((club) => club.claims[WD.P_HAS_PARTS].map((part) => part.value));
      const athletes = await getWDFromStorage('athletes', athleteQids);
      setAthletes(athletes);
      const disciplineQids = [...new Set(Object.values(athletes).flatMap((ath) => ath.claims[WD.P_SPORTS_DISCIPLINE_COMPETED_IN].map((claim) => claim.value)))];
      const disciplines = await getWDFromStorage('disciplines', disciplineQids);
      setDisciplines(disciplines);
    })();
  }, []);
  return (
    <div className="App" style={{ padding: 10 }}>
      <Grid container sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={2}>
        <Grid>
          <Autocomplete
            isOptionEqualToValue={(a, b) => a.label === b.label}
            value={scoreMethod}
            onChange={(e, val) => {
              if (val) {
                setScoreMethod(val);
                setScoreSettings(
                  Object.fromEntries(
                    Object.keys(val.settings ?? {}).map((key) => {
                      if (Array.isArray(val.settings![key])) return [key, val.settings![key][0]];
                      return [key, ''];
                    })
                  )
                );
              }
            }}
            sx={{ width: 300 }}
            options={scoreOptions}
            renderInput={(params) => <TextField {...params} label="Score Method" />}
          />
          {scoreMethod.settings &&
            Object.keys(scoreMethod.settings).map((key) => {
              if (Array.isArray(scoreMethod.settings![key])) {
                return (
                  <FormControl key={key} fullWidth>
                    <InputLabel>{key[0].toUpperCase() + key.slice(1)}</InputLabel>
                    <Select value={scoreSettings[key]} onChange={(e) => setScoreSettings({ ...scoreSettings, [key]: e.target.value })} label={key}>
                      {scoreMethod.settings![key].map((opt: string) => (
                        <MenuItem key={opt} value={opt}>
                          {opt[0].toUpperCase() + opt.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                );
              }
              return null;
            })}
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
            const score = scoreMethod.getScore(clubCopy, scoreSettings, athletes, disciplines);
            return { ...clubCopy, score };
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
