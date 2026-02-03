import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function QuinielaTable({ bets, schedule, isSettled, hasStarted, currentUserId }) {
  const { isDark } = useTheme()
  const [expandedCard, setExpandedCard] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)

  // Map prediction to display text
  const getPredictionDisplay = (prediction, match) => {
    switch (prediction) {
      case 'teamA':
        return 'L'
      case 'teamB':
        return 'V'
      case 'draw':
        return 'E'
      default:
        return '-'
    }
  }

  // Get prediction result styling
  const getPredictionClass = (prediction, match) => {
    if (!match.isCompleted || !match.result) {
      return isDark 
        ? 'bg-dark-700/60 text-dark-300' 
        : 'bg-gray-100 text-gray-600'
    }
    
    if (prediction === match.result) {
      return isDark 
        ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
        : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
    }
    
    return isDark 
      ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30' 
      : 'bg-red-50 text-red-600 ring-1 ring-red-200'
  }

  const hasCompletedMatches = schedule.matches.some(m => m.isCompleted)

  const findPrediction = (predictions, matchId) => {
    const pred = predictions.find(p => p.matchId === matchId)
    return pred ? pred.prediction : null
  }

  // Check if a bet belongs to the current user
  const isCurrentUserBet = (bet) => {
    // currentUserId comes from user.id (from auth context)
    // bet.userId._id comes from MongoDB populated user
    return currentUserId && (bet.userId?._id === currentUserId || bet.userId?.id === currentUserId)
  }

  // Determine if predictions should be visible for a bet
  const canSeePredictions = (bet) => {
    return hasStarted || isCurrentUserBet(bet)
  }

  // Empty state
  if (bets.length === 0) {
    return (
      <div className={`text-center py-16 rounded-xl border ${
        isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
          isDark ? 'bg-dark-700' : 'bg-gray-100'
        }`}>
          <span className="text-3xl">🎯</span>
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          No Predictions Yet
        </h3>
        <p className={`text-sm max-w-xs mx-auto ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
          Be the first to place your prediction this week and compete for the prize!
        </p>
      </div>
    )
  }

  const completedMatchesCount = schedule.matches.filter(m => m.isCompleted).length
  const totalMatchesCount = schedule.matches.length

  // Get rank badge styling - only winner gets gold, everyone else gets neutral gray
  const getRankBadge = (index, isWinner) => {
    // Only the actual winner (when settled) gets the gold/amber badge
    if (isWinner && isSettled) {
      return 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
    }
    // All other ranks get neutral gray styling
    return isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-5">
      
      {/* Summary Stats Bar */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-gradient-to-r from-dark-800 to-dark-700' : 'bg-gradient-to-r from-gray-50 to-white'
        }`}>
          {/* Left Stats */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Participants */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isDark ? 'bg-dark-700/80 border border-dark-600' : 'bg-white border border-gray-200 shadow-sm'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-purple-500/20' : 'bg-purple-100'
              }`}>
                <svg className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Participants</p>
                <p className={`text-lg font-bold -mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{bets.length}</p>
              </div>
            </div>
            
            {/* Progress */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isDark ? 'bg-dark-700/80 border border-dark-600' : 'bg-white border border-gray-200 shadow-sm'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                hasCompletedMatches
                  ? isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                  : isDark ? 'bg-dark-600' : 'bg-gray-100'
              }`}>
                <svg className={`w-4 h-4 ${
                  hasCompletedMatches
                    ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                    : isDark ? 'text-dark-400' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Matches</p>
                <div className="flex items-center gap-1.5">
                  <p className={`text-lg font-bold -mt-0.5 ${
                    hasCompletedMatches
                      ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                      : isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {completedMatchesCount}/{totalMatchesCount}
                  </p>
                  {hasCompletedMatches && completedMatchesCount < totalMatchesCount && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Leader Badge */}
          {bets.length > 0 && (
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
              hasCompletedMatches && bets[0]?.totalPoints > 0
                ? isDark 
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30' 
                  : 'bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200'
                : isDark
                  ? 'bg-dark-700/80 border border-dark-600'
                  : 'bg-gray-50 border border-gray-200'
            }`}>
              <span className="text-xl">🏆</span>
              {hasCompletedMatches && bets[0]?.totalPoints > 0 ? (
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-amber-400 to-amber-600`}>
                    {bets[0]?.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {bets[0]?.userId?.name || 'Unknown'}
                    </p>
                    <p className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      {bets[0]?.totalPoints} points
                    </p>
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  Leader appears after first match
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className={`hidden lg:block rounded-xl border overflow-hidden ${
        isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-dark-700/50' : 'bg-gray-50/80'}>
                <th className={`sticky left-0 z-20 w-14 px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'bg-dark-700/95 text-dark-300 backdrop-blur-sm' : 'bg-gray-50/95 text-gray-500 backdrop-blur-sm'
                }`}>
                  Rank
                </th>
                <th className={`sticky left-14 z-20 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider min-w-[140px] ${
                  isDark ? 'bg-dark-700/95 text-dark-300 backdrop-blur-sm' : 'bg-gray-50/95 text-gray-500 backdrop-blur-sm'
                }`}>
                  Player
                </th>
                <th className={`px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-dark-300' : 'text-gray-500'
                }`}>
                  <div className="flex items-center justify-center gap-1">
                    <span>⚽</span>
                    <span>Goals</span>
                  </div>
                </th>
                {schedule.matches.map((match, index) => (
                  <th
                    key={match._id}
                    className={`px-1.5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider ${
                      isDark ? 'text-dark-300' : 'text-gray-500'
                    }`}
                  >
                    <div 
                      className={`inline-flex items-center justify-center w-9 h-7 rounded-md text-[10px] font-bold transition-colors cursor-help ${
                        match.isCompleted 
                          ? isDark ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                          : isDark ? 'bg-dark-600/50 text-dark-400' : 'bg-gray-100 text-gray-500'
                      }`}
                      title={`${match.teamA} vs ${match.teamB}${match.isCompleted ? ` • Final: ${match.scoreTeamA}-${match.scoreTeamB}` : ''}`}
                    >
                      {index + 1}
                    </div>
                  </th>
                ))}
                <th className={`px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-dark-300' : 'text-gray-500'
                }`}>
                  Points
                </th>
                <th className={`px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-dark-300' : 'text-gray-500'
                }`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-dark-700/50' : 'divide-gray-100'}`}>
              {bets.map((bet, index) => (
                <tr
                  key={bet._id}
                  onMouseEnter={() => setHoveredRow(bet._id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`transition-colors duration-150 ${
                    bet.isWinner && isSettled 
                      ? isDark 
                        ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent' 
                        : 'bg-gradient-to-r from-amber-50 via-amber-25 to-transparent'
                      : hoveredRow === bet._id
                        ? isDark ? 'bg-dark-700/30' : 'bg-gray-50/80'
                        : isDark ? 'bg-dark-800' : 'bg-white'
                  }`}
                >
                  {/* Rank */}
                  <td className={`sticky left-0 z-10 w-14 px-3 py-3 ${
                    isDark ? 'bg-dark-800' : 'bg-white'
                  } ${bet.isWinner && isSettled ? isDark ? 'bg-amber-500/10' : 'bg-amber-50' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getRankBadge(index, bet.isWinner && isSettled)}`}>
                      {bet.isWinner && isSettled ? '👑' : index + 1}
                    </div>
                  </td>
                  
                  {/* Player */}
                  <td className={`sticky left-14 z-10 px-4 py-3 ${
                    isDark ? 'bg-dark-800' : 'bg-white'
                  } ${bet.isWinner && isSettled ? isDark ? 'bg-amber-500/10' : 'bg-amber-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white ${
                        bet.isWinner && isSettled 
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25' 
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20'
                      }`}>
                        {bet.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {bet.userId?.name || 'Unknown'}
                        </p>
                        {bet.isWinner && isSettled && (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            isDark ? 'text-amber-400' : 'text-amber-600'
                          }`}>
                            <span>🏆</span> Winner
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Goals */}
                  <td className="px-3 py-3 text-center">
                    {canSeePredictions(bet) ? (
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-semibold ${
                        isSettled && bet.goalDifference !== null 
                          ? bet.goalDifference === 0 
                            ? isDark ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                            : isDark ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                          : isDark ? 'bg-dark-700 text-dark-200' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {bet.totalGoals}
                        {isSettled && bet.goalDifference !== null && (
                          <span className="text-xs opacity-75 ml-0.5">
                            {bet.goalDifference === 0 ? '✓' : `±${bet.goalDifference}`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-semibold ${
                        isDark ? 'bg-dark-700/50 text-dark-500' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    )}
                  </td>

                  {/* Match Predictions */}
                  {schedule.matches.map((match) => {
                    const prediction = findPrediction(bet.predictions, match._id)
                    return (
                      <td key={match._id} className="px-1.5 py-3 text-center">
                        {canSeePredictions(bet) ? (
                          <div
                            className={`inline-flex items-center justify-center w-9 h-8 rounded-lg text-xs font-bold transition-all ${getPredictionClass(prediction, match)}`}
                            title={`${match.teamA} vs ${match.teamB}: ${
                              prediction === 'teamA' ? 'Home wins (L)' :
                              prediction === 'teamB' ? 'Away wins (V)' : 
                              prediction === 'draw' ? 'Draw (E)' : 'No prediction'
                            }${match.isCompleted ? ` • Result: ${match.scoreTeamA}-${match.scoreTeamB}` : ''}`}
                          >
                            {prediction ? getPredictionDisplay(prediction, match) : '-'}
                          </div>
                        ) : (
                          <div
                            className={`inline-flex items-center justify-center w-9 h-8 rounded-lg text-xs transition-all ${
                              isDark ? 'bg-dark-700/50 text-dark-500' : 'bg-gray-100 text-gray-400'
                            }`}
                            title="Predictions hidden until first match starts"
                          >
                            🔒
                          </div>
                        )}
                      </td>
                    )
                  })}

                  {/* Points */}
                  <td className="px-4 py-3 text-center">
                    {canSeePredictions(bet) ? (
                      <div className={`inline-flex items-center justify-center min-w-[44px] px-3 py-1.5 rounded-lg text-sm font-bold ${
                        bet.totalPoints >= 7 
                          ? isDark ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                          : bet.totalPoints >= 5 
                            ? isDark ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                            : bet.totalPoints >= 3 
                              ? isDark ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40' : 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                              : isDark ? 'bg-dark-700 text-white' : 'bg-gray-100 text-gray-900'
                      }`}>
                        {bet.totalPoints}
                      </div>
                    ) : (
                      <div 
                        className={`inline-flex items-center justify-center min-w-[44px] px-3 py-1.5 rounded-lg text-sm ${
                          isDark ? 'bg-dark-700/50 text-dark-500' : 'bg-gray-100 text-gray-400'
                        }`}
                        title="Points hidden until first match starts"
                      >
                        🔒
                      </div>
                    )}
                  </td>

                  {/* Payment Status */}
                  <td className="px-4 py-3 text-center">
                    {bet.paid ? (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                        isDark ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Paid
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
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

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {bets.map((bet, index) => {
          const isExpanded = expandedCard === bet._id
          const correctCount = schedule.matches.filter(m => m.isCompleted && findPrediction(bet.predictions, m._id) === m.result).length
          const wrongCount = schedule.matches.filter(m => m.isCompleted && findPrediction(bet.predictions, m._id) && findPrediction(bet.predictions, m._id) !== m.result).length
          const pendingCount = schedule.matches.filter(m => !m.isCompleted).length
          
          return (
            <div
              key={bet._id}
              className={`rounded-xl overflow-hidden transition-all duration-200 ${
                bet.isWinner && isSettled 
                  ? isDark
                    ? 'bg-gradient-to-br from-amber-500/15 via-dark-800 to-dark-800 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10' 
                    : 'bg-gradient-to-br from-amber-50 via-white to-white ring-1 ring-amber-300 shadow-lg shadow-amber-100'
                  : isDark 
                    ? 'bg-dark-800 ring-1 ring-dark-700' 
                    : 'bg-white ring-1 ring-gray-200 shadow-sm'
              }`}
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedCard(isExpanded ? null : bet._id)}
                className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                  isDark ? 'active:bg-dark-700/50' : 'active:bg-gray-50'
                }`}
              >
                {/* Rank */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${getRankBadge(index, bet.isWinner && isSettled)}`}>
                  {bet.isWinner && isSettled ? '👑' : index + 1}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                      bet.isWinner && isSettled 
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}>
                      {bet.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {bet.userId?.name || 'Unknown'}
                      </p>
                      {/* Mini Stats */}
                      <div className="flex items-center gap-2 mt-0.5">
                        {canSeePredictions(bet) ? (
                          <>
                            {hasCompletedMatches && (
                              <>
                                <span className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                  ✓{correctCount}
                                </span>
                                <span className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                                  ✗{wrongCount}
                                </span>
                              </>
                            )}
                            {pendingCount > 0 && (
                              <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-400'}`}>
                                {pendingCount} left
                              </span>
                            )}
                            {!hasStarted && isCurrentUserBet(bet) && (
                              <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                (Your bet)
                              </span>
                            )}
                          </>
                        ) : (
                          <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-dark-400' : 'text-gray-400'}`}>
                            🔒 Hidden
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Points */}
                {/* Points */}
                {canSeePredictions(bet) ? (
                  <div className={`flex-shrink-0 px-3 py-2 rounded-xl text-center ${
                    bet.totalPoints >= 7 
                      ? isDark ? 'bg-emerald-500/20 ring-1 ring-emerald-500/40' : 'bg-emerald-100 ring-1 ring-emerald-200'
                      : bet.totalPoints >= 5 
                        ? isDark ? 'bg-amber-500/20 ring-1 ring-amber-500/40' : 'bg-amber-100 ring-1 ring-amber-200'
                        : isDark ? 'bg-dark-700 ring-1 ring-dark-600' : 'bg-gray-100 ring-1 ring-gray-200'
                  }`}>
                    <span className={`text-xl font-bold ${
                      bet.totalPoints >= 7 
                        ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                        : bet.totalPoints >= 5 
                          ? isDark ? 'text-amber-400' : 'text-amber-700'
                          : isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {bet.totalPoints}
                    </span>
                    <span className={`text-[10px] block font-medium -mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      pts
                    </span>
                  </div>
                ) : (
                  <div className={`flex-shrink-0 px-3 py-2 rounded-xl text-center ${
                    isDark ? 'bg-dark-700/50 ring-1 ring-dark-600' : 'bg-gray-100 ring-1 ring-gray-200'
                  }`}>
                    <span className="text-xl">🔒</span>
                  </div>
                )}

                {/* Expand Icon */}
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

              {/* Winner Badge */}
              {bet.isWinner && isSettled && (
                <div className={`mx-4 mb-3 py-2.5 px-4 rounded-lg text-center text-sm font-bold ${
                  isDark ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                }`}>
                  🏆 WEEK CHAMPION 🏆
                </div>
              )}

              {/* Expanded Content */}
              {isExpanded && (
                <div className={`px-4 pb-4 space-y-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-100'}`}>
                  
                  {canSeePredictions(bet) ? (
                    <>
                      {/* Stats Row */}
                      <div className="grid grid-cols-4 gap-2 pt-4">
                        <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-dark-700/50' : 'bg-gray-50'}`}>
                          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{bet.totalGoals}</p>
                          <p className={`text-[10px] font-medium uppercase tracking-wide ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Goals</p>
                          {isSettled && bet.goalDifference !== null && (
                            <p className={`text-xs mt-0.5 ${
                              bet.goalDifference === 0 ? 'text-emerald-500' : isDark ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              {bet.goalDifference === 0 ? '✓ Exact' : `±${bet.goalDifference}`}
                            </p>
                          )}
                        </div>
                        <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                          <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{correctCount}</p>
                          <p className={`text-[10px] font-medium uppercase tracking-wide ${isDark ? 'text-emerald-400/60' : 'text-emerald-600/60'}`}>Correct</p>
                        </div>
                        <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                          <p className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{wrongCount}</p>
                          <p className={`text-[10px] font-medium uppercase tracking-wide ${isDark ? 'text-red-400/60' : 'text-red-600/60'}`}>Wrong</p>
                        </div>
                        <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-dark-700/50' : 'bg-gray-50'}`}>
                          <p className={`text-lg font-bold ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>{pendingCount}</p>
                          <p className={`text-[10px] font-medium uppercase tracking-wide ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Pending</p>
                        </div>
                      </div>

                      {/* Predictions Grid */}
                      <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-dark-600' : 'border-gray-200'}`}>
                        <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                          isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          Match Predictions
                        </div>
                        <div className={`p-3 ${isDark ? 'bg-dark-700/30' : 'bg-gray-50/50'}`}>
                          <div className="grid grid-cols-3 gap-2">
                            {schedule.matches.map((match, matchIndex) => {
                              const prediction = findPrediction(bet.predictions, match._id)
                              const isCorrect = match.isCompleted && prediction === match.result
                              const isWrong = match.isCompleted && prediction && prediction !== match.result
                              
                              return (
                                <div 
                                  key={match._id} 
                                  className={`p-2.5 rounded-lg text-center transition-all ${
                                    isCorrect
                                      ? isDark ? 'bg-emerald-500/15 ring-1 ring-emerald-500/40' : 'bg-emerald-100 ring-1 ring-emerald-200'
                                      : isWrong
                                        ? isDark ? 'bg-red-500/15 ring-1 ring-red-500/40' : 'bg-red-50 ring-1 ring-red-200'
                                        : isDark ? 'bg-dark-600/50 ring-1 ring-dark-500' : 'bg-white ring-1 ring-gray-200'
                                  }`}
                                >
                                  <div className={`text-[10px] font-semibold mb-1 ${
                                    isCorrect ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                                      : isWrong ? isDark ? 'text-red-400' : 'text-red-500'
                                      : isDark ? 'text-dark-400' : 'text-gray-500'
                                  }`}>
                                    M{matchIndex + 1}
                                  </div>
                                  <div className={`text-sm font-bold ${
                                    isCorrect ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                                      : isWrong ? isDark ? 'text-red-400' : 'text-red-600'
                                      : isDark ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {prediction ? getPredictionDisplay(prediction, match) : '-'}
                                  </div>
                                  {match.isCompleted && (
                                    <div className={`text-[9px] mt-0.5 ${
                                      isCorrect ? 'text-emerald-500' : isWrong ? 'text-red-400' : ''
                                    }`}>
                                      {isCorrect ? '✓' : isWrong ? '✗' : ''}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Hidden State - Before First Match */
                    <div className={`pt-4 text-center py-8 rounded-lg ${isDark ? 'bg-dark-700/30' : 'bg-gray-50'}`}>
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                        isDark ? 'bg-dark-600' : 'bg-gray-100'
                      }`}>
                        <span className="text-3xl">🔒</span>
                      </div>
                      <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Predictions Hidden
                      </h4>
                      <p className={`text-xs max-w-xs mx-auto ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                        Other participants' predictions will be visible after the first match starts.
                      </p>
                    </div>
                  )}

                  {/* Payment Status */}
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    isDark ? 'bg-dark-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                      Payment
                    </span>
                    {bet.paid ? (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        isDark ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Confirmed
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
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

      {/* Legend */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`px-4 py-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${
          isDark ? 'bg-dark-700/50 text-dark-400' : 'bg-gray-50 text-gray-500'
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Legend
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-7 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                isDark ? 'bg-dark-700 text-dark-200' : 'bg-gray-100 text-gray-700'
              }`}>L</span>
              <span className={`text-xs ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Home (Local)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-7 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                isDark ? 'bg-dark-700 text-dark-200' : 'bg-gray-100 text-gray-700'
              }`}>V</span>
              <span className={`text-xs ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Away (Visitante)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-7 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                isDark ? 'bg-dark-700 text-dark-200' : 'bg-gray-100 text-gray-700'
              }`}>E</span>
              <span className={`text-xs ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Draw (Empate)</span>
            </div>
            {hasCompletedMatches && (
              <>
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                    isDark ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                  }`}>✓</span>
                  <span className={`text-xs ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                    isDark ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30' : 'bg-red-50 text-red-600 ring-1 ring-red-200'
                  }`}>✗</span>
                  <span className={`text-xs ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Wrong</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
