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

export type EventName = '100m' | '200m' | '400m' | '800m' | '1500m';

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
  id: string;
  eventTitles: EventTitle[];
  competition: {
    name: string;
    startDate: string;
    endDate: string;
    venue: string;
  };
};

export type SexName = 'men' | 'women';

export type CompetitionGroup =
  | 'Area Indoor Championships'
  | 'Other Senior Area Championships'
  | 'Area Senior Regional Championships'
  | 'National Senior Outdoor Championships'
  | 'Area Senior Outdoor Championships'
  | 'National Senior Indoor Championships';

export type Area = 'Europe' | 'Oceania' | 'Asia' | 'North and Central America' | 'South America' | 'Africa';

export type CalendarEvent = {
  id: number;
  area: Area;
  competitionGroup: CompetitionGroup;
};
