import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'
import QuinielaTable from '../components/QuinielaTable'

export default function Dashboard() {
  const [schedule, setSchedule] = useState(null)
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [lockStatus, setLockStatus] = useState({
    isBettingLocked: false,
    hasStarted: false,
    lockoutTime: null
  })
  const [isSettled, setIsSettled] = useState(false)
  const [weekInfo, setWeekInfo] = useState({ weekNumber: 0, year: 0 })
  const { isDark } = useTheme()

  useEffect(() => {
    fetchData()
    // Refresh every minute to update lock status
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [scheduleRes, betsRes] = await Promise.all([
        api.get('/schedule/current'),
        api.get('/bets/current')
      ])

      setSchedule(scheduleRes.data.schedule)
      setBets(betsRes.data.bets)
      setIsSettled(betsRes.data.isSettled)
      setLockStatus({
        isBettingLocked: scheduleRes.data.isBettingLocked,
        hasStarted: scheduleRes.data.hasStarted,
        lockoutTime: scheduleRes.data.lockoutTime
      })
      setWeekInfo({
        weekNumber: scheduleRes.data.weekNumber,
        year: scheduleRes.data.year
      })
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('No schedule found for this week')
      } else {
        toast.error('Failed to load data')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeUntilLockout = () => {
    if (!lockStatus.lockoutTime) return null
    const now = new Date()
    const lockout = new Date(lockStatus.lockoutTime)
    const diff = lockout - now
    
    if (diff <= 0) return null

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-dark-300' : 'text-light-600'}`}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold flex items-center gap-2 ${
              isDark ? 'text-gradient' : 'text-light-900'
            }`}>
              <span>🏟️</span> Quiniela Dashboard
            </h1>
            <p className={`mt-1 text-sm sm:text-base flex items-center gap-2 ${
              isDark ? 'text-dark-300' : 'text-light-600'
            }`}>
              <span>🇲🇽</span> Liga MX - Week {weekInfo.weekNumber}, {weekInfo.year}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Lock Status Badge */}
            {lockStatus.isBettingLocked ? (
              <div className={`flex items-center justify-center px-4 py-2.5 rounded-xl border ${
                isDark 
                  ? 'bg-red-900/30 text-red-400 border-red-700/50' 
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}>
                <span className="mr-2">🔒</span>
                <span className="font-medium text-sm sm:text-base">Betting Closed</span>
              </div>
            ) : (
              <div className={`flex items-center justify-center px-4 py-2.5 rounded-xl border ${
                isDark 
                  ? 'bg-sports-green/10 text-sports-green border-sports-green/30' 
                  : 'bg-green-50 text-green-600 border-green-200'
              }`}>
                <span className="mr-2">🔓</span>
                <span className="font-medium text-sm sm:text-base">
                  Open {getTimeUntilLockout() && <span className="hidden sm:inline">({getTimeUntilLockout()} left)</span>}
                </span>
              </div>
            )}

            {!lockStatus.isBettingLocked && (
              <Link
                to="/place-bet"
                className="btn-accent flex items-center justify-center gap-2 py-2.5"
              >
                <span>📝</span>
                <span>Place Bet</span>
              </Link>
            )}
          </div>
        </div>
        
        {/* Mobile countdown */}
        {!lockStatus.isBettingLocked && getTimeUntilLockout() && (
          <div className={`sm:hidden text-center text-sm ${isDark ? 'text-dark-400' : 'text-light-600'}`}>
            ⏰ {getTimeUntilLockout()} remaining
          </div>
        )}
      </div>

      {/* Schedule Overview */}
      {schedule && (
        <div className={`rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-dark-800/90 to-dark-900/95 border border-dark-700/50 shadow-card' 
            : 'bg-white border border-light-300 shadow-card-light'
        }`}>
          <h2 className={`text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 ${
            isDark ? 'text-dark-100' : 'text-light-900'
          }`}>
            <span>🇲🇽</span> This Week's Matches
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {schedule.matches.map((match, index) => (
              <div
                key={match._id}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  match.isCompleted
                    ? isDark 
                      ? 'border-sports-green/30 bg-sports-green/5' 
                      : 'border-green-300 bg-green-50'
                    : isDark 
                      ? 'border-dark-600/50 bg-dark-700/30' 
                      : 'border-light-300 bg-light-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${isDark ? 'text-dark-400' : 'text-light-600'}`}>
                    Match {index + 1}
                  </span>
                  {match.isCompleted && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isDark 
                        ? 'bg-sports-green/20 text-sports-green' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      ✓ Final
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <p className={`font-bold text-sm sm:text-base ${isDark ? 'text-dark-100' : 'text-light-900'}`}>
                    {match.teamA}
                  </p>
                  <p className={`text-xs my-1 ${isDark ? 'text-dark-400' : 'text-light-500'}`}>vs</p>
                  <p className={`font-bold text-sm sm:text-base ${isDark ? 'text-dark-100' : 'text-light-900'}`}>
                    {match.teamB}
                  </p>
                  {match.isCompleted ? (
                    <p className={`text-xl sm:text-2xl font-bold mt-2 ${
                      isDark ? 'text-sports-green' : 'text-green-600'
                    }`}>
                      {match.scoreTeamA} - {match.scoreTeamB}
                    </p>
                  ) : (
                    <p className={`text-xs sm:text-sm mt-2 ${isDark ? 'text-dark-400' : 'text-light-600'}`}>
                      {formatDate(match.startTime)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {isSettled && schedule.actualTotalGoals !== null && (
            <div className={`mt-4 sm:mt-6 p-4 rounded-xl border ${
              isDark 
                ? 'bg-gradient-to-r from-sports-gold/10 to-sports-gold/5 border-sports-gold/30' 
                : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
            }`}>
              <p className={`text-center text-base sm:text-lg font-bold flex items-center justify-center gap-2 ${
                isDark ? 'text-sports-gold' : 'text-amber-600'
              }`}>
                <span>⚽</span> Total Goals This Week: {schedule.actualTotalGoals}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quiniela Table */}
      {schedule && (
        <div className={`rounded-2xl p-4 sm:p-6 transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-dark-800/90 to-dark-900/95 border border-dark-700/50 shadow-card' 
            : 'bg-white border border-light-300 shadow-card-light'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
            <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${
              isDark ? 'text-dark-100' : 'text-light-900'
            }`}>
              <span>🏆</span> Quiniela Standings
            </h2>
            <span className={`text-sm ${isDark ? 'text-dark-400' : 'text-light-600'}`}>
              {bets.length} participant{bets.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <QuinielaTable 
            bets={bets} 
            schedule={schedule} 
            isSettled={isSettled}
            hasStarted={lockStatus.hasStarted}
          />
        </div>
      )}

      {!schedule && (
        <div className={`rounded-2xl p-4 sm:p-6 text-center py-8 sm:py-12 ${
          isDark 
            ? 'bg-gradient-to-br from-dark-800/90 to-dark-900/95 border border-dark-700/50' 
            : 'bg-white border border-light-300 shadow-card-light'
        }`}>
          <span className="text-5xl sm:text-6xl mb-4 block">📅</span>
          <h2 className={`text-lg sm:text-xl font-bold mb-2 ${isDark ? 'text-dark-100' : 'text-light-900'}`}>
            No Schedule Available
          </h2>
          <p className={`text-sm sm:text-base ${isDark ? 'text-dark-400' : 'text-light-600'}`}>
            The Liga MX schedule for this week hasn't been created yet.
          </p>
        </div>
      )}
    </div>
  )
}
