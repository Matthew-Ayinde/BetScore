# Component Architecture

## 1. Frontend Component Tree

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              app/ (Next.js 14)                               │
└─────────────────────────────────────────────────────────────────────────────┘

app/
├── layout.tsx                    # Root layout with providers
├── page.tsx                      # Landing/Auth page
├── globals.css                   # Tailwind globals
│
├── (dashboard)/                  # Dashboard route group
│   ├── layout.tsx                # Dashboard layout with sidebar
│   │
│   ├── page.tsx                  # Main dashboard (home)
│   │   └── Components:
│   │       ├── <QuickStats />           # Today's matches count, active bets
│   │       ├── <PopularLeagues />       # Quick league shortcuts
│   │       └── <RecentBookings />       # User's last 5 booking codes
│   │
│   ├── search/
│   │   └── page.tsx              # Match search & filtering
│   │       └── Components:
│   │           ├── <FilterPanel />
│   │           │   ├── <OddsRangeSlider />
│   │           │   ├── <MarketSelector />
│   │           │   ├── <BookmakerPicker />
│   │           │   ├── <DateRangePicker />
│   │           │   ├── <LeagueSelector />
│   │           │   └── <WeightsAdjuster />
│   │           │
│   │           ├── <MatchesGrid />
│   │           │   └── <MatchCard />
│   │           │       ├── <TeamDisplay />
│   │           │       ├── <OddsDisplay />
│   │           │       ├── <PredictionBadge />
│   │           │       ├── <ConfidenceBar />
│   │           │       └── <SelectButton />
│   │           │
│   │           └── <LoadingState />
│   │
│   ├── predictions/
│   │   ├── page.tsx              # Predictions overview
│   │   │   └── Components:
│   │   │       ├── <PredictionsList />
│   │   │       └── <AccuracyTracker />
│   │   │
│   │   └── [matchId]/
│   │       └── page.tsx          # Detailed prediction view
│   │           └── Components:
│   │               ├── <PredictionBreakdown />
│   │               │   ├── <FormAnalysis />
│   │               │   ├── <H2HAnalysis />
│   │               │   └── <WeightingChart />
│   │               │
│   │               ├── <TeamFormCards />
│   │               ├── <H2HHistory />
│   │               └── <OddsComparison />
│   │
│   ├── booking/
│   │   ├── page.tsx              # Booking code generator
│   │   │   └── Components:
│   │   │       ├── <SelectionsCart />
│   │   │       ├── <BookmakerDropdown />
│   │   │       ├── <OddsCalculator />
│   │   │       └── <GenerateButton />
│   │   │
│   │   └── [code]/
│   │       └── page.tsx          # Booking code details
│   │           └── Components:
│   │               ├── <CodeDisplay />
│   │               ├── <SelectionsTable />
│   │               ├── <Instructions />
│   │               └── <TrackingStatus />
│   │
│   ├── history/
│   │   └── page.tsx              # Betting history
│   │       └── Components:
│   │           ├── <BettingSlipsList />
│   │           ├── <StatsCards />
│   │           └── <PerformanceChart />
│   │
│   └── settings/
│       └── page.tsx              # User preferences
│           └── Components:
│               ├── <PreferencesForm />
│               ├── <NotificationSettings />
│               └── <AccountSettings />
│
└── api/                          # API routes
    ├── matches/
    │   ├── search/
    │   │   └── route.ts
    │   └── [id]/
    │       └── route.ts
    │
    ├── odds/
    │   ├── fetch/
    │   │   └── route.ts
    │   └── compare/
    │       └── route.ts
    │
    ├── stats/
    │   ├── team/
    │   │   └── route.ts
    │   └── h2h/
    │       └── route.ts
    │
    ├── predictions/
    │   ├── calculate/
    │   │   └── route.ts
    │   └── history/
    │       └── route.ts
    │
    ├── booking/
    │   ├── generate/
    │   │   └── route.ts
    │   └── [code]/
    │       └── route.ts
    │
    ├── user/
    │   ├── preferences/
    │   │   └── route.ts
    │   └── profile/
    │       └── route.ts
    │
    └── websocket/
        └── route.ts              # WebSocket upgrade endpoint
```

## 2. Detailed Component Specifications

### 2.1 FilterPanel Component

```typescript
// components/filters/FilterPanel.tsx

