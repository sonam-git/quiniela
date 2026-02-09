import { useState, useEffect, useTransition, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates'
import toast from 'react-hot-toast'

// Validation Modal Component
function ValidationModal({ isOpen, onClose, title, message, items, isDark, buttonText }) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl transform transition-all ${
        isDark ? 'bg-dark-800 border border-dark-700' : 'bg-white'
      }`}>
        <div className="p-6">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-amber-900/30' : 'bg-amber-100'
          }`}>
            <span className="text-3xl">⚠️</span>
          </div>
          
          {/* Title */}
          <h3 className={`text-lg font-semibold text-center mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {title}
          </h3>
          
          {/* Message */}
          <p className={`text-sm text-center mb-4 ${
            isDark ? 'text-dark-300' : 'text-gray-600'
          }`}>
            {message}
          </p>
          
          {/* Items list (missing matches) */}
          {items && items.length > 0 && (
            <div className={`max-h-40 overflow-y-auto rounded-lg p-3 mb-4 ${
              isDark ? 'bg-dark-700/50' : 'bg-gray-50'
            }`}>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={index} className={`flex items-center gap-2 text-sm ${
                    isDark ? 'text-dark-200' : 'text-gray-700'
                  }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'
                    }`}>
                      !
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            {buttonText || "Got it, I'll fix it"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PlaceBet() {
  const [schedule, setSchedule] = useState(null)
  const [weekInfo, setWeekInfo] = useState({ weekNumber: null, year: null })
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [totalGoals, setTotalGoals] = useState('0')
  const [predictions, setPredictions] = useState({})
  const [existingBet, setExistingBet] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [lockStatus, setLockStatus] = useState({
    isBettingLocked: false,
    lockoutTime: null
  })
  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    items: []
  })
  const { isDark } = useTheme()
  const { t } = useTranslation('bet')
  const navigate = useNavigate()

  const fetchData = useCallback(async () => {
    try {
      const [scheduleRes, myBetRes] = await Promise.all([
        api.get('/schedule/current'),
        api.get('/bets/my/current')
      ])

      setSchedule(scheduleRes.data.schedule)
      setWeekInfo({
        weekNumber: scheduleRes.data.weekNumber,
        year: scheduleRes.data.year
      })
      setLockStatus({
        isBettingLocked: scheduleRes.data.isBettingLocked,
        lockoutTime: scheduleRes.data.lockoutTime
      })

      if (myBetRes.data.bet) {
        setExistingBet(myBetRes.data.bet)
        setTotalGoals(myBetRes.data.bet.totalGoals.toString())
        setPaymentStatus(myBetRes.data.bet.paid ? 'paid' : 'pending')
        // Predictions will be initialized by useEffect based on existingBet
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error(t('errors.noSchedule'))
      } else {
        toast.error(t('errors.loadFailed'))
      }
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time updates for schedule changes
  useRealTimeUpdates({
    onScheduleUpdate: fetchData,
    onResultsUpdate: fetchData
  })

  // Initialize predictions with 'draw' for all matches when schedule loads
  // If user has existing bet, merge with defaults to ensure all matches have predictions
  useEffect(() => {
    if (schedule) {
      const defaultPredictions = {}
      schedule.matches.forEach(match => {
        defaultPredictions[match._id] = 'draw'
      })
      
      if (existingBet && existingBet.predictions) {
        // Merge existing predictions with defaults
        existingBet.predictions.forEach(p => {
          if (p.matchId && p.prediction) {
            defaultPredictions[p.matchId] = p.prediction
          }
        })
      }
      
      setPredictions(prev => {
        // Only update if predictions are empty or need to be merged
        if (Object.keys(prev).length === 0 || !schedule.matches.every(m => prev[m._id])) {
          return defaultPredictions
        }
        return prev
      })
    }
  }, [schedule, existingBet])

  const handlePredictionChange = (matchId, prediction) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: prediction
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!schedule) return

    // Check for missing predictions
    const missingPredictions = schedule.matches.filter(
      match => !predictions[match._id]
    )

    if (missingPredictions.length > 0) {
      const missingItems = missingPredictions.map((match, index) => {
        const matchIndex = schedule.matches.findIndex(m => m._id === match._id) + 1
        return `Match ${matchIndex}: ${match.teamA} vs ${match.teamB}`
      })
      
      setValidationModal({
        isOpen: true,
        title: t('validation.missingPredictionsTitle', 'Missing Predictions'),
        message: t('validation.missingPredictionsMessage', 'Please select a prediction for all matches before submitting.'),
        items: missingItems
      })
      return
    }

    // Check for valid total goals (must be entered and > 0, since 0 goals across 9 matches is unrealistic)
    if (totalGoals === '' || totalGoals === undefined || parseInt(totalGoals) <= 0) {
      setValidationModal({
        isOpen: true,
        title: t('validation.invalidGoalsTitle', 'Total Goals Required'),
        message: t('validation.invalidGoalsMessage', 'Please enter a valid total goals prediction (must be greater than 0). This is used as a tiebreaker.'),
        items: []
      })
      return
    }

    startTransition(async () => {
      try {
        const betData = {
          totalGoals: parseInt(totalGoals),
          paid: paymentStatus === 'paid',
          weekNumber: weekInfo.weekNumber,
          year: weekInfo.year,
          predictions: schedule.matches.map(match => ({
            matchId: match._id,
            prediction: predictions[match._id]
          }))
        }

        await api.post('/bets', betData)
        
        toast.success(existingBet ? t('success.updated') : t('success.placed'))
        navigate('/dashboard')
      } catch (error) {
        toast.error(error.response?.data?.message || t('errors.submitFailed'))
      }
    })
  }

  const closeValidationModal = () => {
    setValidationModal(prev => ({ ...prev, isOpen: false }))
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

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return { days, hours, minutes, seconds }
  }

  // Update countdown every second
  const [countdown, setCountdown] = useState(null)
  
  useEffect(() => {
    setCountdown(getTimeUntilLockout())
    const timer = setInterval(() => {
      setCountdown(getTimeUntilLockout())
    }, 1000)
    return () => clearInterval(timer)
  }, [lockStatus.lockoutTime])

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

  if (lockStatus.isBettingLocked) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className={`rounded-lg border p-8 text-center ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${
              isDark ? 'bg-red-900/30' : 'bg-red-100'
            }`}>
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('locked.title')}
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              {t('locked.message')}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              {t('locked.viewDashboard')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className={`rounded-lg border p-8 text-center ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${
              isDark ? 'bg-dark-700' : 'bg-gray-100'
            }`}>
              <span className="text-2xl">📅</span>
            </div>
            <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('errors.noSchedule')}
            </h2>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              {t('noScheduleMessage')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Count predictions that have a valid value
  const totalMatches = schedule?.matches?.length || 0
  // Check if every match has a valid prediction
  const allPredictionsMade = totalMatches > 0 && schedule?.matches?.every(match => {
    const pred = predictions[match._id]
    return pred && ['teamA', 'teamB', 'draw'].includes(pred)
  })
  const completedPredictions = schedule?.matches?.filter(match => {
    const pred = predictions[match._id]
    return pred && ['teamA', 'teamB', 'draw'].includes(pred)
  }).length || 0

  const getCorrectCount = () => {
    if (!schedule?.matches || !predictions) return 0
    return schedule.matches.filter(match => 
      match.isCompleted && match.result && predictions[match._id] === match.result
    ).length
  }

  const getPredictionResult = (match) => {
    if (!match.isCompleted || !match.result || !predictions[match._id]) return null
    return predictions[match._id] === match.result ? 'correct' : 'wrong'
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
  
          <div className="mb-6">
            <h1 className={`text-2xl font-brand flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {existingBet ? (
                <>
            <span role="img" aria-label="Edit" className="text-lg">✏️</span>
            {t('title.edit')}
                </>
              ) : (
                <>
            <span role="img" aria-label="Place Bet" className="text-lg">🎯</span>
            {t('title.place')}
                </>
              )}
            </h1>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              {t('subtitle')}
            </p>
            
            {countdown && (
              <div className={`mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
                isDark 
            ? 'bg-amber-900/30 border border-amber-800/50' 
            : 'bg-amber-50 border border-amber-200'
              }`}>
                {/* Live indicator */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              
              <span className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                {t('closesIn')}
              </span>

              {/* Clock display */}
              <div className="flex items-center gap-0.5">
                {countdown.days > 0 && (
                  <>
                    <span className={`text-sm font-mono font-bold tabular-nums ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                      {String(countdown.days).padStart(2, '0')}
                    </span>
                    <span className={`text-[9px] ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>d</span>
                    <span className={`text-sm font-bold mx-0.5 ${isDark ? 'text-amber-600' : 'text-amber-400'}`}>:</span>
                  </>
                )}
                <span className={`text-sm font-mono font-bold tabular-nums ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className={`text-[9px] ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>h</span>
                <span className={`text-sm font-bold mx-0.5 animate-pulse ${isDark ? 'text-amber-600' : 'text-amber-400'}`}>:</span>
                <span className={`text-sm font-mono font-bold tabular-nums ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
                <span className={`text-[9px] ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>m</span>
                <span className={`text-sm font-bold mx-0.5 animate-pulse ${isDark ? 'text-amber-600' : 'text-amber-400'}`}>:</span>
                <span className={`text-sm font-mono font-bold tabular-nums ${
                  countdown.hours === 0 && countdown.minutes < 10 
                    ? 'text-red-500' 
                    : isDark ? 'text-amber-300' : 'text-amber-800'
                }`}>
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
                <span className={`text-[9px] ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>s</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Total Goals */}
          <div className={`rounded-lg border p-4 ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
          }`}>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-dark-200' : 'text-gray-700'
            }`}>
              {t('form.totalGoals')}
            </label>
            <p className={`text-xs mb-3 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              {t('form.totalGoalsHint', { count: schedule.matches.length })}
            </p>
            <input
              type="number"
              value={totalGoals}
              onChange={(e) => setTotalGoals(e.target.value)}
              min="0"
              max="100"
              className={`w-24 text-center text-lg font-semibold px-3 py-2 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark 
                  ? 'bg-dark-700 border border-dark-600 text-dark-100' 
                  : 'bg-white border border-gray-300 text-gray-900'
              }`}
              placeholder="0"
              required
            />
          </div>

          {/* Match Predictions */}
          <div className={`rounded-lg border ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`px-4 py-3 border-b flex items-center justify-between ${
              isDark ? 'border-dark-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('matchPredictions')}
              </h2>
              <div className="flex items-center gap-2">
                {schedule.matches.some(m => m.isCompleted) && (
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {getCorrectCount()}/{schedule.matches.filter(m => m.isCompleted).length} {t('correct')}
                  </span>
                )}
                <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  {completedPredictions}/{totalMatches}
                </span>
              </div>
            </div>
            
            <div className="divide-y divide-dark-700">
              {schedule.matches.map((match, index) => {
                const result = getPredictionResult(match)
                return (
                  <div
                    key={match._id}
                    className={`p-4 ${
                      result === 'correct'
                        ? isDark ? 'bg-emerald-900/10' : 'bg-emerald-50'
                        : result === 'wrong'
                          ? isDark ? 'bg-red-900/10' : 'bg-red-50'
                          : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          {t('match.matchNumber', { number: index + 1 })}
                        </span>
                        {result === 'correct' && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                          }`}>✓</span>
                        )}
                        {result === 'wrong' && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700'
                          }`}>✗</span>
                        )}
                        {match.isCompleted && (
                          <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                            {match.scoreTeamA}-{match.scoreTeamB}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs hidden sm:block ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                        {formatDate(match.startTime)}
                      </span>
                    </div>

                    {/* Prediction buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handlePredictionChange(match._id, 'teamA')}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          predictions[match._id] === 'teamA'
                            ? 'bg-emerald-600 text-white'
                            : isDark 
                              ? 'bg-dark-700 border border-dark-600 text-dark-200 hover:border-dark-500' 
                              : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span className="text-xs" title="Home">🏠</span>
                          <span className="truncate">{match.teamA}</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePredictionChange(match._id, 'draw')}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          predictions[match._id] === 'draw'
                            ? 'bg-emerald-600 text-white'
                            : isDark 
                              ? 'bg-dark-700 border border-dark-600 text-dark-300 hover:border-dark-500' 
                              : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {t('form.draw')}
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePredictionChange(match._id, 'teamB')}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          predictions[match._id] === 'teamB'
                            ? 'bg-emerald-600 text-white'
                            : isDark 
                              ? 'bg-dark-700 border border-dark-600 text-dark-200 hover:border-dark-500' 
                              : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span className="text-xs" title="Away">✈️</span>
                          <span className="truncate">{match.teamB}</span>
                        </span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payment Status - Only show for first-time bets */}
          {!existingBet ? (
            <div className={`rounded-lg border p-4 ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
            }`}>
              <label className={`block text-sm font-medium mb-3 ${
                isDark ? 'text-dark-200' : 'text-gray-700'
              }`}>
                {t('payment.title')}
              </label>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('paid')}
                  className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    paymentStatus === 'paid'
                      ? 'bg-blue-600 text-white'
                      : isDark 
                        ? 'bg-dark-700 border border-dark-600 text-dark-200 hover:border-dark-500' 
                        : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ✓ {t('payment.paid')} ($20)
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStatus('pending')}
                  className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    paymentStatus === 'pending'
                      ? isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                      : isDark 
                        ? 'bg-dark-700 border border-dark-600 text-dark-200 hover:border-dark-500' 
                        : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ⏳ {t('payment.pendingLabel')}
                </button>
              </div>

              <div className={`p-3 rounded-lg text-xs ${
                paymentStatus === 'pending'
                  ? isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
                  : isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
              }`}>
                {paymentStatus === 'pending' 
                  ? t('payment.pendingMessage')
                  : t('payment.paidMessage')}
              </div>
            </div>
          ) : (
            /* Payment Status Display for Editing - Read Only */
            <div className={`rounded-lg border p-4 ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
            }`}>
              <label className={`block text-sm font-medium mb-3 ${
                isDark ? 'text-dark-200' : 'text-gray-700'
              }`}>
                {t('payment.title')}
              </label>
              
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                existingBet.paid
                  ? isDark ? 'bg-emerald-900/20 border border-emerald-700/30' : 'bg-emerald-50 border border-emerald-200'
                  : isDark ? 'bg-amber-900/20 border border-amber-700/30' : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  existingBet.paid
                    ? isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'
                    : isDark ? 'bg-amber-900/50' : 'bg-amber-100'
                }`}>
                  <span className="text-lg">{existingBet.paid ? '✓' : '⏳'}</span>
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    existingBet.paid
                      ? isDark ? 'text-emerald-300' : 'text-emerald-700'
                      : isDark ? 'text-amber-300' : 'text-amber-700'
                  }`}>
                    {existingBet.paid ? t('payment.paid') : t('payment.pendingLabel')}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    isDark ? 'text-dark-400' : 'text-gray-500'
                  }`}>
                    {t('payment.adminOnlyChange', 'Payment status can only be changed by an admin')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className={`rounded-lg border p-4 ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                {completedPredictions === totalMatches
                  ? <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>✓ {t('allPredictionsMade')}</span>
                  : <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>{t('predictionsRemaining', { count: totalMatches - completedPredictions })}</span>}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark 
                      ? 'bg-dark-700 text-dark-200 hover:bg-dark-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isPending || !allPredictionsMade || totalGoals === '' || totalGoals === undefined}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? t('submit.placing') : existingBet ? t('submit.update') : t('submit.place')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {/* Validation Modal */}
      <ValidationModal
        isOpen={validationModal.isOpen}
        onClose={closeValidationModal}
        title={validationModal.title}
        message={validationModal.message}
        items={validationModal.items}
        isDark={isDark}
        buttonText={t('validation.gotIt', "Got it, I'll fix it")}
      />
    </div>
  )
}
