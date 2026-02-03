import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import QuinielaTable from '../components/QuinielaTable'
import { BetIcon } from '../components/Navbar'

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
  const [announcements, setAnnouncements] = useState([])
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(() => {
    const saved = localStorage.getItem('dismissedAnnouncements')
    return saved ? JSON.parse(saved) : []
  })
  const { isDark } = useTheme()
  const { user } = useAuth()

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [scheduleRes, betsRes, announcementsRes] = await Promise.all([
        api.get('/schedule/current'),
        api.get('/bets/current'),
        api.get('/announcements')
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
      setAnnouncements(announcementsRes.data.announcements || [])
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

  const dismissAnnouncement = (id) => {
    const updated = [...dismissedAnnouncements, id]
    setDismissedAnnouncements(updated)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(updated))
  }

  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.includes(a._id))

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
        {/* Announcements Banner */}
        {visibleAnnouncements.length > 0 && (
          <div className="mb-6 space-y-3">
            {visibleAnnouncements.map((announcement) => (
              <div
                key={announcement._id}
                className={`relative overflow-hidden rounded-xl border ${
                  isDark 
                    ? 'bg-gradient-to-r from-emerald-900/20 via-dark-800 to-dark-800 border-emerald-800/30' 
                    : 'bg-gradient-to-r from-emerald-50 via-white to-white border-emerald-200'
                }`}
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'
                  }`}>
                    <span className="text-xl">📢</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {announcement.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        New
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                      {announcement.message}
                    </p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                      Posted {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {/* Dismiss Button */}
                  <button
                    onClick={() => dismissAnnouncement(announcement._id)}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                      isDark 
                        ? 'text-dark-400 hover:text-dark-200 hover:bg-dark-700' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Decorative accent */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  isDark ? 'bg-emerald-500' : 'bg-emerald-500'
                }`} />
              </div>
            ))}
          </div>
        )}

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

                  {!lockStatus.isBettingLocked && (
                    <Link
                      to="/place-bet"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <BetIcon /> {bets.some(bet => bet.userId?._id === user?._id || bet.userId === user?._id) ? 'Update' : 'Predict Now'}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

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
                      ? 'text-dark-100 hover:text-yellow-300 hover:bg-dark-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Standing</span>
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'matches'
                    ? isDark
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-white text-gray-900 shadow-md'
                    : isDark
                      ? 'text-dark-100 hover:text-yellow-300 hover:bg-dark-700/50'
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
                      ? 'text-dark-100 hover:text-yellow-300 hover:bg-dark-700/50'
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
          <div className={`rounded-2xl border shadow-lg overflow-hidden ${
            isDark ? 'bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
          }`}>
            {/* Header */}
            <div className={`px-6 py-5 border-b ${
              isDark ? 'border-dark-700 bg-dark-800/50' : 'border-gray-100 bg-white/80'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    isDark ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                  } shadow-lg`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      This Week's Matches
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      Liga MX Matchday Schedule
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {schedule.matches.filter(m => m.isCompleted).length}/{schedule.matches.length} completed
                  </div>
                </div>
              </div>
            </div>

            {/* Match Grid */}
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {schedule.matches.map((match, index) => (
                  <div
                    key={match._id}
                    className={`group relative rounded-xl border transition-all duration-300 overflow-hidden ${
                      match.isCompleted
                        ? isDark 
                          ? 'border-emerald-700/40 bg-gradient-to-br from-emerald-900/30 to-dark-800 hover:border-emerald-600/50 hover:shadow-emerald-900/20 hover:shadow-lg' 
                          : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300 hover:shadow-emerald-100 hover:shadow-lg'
                        : isDark 
                          ? 'border-dark-600 bg-gradient-to-br from-dark-700/80 to-dark-800 hover:border-indigo-600/50 hover:shadow-indigo-900/20 hover:shadow-lg' 
                          : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-indigo-200 hover:shadow-indigo-100 hover:shadow-lg'
                    }`}
                  >
                    {/* Match Number & Status Bar */}
                    <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
                      match.isCompleted
                        ? isDark ? 'border-emerald-800/40 bg-emerald-900/20' : 'border-emerald-100 bg-emerald-50/50'
                        : isDark ? 'border-dark-600 bg-dark-700/50' : 'border-gray-100 bg-gray-50/50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          match.isCompleted
                            ? isDark ? 'bg-emerald-800/50 text-emerald-300' : 'bg-emerald-200 text-emerald-800'
                            : isDark ? 'bg-indigo-800/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {index + 1}
                        </span>
                        <span className={`text-xs font-medium uppercase tracking-wide ${
                          isDark ? 'text-dark-400' : 'text-gray-500'
                        }`}>
                          Match
                        </span>
                      </div>
                      {match.isCompleted ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          isDark ? 'bg-emerald-800/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Final
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          Upcoming
                        </span>
                      )}
                    </div>

                    {/* Match Content */}
                    <div className="p-4 space-y-3">
                      {/* Home Team */}
                      <div className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                        isDark ? 'bg-dark-700/50 hover:bg-dark-700' : 'bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm ${
                          isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600'
                        }`}>
                          🏠
                        </div>
                        <span className={`flex-1 text-sm font-semibold truncate ${isDark ? 'text-dark-100' : 'text-gray-800'}`}>
                          {match.teamA}
                        </span>
                        {match.isCompleted && (
                          <span className={`text-lg font-bold min-w-[2rem] text-center ${
                            isDark ? 'text-emerald-400' : 'text-emerald-600'
                          }`}>
                            {match.scoreTeamA}
                          </span>
                        )}
                      </div>

                      {/* VS Divider */}
                      <div className="flex items-center justify-center">
                        {match.isCompleted ? (
                          <div className={`w-full h-px ${isDark ? 'bg-dark-600' : 'bg-gray-200'}`}></div>
                        ) : (
                          <div className="flex items-center gap-2 w-full">
                            <div className={`flex-1 h-px ${isDark ? 'bg-dark-600' : 'bg-gray-200'}`}></div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              isDark ? 'bg-dark-600 text-dark-300' : 'bg-gray-200 text-gray-500'
                            }`}>VS</span>
                            <div className={`flex-1 h-px ${isDark ? 'bg-dark-600' : 'bg-gray-200'}`}></div>
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                        isDark ? 'bg-dark-700/50 hover:bg-dark-700' : 'bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm ${
                          isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-600'
                        }`}>
                          ✈️
                        </div>
                        <span className={`flex-1 text-sm font-semibold truncate ${isDark ? 'text-dark-100' : 'text-gray-800'}`}>
                          {match.teamB}
                        </span>
                        {match.isCompleted && (
                          <span className={`text-lg font-bold min-w-[2rem] text-center ${
                            isDark ? 'text-emerald-400' : 'text-emerald-600'
                          }`}>
                            {match.scoreTeamB}
                          </span>
                        )}
                      </div>

                      {/* Match Time (for upcoming matches) */}
                      {!match.isCompleted && (
                        <div className={`flex items-center justify-center gap-2 pt-2 mt-2 border-t ${
                          isDark ? 'border-dark-600' : 'border-gray-200'
                        }`}>
                          <svg className={`w-3.5 h-3.5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={`text-xs font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                            {formatDate(match.startTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Info */}
            <div className={`px-6 py-4 border-t ${
              isDark ? 'border-dark-700 bg-dark-800/30' : 'border-gray-100 bg-gray-50/50'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  <span className="font-medium">Tip:</span> Make your predictions before matches begin!
                </p>
                <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Upcoming
                  </span>
                </div>
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
                <span>🏆</span> Jornada {weekInfo.weekNumber} Standing
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
