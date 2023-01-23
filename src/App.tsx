import React from 'react';
import './App.css';

import Grid from '@mui/material/Unstable_Grid2';

import WBK from 'wikibase-sdk';
import { CLUBS, WD } from './constants';
import Club from './Club';
import { ClubItem } from './types';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

const wbk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
});

const scoreOptions = [
  {
    label: 'number of members',
    getScore: (club: ClubItem) => club.claims[WD.P_HAS_PARTS].length,
  },
];

function App() {
  const [clubs, setClubs] = React.useState<{}>({});
  const [reverse, setReverse] = React.useState<boolean>(false);
  const [scoreMethod, setScoreMethod] = React.useState<{ label: string; getScore: (club: ClubItem) => number }>(scoreOptions[0]);
  React.useEffect(() => {
    (async () => {
      if (localStorage.getItem('clubs')) {
        setClubs(JSON.parse(localStorage.getItem('clubs')!));
      } else {
        const tempClubs = wbk.simplify.entities(await (await fetch(wbk.getEntities(Object.values(CLUBS)))).json(), {
          keepQualifiers: true,
          keepReferences: true,
        });
        setClubs(tempClubs);
        localStorage.setItem('clubs', JSON.stringify(tempClubs));
      }
    })();
  }, []);
  return (
    <div className="App" style={{ padding: 10 }}>
      <Grid container sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={2}>
        <Grid>
          <Autocomplete
            value={scoreMethod}
            onChange={(e, val) => val && setScoreMethod(val)}
            sx={{ width: 300 }}
            options={scoreOptions}
            renderInput={(params) => <TextField {...params} label="Score Method" />}
          />
        </Grid>
        <Grid>
          <FormControlLabel control={<Checkbox value={reverse} onChange={(e) => setReverse(e.target.checked)} />} label="Reverse Sort" />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        {Object.values<ClubItem>(clubs)
          .map((club) => {
            const score = scoreMethod.getScore(club);
            return { ...club, score };
          })
          .sort((a, b) => (reverse ? a.score - b.score : b.score - a.score))
          .map((club) => (
            <Grid key={club.id}>
              <Club club={club} score={club.score} />
            </Grid>
          ))}
      </Grid>
    </div>
  );
}

export default App;
