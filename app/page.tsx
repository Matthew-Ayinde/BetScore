'use client';

import { useEffect } from 'react';
import { useBetScoreStore } from '@/lib/store';
import FilterPanel from '@/components/FilterPanel';
import MatchCard from '@/components/MatchCard';
import BookingCodeGenerator from '@/components/BookingCodeGenerator';
import { Trophy, TrendingUp, Zap } from 'lucide-react';

export default function Home() {
  const { filteredMatches, initializeMatches } = useBetScoreStore();
  
  useEffect(() => {
    initializeMatches();
  }, [initializeMatches]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">BetScore</h1>
                <p className="text-sm text-gray-600">Smart Betting Shortlist Tool</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-700">{filteredMatches.length} Matches</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-700">AI Predictions</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Filters & Matches */}
          <div className="lg:col-span-2 space-y-6">
            <FilterPanel />
            
            {/* Matches Grid */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Available Matches ({filteredMatches.length})
              </h2>
              
              {filteredMatches.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Trophy className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No matches found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your filters to see more matches
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredMatches.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Bet Slip */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <BookingCodeGenerator />
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2025 BetScore. Demo version with dummy data.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
