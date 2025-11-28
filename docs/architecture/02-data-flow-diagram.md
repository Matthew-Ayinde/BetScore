# Data Flow Architecture

## 1. Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                    User Actions:
                    - Set odds range (1.20-1.80)
                    - Select markets (H2H, O/U, BTTS)
                    - Choose bookmakers
                    - Pick date range
                    - Adjust form/H2H weights
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (Next.js Routes)                         │
│                                                                               │
│  /api/odds/fetch          │  /api/matches/search      │  /api/booking/code  │
│  /api/stats/team          │  /api/user/preferences    │  /api/predictions   │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                   Request Validation
                   (Zod Schema)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MIDDLEWARE LAYER                                      │
│                                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                    │
│  │ Auth Check   │   │ Rate Limiter │   │ Input        │                    │
│  │ (Optional)   │───│ (Redis)      │───│ Sanitizer    │                    │
│  └──────────────┘   └──────────────┘   └──────────────┘                    │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BUSINESS LOGIC LAYER                                  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │                    ODDS AGGREGATION FLOW                     │            │
│  │                                                              │            │
│  │  1. Check Redis Cache (Key: odds:{league}:{date})           │            │
│  │     ├─ HIT  → Return cached data ─────────────────┐         │            │
│  │     └─ MISS → Continue to API fetch               │         │            │
│  │                                                    │         │            │
│  │  2. Fetch from The Odds API                       │         │            │
│  │     ├─ Success → Process data                     │         │            │
│  │     └─ Fail → Try RapidAPI backup                 │         │            │
│  │                └─ Fail → Log error, return empty  │         │            │
│  │                                                    │         │            │
│  │  3. Normalize odds data:                          │         │            │
│  │     - Convert to decimal format                   │         │            │
│  │     - Map bookmaker names                         │         │            │
│  │     - Extract markets (H2H, O/U, BTTS, DC)       │         │            │
│  │     - Apply user filters (odds range)             │         │            │
│  │                                                    │         │            │
│  │  4. Store in Redis (TTL: 5 min)                   │         │            │
│  │                                                    ▼         │            │
│  │  5. Store in PostgreSQL (historical) ◄────────────┘         │            │
│  └─────────────────────────────────────────────────────────────┘            │
│                            │                                                  │
│                            ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │                    STATS ENRICHMENT FLOW                     │            │
│  │                                                              │            │
│  │  For each filtered match:                                   │            │
│  │                                                              │            │
│  │  1. Check Redis Cache (Key: stats:{team_id}:{date})         │            │
│  │     ├─ HIT  → Return cached stats                           │            │
│  │     └─ MISS → Fetch from API-Football                       │            │
│  │                                                              │            │
│  │  2. Fetch Team Form (last N games):                         │            │
│  │     - Results (W/D/L)                                        │            │
│  │     - Goals scored/conceded                                 │            │
│  │     - Home/Away split                                       │            │
│  │     - Recent trend (last 3 games)                           │            │
│  │                                                              │            │
│  │  3. Fetch Head-to-Head (last N meetings):                   │            │
│  │     - Results distribution                                  │            │
│  │     - Average goals                                         │            │
│  │     - Home/Away advantage                                   │            │
│  │                                                              │            │
│  │  4. Store in Redis (TTL: 1 hour)                            │            │
│  │  5. Store in PostgreSQL (historical)                        │            │
│  └─────────────────────────────────────────────────────────────┘            │
│                            │                                                  │
│                            ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │                 PREDICTION ENGINE FLOW                       │            │
│  │                                                              │            │
│  │  For each match with stats:                                 │            │
│  │                                                              │            │
│  │  1. Calculate Form Score (0-100):                           │            │
│  │     Home: (Wins×3 + Draws×1) / (Games×3) × 100             │            │
│  │     Away: (Wins×3 + Draws×1) / (Games×3) × 100             │            │
│  │                                                              │            │
│  │  2. Calculate H2H Score (0-100):                            │            │
│  │     Home: (Wins / Total H2H) × 100                          │            │
│  │     Away: (Wins / Total H2H) × 100                          │            │
│  │                                                              │            │
│  │  3. Apply User Weights (default 60% Form, 40% H2H):         │            │
│  │     Home Win% = (Form × 0.6) + (H2H × 0.4) + Home Bonus(5%) │            │
│  │     Away Win% = (Form × 0.6) + (H2H × 0.4)                  │            │
│  │     Draw% = 100 - Home% - Away%                             │            │
│  │                                                              │            │
│  │  4. Calculate Confidence Level:                             │            │
│  │     High: Form + H2H data complete, odds align              │            │
│  │     Medium: Partial data, odds diverge                      │            │
│  │     Low: Limited data, high uncertainty                     │            │
│  │                                                              │            │
│  │  5. Generate Breakdown:                                     │            │
│  │     {                                                        │            │
│  │       homeWin: 65%,                                          │            │
│  │       draw: 20%,                                             │            │
│  │       awayWin: 15%,                                          │            │
│  │       confidence: "High",                                    │            │
│  │       breakdown: {                                           │            │
│  │         form: { home: 70, away: 30 },                       │            │
│  │         h2h: { home: 60, away: 40 },                        │            │
│  │         weights: { form: 60%, h2h: 40% }                    │            │
│  │       }                                                      │            │
│  │     }                                                        │            │
│  └─────────────────────────────────────────────────────────────┘            │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESPONSE FORMATTING                                   │
│                                                                               │
│  Combine all data:                                                            │
│  {                                                                            │
│    matches: [                                                                 │
│      {                                                                        │
│        id: "match-123",                                                       │
│        homeTeam: "Liverpool",                                                 │
│        awayTeam: "Arsenal",                                                   │
│        date: "2025-11-30T15:00:00Z",                                         │
│        league: "Premier League",                                              │
│        odds: {                                                                │
│          h2h: { home: 1.65, draw: 3.80, away: 5.20 },                       │
│          ou25: { over: 1.75, under: 2.10 },                                 │
│          btts: { yes: 1.55, no: 2.45 }                                      │
│        },                                                                     │
│        bookmakers: ["1xBet", "888sport"],                                     │
│        prediction: {                                                          │
│          homeWin: 65%, draw: 20%, awayWin: 15%,                             │
│          confidence: "High",                                                  │
│          breakdown: {...}                                                     │
│        },                                                                     │
│        form: { home: {...}, away: {...} },                                   │
│        h2h: [...]                                                             │
│      }                                                                        │
│    ],                                                                         │
│    meta: { total: 15, filtered: 8, cached: true }                           │
│  }                                                                            │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WEBSOCKET LAYER                                       │
│                                                                               │
│  Socket.io Server:                                                            │
│  - Room per league/date combo                                                │
│  - Push updates every 5 minutes                                               │
│  - Emit odds changes to subscribed clients                                    │
│                                                                               │
│  Events:                                                                      │
│  - "odds:updated" → New odds available                                        │
│  - "match:started" → Match went live, remove from list                        │
│  - "prediction:updated" → Stats refreshed                                     │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT UPDATE                                         │
│                                                                               │
│  React components re-render with:                                            │
│  - Updated odds highlights                                                    │
│  - New prediction percentages                                                 │
│  - Changed confidence levels                                                  │
│  - Toast notifications for significant changes                                │
└─────────────────────────────────────────────────────────────────────────────┘


