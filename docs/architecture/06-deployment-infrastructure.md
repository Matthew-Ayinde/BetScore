# Deployment & Infrastructure Architecture

## 1. Production Infrastructure (Vercel + Cloud Services)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GLOBAL CDN LAYER                                 │
│                            (Vercel Edge Network)                              │
│                                                                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │  US Region    │  │  EU Region    │  │  ASIA Region  │                   │
│  │  (Low Latency)│  │  (Low Latency)│  │  (Low Latency)│                   │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘                   │
│          │                  │                  │                             │
└──────────┼──────────────────┼──────────────────┼─────────────────────────────┘
           │                  │                  │
           └──────────────────┴──────────────────┘
                              │
┌─────────────────────────────┼──────────────────────────────────────────────┐
│                     VERCEL PLATFORM                                          │
├─────────────────────────────┴──────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────┐            │
│  │              Next.js Application Deployment                 │            │
│  │                                                             │            │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │            │
│  │  │  Static      │  │  API Routes  │  │  Server      │    │            │
│  │  │  Assets      │  │  (Serverless)│  │  Components  │    │            │
│  │  │  (CDN)       │  │  Functions   │  │  (RSC)       │    │            │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │            │
│  │                                                             │            │
│  │  Features:                                                  │            │
│  │  - Auto-scaling (0 → 1000s instances)                     │            │
│  │  - Edge caching                                            │            │
│  │  - Automatic HTTPS                                         │            │
│  │  - Preview deployments per branch                          │            │
│  │  - Analytics & monitoring                                  │            │
│  └────────────────────────────────────────────────────────────┘            │
│                                                                              │
│  Environment Variables:                                                      │
│  - DATABASE_URL                                                              │
│  - REDIS_URL                                                                 │
│  - THE_ODDS_API_KEY                                                          │
│  - API_FOOTBALL_KEY                                                          │
│  - RAPIDAPI_KEY                                                              │
│  - NEXTAUTH_SECRET                                                           │
│  - WEBSOCKET_URL                                                             │
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   POSTGRESQL        │ │   REDIS CACHE       │ │   FILE STORAGE      │
│   (Supabase)        │ │   (Upstash)         │ │   (Vercel Blob)     │
├─────────────────────┤ ├─────────────────────┤ ├─────────────────────┤
│                     │ │                     │ │                     │
│ Primary DB:         │ │ Hot Data Cache:     │ │ Static Assets:      │
│ - User data         │ │ - Odds (5 min)      │ │ - Team logos        │
│ - Matches           │ │ - Stats (1 hour)    │ │ - League badges     │
│ - Odds history      │ │ - Sessions          │ │ - User uploads      │
│ - Teams             │ │ - Rate limits       │ │                     │
│ - Predictions       │ │                     │ │ CDN-backed          │
│                     │ │ Redis Stack:        │ │ Global edge cache   │
│ Features:           │ │ - Pub/Sub           │ │                     │
│ - Auto backups      │ │ - Sorted Sets       │ │                     │
│ - Connection pool   │ │ - TTL expiration    │ │                     │
│ - Read replicas     │ │ - Atomic ops        │ │                     │
│ - Point-in-time     │ │                     │ │                     │
│   recovery          │ │ Upstash:            │ │                     │
│                     │ │ - Serverless        │ │                     │
│ Pricing:            │ │ - Pay per request   │ │                     │
│ - Free: 500MB       │ │ - Global replicas   │ │                     │
│ - Pro: $25/mo       │ │ - 99.99% SLA        │ │                     │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                      WEBSOCKET SERVER (Separate Service)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Deployment: Railway / Render / AWS EC2                                       │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │               Socket.io Server (Node.js)                  │               │
│  │                                                           │               │
│  │  - Persistent connections                                 │               │
│  │  - Room-based broadcasting                                │               │
│  │  - Redis adapter for clustering                           │               │
│  │  - Auto-reconnection                                      │               │
│  │                                                           │               │
│  │  Scale: 1 instance → 10,000 connections                  │               │
│  │  Cluster: Multiple instances with Redis Pub/Sub          │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                               │
│  Load Balancer:                                                               │
│  - Sticky sessions (same instance per user)                                   │
│  - Health checks                                                              │
│  - WebSocket upgrade support                                                  │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKGROUND JOBS LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Platform: Vercel Cron (free) OR Inngest / QStash (advanced)                │
│                                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   Every 5 min    │  │   Every 1 hour   │  │   Daily 2 AM     │          │
│  │                  │  │                  │  │                  │          │
│  │ Refresh Popular  │  │ Update Team      │  │ Cleanup Old      │          │
│  │ Odds (Top 5     │  │ Statistics       │  │ Cache            │          │
│  │ leagues)         │  │                  │  │                  │          │
│  │                  │  │ Recalculate      │  │ Archive Bets     │          │
│  │ Trigger:         │  │ Predictions      │  │                  │          │
│  │ /api/cron/odds   │  │                  │  │ Generate Stats   │          │
│  │                  │  │ Trigger:         │  │                  │          │
│  │                  │  │ /api/cron/stats  │  │ Trigger:         │          │
│  │                  │  │                  │  │ /api/cron/cleanup│          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                               │
│  Vercel Cron config (vercel.json):                                           │
│  {                                                                            │
│    "crons": [                                                                 │
│      {                                                                        │
│        "path": "/api/cron/odds",                                              │
│        "schedule": "*/5 * * * *"                                              │
│      },                                                                       │
│      {                                                                        │
│        "path": "/api/cron/stats",                                             │
│        "schedule": "0 * * * *"                                                │
│      }                                                                        │
│    ]                                                                          │
│  }                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL API INTEGRATIONS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ The Odds API     │  │ API-Football     │  │ RapidAPI Sports  │          │
│  │                  │  │                  │  │                  │          │
│  │ Provides:        │  │ Provides:        │  │ Provides:        │          │
│  │ - Live odds      │  │ - Team stats     │  │ - Backup stats   │          │
│  │ - Bookmakers     │  │ - Fixtures       │  │ - H2H history    │          │
│  │ - Markets        │  │ - Lineups        │  │                  │          │
│  │                  │  │ - Standings      │  │                  │          │
│  │ Rate Limits:     │  │                  │  │ Rate Limits:     │          │
│  │ - Free: 500/mo   │  │ Rate Limits:     │  │ - Free: 500/mo   │          │
│  │ - Paid: 5k/mo    │  │ - Free: 100/day  │  │ - Pro: 10k/mo    │          │
│  │                  │  │ - Pro: 1000/day  │  │                  │          │
│  │ Caching: 5 min   │  │                  │  │ Caching: 1 hour  │          │
│  │                  │  │ Caching: 1 hour  │  │                  │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                               │
│  Circuit Breaker Pattern:                                                     │
│  - Track failure rate per API                                                 │
│  - Open circuit after 5 consecutive failures                                  │
│  - Half-open after 60 seconds                                                 │
│  - Fallback to cache or alternative API                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Scaling Strategy

