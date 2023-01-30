import React, { useEffect, useState } from 'react';
import { fieldSizes } from './constants';
import { EventName, GetCalendarCompetitionResults, Ranking, SexName } from './types';
import { getScores } from './util';
// import { getMaxScore } from './util';

const App = () => {
  const [startDate] = useState('2021-07-14');
  const [endDate] = useState('2022-06-26');
  const [evt, setEvt] = useState<EventName>('1500m');
  const [sex, setSex] = useState<SexName>('men');
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [results, setResults] = useState<{ [meetId: string]: GetCalendarCompetitionResults }>({});
  const [targetScore, setTargetScore] = useState(0);
  useEffect(
    () =>
      void (async () => {
        const { results } = await (await fetch(`results/${startDate}_${endDate}_simplified.json`)).json();
        setResults(results);
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
  let time = '3:40.00';
  const meetPoints = Object.values(results)
    .filter((x) => x)
    .flatMap((meet) => getScores(meet, evt, sex, time))
    .sort((a, b) => b.score - a.score);
  return (
    <div>
      <span>Target Score: {targetScore}</span>
      <div>Top 5:</div>
      <ol>
        {meetPoints.slice(0, 5).map(({ meet, startDate, place, points, score, placeBonus }, i) => {
          return (
            <li key={i}>
              {meet} {startDate}: {place} {points} ({score} + {placeBonus})
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default App;
