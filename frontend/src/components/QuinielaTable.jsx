import { useTheme } from '../context/ThemeContext'

export default function QuinielaTable({ bets, schedule, isSettled, hasStarted }) {
  const { isDark } = useTheme()

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
      {/* Summary Header - AWS style info bar */}
      {hasCompletedMatches && (
        <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-blue-50 border-blue-100'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-dark-100' : 'text-blue-900'}`}>
              Progress: {completedMatchesCount}/{totalMatchesCount} matches completed
            </span>
          </div>
          {bets.length > 0 && (
            <div className={`text-sm ${isDark ? 'text-dark-300' : 'text-blue-700'}`}>
              Leader: <span className="font-semibold">{bets[0]?.userId?.name || 'Unknown'}</span>
              <span className={`ml-1 font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {bets[0]?.totalPoints || 0} pts
              </span>
            </div>
          )}
        </div>
      )}

      {/* Desktop Table View - AWS Console style */}
      <div className={`hidden lg:block overflow-hidden rounded-lg border ${
        isDark ? 'border-dark-700' : 'border-gray-200'
      }`}>
        <table className="w-full">
          <thead>
            <tr className={`${
              isDark ? 'bg-dark-800 border-b border-dark-700' : 'bg-gray-50 border-b border-gray-200'
            }`}>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${
                isDark ? 'text-dark-300' : 'text-gray-600'
              }`}>
                Rank
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${
                isDark ? 'text-dark-300' : 'text-gray-600'
              }`}>
                Participant
              </th>
              <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide ${
                isDark ? 'text-dark-300' : 'text-gray-600'
              }`}>
                Goals
              </th>
              {schedule.matches.map((match, index) => (
                <th
                  key={match._id}
                  className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide min-w-[48px] ${
                    isDark ? 'text-dark-300' : 'text-gray-600'
                  }`}
                  title={`🏠 ${match.teamA} vs ✈️ ${match.teamB}${match.isCompleted ? ` (${match.scoreTeamA}-${match.scoreTeamB})` : ''}`}
                >
                  <span className="block">M{index + 1}</span>
                  {match.isCompleted && (
                    <span className={`block text-[10px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>✓</span>
                  )}
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
          <tbody className={isDark ? 'bg-dark-900' : 'bg-white'}>
            {bets.map((bet, index) => (
              <tr
                key={bet._id}
                className={`border-b transition-colors ${
                  bet.isWinner && isSettled 
                    ? isDark 
                      ? 'bg-amber-900/20 border-l-4 border-l-amber-500 border-b-dark-700' 
                      : 'bg-amber-50 border-l-4 border-l-amber-500 border-b-gray-200'
                    : isDark 
                      ? 'border-dark-700 hover:bg-dark-800/50' 
                      : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-sm font-medium ${
                    bet.isWinner && isSettled 
                      ? isDark ? 'text-amber-400' : 'text-amber-600'
                      : isDark ? 'text-dark-200' : 'text-gray-700'
                  }`}>
                    {bet.isWinner && isSettled ? '👑' : index + 1}
                  </span>
                </td>
                
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                      bet.isWinner && isSettled 
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
                        : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    }`}>
                      {bet.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-dark-100' : 'text-gray-900'
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
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isSettled && bet.goalDifference !== null 
                      ? bet.goalDifference === 0 
                        ? isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                        : isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'
                      : isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-100 text-gray-600'
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
                        className={`inline-flex items-center justify-center w-8 h-7 rounded text-[11px] font-medium ${getPredictionClass(prediction, match)}`}
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                    bet.totalPoints >= 7 
                      ? isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                      : bet.totalPoints >= 5 
                        ? isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'
                        : bet.totalPoints >= 3 
                          ? isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'
                          : isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {bet.totalPoints}/{schedule.matches.filter(m => m.isCompleted).length || 9}
                  </span>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-center">
                  {bet.paid ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      ✓ Paid
                    </span>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      isDark ? 'bg-dark-700 text-dark-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - AWS style cards */}
      <div className="lg:hidden space-y-3">
        {bets.map((bet, index) => (
          <div
            key={bet._id}
            className={`p-4 rounded-lg border ${
              bet.isWinner && isSettled 
                ? isDark
                  ? 'bg-amber-900/20 border-amber-600/50 border-l-4 border-l-amber-500' 
                  : 'bg-amber-50 border-amber-200 border-l-4 border-l-amber-500'
                : isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${
                  bet.isWinner && isSettled 
                    ? isDark ? 'text-amber-400' : 'text-amber-600'
                    : isDark ? 'text-dark-300' : 'text-gray-500'
                }`}>
                  {bet.isWinner && isSettled ? '👑' : `#${index + 1}`}
                </span>
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                    bet.isWinner && isSettled 
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
                      : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                  }`}>
                    {bet.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className={`font-medium text-sm ${
                    isDark ? 'text-dark-100' : 'text-gray-900'
                  }`}>
                    {bet.userId?.name || 'Unknown'}
                  </span>
                  {bet.isWinner && isSettled && <span>💰</span>}
                </div>
              </div>
              {bet.paid ? (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  ✓ Paid
                </span>
              ) : (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  isDark ? 'bg-dark-700 text-dark-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  Pending
                </span>
              )}
            </div>

            {/* Winner banner */}
            {bet.isWinner && isSettled && (
              <div className={`mb-3 py-2 px-3 rounded text-center text-sm font-semibold ${
                isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
              }`}>
                🏆 WINNER 💰
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Goals:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  isSettled && bet.goalDifference !== null 
                    ? bet.goalDifference === 0 
                      ? isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                      : isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'
                    : isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {bet.totalGoals}
                  {isSettled && bet.goalDifference !== null && bet.goalDifference !== 0 && (
                    <span className="ml-1 opacity-75">±{bet.goalDifference}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Points:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  bet.totalPoints >= 7 
                    ? isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    : bet.totalPoints >= 5 
                      ? isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'
                      : bet.totalPoints >= 3 
                        ? isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'
                        : isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {bet.totalPoints}/{schedule.matches.filter(m => m.isCompleted).length || 9}
                </span>
              </div>
            </div>

            {/* Predictions grid */}
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-1">
              {schedule.matches.map((match, matchIndex) => {
                const prediction = findPrediction(bet.predictions, match._id)
                return (
                  <div key={match._id} className="text-center">
                    <span className={`text-[10px] block mb-0.5 font-medium ${
                      match.isCompleted 
                        ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                        : isDark ? 'text-dark-500' : 'text-gray-400'
                    }`}>
                      M{matchIndex + 1}{match.isCompleted && '✓'}
                    </span>
                    <span className={`inline-flex items-center justify-center w-7 h-6 rounded text-[10px] font-medium ${getPredictionClass(prediction, match)}`}>
                      {prediction ? getPredictionDisplay(prediction, match) : '-'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend - AWS style */}
      <div className={`p-4 rounded-lg border ${
        isDark ? 'bg-dark-800 border-dark-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
          isDark ? 'text-dark-300' : 'text-gray-600'
        }`}>Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span>🏠</span>
            <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Home team</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✈️</span>
            <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Away team</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-5 rounded flex items-center justify-center text-[10px] font-medium ${
              isDark ? 'bg-dark-700 text-dark-200 border border-dark-600' : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              ABC
            </span>
            <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Team wins</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-5 rounded flex items-center justify-center text-[10px] font-medium ${
              isDark ? 'bg-dark-700 text-dark-200 border border-dark-600' : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              E
            </span>
            <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Draw</span>
          </div>
          {hasCompletedMatches && (
            <>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-5 rounded flex items-center justify-center text-[10px] font-medium ${
                  isDark ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  ✓
                </span>
                <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-5 rounded flex items-center justify-center text-[10px] font-medium ${
                  isDark ? 'bg-red-900/30 text-red-400 border border-red-800/50' : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                  ✗
                </span>
                <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Wrong</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