### 2.1 Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AUTO-SCALING ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────┘

User Load:          │         Vercel Instances:        │    Response Time:
                    │                                  │
  10 users    ──────┼────►  1 instance                 │    < 100ms
 100 users    ──────┼────►  3 instances                │    < 150ms
1000 users    ──────┼────►  10 instances               │    < 200ms
5000 users    ──────┼────►  25 instances               │    < 300ms
                    │                                  │
                    │  Auto-scale triggers:            │
                    │  - CPU > 70%                     │
                    │  - Memory > 80%                  │
                    │  - Response time > 500ms         │


Database Scaling:

┌──────────────────┐         ┌──────────────────┐
│  Primary DB      │         │  Read Replica 1  │
│  (Write + Read)  │────────►│  (Read Only)     │
└────────┬─────────┘         └──────────────────┘
         │                   ┌──────────────────┐
         └──────────────────►│  Read Replica 2  │
                             │  (Read Only)     │
                             └──────────────────┘

Strategy:
- Writes → Primary DB
- Reads → Load balanced across replicas
- Replication lag < 100ms


Redis Cluster:

┌──────────────────┐         ┌──────────────────┐
│  Redis Master    │         │  Redis Replica 1 │
│  (Primary)       │────────►│  (Failover)      │
└────────┬─────────┘         └──────────────────┘
         │                   ┌──────────────────┐
         └──────────────────►│  Redis Replica 2 │
                             │  (Failover)      │
                             └──────────────────┘

