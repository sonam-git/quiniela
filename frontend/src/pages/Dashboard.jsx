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
          <div className={`animate-spin rounded-full h-8 w-8 border-2 mx-auto ${
            isDark ? 'border-emerald-500 border-t-transparent' : 'border-emerald-600 border-t-transparent'
          }`} />
          <p className={`mt-3 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Dashboard
              </h1>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                Liga MX · Week {weekInfo.weekNumber}, {weekInfo.year}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Badge */}
              {lockStatus.isBettingLocked ? (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isDark 
                    ? 'bg-red-900/30 text-red-400 border border-red-800/50' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Betting closed
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isDark 
                    ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Open {getTimeUntilLockout() && `· ${getTimeUntilLockout()}`}
                </span>
              )}

              {!lockStatus.isBettingLocked && (
                <Link
                  to="/place-bet"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Place bet
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {schedule && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                Matches
              </p>
              <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {schedule.matches.length}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                Completed
              </p>
              <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {schedule.matches.filter(m => m.isCompleted).length}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                Participants
              </p>
              <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {bets.length}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                Total Goals
              </p>
              <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {schedule.actualTotalGoals ?? '—'}
              </p>
            </div>
          </div>
        )}

        {/* Matches Section */}
        {schedule && (
          <div className={`rounded-lg border mb-6 ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`px-4 py-3 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                This Week's Matches
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {schedule.matches.map((match, index) => (
                  <div
                    key={match._id}
                    className={`p-3 rounded-lg border ${
                      match.isCompleted
                        ? isDark 
                          ? 'border-emerald-800/50 bg-emerald-900/20' 
                          : 'border-emerald-200 bg-emerald-50'
                        : isDark 
                          ? 'border-dark-600 bg-dark-700/50' 
                          : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-medium uppercase tracking-wide ${
                        isDark ? 'text-dark-400' : 'text-gray-500'
                      }`}>
                        Match {index + 1}
                      </span>
                      {match.isCompleted && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          Final
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${isDark ? 'text-dark-100' : 'text-gray-900'}`}>
                        <span className="text-xs mr-1" title="Home">🏠</span>
                        {match.teamA}
                      </p>
                      <p className={`text-[10px] my-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>vs</p>
                      <p className={`text-sm font-medium ${isDark ? 'text-dark-100' : 'text-gray-900'}`}>
                        <span className="text-xs mr-1" title="Away">✈️</span>
                        {match.teamB}
                      </p>
                      {match.isCompleted ? (
                        <p className={`text-lg font-bold mt-2 ${
                          isDark ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          {match.scoreTeamA} – {match.scoreTeamB}
                        </p>
                      ) : (
                        <p className={`text-xs mt-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          {formatDate(match.startTime)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Standings Section */}
        {schedule && (
          <div className={`rounded-lg border ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`px-4 py-3 border-b flex items-center justify-between ${
              isDark ? 'border-dark-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Standings
              </h2>
              <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                {bets.length} participant{bets.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="p-4">
              <QuinielaTable 
                bets={bets} 
                schedule={schedule} 
                isSettled={isSettled}
                hasStarted={lockStatus.hasStarted}
              />
            </div>
          </div>
        )}

        {!schedule && (
          <div className={`rounded-lg border p-8 text-center ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
              isDark ? 'bg-dark-700' : 'bg-gray-100'
            }`}>
              <span className="text-2xl">📅</span>
            </div>
            <h2 className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              No schedule available
            </h2>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              The schedule for this week hasn't been created yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
