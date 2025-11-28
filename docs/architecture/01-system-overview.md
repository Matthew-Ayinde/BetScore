# BetScore System Architecture Overview

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Next.js)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Dashboard  │  │   Filters    │  │  Results     │  │   Booking    │   │
│  │     Page     │  │  Component   │  │   Grid       │  │     Code     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                  │                  │            │
│         └─────────────────┴──────────────────┴──────────────────┘            │
│                                    │                                          │
│                            WebSocket Client                                   │
│                                    │                                          │
└────────────────────────────────────┼──────────────────────────────────────────┘
                                     │
                        ┌────────────┴─────────────┐
                        │   API Gateway Layer      │
                        │   (Next.js API Routes)   │
                        └────────────┬─────────────┘
                                     │
┌────────────────────────────────────┼──────────────────────────────────────────┐
│                            APPLICATION LAYER                                   │
├────────────────────────────────────┴──────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Odds Service   │  │  Stats Service  │  │ Prediction      │              │
│  │  - Fetch odds   │  │  - Team form    │  │ Engine          │              │
│  │  - Normalize    │  │  - Head-to-head │  │ - Win calc      │              │
│  │  - Filter       │  │  - Stats calc   │  │ - Confidence    │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                     │                        │
│  ┌────────┴────────────────────┴─────────────────────┴────────┐              │
│  │              Cache Layer (Redis)                            │              │
│  │  - Odds cache (5 min TTL)                                   │              │
│  │  - Stats cache (1 hour TTL)                                 │              │
│  │  - User preferences cache                                   │              │
│  └────────┬────────────────────┬─────────────────────┬────────┘              │
│           │                    │                     │                        │
│  ┌────────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐              │
│  │  Booking Code   │  │  User Prefs     │  │  Rate Limiter   │              │
│  │  Generator      │  │  Service        │  │  Service        │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼──────────────────────────────────────────┐
│                            DATA LAYER                                          │
├────────────────────────────────────┴──────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────┐              │
│  │                PostgreSQL Database                           │              │
│  │                                                              │              │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │              │
│  │  │  Users   │  │  Prefs   │  │  Bets    │  │  Teams   │  │              │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │              │
│  │                                                              │              │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │              │
│  │  │ Matches  │  │  Odds    │  │  Stats   │  │  Codes   │  │              │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │              │
│  └─────────────────────────────────────────────────────────────┘              │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼──────────────────────────────────────────┐
│                         EXTERNAL SERVICES LAYER                                │
├────────────────────────────────────┴──────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │  The Odds API    │  │  API-Football    │  │  RapidAPI        │           │
│  │  (Primary Odds)  │  │  (Team Stats)    │  │  (Backup Stats)  │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│                                                                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │  Web Scraper     │  │  Bookmaker APIs  │  │  Background Jobs │           │
│  │  (Fallback)      │  │  (Booking Codes) │  │  (Cron/Worker)   │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Core Components

### 2.1 Client Layer (Next.js Frontend)
- **Dashboard Page**: Main interface for users
- **Filters Component**: Dynamic odds range, market selection, bookmaker picker, date range
- **Results Grid**: Display filtered matches with win-chance percentages
- **Booking Code Generator**: Interface to generate codes for selected bookmaker
- **WebSocket Client**: Real-time odds updates every 5 minutes

### 2.2 Application Layer
- **Odds Service**: Aggregates odds from multiple sources, normalizes data
- **Stats Service**: Fetches team form and head-to-head statistics
- **Prediction Engine**: Calculates win-chance % with transparent formula
- **Booking Code Generator**: Creates bookmaker-specific codes
- **User Preferences Service**: Manages saved settings
- **Rate Limiter**: Controls API usage per user

### 2.3 Data Layer
- **PostgreSQL**: Primary database for structured data
- **Redis**: In-memory cache for hot data (odds, stats)

### 2.4 External Services
- **The Odds API**: Primary odds aggregator
- **API-Football**: Team statistics and fixtures
- **RapidAPI**: Backup stats provider
- **Web Scraper**: Fallback for missing data
- **Bookmaker APIs**: Direct integration for booking codes

## 3. Key Design Decisions

### 3.1 Why PostgreSQL?
- Relational data (users, matches, teams, odds)
- ACID compliance for betting history
- Support for JSON columns (flexible market data)
- Strong indexing for fast queries
- Mature ecosystem

### 3.2 Why Redis?
- Sub-millisecond read/write for hot data
- Built-in TTL for automatic cache expiration
- Pub/Sub for WebSocket notifications
- Rate limiting with atomic operations
- Session storage for preferences

### 3.3 Why Next.js API Routes?
- Unified codebase (frontend + backend)
- Edge functions for global low latency
- Built-in API optimization
- Easy WebSocket upgrade
- Vercel deployment ready

### 3.4 Why WebSocket?
- Real-time odds updates (5-min intervals)
- Push notifications for odds changes
- Lower bandwidth than polling
- Better user experience
- Scales with Socket.io clustering

## 4. Scalability Strategy

### 4.1 Horizontal Scaling
- Stateless API routes (scale with load balancer)
- Redis cluster for distributed cache
- Read replicas for PostgreSQL
- CDN for static assets

### 4.2 Vertical Optimization
- Database indexing (matches, odds, teams)
- Query optimization (JOIN reduction)
- N+1 query elimination
- Lazy loading for heavy data

### 4.3 Rate Limiting
- Per-user: 100 requests/minute
- Per-IP: 200 requests/minute
- WebSocket: Max 1000 concurrent connections per instance
- External API: Circuit breaker pattern

## 5. Data Flow Summary

```
User Input → Filter Selection → API Route → Cache Check → 
(Cache Miss) → External APIs → Data Processing → Cache Store → 
Database Write → Response → WebSocket Update → UI Refresh
```

## 6. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router) | React framework |
| Backend | Next.js API Routes | Serverless functions |
| Database | PostgreSQL 15 | Primary data store |
| Cache | Redis 7 | In-memory cache |
| Real-time | Socket.io | WebSocket server |
| ORM | Prisma | Database toolkit |
| Validation | Zod | Schema validation |
| State | Zustand | Client state |
| Styling | Tailwind CSS | UI styling |
| APIs | Axios | HTTP client |
| Jobs | Bull Queue | Background tasks |