interface FilterPanelProps {
  onFilterChange: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

interface SearchFilters {
  oddsRange: { min: number; max: number };
  markets: MarketType[];
  bookmakers: string[];
  dateRange: { start: Date; end?: Date };
  leagues: string[];
  formDepth: number;
  h2hDepth: number;
  formWeight: number;
  h2hWeight: number;
}

export function FilterPanel({ onFilterChange, initialFilters }: FilterPanelProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || defaultFilters);
  
  const handleApply = () => {
    onFilterChange(filters);
  };
  
  return (
    <div className="filter-panel">
      <OddsRangeSlider 
        min={filters.oddsRange.min} 
        max={filters.oddsRange.max}
        onChange={(range) => setFilters({...filters, oddsRange: range})}
      />
      <MarketSelector 
        selected={filters.markets}
        onChange={(markets) => setFilters({...filters, markets})}
      />
      {/* ... other filter components */}
      <button onClick={handleApply}>Apply Filters</button>
    </div>
  );
}
```

### 2.2 MatchCard Component

```typescript
// components/matches/MatchCard.tsx

interface MatchCardProps {
  match: MatchWithPrediction;
  onSelect: (matchId: string, outcome: string) => void;
  isSelected: boolean;
}

interface MatchWithPrediction {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: Date;
  league: string;
  odds: {
    h2h?: { home: number; draw: number; away: number };
    ou25?: { over: number; under: number };
    btts?: { yes: number; no: number };
  };
  bookmakers: string[];
  prediction: {
    homeWin: number;
    draw: number;
    awayWin: number;
    confidence: 'low' | 'medium' | 'high';
    breakdown: {
      form: { home: number; away: number };
      h2h: { home: number; away: number };
      weights: { form: number; h2h: number };
    };
  };
  form: {
    home: TeamForm;
    away: TeamForm;
  };
}

export function MatchCard({ match, onSelect, isSelected }: MatchCardProps) {
  return (
    <div className={cn("match-card", isSelected && "selected")}>
      <div className="teams">
        <TeamDisplay team={match.homeTeam} />
        <span className="vs">vs</span>
        <TeamDisplay team={match.awayTeam} />
      </div>
      
      <OddsDisplay odds={match.odds} bookmakers={match.bookmakers} />
      
      <div className="prediction">
        <PredictionBadge 
          homeWin={match.prediction.homeWin}
          draw={match.prediction.draw}
          awayWin={match.prediction.awayWin}
        />
        <ConfidenceBar level={match.prediction.confidence} />
      </div>
      
      <button onClick={() => onSelect(match.id, 'home')}>
        Select Home Win
      </button>
    </div>
  );
}
```

### 2.3 PredictionBreakdown Component

```typescript
// components/predictions/PredictionBreakdown.tsx

interface PredictionBreakdownProps {
  prediction: DetailedPrediction;
  showFormula: boolean;
}

