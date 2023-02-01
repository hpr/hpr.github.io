import { CompetitionGroup, EventName } from './types';

export const fieldSizes: { [k in EventName]: number } = {
  '100m': 48,
  '200m': 56,
  '400m': 48,
  '800m': 48,
  '1500m': 45,
  '5000m': 42,
};

export const placeScoresFinal = {
  OW: [375, 330, 300, 270, 250, 230, 215, 200, 130, 120, 110, 100, 95, 90, 85, 80],
  DF: [240, 210, 185, 170, 155, 145, 135, 125, 90, 80, 70, 60],
  GW: [200, 170, 150, 140, 130, 120, 110, 100, 70, 60, 50, 45],
  GL: [170, 145, 130, 120, 110, 100, 90, 80, 60, 50, 45, 40],
  A: [140, 120, 110, 100, 90, 80, 70, 60],
  B: [100, 80, 70, 60, 55, 50, 45, 40],
  C: [60, 50, 45, 40, 35, 30, 27, 25],
  D: [40, 35, 30, 25, 22, 19, 17, 15],
  E: [25, 21, 18, 15, 12, 10],
  F: [15, 10, 5],
};

export const placeScoresHeatsFor10PlusFinal = {
  OW: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 95, 90, 85, 80, 75, 70],
  DF: [65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 55, 50],
  GW: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 40, 35],
  GL: [40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 35, 30],
};

export const areaChampionshipGroups: CompetitionGroup[] = [
  'Area Indoor Championships',
  'Other Senior Area Championships',
  'Area Senior Regional Championships',
  'Area Senior Outdoor Championships',
];

export const nationalChampionshipGroups: CompetitionGroup[] = ['National Senior Outdoor Championships', 'National Senior Indoor Championships'];

export const nationalChampionshipOverrideIds = [7175035, 7187091, 7187328]; // TODO contact WA to fix these
