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
        return 'E' // E for Empate
      default:
        return '-'
    }
  }

  // Get prediction result class (correct/incorrect) - shows for completed matches
  const getPredictionClass = (prediction, match) => {
    // If match is not completed, show neutral styling
    if (!match.isCompleted || !match.result) {
      return isDark ? 'bg-dark-600 text-dark-200' : 'bg-gray-100 text-gray-700'
    }
    
    // Match is completed - show correct/wrong styling
    if (prediction === match.result) {
      return 'bg-sports-green/20 text-sports-green font-bold border border-sports-green/30'
    }
    
    return isDark ? 'bg-red-900/30 text-red-400 border border-red-700/30' : 'bg-red-100 text-red-600 border border-red-200'
  }

  // Check if any matches are completed
  const hasCompletedMatches = schedule.matches.some(m => m.isCompleted)

  // Find prediction for a specific match
  const findPrediction = (predictions, matchId) => {
    const pred = predictions.find(p => p.matchId === matchId)
    return pred ? pred.prediction : null
  }

  if (bets.length === 0) {
    return (
      <div className={`text-center py-8 sm:py-12 rounded-xl border ${
        isDark ? 'bg-dark-700/30 border-dark-600/50' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <span className="text-4xl sm:text-5xl mb-4 block">🎯</span>
        <h3 className={`text-base sm:text-lg font-semibold mb-2 ${
          isDark ? 'text-dark-200' : 'text-gray-800'
        }`}>
          No Bets Yet
        </h3>
        <p className={`text-sm sm:text-base ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
          Be the first to place your bet this week!
        </p>
      </div>
    )
  }

  const completedMatchesCount = schedule.matches.filter(m => m.isCompleted).length
  const totalMatchesCount = schedule.matches.length

  return (
    <div>
      {/* Summary Header */}
      {hasCompletedMatches && (
        <div className={`mb-4 p-3 sm:p-4 rounded-xl border ${
          isDark ? 'bg-dark-700/30 border-dark-600/50' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span className={`text-sm font-medium ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>
                Matches Completed: {completedMatchesCount}/{totalMatchesCount}
              </span>
            </div>
            {bets.length > 0 && (
              <div className={`text-sm ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                🏆 Leader: <span className="font-bold">{bets[0]?.userId?.name || 'Unknown'}</span> with <span className="text-sports-green font-bold">{bets[0]?.totalPoints || 0}</span> pts
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className={`border-b ${
              isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <th className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-dark-300' : 'text-gray-500'
              }`}>
                #
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-dark-300' : 'text-gray-500'
              }`}>
                Name
              </th>
              <th className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-dark-300' : 'text-gray-500'
              }`}>
                Goals
              </th>
              {schedule.matches.map((match, index) => (
                <th
                  key={match._id}
                  className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[50px] ${
                    isDark ? 'text-dark-300' : 'text-gray-500'
                  }`}
                  title={`${match.teamA} vs ${match.teamB}${match.isCompleted ? ` (${match.scoreTeamA}-${match.scoreTeamB})` : ''}`}
                >
                  M{index + 1}
                  {match.isCompleted && (
                    <span className="block text-[10px] text-sports-green">✓</span>
                  )}
                </th>
              ))}
              <th className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-dark-300' : 'text-gray-500'
              }`}>
                Pts
              </th>
              <th className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-dark-300' : 'text-gray-500'
              }`}>
                Paid
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-100'}`}>
            {bets.map((bet, index) => (
              <tr
                key={bet._id}
                className={`
                  ${bet.isWinner && isSettled ? 'winner-row' : isDark ? 'hover:bg-dark-700/30' : 'hover:bg-gray-50'}
                  transition-colors
                `}
              >
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`
                    ${index === 0 && isSettled ? 'text-lg' : 'text-sm'}
                    font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}
                  `}>
                    {bet.isWinner && isSettled ? '👑' : index + 1}
                  </span>
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {bet.userId?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isDark ? 'text-dark-100' : 'text-gray-900'}`}>
                        {bet.userId?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-3 py-4 whitespace-nowrap text-center">
                  <span className={`
                    inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold
                    ${isSettled && bet.goalDifference !== null 
                      ? bet.goalDifference === 0 
                        ? 'bg-sports-green/20 text-sports-green' 
                        : 'bg-sports-blue/20 text-sports-blue'
                      : isDark ? 'bg-dark-600 text-dark-200' : 'bg-gray-100 text-gray-700'
                    }
                  `}>
                    {bet.totalGoals}
                    {isSettled && bet.goalDifference !== null && (
                      <span className="ml-1 text-xs">
                        ({bet.goalDifference === 0 ? '✓' : `±${bet.goalDifference}`})
                      </span>
                    )}
                  </span>
                </td>

                {schedule.matches.map((match) => {
                  const prediction = findPrediction(bet.predictions, match._id)
                  return (
                    <td
                      key={match._id}
                      className="px-2 py-4 whitespace-nowrap text-center"
                    >
                      <span
                        className={`
                          inline-flex items-center justify-center 
                          w-8 h-8 rounded text-xs font-bold
                          ${getPredictionClass(prediction, match)}
                        `}
                        title={`${match.teamA} vs ${match.teamB}: ${
                          prediction === 'teamA' ? match.teamA + ' wins' :
                          prediction === 'teamB' ? match.teamB + ' wins' : 'Empate (Draw)'
                        }${match.isCompleted ? ` | Result: ${match.scoreTeamA}-${match.scoreTeamB}` : ''}`}
                      >
                        {prediction ? getPredictionDisplay(prediction, match) : '-'}
                      </span>
                    </td>
                  )
                })}

                <td className="px-3 py-4 whitespace-nowrap text-center">
                  <span className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-bold
                    ${bet.totalPoints >= 7 ? 'bg-sports-green/20 text-sports-green' :
                      bet.totalPoints >= 5 ? 'bg-sports-gold/20 text-sports-gold' :
                      bet.totalPoints >= 3 ? 'bg-sports-blue/20 text-sports-blue' :
                      isDark ? 'bg-dark-600 text-dark-300' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {bet.totalPoints}/{schedule.matches.filter(m => m.isCompleted).length || 9}
                  </span>
                </td>

                <td className="px-3 py-4 whitespace-nowrap text-center">
                  {bet.paid ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sports-green/20 text-sports-green">
                      ✓ Paid
                    </span>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      isDark ? 'bg-dark-600 text-dark-400' : 'bg-gray-100 text-gray-500'
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

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {bets.map((bet, index) => (
          <div
            key={bet._id}
            className={`p-4 rounded-xl border ${
              bet.isWinner && isSettled 
                ? 'winner-row border-sports-gold/50' 
                : isDark ? 'bg-dark-700/30 border-dark-600/50' : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            {/* Header row with rank, name, and paid status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                  {bet.isWinner && isSettled ? '👑' : `#${index + 1}`}
                </span>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {bet.userId?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <span className={`ml-2 font-medium ${isDark ? 'text-dark-100' : 'text-gray-900'}`}>
                    {bet.userId?.name || 'Unknown'}
                  </span>
                </div>
              </div>
              {bet.paid ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-sports-green/20 text-sports-green">
                  ✓ Paid
                </span>
              ) : (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isDark ? 'bg-dark-600 text-dark-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  Pending
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Goals:</span>
                <span className={`
                  px-2 py-0.5 rounded-full text-sm font-bold
                  ${isSettled && bet.goalDifference !== null 
                    ? bet.goalDifference === 0 
                      ? 'bg-sports-green/20 text-sports-green' 
                      : 'bg-sports-blue/20 text-sports-blue'
                    : isDark ? 'bg-dark-600 text-dark-200' : 'bg-gray-100 text-gray-700'
                  }
                `}>
                  {bet.totalGoals}
                  {isSettled && bet.goalDifference !== null && bet.goalDifference !== 0 && (
                    <span className="ml-1 text-xs">(±{bet.goalDifference})</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Points:</span>
                <span className={`
                  px-2 py-0.5 rounded-full text-sm font-bold
                  ${bet.totalPoints >= 7 ? 'bg-sports-green/20 text-sports-green' :
                    bet.totalPoints >= 5 ? 'bg-sports-gold/20 text-sports-gold' :
                    bet.totalPoints >= 3 ? 'bg-sports-blue/20 text-sports-blue' :
                    isDark ? 'bg-dark-600 text-dark-300' : 'bg-gray-100 text-gray-600'}
                `}>
                  {bet.totalPoints}/{schedule.matches.filter(m => m.isCompleted).length || 9}
                </span>
              </div>
            </div>

            {/* Predictions grid */}
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-1">
              {schedule.matches.map((match, matchIndex) => {
                const prediction = findPrediction(bet.predictions, match._id)
                return (
                  <div
                    key={match._id}
                    className="text-center"
                  >
                    <span className={`text-[10px] block mb-0.5 ${
                      match.isCompleted ? 'text-sports-green' : isDark ? 'text-dark-500' : 'text-gray-400'
                    }`}>
                      M{matchIndex + 1}{match.isCompleted && '✓'}
                    </span>
                    <span
                      className={`
                        inline-flex items-center justify-center 
                        w-7 h-7 rounded text-[10px] font-bold
                        ${getPredictionClass(prediction, match)}
                      `}
                    >
                      {prediction ? getPredictionDisplay(prediction, match) : '-'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl border ${
        isDark ? 'bg-dark-700/30 border-dark-600/50' : 'bg-gray-50 border-gray-200'
      }`}>
        <h4 className={`text-xs sm:text-sm font-semibold mb-2 sm:mb-3 ${
          isDark ? 'text-dark-200' : 'text-gray-700'
        }`}>Legend</h4>
        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center font-bold text-[10px] ${
              isDark ? 'bg-dark-600 text-dark-200' : 'bg-gray-200 text-gray-700'
            }`}>
              ABC
            </span>
            <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Team wins</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center font-bold ${
              isDark ? 'bg-dark-600 text-dark-200' : 'bg-gray-200 text-gray-700'
            }`}>
              E
            </span>
            <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Empate (Draw)</span>
          </div>
          {hasCompletedMatches && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-sports-green/20 text-sports-green flex items-center justify-center font-bold border border-sports-green/30">
                  ✓
                </span>
                <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center font-bold border ${
                  isDark ? 'bg-red-900/30 text-red-400 border-red-700/30' : 'bg-red-100 text-red-600 border-red-200'
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
