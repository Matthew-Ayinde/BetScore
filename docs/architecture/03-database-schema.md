# Database Schema Architecture

## 1. Complete Database ERD

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA (PostgreSQL)                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────┐
│       USERS           │
├───────────────────────┤
│ PK  id                │ UUID
│     email             │ VARCHAR(255) UNIQUE
│     username          │ VARCHAR(100)
│     password_hash     │ VARCHAR(255) (nullable for OAuth)
│     created_at        │ TIMESTAMP
│     updated_at        │ TIMESTAMP
│     last_login        │ TIMESTAMP
│     is_active         │ BOOLEAN
│     email_verified    │ BOOLEAN
└───────┬───────────────┘
        │
        │ 1:1
        ▼
┌───────────────────────────────────┐
│    USER_PREFERENCES               │
├───────────────────────────────────┤
│ PK  id                            │ UUID
│ FK  user_id                       │ UUID → users.id
│     default_odds_min              │ DECIMAL(5,2)
│     default_odds_max              │ DECIMAL(5,2)
│     default_markets               │ JSONB ['h2h', 'ou', 'btts']
│     favorite_bookmakers           │ JSONB ['1xBet', '888sport']
│     primary_bookmaker             │ VARCHAR(50)
│     default_leagues               │ JSONB ['EPL', 'La Liga']
│     form_depth                    │ INTEGER (5, 10)
│     h2h_depth                     │ INTEGER (5, 10)
│     form_weight                   │ INTEGER (0-100) default 60
│     h2h_weight                    │ INTEGER (0-100) default 40
│     notifications_enabled         │ BOOLEAN
│     websocket_enabled             │ BOOLEAN
│     created_at                    │ TIMESTAMP
│     updated_at                    │ TIMESTAMP
└───────────────────────────────────┘


┌───────────────────────┐
│       LEAGUES         │
├───────────────────────┤
│ PK  id                │ UUID
│     name              │ VARCHAR(100) UNIQUE
│     code              │ VARCHAR(10) UNIQUE (EPL, LAL)
│     country           │ VARCHAR(100)
│     api_football_id   │ INTEGER
│     the_odds_api_key  │ VARCHAR(50)
│     sport_type        │ VARCHAR(50) (football, basketball)
│     is_active         │ BOOLEAN
│     season            │ VARCHAR(20) (2024-2025)
│     created_at        │ TIMESTAMP
└───────┬───────────────┘
        │
        │ 1:N
        ▼
┌───────────────────────────────────┐
│         TEAMS                     │
├───────────────────────────────────┤
│ PK  id                            │ UUID
│ FK  league_id                     │ UUID → leagues.id
│     name                          │ VARCHAR(100)
│     short_name                    │ VARCHAR(50)
│     api_football_id               │ INTEGER UNIQUE
│     logo_url                      │ TEXT
│     home_stadium                  │ VARCHAR(100)
│     founded                       │ INTEGER
│     country                       │ VARCHAR(100)
│     is_active                     │ BOOLEAN
│     created_at                    │ TIMESTAMP
│     updated_at                    │ TIMESTAMP
└───────┬───────────────────────────┘
        │
        │ 1:N
        ▼
