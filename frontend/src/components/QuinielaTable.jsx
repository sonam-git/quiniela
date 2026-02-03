import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function QuinielaTable({ bets, schedule, isSettled, hasStarted }) {
  const { isDark } = useTheme()
  const [expandedCard, setExpandedCard] = useState(null)

  // Map prediction to display text
  const getPredictionDisplay = (prediction, match) => {
    switch (prediction) {
      case 'teamA':
        return match.teamA.substring(0, 3).toUpperCase()
      case 'teamB':
        return match.teamB.substring(0, 3).toUpperCase()
      case 'draw':
        return 'E'
      default:
        return '-'
    }
  }

  // Get prediction result class (correct/incorrect) - AWS style badges
  const getPredictionClass = (prediction, match) => {
    if (!match.isCompleted || !match.result) {
      return isDark 
        ? 'bg-dark-700 text-dark-200 border border-dark-600' 
        : 'bg-gray-100 text-gray-600 border border-gray-200'
    }
    
    if (prediction === match.result) {
      return isDark 
        ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50 font-semibold'
        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold'
    }
    
    return isDark 
      ? 'bg-red-900/30 text-red-400 border border-red-800/50' 
      : 'bg-red-50 text-red-600 border border-red-200'
  }

  const hasCompletedMatches = schedule.matches.some(m => m.isCompleted)

  const findPrediction = (predictions, matchId) => {
    const pred = predictions.find(p => p.matchId === matchId)
    return pred ? pred.prediction : null
  }

  if (bets.length === 0) {
    return (
      <div className={`text-center py-12 rounded-lg border ${
        isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <span className="text-4xl mb-4 block">🎯</span>
        <h3 className={`text-base font-semibold mb-1 ${
          isDark ? 'text-dark-100' : 'text-gray-900'
        }`}>
          No bets yet
        </h3>
        <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
          Be the first to place your bet this week!
        </p>
      </div>
    )
  }

  const completedMatchesCount = schedule.matches.filter(m => m.isCompleted).length
  const totalMatchesCount = schedule.matches.length

  return (
    <div className="space-y-4">
      {/* Summary Header - AWS Console style info bar */}
      <div className={`rounded-xl overflow-hidden ring-1 ${
        isDark ? 'ring-dark-700 bg-dark-800' : 'ring-gray-200 bg-white'
      }`}>
        <div className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-dark-700/50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              isDark ? 'bg-dark-600' : 'bg-white ring-1 ring-gray-200'
            }`}>
              <svg className={`w-4 h-4 ${isDark ? 'text-dark-300' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {bets.length}
              </span>
              <span className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                participants
              </span>
            </div>
            
            {hasCompletedMatches && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                isDark ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'bg-emerald-50 ring-1 ring-emerald-200'
              }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {completedMatchesCount}/{totalMatchesCount} completed
                </span>
              </div>
            )}
          </div>
          
          {bets.length > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              isDark ? 'bg-amber-500/10 ring-1 ring-amber-500/20' : 'bg-amber-50 ring-1 ring-amber-200'
            }`}>
              <span className="text-base">🏆</span>
              <span className={`text-sm ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Leader:</span>
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {bets[0]?.userId?.name || 'Unknown'}
              </span>
              <span className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {bets[0]?.totalPoints || 0} pts
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table View - AWS Console style */}
      <div className={`hidden lg:block rounded-xl overflow-hidden ring-1 ${
        isDark ? 'ring-dark-700' : 'ring-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${
                isDark ? 'bg-dark-700' : 'bg-gray-50'
              }`}>
                <th className={`sticky left-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${
                  isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-50 text-gray-600'
                }`}>
                  #
                </th>
                <th className={`sticky left-12 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${
                  isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-50 text-gray-600'
                }`}>
                  Participant
                </th>
                <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide ${
                  isDark ? 'text-dark-300' : 'text-gray-600'
                }`}>
                  ⚽ Goals
                </th>
                {schedule.matches.map((match, index) => (
                  <th
                    key={match._id}
                    className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide min-w-[52px] ${
                      isDark ? 'text-dark-300' : 'text-gray-600'
                    }`}
                    title={`🏠 ${match.teamA} vs ✈️ ${match.teamB}${match.isCompleted ? ` (${match.scoreTeamA}-${match.scoreTeamB})` : ''}`}
                  >
                    <span className={`block px-2 py-1 rounded-md ${
                      match.isCompleted 
                        ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                        : ''
                    }`}>
                      M{index + 1}
                      {match.isCompleted && <span className="ml-0.5">✓</span>}
                    </span>
                  </th>
                ))}
                <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide ${
                  isDark ? 'text-dark-300' : 'text-gray-600'
                }`}>
                  Points
                </th>
                <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide ${
                  isDark ? 'text-dark-300' : 'text-gray-600'
                }`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className={isDark ? 'bg-dark-800' : 'bg-white'}>
              {bets.map((bet, index) => (
                <tr
                  key={bet._id}
                  className={`border-t transition-colors ${
                    bet.isWinner && isSettled 
                      ? isDark 
                        ? 'bg-amber-500/10 border-amber-500/30' 
                        : 'bg-amber-50 border-amber-200'
                      : isDark 
                        ? 'border-dark-700 hover:bg-dark-700/50' 
                        : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <td className={`sticky left-0 z-10 px-4 py-3 whitespace-nowrap ${
                    isDark ? 'bg-dark-800' : 'bg-white'
                  } ${bet.isWinner && isSettled ? isDark ? 'bg-amber-500/10' : 'bg-amber-50' : ''}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      index === 0 
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/25'
                        : index === 1
                          ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700'
                          : index === 2
                            ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white'
                            : isDark
                              ? 'bg-dark-700 text-dark-300'
                              : 'bg-gray-100 text-gray-600'
                    }`}>
                      {bet.isWinner && isSettled ? '👑' : index + 1}
                    </div>
                  </td>
                  
                  <td className={`sticky left-12 z-10 px-4 py-3 whitespace-nowrap ${
                    isDark ? 'bg-dark-800' : 'bg-white'
                  } ${bet.isWinner && isSettled ? isDark ? 'bg-amber-500/10' : 'bg-amber-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                        bet.isWinner && isSettled 
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      }`}>
                        {bet.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {bet.userId?.name || 'Unknown'}
                        </span>
                        {bet.isWinner && isSettled && (
                          <span className="text-base">💰</span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      isSettled && bet.goalDifference !== null 
                        ? bet.goalDifference === 0 
                          ? isDark ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                          : isDark ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30' : 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                        : isDark ? 'bg-dark-700 text-dark-300 ring-1 ring-dark-600' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
                    }`}>
                      {bet.totalGoals}
                      {isSettled && bet.goalDifference !== null && (
                        <span className="ml-1 opacity-75">
                          {bet.goalDifference === 0 ? '✓' : `±${bet.goalDifference}`}
                        </span>
                      )}
                    </span>
                  </td>

                  {schedule.matches.map((match) => {
                    const prediction = findPrediction(bet.predictions, match._id)
                    return (
                      <td key={match._id} className="px-2 py-3 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center justify-center w-9 h-7 rounded-md text-[11px] font-semibold ${getPredictionClass(prediction, match)}`}
                          title={`🏠 ${match.teamA} vs ✈️ ${match.teamB}: ${
                            prediction === 'teamA' ? match.teamA + ' wins' :
                            prediction === 'teamB' ? match.teamB + ' wins' : 'Draw'
                          }${match.isCompleted ? ` | Result: ${match.scoreTeamA}-${match.scoreTeamB}` : ''}`}
                        >
                          {prediction ? getPredictionDisplay(prediction, match) : '-'}
                        </span>
                      </td>
                    )
                  })}

                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center justify-center min-w-[40px] px-3 py-1.5 rounded-lg text-sm font-bold ${
                      bet.totalPoints >= 7 
                        ? isDark ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                        : bet.totalPoints >= 5 
                          ? isDark ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                          : bet.totalPoints >= 3 
                            ? isDark ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30' : 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                            : isDark ? 'bg-dark-700 text-dark-300 ring-1 ring-dark-600' : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
                    }`}>
                      {bet.totalPoints}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {bet.paid ? (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isDark ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Paid
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isDark ? 'bg-dark-700 text-dark-400 ring-1 ring-dark-600' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                      }`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - AWS Console style */}
      <div className="lg:hidden space-y-3">
        {bets.map((bet, index) => {
          const isExpanded = expandedCard === bet._id
          const correctCount = schedule.matches.filter(m => m.isCompleted && findPrediction(bet.predictions, m._id) === m.result).length
          const wrongCount = schedule.matches.filter(m => m.isCompleted && findPrediction(bet.predictions, m._id) && findPrediction(bet.predictions, m._id) !== m.result).length
          
          return (
            <div
              key={bet._id}
              className={`rounded-xl overflow-hidden transition-all duration-200 ${
                bet.isWinner && isSettled 
                  ? isDark
                    ? 'bg-gradient-to-r from-amber-900/30 to-dark-800 ring-1 ring-amber-500/50' 
                    : 'bg-gradient-to-r from-amber-50 to-white ring-1 ring-amber-300'
                  : isDark 
                    ? 'bg-dark-800 ring-1 ring-dark-700' 
                    : 'bg-white ring-1 ring-gray-200 shadow-sm'
              }`}
            >
              {/* Main Card Header - Always visible */}
              <button
                onClick={() => setExpandedCard(isExpanded ? null : bet._id)}
                className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                  isDark ? 'hover:bg-dark-700/30' : 'hover:bg-gray-50/50'
                }`}
              >
                {/* Rank Badge */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  index === 0 
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/25'
                    : index === 1
                      ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700'
                      : index === 2
                        ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white'
                        : isDark
                          ? 'bg-dark-700 text-dark-300 ring-1 ring-dark-600'
                          : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
                }`}>
                  {bet.isWinner && isSettled ? '👑' : index + 1}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                      bet.isWinner && isSettled 
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}>
                      {bet.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className={`font-semibold text-sm truncate ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {bet.userId?.name || 'Unknown'}
                    </span>
                    {bet.isWinner && isSettled && <span className="text-sm">💰</span>}
                  </div>
                  
                  {/* Quick Stats Row */}
                  <div className="flex items-center gap-3 mt-1">
                    {hasCompletedMatches && (
                      <>
                        <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          ✓ {correctCount}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                          ✗ {wrongCount}
                        </span>
                      </>
                    )}
                
                  </div>
                </div>

                {/* Points Badge */}
                <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-center min-w-[52px] ${
                  bet.totalPoints >= 7 
                    ? isDark ? 'bg-emerald-500/20 ring-1 ring-emerald-500/30' : 'bg-emerald-100 ring-1 ring-emerald-200'
                    : bet.totalPoints >= 5 
                      ? isDark ? 'bg-amber-500/20 ring-1 ring-amber-500/30' : 'bg-amber-100 ring-1 ring-amber-200'
                      : isDark ? 'bg-dark-700 ring-1 ring-dark-600' : 'bg-gray-100 ring-1 ring-gray-200'
                }`}>
                  <span className={`text-lg font-bold ${
                    bet.totalPoints >= 7 
                      ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                      : bet.totalPoints >= 5 
                        ? isDark ? 'text-amber-400' : 'text-amber-700'
                        : isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {bet.totalPoints}
                  </span>
                  <span className={`text-[10px] block -mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    pts
                  </span>
                </div>

                {/* Expand Arrow */}
                <svg 
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  } ${isDark ? 'text-dark-400' : 'text-gray-400'}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Winner Banner */}
              {bet.isWinner && isSettled && (
                <div className={`mx-4 mb-3 py-2 px-3 rounded-lg text-center text-sm font-semibold ${
                  isDark ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                }`}>
                  🏆 WEEK WINNER 🏆
                </div>
              )}

              {/* Expanded Content */}
              {isExpanded && (
                <div className={`px-4 pb-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-100'}`}>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
                    <div className={`p-3 rounded-lg text-center ${
                      isDark ? 'bg-dark-700/50' : 'bg-gray-50'
                    }`}>
                      <div className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                        Goals
                      </div>
                      <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {bet.totalGoals}
                      </div>
                      {isSettled && bet.goalDifference !== null && (
                        <div className={`text-xs mt-0.5 ${
                          bet.goalDifference === 0 
                            ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                            : isDark ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {bet.goalDifference === 0 ? '✓ Exact' : `±${bet.goalDifference}`}
                        </div>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg text-center ${
                      isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                    }`}>
                      <div className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'}`}>
                        Correct
                      </div>
                      <div className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {correctCount}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${
                      isDark ? 'bg-red-500/10' : 'bg-red-50'
                    }`}>
                      <div className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-red-400/70' : 'text-red-600/70'}`}>
                        Wrong
                      </div>
                      <div className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        {wrongCount}
                      </div>
                    </div>
                  </div>

                  {/* Predictions Section */}
                  <div className={`rounded-lg overflow-hidden ring-1 ${
                    isDark ? 'ring-dark-600 bg-dark-700/30' : 'ring-gray-200 bg-gray-50'
                  }`}>
                    <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                      isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      Match Predictions
                    </div>
                    <div className="p-3">
                      <div className="grid grid-cols-3 gap-2">
                        {schedule.matches.map((match, matchIndex) => {
                          const prediction = findPrediction(bet.predictions, match._id)
                          const isCorrect = match.isCompleted && prediction === match.result
                          const isWrong = match.isCompleted && prediction && prediction !== match.result
                          
                          return (
                            <div 
                              key={match._id} 
                              className={`p-2 rounded-lg text-center transition-all ${
                                isCorrect
                                  ? isDark ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30' : 'bg-emerald-50 ring-1 ring-emerald-200'
                                  : isWrong
                                    ? isDark ? 'bg-red-500/15 ring-1 ring-red-500/30' : 'bg-red-50 ring-1 ring-red-200'
                                    : isDark ? 'bg-dark-600/50' : 'bg-white ring-1 ring-gray-200'
                              }`}
                            >
                              <div className={`text-[10px] font-medium mb-1 ${
                                match.isCompleted 
                                  ? isCorrect ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                                    : isWrong ? isDark ? 'text-red-400' : 'text-red-500'
                                    : isDark ? 'text-dark-400' : 'text-gray-500'
                                  : isDark ? 'text-dark-500' : 'text-gray-400'
                              }`}>
                                M{matchIndex + 1} {match.isCompleted && (isCorrect ? '✓' : '✗')}
                              </div>
                              <div className={`text-xs font-semibold ${
                                isCorrect
                                  ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                                  : isWrong
                                    ? isDark ? 'text-red-400' : 'text-red-600'
                                    : isDark ? 'text-dark-200' : 'text-gray-700'
                              }`}>
                                {prediction ? getPredictionDisplay(prediction, match) : '-'}
                              </div>
                              <div className={`text-[9px] mt-0.5 truncate ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                                {match.teamA.substring(0, 3)} vs {match.teamB.substring(0, 3)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className={`mt-3 flex items-center justify-between p-3 rounded-lg ${
                    isDark ? 'bg-dark-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs font-medium ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      Payment Status
                    </span>
                    {bet.paid ? (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isDark ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Confirmed
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isDark ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend - AWS Console style */}
      <div className={`rounded-xl overflow-hidden ring-1 ${
        isDark ? 'ring-dark-700 bg-dark-800' : 'ring-gray-200 bg-white'
      }`}>
        <div className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide flex items-center gap-2 ${
          isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-50 text-gray-600'
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Legend
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-dark-700/50' : 'bg-gray-50'}`}>
              <span className="text-base">🏠</span>
              <span className={`text-xs font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Home team</span>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-dark-700/50' : 'bg-gray-50'}`}>
              <span className="text-base">✈️</span>
              <span className={`text-xs font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Away team</span>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-dark-700/50' : 'bg-gray-50'}`}>
              <span className={`w-7 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isDark ? 'bg-dark-600 text-dark-200 ring-1 ring-dark-500' : 'bg-gray-200 text-gray-700 ring-1 ring-gray-300'
              }`}>
                ABC
              </span>
              <span className={`text-xs font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Team wins</span>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-dark-700/50' : 'bg-gray-50'}`}>
              <span className={`w-7 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                isDark ? 'bg-dark-600 text-dark-200 ring-1 ring-dark-500' : 'bg-gray-200 text-gray-700 ring-1 ring-gray-300'
              }`}>
                E
              </span>
              <span className={`text-xs font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Draw (Empate)</span>
            </div>
            {hasCompletedMatches && (
              <>
                <div className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                  <span className={`w-7 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    isDark ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                  }`}>
                    ✓
                  </span>
                  <span className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Correct</span>
                </div>
                <div className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                  <span className={`w-7 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    isDark ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40' : 'bg-red-100 text-red-600 ring-1 ring-red-300'
                  }`}>
                    ✗
                  </span>
                  <span className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>Wrong</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