export function PredictionBreakdown({ prediction, showFormula }: PredictionBreakdownProps) {
  return (
    <div className="breakdown-container">
      {/* Visual breakdown */}
      <div className="percentage-bars">
        <Bar label="Home Win" value={prediction.homeWin} color="green" />
        <Bar label="Draw" value={prediction.draw} color="gray" />
        <Bar label="Away Win" value={prediction.awayWin} color="blue" />
      </div>
      
      {/* Component breakdown */}
      <div className="components">
        <ComponentCard 
          title="Form Score" 
          weight={prediction.breakdown.weights.form}
          home={prediction.breakdown.form.home}
          away={prediction.breakdown.form.away}
        />
        <ComponentCard 
          title="Head-to-Head" 
          weight={prediction.breakdown.weights.h2h}
          home={prediction.breakdown.h2h.home}
          away={prediction.breakdown.h2h.away}
        />
      </div>
      
      {/* Formula display */}
      {showFormula && (
        <div className="formula">
          <h4>Calculation Formula</h4>
          <code>
            Home Win % = (Form × {prediction.breakdown.weights.form}%) + 
                        (H2H × {prediction.breakdown.weights.h2h}%) + 
                        Home Bonus (5%)
          </code>
          <code>
            = ({prediction.breakdown.form.home} × 0.{prediction.breakdown.weights.form}) + 
              ({prediction.breakdown.h2h.home} × 0.{prediction.breakdown.weights.h2h}) + 5
          </code>
          <code>
            = {prediction.homeWin}%
          </code>
        </div>
      )}
    </div>
  );
}
```

## 3. Backend Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND SERVICES                                   │
└─────────────────────────────────────────────────────────────────────────────┘

lib/
├── services/
│   ├── odds/
│   │   ├── OddsAggregator.ts          # Main odds fetching service
│   │   │   ├── fetchFromTheOddsAPI()
│   │   │   ├── fetchFromRapidAPI()
│   │   │   ├── normalizeOdds()
│   │   │   └── filterByRange()
│   │   │
│   │   ├── OddsNormalizer.ts          # Normalize different formats
│   │   └── OddsComparator.ts          # Compare across bookmakers
│   │
│   ├── stats/
│   │   ├── TeamStatsService.ts        # Team form & statistics
│   │   │   ├── fetchRecentForm()
│   │   │   ├── calculateFormScore()
│   │   │   └── getHomeAwayStats()
│   │   │
│   │   └── HeadToHeadService.ts       # H2H history
│   │       ├── fetchH2HHistory()
│   │       ├── calculateH2HScore()
│   │       └── analyzeHomeAdvantage()
│   │
│   ├── prediction/
│   │   ├── PredictionEngine.ts        # Core prediction logic
│   │   │   ├── calculateWinPercentage()
│   │   │   ├── applyWeights()
│   │   │   ├── determineConfidence()
│   │   │   └── generateBreakdown()
│   │   │
│   │   └── ConfidenceCalculator.ts    # Confidence scoring
│   │
│   ├── booking/
│   │   ├── BookingCodeGenerator.ts    # Generate codes
│   │   │   ├── generateForBookmaker()
│   │   │   ├── calculateTotalOdds()
│   │   │   └── storeBooking()
│   │   │
│   │   └── BookmakerAdapter.ts        # Bookmaker-specific logic
│   │       ├── adapters/
│   │       │   ├── 1xBetAdapter.ts
│   │       │   ├── 888SportAdapter.ts
│   │       │   └── DefaultAdapter.ts
│   │       └── createBookingSlip()
│   │
│   └── cache/
│       ├── CacheManager.ts            # Redis cache operations
│       │   ├── get()
│       │   ├── set()
│       │   ├── invalidate()
│       │   └── prefetch()
│       │
│       └── CacheKeyBuilder.ts         # Build cache keys
│
├── db/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   └── repositories/
│       ├── MatchRepository.ts
│       ├── OddsRepository.ts
│       ├── TeamRepository.ts
│       ├── UserRepository.ts
│       └── BookingRepository.ts
│
├── api-clients/
│   ├── TheOddsAPIClient.ts
│   ├── APIFootballClient.ts
│   ├── RapidAPIClient.ts
│   └── BaseAPIClient.ts               # Common error handling
│
├── websocket/
│   ├── SocketServer.ts                # Socket.io server setup
│   ├── RoomManager.ts                 # Manage rooms/channels
│   └── EventEmitter.ts                # Emit odds updates
│
├── jobs/
│   ├── OddsRefreshJob.ts              # Every 5 minutes
│   ├── StatsUpdateJob.ts              # Every hour
│   └── CleanupJob.ts                  # Daily
│
├── middleware/
│   ├── authMiddleware.ts
│   ├── rateLimitMiddleware.ts
│   ├── validationMiddleware.ts
│   └── errorMiddleware.ts
│
├── utils/
│   ├── validation/
│   │   ├── schemas.ts                 # Zod schemas
│   │   └── validators.ts
│   │
│   ├── helpers/
│   │   ├── dateHelpers.ts
│   │   ├── oddsHelpers.ts
│   │   └── mathHelpers.ts
│   │
│   └── constants/
│       ├── markets.ts
│       ├── bookmakers.ts
│       └── leagues.ts
│
└── types/
    ├── odds.types.ts
    ├── match.types.ts
    ├── prediction.types.ts
    └── api.types.ts
```

## 4. State Management Architecture

