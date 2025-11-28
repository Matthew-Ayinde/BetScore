# API Integration Architecture

## 1. External API Integration Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL API LAYER                                       │
└─────────────────────────────────────────────────────────────────────────────┘

                           ┌─────────────────┐
                           │  API Gateway    │
                           │  (Abstraction)  │
                           └────────┬────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │  ODDS PROVIDERS  │  │ STATS PROVIDERS  │  │ BOOKMAKER APIs   │
    └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
             │                     │                     │
     ┌───────┴────────┐    ┌───────┴────────┐    ┌───────┴────────┐
     │                │    │                │    │                │
     ▼                ▼    ▼                ▼    ▼                ▼
┌─────────┐   ┌─────────┐ ┌─────────┐  ┌─────────┐ ┌─────────┐  ┌─────────┐
│The Odds │   │RapidAPI │ │API-     │  │RapidAPI │ │1xBet    │  │888Sport │
│   API   │   │ Sports  │ │Football │  │ Backup  │ │ API     │  │  API    │
└─────────┘   └─────────┘ └─────────┘  └─────────┘ └─────────┘  └─────────┘
  PRIMARY      FALLBACK    PRIMARY      FALLBACK      OPTIONAL     OPTIONAL
```

## 2. The Odds API Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE ODDS API CLIENT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Base URL: https://api.the-odds-api.com/v4                                   │
│  Authentication: API Key (Query param)                                        │
│  Rate Limit: 500 requests/month (free), 5,000 (pro)                          │
│                                                                               │
│  Key Endpoints:                                                               │
│                                                                               │
│  1. Get Sports:                                                               │
│     GET /sports                                                               │
│     Response: List of available sports                                        │
│                                                                               │
│  2. Get Odds:                                                                 │
│     GET /sports/{sport}/odds                                                  │
│     Params:                                                                   │
│       - regions: uk,eu,us                                                     │
│       - markets: h2h,spreads,totals                                           │
│       - bookmakers: 1xbet,888sport,bet365                                     │
│       - oddsFormat: decimal                                                   │
│       - dateFormat: iso                                                       │
│                                                                               │
│     Response:                                                                 │
│     {                                                                         │
│       "id": "abc123",                                                         │
│       "sport_key": "soccer_epl",                                              │
│       "sport_title": "Premier League",                                        │
│       "commence_time": "2025-11-30T15:00:00Z",                               │
│       "home_team": "Liverpool",                                               │
│       "away_team": "Arsenal",                                                 │
│       "bookmakers": [                                                         │
│         {                                                                     │
│           "key": "1xbet",                                                     │
│           "title": "1xBet",                                                   │
│           "markets": [                                                        │
│             {                                                                 │
│               "key": "h2h",                                                   │
│               "outcomes": [                                                   │
│                 { "name": "Liverpool", "price": 1.65 },                       │
│                 { "name": "Arsenal", "price": 5.20 },                         │
│                 { "name": "Draw", "price": 3.80 }                             │
│               ]                                                               │
│             },                                                                │
│             {                                                                 │
│               "key": "totals",                                                │
│               "outcomes": [                                                   │
│                 { "name": "Over", "price": 1.75, "point": 2.5 },             │
│                 { "name": "Under", "price": 2.10, "point": 2.5 }             │
│               ]                                                               │
│             }                                                                 │
│           ]                                                                   │
│         }                                                                     │
│       ]                                                                       │
│     }                                                                         │
│                                                                               │
│  3. Get Historical Odds:                                                      │
│     GET /sports/{sport}/odds-history                                          │
│     (Pro plan only)                                                           │
│                                                                               │
│  Implementation:                                                              │
│                                                                               │
│  // lib/api-clients/TheOddsAPIClient.ts                                       │
│  export class TheOddsAPIClient {                                              │
│    private baseURL = 'https://api.the-odds-api.com/v4';                      │
│    private apiKey: string;                                                    │
│                                                                               │
│    async getOdds(sport: string, options: OddsOptions) {                      │
│      const params = new URLSearchParams({                                    │
│        apiKey: this.apiKey,                                                   │
│        regions: options.regions.join(','),                                    │
│        markets: options.markets.join(','),                                    │
│        oddsFormat: 'decimal',                                                 │
│      });                                                                      │
│                                                                               │
│      const response = await fetch(                                            │
│        `${this.baseURL}/sports/${sport}/odds?${params}`,                     │
│        { next: { revalidate: 300 } } // Cache 5 min                          │
│      );                                                                       │
│                                                                               │
│      if (!response.ok) {                                                      │
│        throw new APIError('The Odds API', response.status);                  │
│      }                                                                        │
│                                                                               │
│      // Track remaining requests                                              │
│      const remaining = response.headers.get('x-requests-remaining');         │
│      console.log(`The Odds API: ${remaining} requests remaining`);           │
│                                                                               │
│      return response.json();                                                  │
│    }                                                                          │
│  }                                                                            │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3. API-Football Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      API-FOOTBALL CLIENT                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Base URL: https://v3.football.api-sports.io                                 │
│  Authentication: API Key (Header: x-apisports-key)                            │
│  Rate Limit: 100 requests/day (free), 1,000 (pro)                            │
│                                                                               │
│  Key Endpoints:                                                               │
│                                                                               │
│  1. Get Fixtures:                                                             │
│     GET /fixtures                                                             │
│     Params: date, league, season, team                                        │
│                                                                               │
│  2. Get Team Statistics:                                                      │
│     GET /teams/statistics                                                     │
│     Params: team, season, league                                              │
│                                                                               │
│     Response:                                                                 │
│     {                                                                         │
│       "response": {                                                           │
│         "form": "WWDLW",                                                      │
│         "fixtures": {                                                         │
│           "played": { "home": 10, "away": 10, "total": 20 },                 │
│           "wins": { "home": 7, "away": 5, "total": 12 },                     │
│           "draws": { "home": 2, "away": 3, "total": 5 },                     │
│           "loses": { "home": 1, "away": 2, "total": 3 }                      │
│         },                                                                    │
│         "goals": {                                                            │
│           "for": {                                                            │
│             "total": { "home": 25, "away": 18 },                             │
│             "average": { "home": "2.5", "away": "1.8" }                      │
│           },                                                                  │
│           "against": {                                                        │
│             "total": { "home": 8, "away": 12 },                              │
│             "average": { "home": "0.8", "away": "1.2" }                      │
│           }                                                                   │
│         },                                                                    │
│         "clean_sheet": { "home": 6, "away": 4, "total": 10 }                 │
│       }                                                                       │
│     }                                                                         │
│                                                                               │
│  3. Get Head-to-Head:                                                         │
│     GET /fixtures/headtohead                                                  │
│     Params: h2h (team1-team2), last (number of meetings)                     │
│                                                                               │
│     Response:                                                                 │
│     {                                                                         │
│       "response": [                                                           │
│         {                                                                     │
│           "fixture": {                                                        │
│             "id": 12345,                                                      │
│             "date": "2024-08-15T14:00:00Z",                                  │
│             "venue": { "name": "Anfield" }                                   │
│           },                                                                  │
│           "teams": {                                                          │
│             "home": { "id": 40, "name": "Liverpool", "winner": true },       │
│             "away": { "id": 42, "name": "Arsenal", "winner": false }         │
│           },                                                                  │
│           "goals": { "home": 3, "away": 1 },                                 │
│           "score": {                                                          │
│             "fulltime": { "home": 3, "away": 1 }                             │
│           }                                                                   │
│         }                                                                     │
│       ]                                                                       │
│     }                                                                         │
│                                                                               │
│  Implementation:                                                              │
│                                                                               │
│  // lib/api-clients/APIFootballClient.ts                                      │
│  export class APIFootballClient {                                             │
│    private baseURL = 'https://v3.football.api-sports.io';                    │
│    private apiKey: string;                                                    │
│                                                                               │
│    async getTeamStats(teamId: number, season: number, league: number) {      │
│      const response = await fetch(                                            │
│        `${this.baseURL}/teams/statistics?team=${teamId}&season=${season}&league=${league}`,│
│        {                                                                      │
│          headers: { 'x-apisports-key': this.apiKey },                        │
│          next: { revalidate: 3600 } // Cache 1 hour                          │
│        }                                                                      │
│      );                                                                       │
│                                                                               │
│      if (!response.ok) {                                                      │
│        throw new APIError('API-Football', response.status);                  │
│      }                                                                        │
│                                                                               │
│      const data = await response.json();                                     │
│      return this.normalizeTeamStats(data.response);                          │
│    }                                                                          │
│                                                                               │
│    private normalizeTeamStats(data: any): TeamStats {                        │
│      return {                                                                 │
│        form: data.form,                                                       │
│        gamesPlayed: data.fixtures.played.total,                              │
│        wins: data.fixtures.wins.total,                                        │
│        draws: data.fixtures.draws.total,                                      │
│        losses: data.fixtures.loses.total,                                     │
│        goalsScored: data.goals.for.total.home + data.goals.for.total.away,   │
│        goalsConceded: data.goals.against.total.home + data.goals.against.total.away,│
│        cleanSheets: data.clean_sheet.total,                                  │
│      };                                                                       │
│    }                                                                          │
│  }                                                                            │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4. Fallback & Circuit Breaker Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CIRCUIT BREAKER IMPLEMENTATION                              │
└─────────────────────────────────────────────────────────────────────────────┘

State Machine:

                    ┌─────────┐
                    │ CLOSED  │ ◄──── Normal operation
                    │ (OK)    │       All requests pass through
                    └────┬────┘
                         │
                   5 failures in 1 min
                         │
                         ▼
                    ┌─────────┐
                    │  OPEN   │ ◄──── Circuit is broken
                    │ (Error) │       Requests fail immediately
                    └────┬────┘       Fallback to cache/alternative
                         │
                   Wait 60 seconds
                         │
                         ▼
                    ┌─────────┐
                    │  HALF   │ ◄──── Testing recovery
                    │  OPEN   │       Allow 1 test request
                    └────┬────┘
                         │
                    ┌────┴────┐
                    │         │
              Success       Failure
                    │         │
                    ▼         ▼
              ┌─────────┐ ┌─────────┐
              │ CLOSED  │ │  OPEN   │
              └─────────┘ └─────────┘


Implementation:

// lib/utils/CircuitBreaker.ts

export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private lastFailureTime?: Date;
  
  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    // If open, don't even try the main function
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.timeout) {
        this.state = 'half-open';
      } else {
        console.log('Circuit is OPEN, using fallback');
        return fallback();
      }
    }
    
    try {
      const result = await fn();
      
      // Success! Reset if we were half-open
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = new Date();
      
      // Open the circuit if we hit threshold
      if (this.failures >= this.threshold) {
        this.state = 'open';
        console.log('Circuit OPENED due to failures');
      }
      
      // Use fallback
      return fallback();
    }
  }
}


Usage:

// lib/services/odds/OddsAggregator.ts

const theOddsAPIBreaker = new CircuitBreaker(5, 60000);
const rapidAPIBreaker = new CircuitBreaker(5, 60000);

export async function fetchOdds(league: string, date: string) {
  // Try The Odds API with circuit breaker
  return theOddsAPIBreaker.execute(
    async () => {
      const data = await theOddsAPIClient.getOdds(league, { date });
      return normalizeOdds(data);
    },
    async () => {
      // Fallback to RapidAPI
      console.log('Falling back to RapidAPI');
      
      return rapidAPIBreaker.execute(
        async () => {
          const data = await rapidAPIClient.getOdds(league, { date });
          return normalizeOdds(data);
        },
        async () => {
          // Ultimate fallback: return cached data
          console.log('All APIs failed, returning cache');
          const cached = await cacheManager.get(`odds:${league}:${date}`);
          
          if (!cached) {
            throw new Error('No cached data available');
          }
          
          return cached;
        }
      );
    }
  );
}
```