┌───────────────────────────────────────────────────────┐
│                    MATCHES                            │
├───────────────────────────────────────────────────────┤
│ PK  id                                                │ UUID
│ FK  league_id                                         │ UUID → leagues.id
│ FK  home_team_id                                      │ UUID → teams.id
│ FK  away_team_id                                      │ UUID → teams.id
│     api_football_id                                   │ INTEGER UNIQUE
│     the_odds_api_id                                   │ VARCHAR(50)
│     match_date                                        │ TIMESTAMP
│     status                                            │ ENUM (scheduled, live, finished, cancelled)
│     home_score                                        │ INTEGER (nullable)
│     away_score                                        │ INTEGER (nullable)
│     venue                                             │ VARCHAR(100)
│     referee                                           │ VARCHAR(100)
│     round                                             │ VARCHAR(50)
│     season                                            │ VARCHAR(20)
│     last_updated                                      │ TIMESTAMP
│     created_at                                        │ TIMESTAMP
│                                                       │
│     INDEX idx_match_date ON (match_date)              │
│     INDEX idx_league_date ON (league_id, match_date)  │
│     INDEX idx_status ON (status)                      │
└───────┬───────────────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌───────────────────────────────────────────────────────────────┐
│                         ODDS                                  │
├───────────────────────────────────────────────────────────────┤
│ PK  id                                                        │ UUID
│ FK  match_id                                                  │ UUID → matches.id
│     bookmaker_name                                            │ VARCHAR(50)
│     bookmaker_key                                             │ VARCHAR(50)
│     market_type                                               │ ENUM (h2h, ou, btts, dc, ht, cs)
│     market_line                                               │ DECIMAL(3,1) (for O/U: 2.5)
│     home_odds                                                 │ DECIMAL(6,2)
│     draw_odds                                                 │ DECIMAL(6,2) (nullable)
│     away_odds                                                 │ DECIMAL(6,2)
│     last_updated                                              │ TIMESTAMP
│     created_at                                                │ TIMESTAMP
│                                                               │
│     INDEX idx_match_bookmaker ON (match_id, bookmaker_name)   │
│     INDEX idx_market_type ON (market_type)                    │
│     INDEX idx_odds_range ON (home_odds, away_odds)            │
│     UNIQUE (match_id, bookmaker_name, market_type, market_line)│
└───────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────┐
│                  TEAM_STATISTICS                      │
├───────────────────────────────────────────────────────┤
│ PK  id                                                │ UUID
│ FK  team_id                                           │ UUID → teams.id
│ FK  match_id                                          │ UUID → matches.id
│     date                                              │ DATE
│     games_played                                      │ INTEGER
│     wins                                              │ INTEGER
│     draws                                             │ INTEGER
│     losses                                            │ INTEGER
│     goals_for                                         │ INTEGER
│     goals_against                                     │ INTEGER
│     clean_sheets                                      │ INTEGER
│     failed_to_score                                   │ INTEGER
│     home_games_played                                 │ INTEGER
│     home_wins                                         │ INTEGER
│     away_games_played                                 │ INTEGER
│     away_wins                                         │ INTEGER
│     form_last_5                                       │ VARCHAR(5) (WWDLW)
│     form_last_10                                      │ VARCHAR(10)
│     avg_goals_scored                                  │ DECIMAL(3,2)
│     avg_goals_conceded                                │ DECIMAL(3,2)
│     calculated_at                                     │ TIMESTAMP
│     created_at                                        │ TIMESTAMP
│                                                       │
│     INDEX idx_team_date ON (team_id, date)            │
│     UNIQUE (team_id, date)                            │
└───────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────┐
│                  HEAD_TO_HEAD                         │
├───────────────────────────────────────────────────────┤
│ PK  id                                                │ UUID
│ FK  team_a_id                                         │ UUID → teams.id
│ FK  team_b_id                                         │ UUID → teams.id
│     total_meetings                                    │ INTEGER
│     team_a_wins                                       │ INTEGER
│     team_b_wins                                       │ INTEGER
│     draws                                             │ INTEGER
│     last_5_results                                    │ JSONB [{winner, score, date}]
│     last_10_results                                   │ JSONB
│     avg_goals_team_a                                  │ DECIMAL(3,2)
│     avg_goals_team_b                                  │ DECIMAL(3,2)
│     home_advantage_team_a                             │ DECIMAL(5,2) %
│     calculated_at                                     │ TIMESTAMP
│     updated_at                                        │ TIMESTAMP
│                                                       │
│     INDEX idx_teams_pair ON (team_a_id, team_b_id)    │
│     UNIQUE (team_a_id, team_b_id)                     │
└───────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────┐
│                    PREDICTIONS                            │
├───────────────────────────────────────────────────────────┤
│ PK  id                                                    │ UUID
│ FK  match_id                                              │ UUID → matches.id
│ FK  user_id                                               │ UUID → users.id (nullable)
│     home_win_percent                                      │ DECIMAL(5,2)
│     draw_percent                                          │ DECIMAL(5,2)
│     away_win_percent                                      │ DECIMAL(5,2)
│     confidence_level                                      │ ENUM (low, medium, high)
│     confidence_score                                      │ DECIMAL(5,2) (0-100)
│     form_weight_used                                      │ INTEGER
│     h2h_weight_used                                       │ INTEGER
│     home_form_score                                       │ DECIMAL(5,2)
│     away_form_score                                       │ DECIMAL(5,2)
│     home_h2h_score                                        │ DECIMAL(5,2)
│     away_h2h_score                                        │ DECIMAL(5,2)
│     home_bonus_applied                                    │ DECIMAL(5,2)
│     model_version                                         │ VARCHAR(10) (v1.0)
│     breakdown                                             │ JSONB (full calc details)
│     created_at                                            │ TIMESTAMP
│                                                           │
│     INDEX idx_match_prediction ON (match_id)              │
│     INDEX idx_confidence ON (confidence_level)            │
└───────────────────────────────────────────────────────────┘


        ┌───────────────────┐
        │       USERS       │
        └─────────┬─────────┘
                  │
                  │ 1:N
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                       BETTING_SLIPS                         │
├─────────────────────────────────────────────────────────────┤
│ PK  id                                                      │ UUID
│ FK  user_id                                                 │ UUID → users.id
│     booking_code                                            │ VARCHAR(50) UNIQUE
│     bookmaker_name                                          │ VARCHAR(50)
│     total_odds                                              │ DECIMAL(8,2)
│     stake_amount                                            │ DECIMAL(10,2) (nullable)
│     potential_return                                        │ DECIMAL(10,2) (nullable)
│     num_selections                                          │ INTEGER
│     status                                                  │ ENUM (pending, won, lost, void)
│     settled_at                                              │ TIMESTAMP (nullable)
│     expires_at                                              │ TIMESTAMP
│     created_at                                              │ TIMESTAMP
│     updated_at                                              │ TIMESTAMP
│                                                             │
│     INDEX idx_user_status ON (user_id, status)              │
│     INDEX idx_booking_code ON (booking_code)                │
└─────────┬───────────────────────────────────────────────────┘
          │
          │ 1:N
          ▼