```typescript
// store/useMatchStore.ts - Zustand store

interface MatchStore {
  // State
  filters: SearchFilters;
  matches: MatchWithPrediction[];
  selectedMatches: Map<string, Selection>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setFilters: (filters: SearchFilters) => void;
  searchMatches: () => Promise<void>;
  selectMatch: (matchId: string, selection: Selection) => void;
  deselectMatch: (matchId: string) => void;
  clearSelections: () => void;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  filters: defaultFilters,
  matches: [],
  selectedMatches: new Map(),
  isLoading: false,
  error: null,
  
  setFilters: (filters) => set({ filters }),
  
  searchMatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/matches/search', {
        method: 'POST',
        body: JSON.stringify(get().filters),
      });
      const data = await response.json();
      set({ matches: data.matches, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  selectMatch: (matchId, selection) => {
    const selections = new Map(get().selectedMatches);
    selections.set(matchId, selection);
    set({ selectedMatches: selections });
  },
  
  // ... other actions
}));


// store/useBookingStore.ts

interface BookingStore {
  bookingCode: string | null;
  totalOdds: number;
  bookmaker: string;
  
  generateCode: (selections: Selection[], bookmaker: string) => Promise<void>;
  clearCode: () => void;
}


// store/usePreferencesStore.ts

interface PreferencesStore {
  preferences: UserPreferences;
  
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  loadPreferences: () => Promise<void>;
}
```

## 5. WebSocket Integration

```typescript
// lib/websocket/client.ts

export class SocketClient {
  private socket: Socket;
  
  connect(userId?: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL, {
      auth: { userId },
    });
    
    this.setupListeners();
  }
  
  joinRoom(room: string) {
    this.socket.emit('join-room', room);
  }
  
  leaveRoom(room: string) {
    this.socket.emit('leave-room', room);
  }
  
  onOddsUpdate(callback: (data: OddsUpdate) => void) {
    this.socket.on('odds:updated', callback);
  }
  
  onMatchStarted(callback: (matchId: string) => void) {
    this.socket.on('match:started', callback);
  }
  
  disconnect() {
    this.socket.disconnect();
  }
  
  private setupListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });
  }
}

// Usage in React component
export function MatchesPage() {
  const socketClient = useMemo(() => new SocketClient(), []);
  
  useEffect(() => {
    socketClient.connect();
    socketClient.joinRoom(`epl-${format(new Date(), 'yyyy-MM-dd')}`);
    
    socketClient.onOddsUpdate((update) => {
      // Update local state with new odds
      updateMatchOdds(update);
    });
    
    return () => {
      socketClient.disconnect();
    };
  }, []);
  
  // ... component logic
}
```

## 6. API Route Structure

```typescript
// app/api/matches/search/route.ts

export async function POST(request: Request) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const filters = SearchFiltersSchema.parse(body);
    
    // 2. Check rate limit
    await rateLimiter.check(request);
    
    // 3. Build cache key
    const cacheKey = buildCacheKey('matches', filters);
    
    // 4. Check cache
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
    
    // 5. Fetch odds
    const odds = await oddsAggregator.fetch(filters);
    
    // 6. Enrich with stats
    const enriched = await Promise.all(
      odds.map(async (match) => {
        const [homeStats, awayStats, h2h] = await Promise.all([
          statsService.getTeamForm(match.homeTeamId, filters.formDepth),
          statsService.getTeamForm(match.awayTeamId, filters.formDepth),
          h2hService.getHistory(match.homeTeamId, match.awayTeamId, filters.h2hDepth),
        ]);
        
        const prediction = predictionEngine.calculate({
          homeStats,
          awayStats,
          h2h,
          weights: { form: filters.formWeight, h2h: filters.h2hWeight },
        });
        
        return { ...match, homeStats, awayStats, h2h, prediction };
      })
    );
    
    // 7. Cache result
    await cacheManager.set(cacheKey, enriched, 300); // 5 min TTL
    
    // 8. Return response
    return NextResponse.json({
      matches: enriched,
      meta: {
        total: enriched.length,
        cached: false,
      },
    });
    
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 7. Component Communication Flow

```
┌────────────────┐
│  FilterPanel   │
└───────┬────────┘
        │ onFilterChange()
        ▼
┌────────────────┐
│ useMatchStore  │ ───────> searchMatches() ───────> API: /api/matches/search
└───────┬────────┘
        │ matches[]
        ▼
┌────────────────┐
│  MatchesGrid   │
└───────┬────────┘
        │ map(match)
        ▼
┌────────────────┐
│   MatchCard    │ ───────> onSelect() ───────> useMatchStore.selectMatch()
└────────────────┘
        │
        │ selectedMatches
        ▼
┌────────────────┐
│ BookingButton  │ ───────> onClick() ───────> useBookingStore.generateCode()
└────────────────┘                                      │
                                                        ▼
                                            API: /api/booking/generate
                                                        │
                                                        ▼
                                                ┌───────────────┐
                                                │  CodeDisplay  │
                                                └───────────────┘
```