## 5. Rate Limiting Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     RATE LIMIT MANAGEMENT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  API Quotas:                                                                  │
│                                                                               │
│  The Odds API:     500 requests/month   = ~16/day   = ~1/hour                │
│  API-Football:     100 requests/day     = ~4/hour                            │
│  RapidAPI:         500 requests/month   = ~16/day   = ~1/hour                │
│                                                                               │
│  Strategy:                                                                    │
│                                                                               │
│  1. Request Budgeting:                                                        │
│     - Track usage per API in Redis                                            │
│     - Reset counters based on API billing cycle                               │
│     - Alert at 80% usage                                                      │
│                                                                               │
│  2. Request Prioritization:                                                   │
│     Priority 1: Popular leagues (EPL, La Liga, UCL)                          │
│     Priority 2: User-requested leagues                                        │
│     Priority 3: Background data refresh                                       │
│                                                                               │
│  3. Smart Caching:                                                            │
│     - Cache odds for 5 minutes (reduce API calls)                             │
│     - Cache stats for 1 hour (teams don't change often)                       │
│     - Prefetch popular matches during off-peak                                │
│                                                                               │
│  4. Request Batching:                                                         │
│     - Batch multiple match requests into one API call                         │
│     - Request all markets in single call (h2h, ou, btts)                     │
│                                                                               │
│  Implementation:                                                              │
│                                                                               │
│  // lib/services/RateLimiter.ts                                               │
│                                                                               │
│  export class APIRateLimiter {                                                │
│    private redis: Redis;                                                      │
│                                                                               │
│    async checkQuota(apiName: string): Promise<boolean> {                     │
│      const key = `rate-limit:${apiName}:${this.getCurrentPeriod()}`;         │
│      const current = await this.redis.get(key);                              │
│                                                                               │
│      const limits = {                                                         │
│        'the-odds-api': 16,  // per day                                        │
│        'api-football': 4,   // per hour                                       │
│        'rapidapi': 16,      // per day                                        │
│      };                                                                       │
│                                                                               │
│      if (parseInt(current || '0') >= limits[apiName]) {                      │
│        console.warn(`${apiName} rate limit reached`);                        │
│        return false;                                                          │
│      }                                                                        │
│                                                                               │
│      return true;                                                             │
│    }                                                                          │
│                                                                               │
│    async incrementUsage(apiName: string) {                                    │
│      const key = `rate-limit:${apiName}:${this.getCurrentPeriod()}`;         │
│      await this.redis.incr(key);                                             │
│      await this.redis.expire(key, 86400); // 24 hours                        │
│    }                                                                          │
│  }                                                                            │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6. Data Normalization Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA NORMALIZATION PIPELINE                              │
└─────────────────────────────────────────────────────────────────────────────┘

Raw API Response (Different Formats)
             │
             ▼
┌────────────────────────────────────┐
│  Step 1: Extract Core Data         │
│  - Match ID                         │
│  - Team names                       │
│  - Date/time                        │
│  - League                           │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│  Step 2: Normalize Team Names      │
│  - Map variations                   │
│    "Man United" → "Manchester Utd" │
│    "Liverpool FC" → "Liverpool"    │
│  - Resolve to team_id               │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│  Step 3: Normalize Odds Format     │
│  - Convert to decimal               │
│  - Fractional → Decimal             │
│  - American → Decimal               │
│  - Validate range (1.01 - 1000)    │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│  Step 4: Structure Markets         │
│  {                                  │
│    h2h: {                           │
│      home: 1.65,                    │
│      draw: 3.80,                    │
│      away: 5.20                     │
│    },                               │
│    ou25: {                          │
│      over: 1.75,                    │
│      under: 2.10                    │
│    },                               │
│    btts: {                          │
│      yes: 1.55,                     │
│      no: 2.45                       │
│    }                                │
│  }                                  │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│  Step 5: Add Metadata               │
│  - Source API                       │
│  - Fetch timestamp                  │
│  - Bookmaker info                   │
│  - Market availability flags        │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│  Normalized Match Object            │
└────────────────────────────────────┘


Implementation:

// lib/services/odds/OddsNormalizer.ts

export class OddsNormalizer {
  normalizeTheOddsAPI(data: TheOddsAPIResponse): NormalizedMatch {
    return {
      id: data.id,
      homeTeam: this.normalizeTeamName(data.home_team),
      awayTeam: this.normalizeTeamName(data.away_team),
      date: new Date(data.commence_time),
      league: this.mapLeague(data.sport_key),
      odds: this.extractMarkets(data.bookmakers),
      bookmakers: data.bookmakers.map(b => b.title),
      source: 'the-odds-api',
      fetchedAt: new Date(),
    };
  }
  
  private normalizeTeamName(name: string): string {
    const mapping = {
      'Man United': 'Manchester United',
      'Man City': 'Manchester City',
      'Liverpool FC': 'Liverpool',
      // ... more mappings
    };
    
    return mapping[name] || name;
  }
  
  private extractMarkets(bookmakers: any[]): Markets {
    const markets: Markets = {};
    
    bookmakers.forEach(bookmaker => {
      bookmaker.markets.forEach(market => {
        if (market.key === 'h2h') {
          markets.h2h = {
            home: market.outcomes.find(o => o.name === 'home')?.price,
            draw: market.outcomes.find(o => o.name === 'draw')?.price,
            away: market.outcomes.find(o => o.name === 'away')?.price,
          };
        }
        // ... handle other markets
      });
    });
    
    return markets;
  }
}
```

## 7. API Response Caching Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CACHING DECISION TREE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

API Request
     │
     ▼
Is data in cache?
     ├── YES ──► Is TTL expired?
     │           ├── NO ──► Return cached data ──► END
     │           └── YES ──► Continue to API call
     │
     └── NO ──► Check rate limit
                 ├── OK ──► Call API ──► Store in cache ──► Return ──► END
                 └── EXCEEDED ──► Return stale cache (if exists) ──► END
                                   └── No cache ──► Return error ──► END


Cache Keys:

odds:{league}:{date}:{bookmakers}
  TTL: 5 minutes
  Example: odds:epl:2025-11-30:1xbet,888sport

stats:team:{team_id}:{last_n_games}
  TTL: 1 hour
  Example: stats:team:40:5

h2h:{team_a_id}:{team_b_id}:{last_n_meetings}
  TTL: 24 hours
  Example: h2h:40:42:10

user:prefs:{user_id}
  TTL: 1 hour
  Example: user:prefs:uuid-123


Invalidation Events:

- Match starts → Delete odds cache for that match
- Match ends → Delete all caches for those teams
- User updates prefs → Delete user prefs cache
- Manual admin trigger → Delete specific league/date cache
```

## 8. Error Handling Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API ERROR HANDLING                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  HTTP 200 OK            → Process normally                                    │
│                                                                               │
│  HTTP 400 Bad Request   → Log error, validate input, return 400 to client    │
│                                                                               │
│  HTTP 401 Unauthorized  → Invalid API key, alert admin, use fallback API     │
│                                                                               │
│  HTTP 403 Forbidden     → Quota exceeded, use cache, alert admin             │
│                                                                               │
│  HTTP 404 Not Found     → Resource doesn't exist, return empty to client     │
│                                                                               │
│  HTTP 429 Too Many Req  → Rate limited, open circuit breaker, use cache      │
│                                                                               │
│  HTTP 500 Server Error  → API is down, use fallback API or cache             │
│                                                                               │
│  HTTP 503 Unavailable   → API maintenance, use cache, retry after 5 min      │
│                                                                               │
│  Network Timeout        → Retry once, then use fallback or cache             │
│                                                                               │
│  Connection Refused     → API is completely down, use cache only             │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 9. API Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      API HEALTH DASHBOARD                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  The Odds API:                                                                │
│  Status: ✓ Operational                                                        │
│  Response Time: 345ms (avg)                                                   │
│  Success Rate: 99.2%                                                          │
│  Quota Used: 450/500 (90%)                                                    │
│  Circuit Breaker: CLOSED                                                      │
│                                                                               │
│  API-Football:                                                                │
│  Status: ✓ Operational                                                        │
│  Response Time: 520ms (avg)                                                   │
│  Success Rate: 98.5%                                                          │
│  Quota Used: 75/100 (75%)                                                     │
│  Circuit Breaker: CLOSED                                                      │
│                                                                               │
│  RapidAPI:                                                                    │
│  Status: ⚠ Degraded                                                          │
│  Response Time: 1200ms (avg)                                                  │
│  Success Rate: 85%                                                            │
│  Quota Used: 320/500 (64%)                                                    │
│  Circuit Breaker: HALF-OPEN                                                   │
│                                                                               │
│  Cache Performance:                                                           │
│  Hit Rate: 92%                                                                │
│  Avg Retrieval Time: 2ms                                                      │
│  Memory Usage: 125MB / 256MB                                                  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```
