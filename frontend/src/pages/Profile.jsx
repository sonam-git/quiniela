import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

// Icons
const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const TrophyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const GoalIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const PaymentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

// Confirm Modal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, isDark, isLoading }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-sm rounded-xl shadow-2xl border ${
        isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
      }`}>
        <div className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-red-500/20' : 'bg-red-100'
            }`}>
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                {message}
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-dark-700 text-gray-300 hover:bg-dark-600 border border-dark-600' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [myBet, setMyBet] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [weekInfo, setWeekInfo] = useState({ weekNumber: 0, year: 0 })
  const [lockStatus, setLockStatus] = useState({ locked: false })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [betRes, scheduleRes] = await Promise.all([
        api.get('/bets/my/current'),
        api.get('/schedule/current')
      ])
      
      setMyBet(betRes.data.bet)
      setWeekInfo({ 
        weekNumber: betRes.data.weekNumber, 
        year: betRes.data.year 
      })
      setLockStatus({ locked: betRes.data.locked })
      setSchedule(scheduleRes.data.schedule)
    } catch (error) {
      console.error('Error fetching profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBet = async () => {
    try {
      setDeleting(true)
      await api.delete('/bets/my/current')
      toast.success('Prediction deleted successfully')
      setMyBet(null)
      setShowDeleteModal(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete prediction')
    } finally {
      setDeleting(false)
    }
  }

  const calculateStats = () => {
    if (!myBet || !schedule) return { correctPredictions: 0, totalPoints: 0, completedMatches: 0, accuracy: 0 }
    
    let correctPredictions = 0
    let completedMatches = 0
    
    schedule.matches?.forEach(match => {
      if (!match.isCompleted) return
      completedMatches++
      
      const prediction = myBet.predictions?.find(p => p.matchId === match._id)
      if (!prediction) return
      
      const actualResult = match.scoreTeamA > match.scoreTeamB ? 'teamA' 
        : match.scoreTeamA < match.scoreTeamB ? 'teamB' 
        : 'draw'
      
      if (prediction.prediction === actualResult) {
        correctPredictions++
      }
    })

    const accuracy = completedMatches > 0 ? Math.round((correctPredictions / completedMatches) * 100) : 0
    
    return { correctPredictions, totalPoints: correctPredictions, completedMatches, accuracy }
  }

  const getPredictionLabel = (prediction) => {
    switch (prediction) {
      case 'teamA': return 'L'
      case 'teamB': return 'V'
      case 'draw': return 'E'
      default: return '-'
    }
  }

  const getPredictionStatus = (matchId) => {
    if (!schedule || !myBet) return null
    
    const match = schedule.matches?.find(m => m._id === matchId)
    if (!match?.isCompleted) return null
    
    const prediction = myBet.predictions?.find(p => p.matchId === matchId)
    if (!prediction) return null
    
    const actualResult = match.scoreTeamA > match.scoreTeamB ? 'teamA' 
      : match.scoreTeamA < match.scoreTeamB ? 'teamB' 
      : 'draw'
    
    return prediction.prediction === actualResult ? 'correct' : 'incorrect'
  }

  const stats = calculateStats()

  const { t } = useTranslation('profile')

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-10 w-10 border-2 mx-auto ${
            isDark ? 'border-emerald-500 border-t-transparent' : 'border-emerald-600 border-t-transparent'
          }`} />
          <p className={`mt-4 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-1.5 transition-colors ${
                  isDark ? 'text-dark-400 hover:text-emerald-400' : 'text-gray-500 hover:text-emerald-600'
                }`}
              >
                <BackIcon />
                <span>{t('breadcrumb.dashboard')}</span>
              </Link>
            </li>
            <li className={isDark ? 'text-dark-600' : 'text-gray-300'}>/</li>
            <li className={isDark ? 'text-white' : 'text-gray-900'}>{t('breadcrumb.profile')}</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-brand ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('title')}
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            {t('subtitle')}
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* User Profile Card */}
            <div className={`rounded-xl border overflow-hidden ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              {/* Header Banner */}
              <div className="h-24 bg-gradient-to-r from-gray-500 via-emerald-600 to-gray-600 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
              </div>
              
              <div className="px-5 pb-5 relative">
                {/* Avatar */}
                <div className="absolute -top-12 left-5">
                  <div className={`w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg ring-4 ${
                    isDark ? 'ring-dark-800' : 'ring-white'
                  }`}>
                    <span className="text-white font-bold text-3xl">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Spacer for avatar */}
                <div className="h-10"></div>

                {/* User Info */}
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : 'User'}
                </h2>
                
                <div className="mt-3 space-y-2">
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    <EmailIcon />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    <CalendarIcon />
                    <span>Week {weekInfo.weekNumber}, {weekInfo.year}</span>
                  </div>
                </div>

                {/* Payment Status */}
                <div className={`mt-4 p-3 rounded-lg flex items-center justify-between ${
                  myBet?.paid 
                    ? isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
                    : isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <PaymentIcon />
                    <span className={`text-sm font-medium ${
                      myBet?.paid 
                        ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                        : isDark ? 'text-amber-400' : 'text-amber-700'
                    }`}>
                      Payment Status
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    myBet?.paid 
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {myBet?.paid ? 'PAID' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className={`rounded-xl border p-5 ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 ${
                isDark ? 'text-dark-400' : 'text-gray-500'
              }`}>
                <ChartIcon />
                Quick Stats
              </h3>
              
              <div className="space-y-4">
                {/* Accuracy */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Accuracy</span>
                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.accuracy}%</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${stats.accuracy}%` }}
                    />
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>{t('stats.points')}</span>
                  <span className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{stats.totalPoints}</span>
                </div>

                {/* Correct */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>{t('stats.correctPredictions')}</span>
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stats.correctPredictions}/{stats.completedMatches}
                  </span>
                </div>

                {/* Goals Predicted */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>{t('stats.goalsPredicted')}</span>
                  <span className={`text-sm font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                    {myBet?.totalGoals ?? '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Predictions */}
          <div className="lg:col-span-2">
            <div className={`rounded-xl border ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              {/* Header */}
              <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'border-dark-700' : 'border-gray-200'
              }`}>
                <div>
                  <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('predictions.title')}
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    {t('predictions.weekMatches', { week: weekInfo.weekNumber, count: schedule?.matches?.length || 0 })}
                  </p>
                </div>
                
                {/* Action Buttons */}
                {myBet && (
                  <div className="flex items-center gap-2">
                    {!lockStatus.locked && (
                      <>
                        <Link
                          to="/place-bet"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                          <EditIcon />
                          <span>{t('predictions.updatePrediction')}</span>
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(true)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isDark 
                              ? 'text-red-400 hover:bg-red-500/10 border border-red-500/30' 
                              : 'text-red-600 hover:bg-red-50 border border-red-200'
                          }`}
                        >
                          <TrashIcon />
                          <span className="hidden sm:inline">{t('predictions.delete')}</span>
                        </button>
                      </>
                    )}
                    {lockStatus.locked && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        isDark ? 'bg-dark-700 text-dark-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        🔒 {t('predictions.locked')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              {myBet && schedule?.matches ? (
                <div className="p-4 sm:p-5">
                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <div className={`p-3 rounded-lg text-center ${
                      isDark ? 'bg-dark-700/50 border border-dark-600' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                        isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                      }`}>
                        <TrophyIcon />
                      </div>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalPoints}</p>
                      <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Points</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${
                      isDark ? 'bg-dark-700/50 border border-dark-600' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                        isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                      }`}>
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.correctPredictions}</p>
                      <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Correct</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${
                      isDark ? 'bg-dark-700/50 border border-dark-600' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                        isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                      }`}>
                        <GoalIcon />
                      </div>
                      <p className={`text-xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{myBet?.totalGoals ?? '-'}</p>
                      <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Goals</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${
                      isDark ? 'bg-dark-700/50 border border-dark-600' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                        isDark ? 'bg-amber-500/20' : 'bg-amber-100'
                      }`}>
                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        </svg>
                      </div>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.accuracy}%</p>
                      <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Accuracy</p>
                    </div>
                  </div>

                  {/* Predictions Table */}
                  <div className={`rounded-lg border overflow-hidden ${
                    isDark ? 'border-dark-600' : 'border-gray-200'
                  }`}>
                    {/* Table Header */}
                    <div className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ${
                      isDark ? 'bg-dark-700 text-dark-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <div className="col-span-1">#</div>
                      <div className="col-span-7 sm:col-span-8">Match</div>
                      <div className="col-span-2 sm:col-span-1 text-center">Pick</div>
                      <div className="col-span-2 text-center">Result</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-dark-600">
                      {schedule.matches.map((match, index) => {
                        const prediction = myBet.predictions?.find(p => p.matchId === match._id)
                        const status = getPredictionStatus(match._id)
                        
                        return (
                          <div 
                            key={match._id}
                            className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors ${
                              status === 'correct'
                                ? isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/50'
                                : status === 'incorrect'
                                  ? isDark ? 'bg-red-500/5' : 'bg-red-50/50'
                                  : isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'
                            }`}
                          >
                            {/* Match Number */}
                            <div className="col-span-1">
                              <span className={`text-xs font-medium ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                                {index + 1}
                              </span>
                            </div>

                            {/* Teams */}
                            <div className="col-span-7 sm:col-span-8">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {match.teamA}
                                </span>
                                <span className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>vs</span>
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {match.teamB}
                                </span>
                              </div>
                              {match.isCompleted && (
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                                  Final: {match.scoreTeamA} - {match.scoreTeamB}
                                </p>
                              )}
                            </div>

                            {/* Prediction Badge */}
                            <div className="col-span-2 sm:col-span-1 flex justify-center">
                              <span className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center ${
                                status === 'correct' 
                                  ? 'bg-emerald-500 text-white' 
                                  : status === 'incorrect'
                                    ? 'bg-red-500 text-white'
                                    : isDark 
                                      ? 'bg-dark-600 text-dark-300'
                                      : 'bg-gray-200 text-gray-600'
                              }`}>
                                {getPredictionLabel(prediction?.prediction)}
                              </span>
                            </div>

                            {/* Status */}
                            <div className="col-span-2 flex justify-center">
                              {status === 'correct' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                                  <CheckIcon />
                                  <span className="hidden sm:inline">Correct</span>
                                </span>
                              ) : status === 'incorrect' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                                  <XIcon />
                                  <span className="hidden sm:inline">Wrong</span>
                                </span>
                              ) : (
                                <span className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Total Goals Section */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`p-4 rounded-lg ${
                      isDark ? 'bg-gradient-to-r from-purple-900/30 to-purple-800/20 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                          Goals Prediction
                        </span>
                        <span className={`text-2xl font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                          {myBet.totalGoals}
                        </span>
                      </div>
                    </div>
                    
                    {schedule.actualTotalGoals !== undefined && schedule.actualTotalGoals !== null && (
                      <div className={`p-4 rounded-lg ${
                        isDark ? 'bg-dark-700/50 border border-dark-600' : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                            Actual Goals
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {schedule.actualTotalGoals}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              Math.abs(myBet.totalGoals - schedule.actualTotalGoals) === 0
                                ? 'bg-emerald-500 text-white'
                                : isDark ? 'bg-dark-600 text-dark-400' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {Math.abs(myBet.totalGoals - schedule.actualTotalGoals) === 0 ? '✓ Exact' : `±${Math.abs(myBet.totalGoals - schedule.actualTotalGoals)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty State */
                <div className="p-8 sm:p-12 text-center">
                  <div className={`w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                    isDark ? 'bg-dark-700' : 'bg-gray-100'
                  }`}>
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    No Predictions Yet
                  </h3>
                  <p className={`text-sm mb-6 max-w-sm mx-auto ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    You haven't placed any predictions for this week. Start now to compete with other players!
                  </p>
                  <Link
                    to="/place-bet"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Place Your Prediction
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteBet}
        title="Delete Prediction"
        message="This action cannot be undone. You'll need to place a new prediction."
        confirmText="Delete"
        isDark={isDark}
        isLoading={deleting}
      />
    </div>
  )
}