Strategy:
- Redis Sentinel for auto-failover
- Upstash handles this automatically
- < 1ms failover time
```

### 2.2 Caching Strategy (Multi-Layer)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CACHING LAYERS                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Request Flow:

User Request
     │
     ▼
┌─────────────────┐
│  L1: Browser    │  Cache: Static assets, API responses
│  (Client-side)  │  TTL: 1 minute for odds, 5 min for stats
└────────┬────────┘  Tool: React Query / SWR
         │
         ▼
┌─────────────────┐
│  L2: Edge       │  Cache: Next.js static generation
│  (Vercel CDN)   │  TTL: Varies by page (ISR)
└────────┬────────┘  Invalidation: On-demand revalidation
         │
         ▼
┌─────────────────┐
│  L3: API Cache  │  Cache: Computed results
│  (In-memory)    │  TTL: 30 seconds
└────────┬────────┘  Tool: Node.js LRU cache
         │
         ▼
┌─────────────────┐
│  L4: Redis      │  Cache: Odds, stats, sessions
│  (Distributed)  │  TTL: 5 min (odds), 1 hour (stats)
└────────┬────────┘  Invalidation: Event-based + TTL
         │
         ▼
┌─────────────────┐
│  L5: Database   │  Source of truth
│  (PostgreSQL)   │  Queried only on cache miss
└─────────────────┘  Indexed for fast lookups


Cache Hit Ratios (Target):
- L1 (Browser): 40%
- L2 (Edge): 30%
- L3 (API): 15%
- L4 (Redis): 10%
- L5 (Database): 5%

Result: 95% of requests never hit database
```

## 3. Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MONITORING STACK                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │                    Vercel Analytics                       │               │
│  │                                                           │               │
│  │  - Real User Monitoring (RUM)                             │               │
│  │  - Core Web Vitals (LCP, FID, CLS)                       │               │
│  │  - Page load times                                        │               │
│  │  - Geographic distribution                                │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │                     Sentry (Errors)                       │               │
│  │                                                           │               │
│  │  - Frontend errors                                        │               │
│  │  - API errors                                             │               │
│  │  - Error rate alerts                                      │               │
│  │  - User impact tracking                                   │               │
│  │  - Performance tracing                                    │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │                LogTail / Better Stack (Logs)              │               │
│  │                                                           │               │
│  │  - Structured logging                                     │               │
│  │  - Log aggregation                                        │               │
│  │  - Search & filtering                                     │               │
│  │  - Real-time tail                                         │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │              Upstash (Redis Metrics)                      │               │
│  │                                                           │               │
│  │  - Cache hit rate                                         │               │
│  │  - Memory usage                                           │               │
│  │  - Commands per second                                    │               │
│  │  - Connection count                                       │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │              Supabase (Database Metrics)                  │               │
│  │                                                           │               │
│  │  - Query performance                                      │               │
│  │  - Slow queries log                                       │               │
│  │  - Connection pool status                                 │               │
│  │  - Disk usage                                             │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

Key Metrics Dashboard:

┌─────────────────────────────────────────────────────────────┐
│  BetScore System Health                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  System Metrics:                                             │
│  ✓ API Response Time: 145ms (target < 200ms)                │
│  ✓ Error Rate: 0.2% (target < 1%)                           │
│  ✓ Uptime: 99.95% (target > 99.9%)                          │
│  ⚠ Cache Hit Rate: 88% (target > 90%)                       │
│                                                              │
│  API Integrations:                                           │
│  ✓ The Odds API: 450/500 requests (90% quota)               │
│  ✓ API-Football: 75/100 requests (75% quota)                │
│  ✓ RapidAPI: 320/500 requests (64% quota)                   │
│                                                              │
│  Database:                                                   │
│  ✓ Connection Pool: 15/20 used                              │
│  ✓ Query Time (avg): 12ms                                   │
│  ⚠ Slow Queries: 3 (> 1 second)                             │
│                                                              │
│  Redis:                                                      │
│  ✓ Memory Usage: 125MB / 256MB                              │
│  ✓ Ops/sec: 1,200                                           │
│  ✓ Evictions: 0                                             │
│                                                              │
│  WebSocket:                                                  │
│  ✓ Active Connections: 342                                  │
│  ✓ Messages/sec: 15                                         │
│  ✓ Disconnect Rate: 2%                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 4. Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  1. Network Security                                          │
├──────────────────────────────────────────────────────────────┤
│  - HTTPS only (TLS 1.3)                                       │
│  - HSTS enabled                                               │
│  - CSP headers                                                │
│  - CORS configuration                                         │
│  - DDoS protection (Vercel)                                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  2. Authentication & Authorization                            │
├──────────────────────────────────────────────────────────────┤
│  - NextAuth.js (OAuth + Credentials)                          │
│  - JWT tokens (httpOnly cookies)                              │
│  - Session management (Redis)                                 │
│  - Rate limiting per user                                     │
│  - API key authentication for server-to-server                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  3. Input Validation                                          │
├──────────────────────────────────────────────────────────────┤
│  - Zod schema validation                                      │
│  - SQL injection prevention (Prisma ORM)                      │
│  - XSS prevention (React auto-escaping)                       │
│  - CSRF tokens                                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  4. Data Protection                                           │
├──────────────────────────────────────────────────────────────┤
│  - Database encryption at rest                                │
│  - SSL/TLS for data in transit                               │
│  - Password hashing (bcrypt)                                  │
│  - Sensitive data redaction in logs                           │
│  - PII anonymization                                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  5. Rate Limiting                                             │
├──────────────────────────────────────────────────────────────┤
│  Per-User:                                                    │
│  - 100 requests/minute                                        │
│  - 1000 requests/hour                                         │
│                                                               │
│  Per-IP:                                                      │
│  - 200 requests/minute                                        │
│  - 2000 requests/hour                                         │
│                                                               │
│  WebSocket:                                                   │
│  - Max 1000 concurrent connections per instance               │
│  - 100 messages/minute per connection                         │
└──────────────────────────────────────────────────────────────┘
```

## 5. Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CI/CD PIPELINE (GitHub Actions)                         │
└─────────────────────────────────────────────────────────────────────────────┘

Code Push to GitHub
        │
        ▼
┌────────────────┐
│  GitHub Action │
│    Triggered   │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Run Tests     │
│  - Unit        │
│  - Integration │
│  - E2E         │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Lint & Type   │
│  Check         │
│  - ESLint      │
│  - TypeScript  │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Build App     │
│  - Next.js     │
│  - Optimize    │
└───────┬────────┘
        │
        ▼
    ┌───┴───┐
    │       │
    ▼       ▼
┌─────┐  ┌─────┐
│ Dev │  │ Prod│
└──┬──┘  └──┬──┘
   │        │
   ▼        ▼
Preview   Vercel
Deploy    Production
```

