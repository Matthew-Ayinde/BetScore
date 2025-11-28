import { Match, Team, Odds, TeamForm, HeadToHead, Prediction } from './types';

// Dummy teams data
const teams: Team[] = [
  { id: '1', name: 'Liverpool', shortName: 'LIV' },
  { id: '2', name: 'Arsenal', shortName: 'ARS' },
  { id: '3', name: 'Manchester City', shortName: 'MCI' },
  { id: '4', name: 'Manchester United', shortName: 'MUN' },
  { id: '5', name: 'Chelsea', shortName: 'CHE' },
  { id: '6', name: 'Tottenham', shortName: 'TOT' },
  { id: '7', name: 'Newcastle', shortName: 'NEW' },
  { id: '8', name: 'Aston Villa', shortName: 'AVL' },
  { id: '9', name: 'Brighton', shortName: 'BHA' },
  { id: '10', name: 'West Ham', shortName: 'WHU' },
  { id: '11', name: 'Barcelona', shortName: 'BAR' },
  { id: '12', name: 'Real Madrid', shortName: 'RMA' },
  { id: '13', name: 'Atletico Madrid', shortName: 'ATM' },
  { id: '14', name: 'Bayern Munich', shortName: 'BAY' },
  { id: '15', name: 'Borussia Dortmund', shortName: 'BVB' },
];

const bookmakers = ['1xBet', '888sport', 'Bet365', 'William Hill', 'Betway'];
const leagues = ['Premier League', 'La Liga', 'Bundesliga', 'Champions League'];

// Generate random odds
function generateOdds(): Odds {
  const homeWin = +(1.5 + Math.random() * 3).toFixed(2);
  const draw = +(3.0 + Math.random() * 2).toFixed(2);
  const awayWin = +(2.0 + Math.random() * 4).toFixed(2);
  
  return {
    h2h: { home: homeWin, draw, away: awayWin },
    ou25: {
      over: +(1.5 + Math.random() * 1).toFixed(2),
      under: +(1.8 + Math.random() * 1).toFixed(2),
    },
    btts: {
      yes: +(1.4 + Math.random() * 0.8).toFixed(2),
      no: +(1.9 + Math.random() * 1).toFixed(2),
    },
  };
}

// Generate team form
function generateTeamForm(): TeamForm {
  const wins = Math.floor(Math.random() * 6);
  const draws = Math.floor(Math.random() * (6 - wins));
  const losses = 5 - wins - draws;
  const formChars = ['W', 'D', 'L'];
  const formArray = [
    ...Array(wins).fill('W'),
    ...Array(draws).fill('D'),
    ...Array(losses).fill('L'),
  ];
  const form = formArray.sort(() => Math.random() - 0.5).join('');
  
  return {
    form: form.slice(0, 5),
    gamesPlayed: 5,
    wins,
    draws,
    losses,
    goalsScored: wins * 2 + draws + Math.floor(Math.random() * 3),
    goalsConceded: losses * 2 + draws + Math.floor(Math.random() * 3),
  };
}

// Generate head-to-head
function generateH2H(): HeadToHead {
  const homeWins = Math.floor(Math.random() * 4);
  const awayWins = Math.floor(Math.random() * 4);
  const draws = Math.floor(Math.random() * 3);
  const totalMeetings = homeWins + awayWins + draws;
  
  const results = [
    ...Array(homeWins).fill('H'),
    ...Array(awayWins).fill('A'),
    ...Array(draws).fill('D'),
  ].sort(() => Math.random() - 0.5);
  
  return {
    totalMeetings,
    homeWins,
    awayWins,
    draws,
    lastResults: results.slice(0, 5),
  };
}

