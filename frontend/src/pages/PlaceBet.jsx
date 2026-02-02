import { useState, useEffect, useTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

export default function PlaceBet() {
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [totalGoals, setTotalGoals] = useState('')
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

      // If user has existing bet, populate the form
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-dark-300' : 'text-light-600'}`}>Loading matches...</p>
        </div>
      </div>
    )
  }

  if (lockStatus.isBettingLocked) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className={`text-center py-8 sm:py-12 rounded-2xl p-6 ${
          isDark 
            ? 'bg-gradient-to-br from-dark-800/90 to-dark-900/95 border border-dark-700/50' 
            : 'bg-white border border-light-300 shadow-card-light'
        }`}>
          <span className="text-5xl sm:text-6xl mb-4 block">🔒</span>
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-dark-100' : 'text-light-900'}`}>
            Betting is Closed
          </h2>
          <p className={`mb-6 text-sm sm:text-base ${isDark ? 'text-dark-400' : 'text-light-600'}`}>
            Betting closes 5 minutes before the first match starts.
            <br />
            Check back next week to place your bets!
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className={`text-center py-8 sm:py-12 rounded-2xl p-6 ${
          isDark 
            ? 'bg-gradient-to-br from-dark-800/90 to-dark-900/95 border border-dark-700/50' 
            : 'bg-white border border-light-300 shadow-card-light'
        }`}>
          <span className="text-5xl sm:text-6xl mb-4 block">📅</span>
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-dark-100' : 'text-light-900'}`}>
            No Schedule Available
          </h2>
          <p className={`text-sm sm:text-base ${isDark ? 'text-dark-400' : 'text-light-600'}`}>
            The Liga MX schedule for this week hasn't been created yet.
          </p>
        </div>
      </div>
    )
  }

  const completedPredictions = Object.keys(predictions).length
  const totalMatches = schedule.matches.length

  // Calculate correct predictions count
  const getCorrectCount = () => {
    if (!schedule?.matches || !predictions) return 0
    return schedule.matches.filter(match => 
      match.isCompleted && match.result && predictions[match._id] === match.result
    ).length
  }

  // Check if prediction is correct/wrong for a completed match
  const getPredictionResult = (match) => {
    if (!match.isCompleted || !match.result || !predictions[match._id]) return null
    return predictions[match._id] === match.result ? 'correct' : 'wrong'
  }

  const cardClass = `rounded-2xl p-4 sm:p-6 transition-all duration-300 ${
    isDark 
      ? 'bg-gradient-to-br from-dark-800/90 to-dark-900/95 border border-dark-700/50 shadow-card' 
      : 'bg-white border border-light-300 shadow-card-light'
  }`

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className={`text-2xl sm:text-3xl font-bold flex items-center gap-2 ${
          isDark ? 'text-gradient' : 'text-light-900'
        }`}>
          <span>📝</span> {existingBet ? 'Edit Your Bet' : 'Place Your Bet'}
        </h1>
        <p className={`mt-2 text-sm sm:text-base flex items-center gap-2 ${
          isDark ? 'text-dark-300' : 'text-light-600'
        }`}>
          <span>🇲🇽</span> Liga MX - Make your predictions for this week
        </p>
        
        {/* Time Warning */}
        {getTimeUntilLockout() && (
          <div className={`mt-4 p-3 sm:p-4 rounded-xl border ${
            isDark 
              ? 'bg-sports-gold/10 border-sports-gold/30' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <p className={`font-medium text-sm sm:text-base flex items-center gap-2 ${
              isDark ? 'text-sports-gold' : 'text-amber-600'
            }`}>
              <span>⏰</span> Betting closes in {getTimeUntilLockout()}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Total Goals Prediction */}
        <div className={`${cardClass} mb-4 sm:mb-6`}>
          <h2 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${
            isDark ? 'text-dark-100' : 'text-light-900'
          }`}>
            <span>⚽</span> Total Goals Prediction
          </h2>
          <p className={`mb-4 text-sm sm:text-base ${isDark ? 'text-dark-400' : 'text-light-600'}`}>
            Predict the total number of goals scored across all 9 matches this week.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={totalGoals}
              onChange={(e) => setTotalGoals(e.target.value)}
              min="0"
              max="100"
              className={`w-24 sm:w-32 text-center text-xl sm:text-2xl font-bold px-4 py-3 rounded-lg transition-all duration-300
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                isDark 
                  ? 'bg-dark-800 border border-dark-600 text-dark-100' 
                  : 'bg-light-100 border border-light-400 text-light-900'
              }`}
              placeholder="0"
              required
            />
            <span className={`text-sm sm:text-base ${isDark ? 'text-dark-400' : 'text-light-600'}`}>goals</span>
          </div>
        </div>

        {/* Match Predictions */}
        <div className={`${cardClass} mb-4 sm:mb-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
            <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${
              isDark ? 'text-dark-100' : 'text-light-900'
            }`}>
              <span>🏆</span> Match Predictions
            </h2>
            <div className="flex items-center gap-3">
              {/* Correct count - only show if there are completed matches */}
              {schedule.matches.some(m => m.isCompleted) && (
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  isDark ? 'bg-sports-green/20 text-sports-green' : 'bg-green-100 text-green-700'
                }`}>
                  ✓ {getCorrectCount()}/{schedule.matches.filter(m => m.isCompleted).length} correct
                </span>
              )}
              <span className={`text-sm px-3 py-1 rounded-full ${
                isDark ? 'bg-dark-700 text-dark-400' : 'bg-light-200 text-light-600'
              }`}>
                {completedPredictions}/{totalMatches} selected
              </span>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {schedule.matches.map((match, index) => {
              const result = getPredictionResult(match)
              return (
              <div
                key={match._id}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  result === 'correct'
                    ? isDark 
                      ? 'border-sports-green/50 bg-sports-green/10' 
                      : 'border-green-400 bg-green-50'
                    : result === 'wrong'
                      ? isDark 
                        ? 'border-red-500/50 bg-red-500/10' 
                        : 'border-red-400 bg-red-50'
                      : predictions[match._id]
                        ? isDark 
                          ? 'border-primary-500/50 bg-primary-500/5' 
                          : 'border-primary-300 bg-primary-50'
                        : isDark 
                          ? 'border-dark-600/50 bg-dark-700/30' 
                          : 'border-light-300 bg-light-100'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-dark-400' : 'text-light-600'}`}>
                      Match {index + 1}
                    </span>
                    {/* Result indicator */}
                    {result === 'correct' && (
                      <span className="text-sports-green text-lg" title="Correct prediction">✓</span>
                    )}
                    {result === 'wrong' && (
                      <span className="text-red-500 text-lg" title="Wrong prediction">✗</span>
                    )}
                    {match.isCompleted && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isDark ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-light-600'
                      }`}>
                        Final: {match.teamAScore}-{match.teamBScore}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs hidden sm:block ${isDark ? 'text-dark-500' : 'text-light-500'}`}>
                    {formatDate(match.startTime)}
                  </span>
                </div>

                {/* Mobile: Stack buttons vertically with team names */}
                <div className="flex flex-col sm:hidden gap-2">
                  <button
                    type="button"
                    onClick={() => handlePredictionChange(match._id, 'teamA')}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      predictions[match._id] === 'teamA'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                        : isDark 
                          ? 'bg-dark-600 border border-dark-500 text-dark-200 hover:border-primary-500/50' 
                          : 'bg-white border border-light-400 text-light-700 hover:border-primary-400'
                    }`}
                  >
                    <span className="text-lg">🏠</span> {match.teamA}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePredictionChange(match._id, 'draw')}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      predictions[match._id] === 'draw'
                        ? isDark 
                          ? 'bg-dark-500 text-white border-2 border-dark-400' 
                          : 'bg-light-700 text-white border-2 border-light-600'
                        : isDark 
                          ? 'bg-dark-600 border border-dark-500 text-dark-200 hover:border-dark-400' 
                          : 'bg-white border border-light-400 text-light-700 hover:border-light-500'
                    }`}
                  >
                    E - Empate (Draw)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePredictionChange(match._id, 'teamB')}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      predictions[match._id] === 'teamB'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                        : isDark 
                          ? 'bg-dark-600 border border-dark-500 text-dark-200 hover:border-primary-500/50' 
                          : 'bg-white border border-light-400 text-light-700 hover:border-primary-400'
                    }`}
                  >
                    <span className="text-lg">✈️</span> {match.teamB}
                  </button>
                </div>

                {/* Desktop: Horizontal layout */}
                <div className="hidden sm:flex items-center justify-between gap-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => handlePredictionChange(match._id, 'teamA')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                      predictions[match._id] === 'teamA'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                        : isDark 
                          ? 'bg-dark-600 border border-dark-500 text-dark-200 hover:border-primary-500/50' 
                          : 'bg-white border border-light-400 text-light-700 hover:border-primary-400'
                    }`}
                  >
                    {match.teamA}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePredictionChange(match._id, 'draw')}
                    className={`py-3 px-6 rounded-lg font-bold transition-all ${
                      predictions[match._id] === 'draw'
                        ? isDark 
                          ? 'bg-dark-500 text-white border-2 border-dark-400' 
                          : 'bg-light-700 text-white border-2 border-light-600'
                        : isDark 
                          ? 'bg-dark-600 border border-dark-500 text-dark-300 hover:border-dark-400' 
                          : 'bg-white border border-light-400 text-light-700 hover:border-light-500'
                    }`}
                  >
                    E
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePredictionChange(match._id, 'teamB')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                      predictions[match._id] === 'teamB'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                        : isDark 
                          ? 'bg-dark-600 border border-dark-500 text-dark-200 hover:border-primary-500/50' 
                          : 'bg-white border border-light-400 text-light-700 hover:border-primary-400'
                    }`}
                  >
                    {match.teamB}
                  </button>
                </div>

                {/* Mobile date */}
                <div className={`sm:hidden text-xs mt-2 text-center ${isDark ? 'text-dark-500' : 'text-light-500'}`}>
                  {formatDate(match.startTime)}
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Payment Section */}
        <div className={`${cardClass} mb-4 sm:mb-6`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-sports-gold/20' : 'bg-amber-100'
            }`}>
              <span className="text-2xl">💵</span>
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-dark-100' : 'text-light-900'}`}>
                Payment Status
              </h3>
              
              {/* Payment Status Selection */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('paid')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    paymentStatus === 'paid'
                      ? 'bg-gradient-to-r from-sports-green to-green-600 text-white shadow-lg'
                      : isDark 
                        ? 'bg-dark-600 border border-dark-500 text-dark-200 hover:border-sports-green/50' 
                        : 'bg-white border border-light-400 text-light-700 hover:border-green-400'
                  }`}
                >
                  <span className="text-lg">✓</span>
                  <span>Paid</span>
                  {paymentStatus === 'paid' && <span className="ml-1">($20)</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStatus('pending')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    paymentStatus === 'pending'
                      ? isDark 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' 
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                      : isDark 
                        ? 'bg-dark-600 border border-dark-500 text-dark-200 hover:border-red-500/50' 
                        : 'bg-white border border-light-400 text-light-700 hover:border-red-400'
                  }`}
                >
                  <span className="text-lg">⏳</span>
                  <span>Pending</span>
                </button>
              </div>

              {/* Payment Instructions */}
              <div className={`p-4 rounded-lg border ${
                paymentStatus === 'pending'
                  ? isDark 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : 'bg-red-50 border-red-200'
                  : isDark 
                    ? 'bg-sports-green/10 border-sports-green/30' 
                    : 'bg-green-50 border-green-200'
              }`}>
                {paymentStatus === 'pending' ? (
                  <div>
                    <p className={`text-sm font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      ⚠️ Payment Required
                    </p>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-dark-300' : 'text-light-700'}`}>
                      Please pay <strong className={isDark ? 'text-sports-gold' : 'text-amber-600'}>$20 cash</strong> before the first game kicks off. 
                      Without payment, even if you win the quiniela, you will <strong>not be allowed to claim the prize</strong>. 
                      You must complete your payment to officially participate.
                    </p>
                    <p className={`text-xs mt-3 ${isDark ? 'text-dark-400' : 'text-light-500'}`}>
                      Once you've paid, change your status to "Paid" above.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className={`text-sm font-bold mb-2 ${isDark ? 'text-sports-green' : 'text-green-600'}`}>
                      ✓ Payment Confirmed
                    </p>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-dark-300' : 'text-light-700'}`}>
                      Thank you for your payment! You are now officially participating in this week's Quiniela. 
                      Good luck with your predictions! 🍀
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className={cardClass}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className={`text-sm sm:text-base ${isDark ? 'text-dark-300' : 'text-light-600'}`}>
                {completedPredictions === totalMatches
                  ? <span className={isDark ? 'text-sports-green' : 'text-green-600'}>✅ All predictions made!</span>
                  : <span className={isDark ? 'text-sports-gold' : 'text-amber-600'}>⚠️ {totalMatches - completedPredictions} predictions remaining</span>}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className={`w-full sm:w-auto order-2 sm:order-1 py-2.5 px-5 rounded-lg font-semibold transition-all ${
                  isDark 
                    ? 'bg-dark-700 hover:bg-dark-600 text-dark-100 border border-dark-500' 
                    : 'bg-light-200 hover:bg-light-300 text-light-800 border border-light-400'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || completedPredictions !== totalMatches || !totalGoals}
                className="btn-primary w-full sm:w-auto order-1 sm:order-2"
              >
                {isPending ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : existingBet ? (
                  <span className="flex items-center justify-center gap-2">
                    <span>✏️</span> Update Bet
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>🎯</span> Place Bet
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
