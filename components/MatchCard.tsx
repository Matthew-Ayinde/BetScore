'use client';

import { Match } from '@/lib/types';
import { useBetScoreStore } from '@/lib/store';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Calendar, Activity } from 'lucide-react';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const { selectedMatches, selectMatch, deselectMatch } = useBetScoreStore();
  const isSelected = selectedMatches.has(match.id);
  
  const handleSelectOutcome = (market: 'h2h', outcome: 'home' | 'draw' | 'away', odds: number) => {
    if (isSelected) {
      deselectMatch(match.id);
    } else {
      selectMatch({
        matchId: match.id,
        match,
        market,
        outcome,
        odds,
      });
    }
  };
  
  const getConfidenceBadge = () => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
    };
    return colors[match.prediction.confidence];
  };
  
  const getPredictionIcon = () => {
    if (match.prediction.homeWin > match.prediction.awayWin && match.prediction.homeWin > match.prediction.draw) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    if (match.prediction.awayWin > match.prediction.homeWin && match.prediction.awayWin > match.prediction.draw) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return <Minus className="w-4 h-4 text-gray-600" />;
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow ${
      isSelected ? 'ring-2 ring-blue-500' : ''
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{format(match.date, 'MMM dd, HH:mm')}</span>
        </div>
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {match.league}
        </span>
      </div>
      
      {/* Teams */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{match.homeTeam.name}</span>
            <span className="text-xs text-gray-500">({match.homeTeam.shortName})</span>
          </div>
          <span className="text-sm text-gray-600 font-mono">
            {match.form.home.form}
          </span>
        </div>
        <div className="flex items-center justify-center text-gray-400 text-sm my-2">
          vs
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{match.awayTeam.name}</span>
            <span className="text-xs text-gray-500">({match.awayTeam.shortName})</span>
          </div>
          <span className="text-sm text-gray-600 font-mono">
            {match.form.away.form}
          </span>
        </div>
      </div>
      
      {/* Odds - H2H */}
      {match.odds.h2h && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Match Winner (H2H)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSelectOutcome('h2h', 'home', match.odds.h2h!.home)}
              className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-2 text-center transition-colors"
            >
              <div className="text-xs text-gray-600 mb-1">Home</div>
              <div className="text-lg font-bold text-green-700">{match.odds.h2h.home}</div>
            </button>
            <button
              onClick={() => handleSelectOutcome('h2h', 'draw', match.odds.h2h!.draw)}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 text-center transition-colors"
            >
              <div className="text-xs text-gray-600 mb-1">Draw</div>
              <div className="text-lg font-bold text-gray-700">{match.odds.h2h.draw}</div>
            </button>
            <button
              onClick={() => handleSelectOutcome('h2h', 'away', match.odds.h2h!.away)}
              className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-2 text-center transition-colors"
            >
              <div className="text-xs text-gray-600 mb-1">Away</div>
              <div className="text-lg font-bold text-red-700">{match.odds.h2h.away}</div>
            </button>
          </div>
        </div>
      )}
      
      {/* Prediction */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getPredictionIcon()}
            <span className="text-sm font-medium text-gray-700">AI Prediction</span>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded ${getConfidenceBadge()}`}>
            {match.prediction.confidence.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-gray-600">Home</div>
            <div className="text-lg font-bold text-green-700">{match.prediction.homeWin}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Draw</div>
            <div className="text-lg font-bold text-gray-700">{match.prediction.draw}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Away</div>
            <div className="text-lg font-bold text-red-700">{match.prediction.awayWin}%</div>
          </div>
        </div>
        
        {/* Breakdown */}
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Form: {match.prediction.breakdown.form.home} vs {match.prediction.breakdown.form.away}</span>
            <span>Weight: {match.prediction.breakdown.weights.form}%</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>H2H: {match.prediction.breakdown.h2h.home} vs {match.prediction.breakdown.h2h.away}</span>
            <span>Weight: {match.prediction.breakdown.weights.h2h}%</span>
          </div>
        </div>
      </div>
      
      {/* Bookmakers */}
      <div className="mt-3 flex flex-wrap gap-1">
        {match.bookmakers.map(bookmaker => (
          <span key={bookmaker} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {bookmaker}
          </span>
        ))}
      </div>
      
      {isSelected && (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
          <span className="text-sm text-blue-700 font-medium">✓ Selected for bet slip</span>
        </div>
      )}
    </div>
  );
}