// Calculate prediction based on form and H2H
function calculatePrediction(
  homeForm: TeamForm,
  awayForm: TeamForm,
  h2h: HeadToHead,
  formWeight: number = 60,
  h2hWeight: number = 40
): Prediction {
  // Form score (0-100)
  const homeFormScore = (homeForm.wins * 3 + homeForm.draws) / (homeForm.gamesPlayed * 3) * 100;
  const awayFormScore = (awayForm.wins * 3 + awayForm.draws) / (awayForm.gamesPlayed * 3) * 100;
  
  // H2H score (0-100)
  const homeH2HScore = h2h.totalMeetings > 0 
    ? (h2h.homeWins / h2h.totalMeetings) * 100 
    : 50;
  const awayH2HScore = h2h.totalMeetings > 0 
    ? (h2h.awayWins / h2h.totalMeetings) * 100 
    : 50;
  
  // Apply weights
  const homeScore = (homeFormScore * formWeight / 100) + (homeH2HScore * h2hWeight / 100) + 5; // +5 home advantage
  const awayScore = (awayFormScore * formWeight / 100) + (awayH2HScore * h2hWeight / 100);
  
  // Normalize to percentages
  const total = homeScore + awayScore + 20; // 20 for draw base
  const homeWin = +(homeScore / total * 100).toFixed(1);
  const awayWin = +(awayScore / total * 100).toFixed(1);
  const draw = +(100 - homeWin - awayWin).toFixed(1);
  
  // Determine confidence
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  if (h2h.totalMeetings >= 5 && homeForm.gamesPlayed >= 5) {
    confidence = 'high';
  } else if (h2h.totalMeetings < 3 || homeForm.gamesPlayed < 5) {
    confidence = 'low';
  }
  
  return {
    homeWin,
    draw,
    awayWin,
    confidence,
    breakdown: {
      form: { home: +homeFormScore.toFixed(1), away: +awayFormScore.toFixed(1) },
      h2h: { home: +homeH2HScore.toFixed(1), away: +awayH2HScore.toFixed(1) },
      weights: { form: formWeight, h2h: h2hWeight },
    },
  };
}

// Generate dummy matches
export function generateDummyMatches(count: number = 15): Match[] {
  const matches: Match[] = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const homeTeam = teams[Math.floor(Math.random() * teams.length)];
    let awayTeam = teams[Math.floor(Math.random() * teams.length)];
    
    // Ensure different teams
    while (awayTeam.id === homeTeam.id) {
      awayTeam = teams[Math.floor(Math.random() * teams.length)];
    }
    
    const homeForm = generateTeamForm();
    const awayForm = generateTeamForm();
    const h2h = generateH2H();
    const odds = generateOdds();
    
    // Match date within next 7 days
    const matchDate = new Date(today);
    matchDate.setDate(today.getDate() + Math.floor(Math.random() * 7));
    matchDate.setHours(15 + Math.floor(Math.random() * 5), 0, 0, 0);
    
    const prediction = calculatePrediction(homeForm, awayForm, h2h);
    
    matches.push({
      id: `match-${i + 1}`,
      homeTeam,
      awayTeam,
      date: matchDate,
      league: leagues[Math.floor(Math.random() * leagues.length)],
      odds,
      bookmakers: bookmakers.slice(0, 2 + Math.floor(Math.random() * 3)),
      prediction,
      form: { home: homeForm, away: awayForm },
      h2h,
    });
  }
  
  return matches.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Filter matches based on criteria
export function filterMatches(
  matches: Match[],
  filters: {
    oddsMin?: number;
    oddsMax?: number;
    markets?: string[];
    bookmakers?: string[];
    leagues?: string[];
  }
): Match[] {
  return matches.filter(match => {
    // Filter by odds range
    if (filters.oddsMin && filters.oddsMax) {
      const hasValidOdds = 
        (match.odds.h2h?.home >= filters.oddsMin && match.odds.h2h?.home <= filters.oddsMax) ||
        (match.odds.h2h?.away >= filters.oddsMin && match.odds.h2h?.away <= filters.oddsMax) ||
        (match.odds.ou25?.over >= filters.oddsMin && match.odds.ou25?.over <= filters.oddsMax);
      
      if (!hasValidOdds) return false;
    }
    
    // Filter by bookmakers
    if (filters.bookmakers && filters.bookmakers.length > 0) {
      const hasBookmaker = match.bookmakers.some(b => filters.bookmakers!.includes(b));
      if (!hasBookmaker) return false;
    }
    
    // Filter by leagues
    if (filters.leagues && filters.leagues.length > 0) {
      if (!filters.leagues.includes(match.league)) return false;
    }
    
    return true;
  });
}

export { bookmakers, leagues };
