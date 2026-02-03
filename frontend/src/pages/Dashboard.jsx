import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import QuinielaTable from '../components/QuinielaTable'

export default function Dashboard() {
  const [schedule, setSchedule] = useState(null)
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lockStatus, setLockStatus] = useState({
    isBettingLocked: false,
    hasStarted: false,
    lockoutTime: null
  })
  const [isSettled, setIsSettled] = useState(false)
  const [weekInfo, setWeekInfo] = useState({ weekNumber: 0, year: 0 })
  const [activeTab, setActiveTab] = useState('standings')
  const { isDark } = useTheme()

  const fetchData = useCallback(async () => {
    try {
      setError(null)
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
        setError({
          type: 'not_found',
          title: 'No Schedule Available',
          message: 'The schedule for this week hasn\'t been created yet. Please check back later.'
        })
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setError({
          type: 'network',
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your internet connection and try again.'
        })
      } else {
        setError({
          type: 'server',
          title: 'Failed to Load Data',
          message: 'Something went wrong while loading the data. Please try again later.'
        })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

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

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return { days, hours, minutes, seconds }
  }

  // Update countdown every second
  const [countdown, setCountdown] = useState(getTimeUntilLockout())
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilLockout())
    }, 1000)
    return () => clearInterval(timer)
  }, [lockStatus.lockoutTime])

  // Calculate current leader based on points and goals difference tiebreaker
  const getCurrentLeader = () => {
    if (!schedule || !bets || bets.length === 0) return null
    
    const completedMatches = schedule.matches.filter(m => m.isCompleted).length
    if (completedMatches === 0) return null
    
    const actualTotalGoals = schedule.actualTotalGoals ?? 0
    
    // Calculate points and goals difference for each bet
    const betsWithStats = bets.map(bet => {
      let points = 0
      
      schedule.matches.forEach(match => {
        if (!match.isCompleted) return
        
        const prediction = bet.predictions?.find(p => p.matchId === match._id)
        if (!prediction) return
        
        const actualResult = match.scoreTeamA > match.scoreTeamB ? 'L' 
          : match.scoreTeamA < match.scoreTeamB ? 'V' 
          : 'E'
        
        if (prediction.prediction === actualResult) {
          points += 1
        }
      })
      
      const goalsDiff = Math.abs((bet.totalGoalsPrediction || 0) - actualTotalGoals)
      
      return {
        ...bet,
        totalPoints: points,
        goalsDifference: goalsDiff
      }
    })
    
    // Sort by points (desc), then by goals difference (asc)
    betsWithStats.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints
      }
      return a.goalsDifference - b.goalsDifference
    })
    
    // Only return a leader if they have at least 1 point
    const topBet = betsWithStats[0]
    if (!topBet || topBet.totalPoints === 0) {
      return null
    }
    
    return topBet
  }

  const currentLeader = getCurrentLeader()
  const completedMatchesCount = schedule?.matches?.filter(m => m.isCompleted).length || 0

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

  if (error) {
    const errorIcons = {
      not_found: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      network: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
        </svg>
      ),
      server: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }

    const errorColors = {
      not_found: {
        icon: isDark ? 'text-amber-400' : 'text-amber-500',
        bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50',
        border: isDark ? 'border-amber-800/50' : 'border-amber-200'
      },
      network: {
        icon: isDark ? 'text-blue-400' : 'text-blue-500',
        bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
        border: isDark ? 'border-blue-800/50' : 'border-blue-200'
      },
      server: {
        icon: isDark ? 'text-red-400' : 'text-red-500',
        bg: isDark ? 'bg-red-900/20' : 'bg-red-50',
        border: isDark ? 'border-red-800/50' : 'border-red-200'
      }
    }

    const colors = errorColors[error.type] || errorColors.server

    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className={`rounded-xl border p-8 text-center ${colors.bg} ${colors.border}`}>
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-5 ${
              isDark ? 'bg-dark-800' : 'bg-white'
            }`}>
              <span className={colors.icon}>
                {errorIcons[error.type] || errorIcons.server}
              </span>
            </div>
            
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {error.title}
            </h2>
            
            <p className={`text-sm mb-6 ${isDark ? 'text-dark-400' : 'text-gray-600'}`}>
              {error.message}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setLoading(true)
                  fetchData()
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
              
              <Link
                to="/instructions"
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-dark-700 hover:bg-dark-600 text-white border border-dark-600'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How to Play
              </Link>
            </div>
          </div>
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
              <h1 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                  <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                  <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                </svg>
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
                <div className="flex items-center gap-3">
                  {/* Live Status Indicator */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                    isDark 
                      ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    LIVE
                  </span>

                  {/* Countdown Clock */}
                  {countdown && (
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                      isDark 
                        ? 'bg-dark-700 border border-dark-600' 
                        : 'bg-white border border-gray-200 shadow-sm'
                    }`}>
                      <svg className={`w-3.5 h-3.5 mr-1 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {countdown.days > 0 && (
                        <>
                          <div className="text-center">
                            <span className={`text-sm font-mono font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {String(countdown.days).padStart(2, '0')}
                            </span>
                            <span className={`text-[9px] uppercase ml-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>d</span>
                          </div>
                          <span className={`text-sm font-bold ${isDark ? 'text-dark-500' : 'text-gray-300'}`}>:</span>
                        </>
                      )}
                      <div className="text-center">
                        <span className={`text-sm font-mono font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {String(countdown.hours).padStart(2, '0')}
                        </span>
                        <span className={`text-[9px] uppercase ml-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>h</span>
                      </div>
                      <span className={`text-sm font-bold animate-pulse ${isDark ? 'text-dark-500' : 'text-gray-300'}`}>:</span>
                      <div className="text-center">
                        <span className={`text-sm font-mono font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {String(countdown.minutes).padStart(2, '0')}
                        </span>
                        <span className={`text-[9px] uppercase ml-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>m</span>
                      </div>
                      <span className={`text-sm font-bold animate-pulse ${isDark ? 'text-dark-500' : 'text-gray-300'}`}>:</span>
                      <div className="text-center">
                        <span className={`text-sm font-mono font-bold tabular-nums ${
                          countdown.hours === 0 && countdown.minutes < 10 
                            ? 'text-red-500' 
                            : isDark ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          {String(countdown.seconds).padStart(2, '0')}
                        </span>
                        <span className={`text-[9px] uppercase ml-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>s</span>
                      </div>
                    </div>
                  )}
                </div>
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

        {/* Current Leader Section */}
        {schedule && bets.length > 0 && (
          <div className={`mb-6 p-4 rounded-xl border ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-amber-900/30' : 'bg-amber-100'
                }`}>
                  <span className="text-xl">👑</span>
                </div>
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    Current Leader
                  </p>
                  {completedMatchesCount > 0 && currentLeader ? (
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {currentLeader.userId?.name || currentLeader.userName || 'Unknown'}
                    </p>
                  ) : (
                    <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      The leader will display only after the completion of first game
                    </p>
                  )}
                </div>
              </div>
              {completedMatchesCount > 0 && currentLeader && (
                <div className="text-right">
                  <div className={`flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <span className="text-2xl font-bold">{currentLeader.totalPoints}</span>
                    <span className="text-xs font-medium">pts</span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    {completedMatchesCount}/{schedule.matches.length} matches
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        {schedule && (
          <div className="mb-6">
            <div className={`grid grid-cols-3 gap-2 p-1.5 rounded-xl ${
              isDark ? 'bg-dark-800' : 'bg-gray-100'
            }`}>
              <button
                onClick={() => setActiveTab('standings')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'standings'
                    ? isDark
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-white text-gray-900 shadow-md'
                    : isDark
                      ? 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Standings</span>
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'matches'
                    ? isDark
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-white text-gray-900 shadow-md'
                    : isDark
                      ? 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Schedule</span>
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'stats'
                    ? isDark
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-white text-gray-900 shadow-md'
                    : isDark
                      ? 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <span>Stats</span>
              </button>
            </div>
          </div>
        )}

        {/* Stats Tab Content */}
        {activeTab === 'stats' && schedule && (
          <div className={`rounded-xl border ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDark ? 'border-dark-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span>📊</span> Week {weekInfo.weekNumber} Statistics
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-xl border ${
                  isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                  }`}>
                    <svg className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    Total Matches
                  </p>
                  <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {schedule.matches.length}
                  </p>
                </div>
                <div className={`p-5 rounded-xl border ${
                  isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'
                  }`}>
                    <svg className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    Completed
                  </p>
                  <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {schedule.matches.filter(m => m.isCompleted).length}
                  </p>
                </div>
                <div className={`p-5 rounded-xl border ${
                  isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                  }`}>
                    <svg className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    Participants
                  </p>
                  <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {bets.length}
                  </p>
                </div>
                <div className={`p-5 rounded-xl border ${
                  isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    isDark ? 'bg-amber-900/30' : 'bg-amber-100'
                  }`}>
                    <svg className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    Total Goals
                  </p>
                  <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {schedule.actualTotalGoals ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Match Schedule Tab Content */}
        {activeTab === 'matches' && schedule && (
          <div className={`rounded-xl border ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDark ? 'border-dark-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span>📅</span> This Week's Matches
              </h2>
              <span className={`text-sm px-2.5 py-1 rounded-full ${
                isDark ? 'bg-dark-600 text-dark-300' : 'bg-gray-100 text-gray-600'
              }`}>
                {schedule.matches.filter(m => m.isCompleted).length}/{schedule.matches.length} completed
              </span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedule.matches.map((match, index) => (
                  <div
                    key={match._id}
                    className={`p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
                      match.isCompleted
                        ? isDark 
                          ? 'border-emerald-800/50 bg-emerald-900/20' 
                          : 'border-emerald-200 bg-emerald-50'
                        : isDark 
                          ? 'border-dark-600 bg-dark-700/50 hover:border-dark-500' 
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${
                        isDark ? 'text-dark-400' : 'text-gray-500'
                      }`}>
                        Match {index + 1}
                      </span>
                      {match.isCompleted ? (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          ✓ Final
                        </span>
                      ) : (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'
                        }`}>
                          Upcoming
                        </span>
                      )}
                    </div>
                    <div className="text-center space-y-2">
                      <div className={`flex items-center justify-center gap-2 ${isDark ? 'text-dark-100' : 'text-gray-900'}`}>
                        <span className="text-sm" title="Home">🏠</span>
                        <p className="text-sm font-semibold">{match.teamA}</p>
                      </div>
                      {match.isCompleted ? (
                        <p className={`text-2xl font-bold py-1 ${
                          isDark ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          {match.scoreTeamA} – {match.scoreTeamB}
                        </p>
                      ) : (
                        <p className={`text-sm font-medium py-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                          VS
                        </p>
                      )}
                      <div className={`flex items-center justify-center gap-2 ${isDark ? 'text-dark-100' : 'text-gray-900'}`}>
                        <span className="text-sm" title="Away">✈️</span>
                        <p className="text-sm font-semibold">{match.teamB}</p>
                      </div>
                      {!match.isCompleted && (
                        <p className={`text-xs pt-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
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

        {/* Standings Tab Content */}
        {activeTab === 'standings' && schedule && (
          <div className={`rounded-xl border ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDark ? 'border-dark-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span>🏆</span> Jornada {weekInfo.weekNumber} Standings
              </h2>
              <span className={`text-sm flex items-center gap-1.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                <span>👥</span> {bets.length} participant{bets.length !== 1 ? 's' : ''}
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
