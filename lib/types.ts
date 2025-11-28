// Type definitions for the BetScore demo

export type MarketType = 'h2h' | 'ou25' | 'btts' | 'dc';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface Team {
  id: string;
  name: string;
  shortName: string;
}

export interface Odds {
  h2h?: {
    home: number;
    draw: number;
    away: number;
  };
  ou25?: {
    over: number;
    under: number;
  };
  btts?: {
    yes: number;
    no: number;
  };
}

export interface TeamForm {
  form: string; // e.g., "WWDLW"
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
}

export interface HeadToHead {
  totalMeetings: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  lastResults: string[]; // e.g., ["H", "A", "D"]
}

export interface Prediction {
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: ConfidenceLevel;
  breakdown: {
    form: { home: number; away: number };
    h2h: { home: number; away: number };
    weights: { form: number; h2h: number };
  };
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: Date;
  league: string;
  odds: Odds;
  bookmakers: string[];
  prediction: Prediction;
  form: {
    home: TeamForm;
    away: TeamForm;
  };
  h2h: HeadToHead;
}

export interface SearchFilters {
  oddsRange: { min: number; max: number };
  markets: MarketType[];
  bookmakers: string[];
  dateRange: { start: Date; end?: Date };
  leagues: string[];
  formWeight: number;
  h2hWeight: number;
}

export interface BettingSelection {
  matchId: string;
  match: Match;
  market: MarketType;
  outcome: string;
  odds: number;
}

export interface BookingCode {
  code: string;
  bookmaker: string;
  selections: BettingSelection[];
  totalOdds: number;
  createdAt: Date;
}