┌───────────────────────────────────────────────────────────┐
│                    BETTING_SELECTIONS                     │
├───────────────────────────────────────────────────────────┤
│ PK  id                                                    │ UUID
│ FK  betting_slip_id                                       │ UUID → betting_slips.id
│ FK  match_id                                              │ UUID → matches.id
│ FK  prediction_id                                         │ UUID → predictions.id (nullable)
│     market_type                                           │ ENUM (h2h, ou, btts, dc)
│     market_line                                           │ DECIMAL(3,1) (nullable)
│     selection                                             │ VARCHAR(50) (home, away, over, yes)
│     odds                                                  │ DECIMAL(6,2)
│     result                                                │ ENUM (pending, won, lost, void)
│     created_at                                            │ TIMESTAMP
│                                                           │
│     INDEX idx_slip_match ON (betting_slip_id, match_id)   │
└───────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────┐
│                   BOOKMAKERS                            │
├─────────────────────────────────────────────────────────┤
│ PK  id                                                  │ UUID
│     name                                                │ VARCHAR(100) UNIQUE
│     key                                                 │ VARCHAR(50) UNIQUE
│     the_odds_api_key                                    │ VARCHAR(50)
│     logo_url                                            │ TEXT
│     website_url                                         │ TEXT
│     supports_booking_code                               │ BOOLEAN
│     booking_code_api_endpoint                           │ TEXT (nullable)
│     booking_code_format                                 │ VARCHAR(50) (nullable)
│     is_active                                           │ BOOLEAN
│     priority                                            │ INTEGER (display order)
│     regions                                             │ JSONB ['uk', 'eu', 'us']
│     created_at                                          │ TIMESTAMP
│     updated_at                                          │ TIMESTAMP
└─────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────┐
│                   API_LOGS                              │
├─────────────────────────────────────────────────────────┤
│ PK  id                                                  │ UUID
│     api_name                                            │ VARCHAR(50)
│     endpoint                                            │ TEXT
│     method                                              │ VARCHAR(10)
│     status_code                                         │ INTEGER
│     request_payload                                     │ JSONB (nullable)
│     response_payload                                    │ JSONB (nullable)
│     error_message                                       │ TEXT (nullable)
│     response_time_ms                                    │ INTEGER
│     user_id                                             │ UUID (nullable)
│     ip_address                                          │ VARCHAR(45)
│     created_at                                          │ TIMESTAMP
│                                                         │
│     INDEX idx_api_timestamp ON (api_name, created_at)   │
│     INDEX idx_status ON (status_code)                   │
└─────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────┐
│                   RATE_LIMITS                           │
├─────────────────────────────────────────────────────────┤
│ PK  id                                                  │ UUID
│     user_id                                             │ UUID (nullable) → users.id
│     ip_address                                          │ VARCHAR(45)
│     endpoint                                            │ VARCHAR(100)
│     request_count                                       │ INTEGER
│     window_start                                        │ TIMESTAMP
│     window_end                                          │ TIMESTAMP
│     is_blocked                                          │ BOOLEAN
│     created_at                                          │ TIMESTAMP
│                                                         │
│     INDEX idx_user_endpoint ON (user_id, endpoint)      │
│     INDEX idx_ip_endpoint ON (ip_address, endpoint)     │
└─────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────┐
│                   WEBSOCKET_CONNECTIONS                 │
├─────────────────────────────────────────────────────────┤
│ PK  id                                                  │ UUID
│     socket_id                                           │ VARCHAR(50) UNIQUE
│     user_id                                             │ UUID (nullable) → users.id
│     ip_address                                          │ VARCHAR(45)
│     rooms                                               │ JSONB ['epl-2025-11-30']
│     connected_at                                        │ TIMESTAMP
│     last_ping                                           │ TIMESTAMP
│     is_active                                           │ BOOLEAN
└─────────────────────────────────────────────────────────┘
```

## 2. Key Relationships

```
USERS (1) ────────────── (1) USER_PREFERENCES
  │
  ├── (1) ────────────── (N) BETTING_SLIPS
  │                           │
  │                           └── (1) ────────────── (N) BETTING_SELECTIONS
  │
  └── (1) ────────────── (N) PREDICTIONS