## 2. Booking Code Generation Flow

┌─────────────────────────────────────────────────────────────────────────────┐
│  User selects matches + outcomes + primary bookmaker                         │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST /api/booking/generate                                                   │
│  {                                                                            │
│    bookmaker: "1xBet",                                                        │
│    selections: [                                                              │
│      { matchId: "123", market: "h2h", outcome: "home" },                     │
│      { matchId: "456", market: "ou25", outcome: "over" }                     │
│    ]                                                                          │
│  }                                                                            │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Bookmaker-Specific Handler                                                   │
│                                                                               │
│  IF bookmaker has API:                                                        │
│    → Call bookmaker API with selections                                       │
│    → Receive booking code                                                     │
│                                                                               │
│  ELSE:                                                                        │
│    → Generate internal reference code                                         │
│    → Store selections in DB                                                   │
│    → Return code + display instructions                                       │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Store in Database:                                                           │
│  - User ID (if authenticated)                                                 │
│  - Selections array                                                           │
│  - Booking code                                                               │
│  - Total odds                                                                 │
│  - Timestamp                                                                  │
│  - Status (pending/won/lost)                                                  │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Return to User:                                                              │
│  {                                                                            │
│    bookingCode: "BET-1XBET-ABC123",                                          │
│    totalOdds: 4.25,                                                           │
│    selections: 2,                                                             │
│    bookmaker: "1xBet",                                                        │
│    instructions: "Enter this code on 1xBet betslip",                         │
│    expiresAt: "2025-11-30T14:59:00Z"                                         │
│  }                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘


## 3. Background Jobs Flow

┌─────────────────────────────────────────────────────────────────────────────┐
│                         CRON SCHEDULER (Bull Queue)                           │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Every   │ │  Every   │ │  Every   │
        │ 5 mins   │ │  1 hour  │ │   Day    │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             ▼            ▼            ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │ Refresh    │ │ Update     │ │ Cleanup    │
    │ Popular    │ │ Team       │ │ Expired    │
    │ Odds       │ │ Stats      │ │ Cache      │
    └────┬───────┘ └────┬───────┘ └────┬───────┘
         │              │              │
         ▼              ▼              ▼
    Update Cache    Update DB     Delete Old
    Push WebSocket  Invalidate    Archive Bets
                    Cache         Cleanup Logs


## 4. Error Handling Flow

┌─────────────────────────────────────────────────────────────────────────────┐
│  API Request Error                                                            │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
          ┌─────────────┐   ┌─────────────┐
          │ Rate Limit  │   │ API Failure │
          │ Exceeded    │   │ (5xx, 4xx)  │
          └─────┬───────┘   └─────┬───────┘
                │                 │
                ▼                 ▼
        ┌──────────────┐   ┌──────────────┐
        │ Return 429   │   │ Try Fallback │
        │ + Retry-After│   │ API Source   │
        └──────────────┘   └─────┬────────┘
                                 │
                         ┌───────┴───────┐
                         │               │
                         ▼               ▼
                   ┌──────────┐    ┌──────────┐
                   │ Success  │    │  Fail    │
                   └────┬─────┘    └────┬─────┘
                        │               │
                        ▼               ▼
                  Return Data    ┌──────────────┐
                                 │ Log Error    │
                                 │ Return Cached│
                                 │ or Empty     │
                                 └──────────────┘


## 5. Cache Strategy Flow

┌─────────────────────────────────────────────────────────────────────────────┐
│                         CACHE HIERARCHY                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Level 1: Redis (5 min TTL)
  - Live odds for popular leagues
  - Active match data
  - Current predictions

Level 2: Redis (1 hour TTL)
  - Team statistics
  - Head-to-head records
  - League standings

Level 3: Redis (24 hour TTL)
  - User preferences
  - Bookmaker lists
  - League metadata

Level 4: PostgreSQL
  - Historical odds
  - Past predictions
  - User betting history

Cache Invalidation:
  - Manual: Admin triggers refresh
  - Auto: TTL expiration
  - Event-based: Match starts, result posted
  - Proactive: Background job pre-fetches
