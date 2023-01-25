import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import { WDItem } from './types';

const Club = ({ club, score, context }: { club: WDItem, score: number, context?: any }) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          {club.labels.en}
        </Typography>
        Score: {score}
        {context && <p style={{ fontStyle: 'italic' }}>Context: {context?.labels?.en}</p>}
      </CardContent>
      <CardActions>
        <Button size="small">Learn More</Button>
      </CardActions>
    </Card>
  );
};

export default Club;