LEAGUES (1) ────────────── (N) TEAMS
   │
   └── (1) ────────────── (N) MATCHES
                               │
                               ├── (1) ────────────── (N) ODDS
                               ├── (1) ────────────── (1) PREDICTIONS
                               └── (1) ────────────── (N) TEAM_STATISTICS


TEAMS (1) ─────────────────────┐
  │                            │
  ├── (1) ────── (N) TEAM_STATISTICS
  │                            │
  └────────────────────────────┴── (2) ────────────── (1) HEAD_TO_HEAD
                    (team_a & team_b)
```

## 3. Indexes Strategy

### Performance-Critical Indexes
```sql
-- Frequently queried date ranges
CREATE INDEX idx_match_date_status ON matches(match_date, status);
CREATE INDEX idx_match_league_date ON matches(league_id, match_date, status);

-- Odds filtering
CREATE INDEX idx_odds_bookmaker_match ON odds(bookmaker_name, match_id);
CREATE INDEX idx_odds_range ON odds(home_odds, away_odds) WHERE draw_odds IS NOT NULL;

-- User betting history
CREATE INDEX idx_betting_slips_user_created ON betting_slips(user_id, created_at DESC);
CREATE INDEX idx_betting_selections_slip ON betting_selections(betting_slip_id);

-- Statistics lookups
CREATE INDEX idx_team_stats_team_date ON team_statistics(team_id, date DESC);
CREATE INDEX idx_h2h_teams ON head_to_head(team_a_id, team_b_id);

-- API monitoring
CREATE INDEX idx_api_logs_time ON api_logs(created_at DESC, api_name);
CREATE INDEX idx_api_logs_errors ON api_logs(status_code) WHERE status_code >= 400;
```

## 4. Data Types Rationale

| Column Type | Reason |
|-------------|--------|
| UUID | Prevents enumeration attacks, globally unique |
| JSONB | Flexible nested data, queryable with GIN indexes |
| DECIMAL(6,2) | Precise odds calculations (e.g., 1.85, 125.50) |
| ENUM | Type safety, faster than VARCHAR for fixed values |
| TIMESTAMP | Always store in UTC, convert in application |

## 5. Data Retention Policy

```
Odds:               Keep last 30 days in hot storage, archive older
Team Statistics:    Keep full season + last season
Matches:            Keep indefinitely (compressed after 1 year)
API Logs:           Keep 7 days, archive weekly summaries
Betting Slips:      Keep indefinitely (user data)
Predictions:        Keep 90 days for accuracy tracking
WebSocket Logs:     Keep 24 hours only
```

## 6. Partitioning Strategy

For scaling to millions of records:

```sql
-- Partition matches by month
CREATE TABLE matches_2025_11 PARTITION OF matches
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Partition odds by date
CREATE TABLE odds_2025_11 PARTITION OF odds
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Partition API logs by week
CREATE TABLE api_logs_2025_w48 PARTITION OF api_logs
FOR VALUES FROM ('2025-11-24') TO ('2025-12-01');
```

## 7. Prisma Schema (TypeScript)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  username       String
  passwordHash   String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  lastLogin      DateTime?
  isActive       Boolean   @default(true)
  emailVerified  Boolean   @default(false)
  
  preferences    UserPreferences?
  bettingSlips   BettingSlip[]
  predictions    Prediction[]
  
  @@map("users")
}

model Match {
  id              String      @id @default(uuid())
  leagueId        String
  homeTeamId      String
  awayTeamId      String
  apiFootballId   Int         @unique
  theOddsApiId    String?
  matchDate       DateTime
  status          MatchStatus
  homeScore       Int?
  awayScore       Int?
  venue           String?
  
  league          League      @relation(fields: [leagueId], references: [id])
  homeTeam        Team        @relation("HomeMatches", fields: [homeTeamId], references: [id])
  awayTeam        Team        @relation("AwayMatches", fields: [awayTeamId], references: [id])
  odds            Odds[]
  predictions     Prediction[]
  
  @@index([matchDate])
  @@index([leagueId, matchDate])
  @@map("matches")
}

enum MatchStatus {
  SCHEDULED
  LIVE
  FINISHED
  CANCELLED
}

// ... (similar for all other tables)
```
