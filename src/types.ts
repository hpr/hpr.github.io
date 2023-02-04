export type Ranking = {
  Rank: string;
  Competitor: string;
  DOB: string;
  Nat: string;
  score: string;
  EventList: string;
  RankingScoreCalculation: {
    results: [];
    wrResults: [];
  };
};

export type RankingsQuery = {
  event: EventName;
  sex: SexName;
  regionType: 'world';
  page: '1';
  rankDate: string;
  limitByCountry: '3';
};

export type EventName = '100m' | '200m' | '400m' | '800m' | '1500m' | '5000m' | '600m' | '1000m' | 'Mile' | '2000m' | '3000m' | '2 miles';

export type Competitor = {
  name: string;
  birthDate: string;
  urlSlug: string;
};

export type Result = {
  mark: string;
  place: string;
  points: string | null;
  wind: string | null;
  competitor: Competitor;
};

export type RaceType = 'Heat' | 'Semifinal' | 'Final';

export type Race = {
  race: RaceType;
  raceId: number;
  raceNumber: number;
  wind: string | null;
  results: Result[];
};

export type Event = {
  event: string;
  races: Race[];
};

export type RankingCategory = 'OW' | 'DF' | 'GW' | 'GL' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type EventTitle = {
  rankingCategory: RankingCategory;
  eventTitle: string | null;
  events: Event[];
};

export type GetCalendarCompetitionResults = {
  id: number;
  eventTitles: EventTitle[];
  competition: {
    name: string;
    startDate: string;
    endDate: string;
    venue: string;
    altitude: number;
    area: Area;
    competitionGroups: CompetitionGroup[];
  };
};

export type SexName = 'men' | 'women';

export type CompetitionGroup =
  | 'Area Indoor Championships'
  | 'Other Senior Area Championships'
  | 'Area Senior Regional Championships'
  | 'National Senior Outdoor Championships'
  | 'Area Senior Outdoor Championships'
  | 'National Senior Indoor Championships'
  | 'Area U20 Championships'
  | 'Area Senior CE Championships'
  | 'National Senior Outdoor Combined Events Championships'
  | 'National Senior Road Running Championships'
  | 'National Senior 10,000m Championships'
  | 'National Senior Half Marathon Championships'
  | 'National Senior Marathon Championships'
  | 'National Senior Outdoor Race Walking Championships'
  | 'Area Senior Race Walking Championships'
  | 'Area RR Championships'
  | 'Area Marathon Championships'
  | 'National Senior Indoor Combined Events Championships'
  | 'Area U18 Championships'
  | 'Area U23 Championships';

export type Area = 'Europe' | 'Oceania' | 'Asia' | 'North and Central America' | 'South America' | 'Africa';

export type FilterGroup =
  | 'Area Championships'
  | 'National Championships'
  | 'National U18 Championships'
  | 'Area U23 Championships'
  | 'Area U20 Championships'
  | 'Area U18 Championships'
  | 'DL Final'
  | 'NCAA Championships';

export type CalendarEvent = {
  id: number;
  area: Area;
  competitionGroup: string;
};

export type SimilarMarks = { [k in EventName]?: string };
