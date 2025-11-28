import { create } from 'zustand';
import { Match, BettingSelection, BookingCode, SearchFilters } from './types';
import { generateDummyMatches, filterMatches } from './dummyData';

interface BetScoreStore {
  // State
  allMatches: Match[];
  filteredMatches: Match[];
  selectedMatches: Map<string, BettingSelection>;
  bookingCode: BookingCode | null;
  filters: {
    oddsMin: number;
    oddsMax: number;
    bookmakers: string[];
    leagues: string[];
    formWeight: number;
    h2hWeight: number;
  };
  
  // Actions
  initializeMatches: () => void;
  applyFilters: () => void;
  updateFilters: (filters: Partial<BetScoreStore['filters']>) => void;
  selectMatch: (selection: BettingSelection) => void;
  deselectMatch: (matchId: string) => void;
  clearSelections: () => void;
  generateBookingCode: (bookmaker: string) => void;
  clearBookingCode: () => void;
}

export const useBetScoreStore = create<BetScoreStore>((set, get) => ({
  allMatches: [],
  filteredMatches: [],
  selectedMatches: new Map(),
  bookingCode: null,
  filters: {
    oddsMin: 1.2,
    oddsMax: 3.0,
    bookmakers: [],
    leagues: [],
    formWeight: 60,
    h2hWeight: 40,
  },
  
  initializeMatches: () => {
    const matches = generateDummyMatches(20);
    set({ allMatches: matches, filteredMatches: matches });
  },
  
  applyFilters: () => {
    const { allMatches, filters } = get();
    const filtered = filterMatches(allMatches, {
      oddsMin: filters.oddsMin,
      oddsMax: filters.oddsMax,
      bookmakers: filters.bookmakers.length > 0 ? filters.bookmakers : undefined,
      leagues: filters.leagues.length > 0 ? filters.leagues : undefined,
    });
    set({ filteredMatches: filtered });
  },
  
  updateFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
    get().applyFilters();
  },
  
  selectMatch: (selection) => {
    set(state => {
      const newSelections = new Map(state.selectedMatches);
      newSelections.set(selection.matchId, selection);
      return { selectedMatches: newSelections };
    });
  },
  
  deselectMatch: (matchId) => {
    set(state => {
      const newSelections = new Map(state.selectedMatches);
      newSelections.delete(matchId);
      return { selectedMatches: newSelections };
    });
  },
  
  clearSelections: () => {
    set({ selectedMatches: new Map() });
  },
  
  generateBookingCode: (bookmaker) => {
    const { selectedMatches } = get();
    const selections = Array.from(selectedMatches.values());
    
    if (selections.length === 0) return;
    
    // Calculate total odds
    const totalOdds = selections.reduce((acc, sel) => acc * sel.odds, 1);
    
    // Generate booking code
    const code = `BET-${bookmaker.toUpperCase().slice(0, 3)}-${Date.now().toString(36).toUpperCase()}`;
    
    set({
      bookingCode: {
        code,
        bookmaker,
        selections,
        totalOdds: +totalOdds.toFixed(2),
        createdAt: new Date(),
      }
    });
  },
  
  clearBookingCode: () => {
    set({ bookingCode: null });
  },
}));
