'use client';

import { useBetScoreStore } from '@/lib/store';
import { bookmakers, leagues } from '@/lib/dummyData';
import { SlidersHorizontal } from 'lucide-react';

export default function FilterPanel() {
  const { filters, updateFilters } = useBetScoreStore();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
      </div>
      
      {/* Odds Range */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Odds Range: {filters.oddsMin.toFixed(2)} - {filters.oddsMax.toFixed(2)}
        </label>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Min</label>
            <input
              type="range"
              min="1.01"
              max="5.00"
              step="0.1"
              value={filters.oddsMin}
              onChange={(e) => updateFilters({ oddsMin: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Max</label>
            <input
              type="range"
              min="1.01"
              max="10.00"
              step="0.1"
              value={filters.oddsMax}
              onChange={(e) => updateFilters({ oddsMax: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Bookmakers */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Bookmakers</label>
        <div className="flex flex-wrap gap-2">
          {bookmakers.map(bookmaker => (
            <button
              key={bookmaker}
              onClick={() => {
                const newBookmakers = filters.bookmakers.includes(bookmaker)
                  ? filters.bookmakers.filter(b => b !== bookmaker)
                  : [...filters.bookmakers, bookmaker];
                updateFilters({ bookmakers: newBookmakers });
              }}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                filters.bookmakers.includes(bookmaker)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {bookmaker}
            </button>
          ))}
        </div>
      </div>
      
      {/* Leagues */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Leagues</label>
        <div className="flex flex-wrap gap-2">
          {leagues.map(league => (
            <button
              key={league}
              onClick={() => {
                const newLeagues = filters.leagues.includes(league)
                  ? filters.leagues.filter(l => l !== league)
                  : [...filters.leagues, league];
                updateFilters({ leagues: newLeagues });
              }}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                filters.leagues.includes(league)
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
              }`}
            >
              {league}
            </button>
          ))}
        </div>
      </div>
      
      {/* Prediction Weights */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Form Weight: {filters.formWeight}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={filters.formWeight}
            onChange={(e) => {
              const formWeight = parseInt(e.target.value);
              updateFilters({ formWeight, h2hWeight: 100 - formWeight });
            }}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            H2H Weight: {filters.h2hWeight}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={filters.h2hWeight}
            onChange={(e) => {
              const h2hWeight = parseInt(e.target.value);
              updateFilters({ h2hWeight, formWeight: 100 - h2hWeight });
            }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