## 6. Disaster Recovery

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DISASTER RECOVERY PLAN                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Database Backups:                                                            │
│  - Automatic daily backups (Supabase)                                         │
│  - Point-in-time recovery (7 days)                                            │
│  - Manual backup before major updates                                         │
│  - Backup verification weekly                                                 │
│                                                                               │
│  Recovery Time Objective (RTO): 1 hour                                        │
│  Recovery Point Objective (RPO): 24 hours                                     │
│                                                                               │
│  Failover Strategy:                                                           │
│  1. Database: Auto-failover to replica (< 1 min)                             │
│  2. Redis: Auto-failover to replica (< 1 min)                                │
│  3. Application: Rollback to previous deployment (< 5 min)                   │
│  4. WebSocket: Reconnect to healthy instance (< 10 sec)                      │
│                                                                               │
│  Incident Response:                                                           │
│  1. Alert triggered (Sentry / Uptime monitor)                                 │
│  2. On-call engineer notified (PagerDuty)                                     │
│  3. Assess impact & communicate to users                                      │
│  4. Execute recovery plan                                                     │
│  5. Post-mortem & mitigation                                                  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 7. Cost Estimation (Monthly)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COST BREAKDOWN                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Vercel (Hosting):                                                            │
│  - Pro Plan: $20/month                                                        │
│  - Bandwidth: ~100GB/month included                                           │
│  - Serverless executions: 1M/month included                                   │
│                                                                               │
│  Supabase (Database):                                                         │
│  - Pro Plan: $25/month                                                        │
│  - 8GB database, 50GB bandwidth                                               │
│  - Daily backups, 7-day PITR                                                  │
│                                                                               │
│  Upstash (Redis):                                                             │
│  - Pay-as-you-go: ~$15/month                                                  │
│  - 1GB storage, 10M requests/month                                            │
│                                                                               │
│  Railway (WebSocket):                                                         │
│  - Starter: $5/month                                                          │
│  - 8GB RAM, 8vCPU                                                             │
│                                                                               │
│  The Odds API:                                                                │
│  - Pro Plan: $50/month                                                        │
│  - 5,000 requests/month                                                       │
│                                                                               │
│  API-Football:                                                                │
│  - Pro Plan: $30/month                                                        │
│  - 1,000 requests/day                                                         │
│                                                                               │
│  RapidAPI:                                                                    │
│  - Basic Plan: $10/month                                                      │
│  - 500 requests/month                                                         │
│                                                                               │
│  Sentry (Monitoring):                                                         │
│  - Team Plan: $26/month                                                       │
│  - 50K errors/month                                                           │
│                                                                               │
│  ──────────────────────────────────────                                      │
│  TOTAL: ~$181/month                                                           │
│                                                                               │
│  At Scale (5,000 users):                                                      │
│  - Vercel: $50/month                                                          │
│  - Supabase: $50/month                                                        │
│  - Upstash: $35/month                                                         │
│  - Railway: $25/month                                                         │
│  - APIs: $200/month                                                           │
│  - Sentry: $50/month                                                          │
│  ──────────────────────────────────────                                      │
│  TOTAL: ~$410/month                                                           │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```
