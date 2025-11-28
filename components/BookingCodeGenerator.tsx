'use client';

import { useBetScoreStore } from '@/lib/store';
import { bookmakers } from '@/lib/dummyData';
import { useState } from 'react';
import { ShoppingCart, Ticket, Copy, CheckCircle2, XCircle } from 'lucide-react';

export default function BookingCodeGenerator() {
  const { selectedMatches, bookingCode, generateBookingCode, clearBookingCode, clearSelections } = useBetScoreStore();
  const [selectedBookmaker, setSelectedBookmaker] = useState(bookmakers[0]);
  const [copied, setCopied] = useState(false);
  
  const selections = Array.from(selectedMatches.values());
  const totalOdds = selections.reduce((acc, sel) => acc * sel.odds, 1);
  
  const handleGenerate = () => {
    generateBookingCode(selectedBookmaker);
  };
  
  const handleCopyCode = () => {
    if (bookingCode) {
      navigator.clipboard.writeText(bookingCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleNewBet = () => {
    clearBookingCode();
    clearSelections();
  };
  
  if (bookingCode) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Code Generated!</h2>
          <p className="text-gray-600">Your bet slip is ready</p>
        </div>
        
        {/* Booking Code */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6 text-white">
          <div className="text-sm opacity-90 mb-2">Booking Code</div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold font-mono tracking-wider">
              {bookingCode.code}
            </div>
            <button
              onClick={handleCopyCode}
              className="bg-white/20 hover:bg-white/30 rounded-lg p-3 transition-colors"
              title="Copy code"
            >
              {copied ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <Copy className="w-6 h-6" />
              )}
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between items-center">
              <span className="text-sm">Bookmaker</span>
              <span className="font-semibold">{bookingCode.bookmaker}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm">Total Odds</span>
              <span className="text-2xl font-bold">{bookingCode.totalOdds.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm">Selections</span>
              <span className="font-semibold">{bookingCode.selections.length}</span>
            </div>
          </div>
        </div>
        
        {/* Selections */}
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-gray-800">Your Selections</h3>
          {bookingCode.selections.map((selection) => (
            <div key={selection.matchId} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-gray-800">
                    {selection.match.homeTeam.shortName} vs {selection.match.awayTeam.shortName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selection.match.league}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{selection.odds}</div>
                  <div className="text-xs text-gray-500">{selection.outcome}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">How to Use</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Copy the booking code above</li>
            <li>Visit {bookingCode.bookmaker} website</li>
            <li>Go to the bet slip section</li>
            <li>Enter the booking code</li>
            <li>Confirm your stake and place bet</li>
          </ol>
        </div>
        
        <button
          onClick={handleNewBet}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Create New Bet
        </button>
      </div>
    );
  }
  
  if (selections.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No selections yet</h3>
          <p className="text-gray-500 text-sm">
            Select matches from the list to create your bet slip
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Bet Slip</h2>
      </div>
      
      {/* Selections */}
      <div className="space-y-3 mb-6">
        {selections.map((selection) => (
          <div key={selection.matchId} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium text-gray-800">
                  {selection.match.homeTeam.shortName} vs {selection.match.awayTeam.shortName}
                </div>
                <div className="text-sm text-gray-600">
                  {selection.match.league}
                </div>
              </div>
              <button
                onClick={() => useBetScoreStore.getState().deselectMatch(selection.matchId)}
                className="text-red-500 hover:text-red-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 capitalize">{selection.outcome} win</span>
              <span className="text-lg font-bold text-blue-600">{selection.odds}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Total Odds */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Total Odds</span>
          <span className="text-3xl font-bold text-blue-600">{totalOdds.toFixed(2)}</span>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          {selections.length} selection{selections.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {/* Bookmaker Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Bookmaker
        </label>
        <select
          value={selectedBookmaker}
          onChange={(e) => setSelectedBookmaker(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {bookmakers.map(bookmaker => (
            <option key={bookmaker} value={bookmaker}>
              {bookmaker}
            </option>
          ))}
        </select>
      </div>
      
      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
      >
        Generate Booking Code
      </button>
      
      <button
        onClick={clearSelections}
        className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors"
      >
        Clear All
      </button>
    </div>
  );
}
