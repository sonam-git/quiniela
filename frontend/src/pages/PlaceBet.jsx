import { useState, useEffect, useTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

export default function PlaceBet() {
  const [schedule, setSchedule] = useState(null)
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
  const { isDark } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  // Initialize predictions with 'draw' for all matches when schedule loads
  useEffect(() => {
    if (schedule && !existingBet) {
      const defaultPredictions = {}
      schedule.matches.forEach(match => {
        defaultPredictions[match._id] = 'draw'
      })
      setPredictions(defaultPredictions)
    }
  }, [schedule, existingBet])

  const fetchData = async () => {
    try {
      const [scheduleRes, myBetRes] = await Promise.all([
        api.get('/schedule/current'),
        api.get('/bets/my/current')
      ])

      setSchedule(scheduleRes.data.schedule)
      setLockStatus({
        isBettingLocked: scheduleRes.data.isBettingLocked,
        lockoutTime: scheduleRes.data.lockoutTime
      })

      if (myBetRes.data.bet) {
        setExistingBet(myBetRes.data.bet)
        setTotalGoals(myBetRes.data.bet.totalGoals.toString())
        setPaymentStatus(myBetRes.data.bet.paid ? 'paid' : 'pending')
        
        const preds = {}
        myBetRes.data.bet.predictions.forEach(p => {
          preds[p.matchId] = p.prediction
        })
        setPredictions(preds)
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('No schedule found for this week')
      } else {
        toast.error('Failed to load schedule')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePredictionChange = (matchId, prediction) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: prediction
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!schedule) return

    const missingPredictions = schedule.matches.filter(
      match => !predictions[match._id]
    )

    if (missingPredictions.length > 0) {
      toast.error(`Please make predictions for all ${missingPredictions.length} remaining matches`)
      return
    }

    if (!totalGoals || parseInt(totalGoals) < 0) {
      toast.error('Please enter a valid total goals prediction')
      return
    }

    startTransition(async () => {
      try {
        const betData = {
          totalGoals: parseInt(totalGoals),
          paid: paymentStatus === 'paid',
          predictions: schedule.matches.map(match => ({
            matchId: match._id,
            prediction: predictions[match._id]
          }))
        }

        await api.post('/bets', betData)
        
        toast.success(existingBet ? 'Bet updated successfully!' : 'Bet placed successfully!')
        navigate('/dashboard')
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to place bet')
      }
    })
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
              Betting closed
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              Betting closes 5 minutes before the first match starts. Check back next week!
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              Back to Dashboard
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
              No schedule available
            </h2>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              The schedule for this week hasn't been created yet.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const completedPredictions = Object.keys(predictions).length
  const totalMatches = schedule.matches.length

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
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {existingBet ? 'Edit bet' : 'Place bet'}
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            Make your predictions for this week's matches
          </p>
          
          {getTimeUntilLockout() && (
            <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
              isDark 
                ? 'bg-amber-900/30 text-amber-400 border border-amber-800/50' 
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Closes in {getTimeUntilLockout()}
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
              Total goals prediction
            </label>
            <p className={`text-xs mb-3 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              Predict the total goals across all 9 matches
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
                Match predictions
              </h2>
              <div className="flex items-center gap-2">
                {schedule.matches.some(m => m.isCompleted) && (
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {getCorrectCount()}/{schedule.matches.filter(m => m.isCompleted).length} correct
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
                          Match {index + 1}
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
                            ? isDark ? 'bg-dark-500 text-white' : 'bg-gray-700 text-white'
                            : isDark 
                              ? 'bg-dark-700 border border-dark-600 text-dark-300 hover:border-dark-500' 
                              : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Draw
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

          {/* Payment Status */}
          <div className={`rounded-lg border p-4 ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
          }`}>
            <label className={`block text-sm font-medium mb-3 ${
              isDark ? 'text-dark-200' : 'text-gray-700'
            }`}>
              Payment status
            </label>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  paymentStatus === 'paid'
                    ? 'bg-emerald-600 text-white'
                    : isDark 
                      ? 'bg-dark-700 border border-dark-600 text-dark-200 hover:border-dark-500' 
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                ✓ Paid ($20)
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
                ⏳ Pending
              </button>
            </div>

            <div className={`p-3 rounded-lg text-xs ${
              paymentStatus === 'pending'
                ? isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
                : isDark ? 'bg-emerald-900/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {paymentStatus === 'pending' 
                ? 'Payment required before first match. Without payment, you cannot claim the prize.'
                : 'Payment confirmed! You are officially participating.'}
            </div>
          </div>

          {/* Submit */}
          <div className={`rounded-lg border p-4 ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                {completedPredictions === totalMatches
                  ? <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>✓ All predictions made</span>
                  : <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>{totalMatches - completedPredictions} predictions remaining</span>}
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || completedPredictions !== totalMatches || !totalGoals}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Saving...' : existingBet ? 'Update bet' : 'Place bet'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
