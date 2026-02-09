import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// Guest Bet Modal Component
export function GuestBetModal({ 
  isOpen, 
  onClose, 
  schedule, 
  weekInfo,
  isDark, 
  onSubmit, 
  editingGuest = null,
  isSubmitting = false
}) {
  const { t } = useTranslation('bet')
  const [guestName, setGuestName] = useState(editingGuest?.participantName || '')
  const [guestTotalGoals, setGuestTotalGoals] = useState(editingGuest?.totalGoals?.toString() || '0')
  const [guestPredictions, setGuestPredictions] = useState({})
  const [guestPaymentStatus, setGuestPaymentStatus] = useState(editingGuest?.paid ? 'paid' : 'pending')
  const [errors, setErrors] = useState({})

  // Initialize predictions when modal opens
  useEffect(() => {
    if (isOpen && schedule) {
      const defaultPredictions = {}
      schedule.matches.forEach(match => {
        defaultPredictions[match._id] = 'draw'
      })
      
      if (editingGuest?.predictions) {
        editingGuest.predictions.forEach(p => {
          if (p.matchId && p.prediction) {
            defaultPredictions[p.matchId] = p.prediction
          }
        })
      }
      
      setGuestPredictions(defaultPredictions)
      setGuestName(editingGuest?.participantName || '')
      setGuestTotalGoals(editingGuest?.totalGoals?.toString() || '0')
      setGuestPaymentStatus(editingGuest?.paid ? 'paid' : 'pending')
      setErrors({})
    }
  }, [isOpen, schedule, editingGuest])

  const handlePredictionChange = (matchId, prediction) => {
    setGuestPredictions(prev => ({
      ...prev,
      [matchId]: prediction
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!guestName.trim()) {
      newErrors.name = t('guest.errors.nameRequired')
    } else if (guestName.trim().length < 2) {
      newErrors.name = t('guest.errors.nameTooShort')
    }
    
    if (!guestTotalGoals || parseInt(guestTotalGoals) <= 0) {
      newErrors.goals = t('validation.invalidGoalsMessage')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const guestData = {
      participantName: guestName.trim(),
      totalGoals: parseInt(guestTotalGoals),
      paid: guestPaymentStatus === 'paid',
      weekNumber: weekInfo?.weekNumber,
      year: weekInfo?.year,
      predictions: schedule.matches.map(match => ({
        matchId: match._id,
        prediction: guestPredictions[match._id]
      }))
    }

    onSubmit(guestData, editingGuest?._id)
  }

  if (!isOpen) return null

  const completedPredictions = schedule?.matches?.filter(match => {
    const pred = guestPredictions[match._id]
    return pred && ['teamA', 'teamB', 'draw'].includes(pred)
  }).length || 0
  const totalMatches = schedule?.matches?.length || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        isDark ? 'bg-dark-800 border border-dark-700' : 'bg-white'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingGuest ? t('guest.editGuest') : t('guest.addGuest')}
              </h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                {t('guest.subtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-dark-700 text-dark-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Guest Name Input */}
          <div className={`rounded-lg border p-4 mb-4 ${
            isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-dark-200' : 'text-gray-700'
            }`}>
              {t('guest.guestName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={t('guest.guestNamePlaceholder')}
              className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isDark 
                  ? 'bg-dark-700 border border-dark-600 text-dark-100 placeholder-dark-500' 
                  : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
              } ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Total Goals */}
          <div className={`rounded-lg border p-4 mb-4 ${
            isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-dark-200' : 'text-gray-700'
            }`}>
              {t('form.totalGoals')} <span className="text-red-500">*</span>
            </label>
            <p className={`text-xs mb-3 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              {t('form.totalGoalsHint', { count: schedule?.matches?.length || 0 })}
            </p>
            <input
              type="number"
              value={guestTotalGoals}
              onChange={(e) => setGuestTotalGoals(e.target.value)}
              min="0"
              max="100"
              className={`w-24 text-center text-lg font-semibold px-3 py-2 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isDark 
                  ? 'bg-dark-700 border border-dark-600 text-dark-100' 
                  : 'bg-white border border-gray-300 text-gray-900'
              } ${errors.goals ? 'border-red-500' : ''}`}
              placeholder="0"
            />
            {errors.goals && (
              <p className="text-red-500 text-xs mt-1">{errors.goals}</p>
            )}
          </div>

          {/* Payment Status */}
          <div className={`rounded-lg border p-4 mb-4 ${
            isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <label className={`block text-sm font-medium mb-3 ${
              isDark ? 'text-dark-200' : 'text-gray-700'
            }`}>
              {t('payment.title')}
            </label>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setGuestPaymentStatus('paid')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  guestPaymentStatus === 'paid'
                    ? 'bg-emerald-600 text-white'
                    : isDark 
                      ? 'bg-dark-600 border border-dark-500 text-dark-200 hover:border-dark-400' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                ✓ {t('payment.paid')} ($20)
              </button>

              <button
                type="button"
                onClick={() => setGuestPaymentStatus('pending')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  guestPaymentStatus === 'pending'
                    ? isDark ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white'
                    : isDark 
                      ? 'bg-dark-600 border border-dark-500 text-dark-200 hover:border-dark-400' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                ⏳ {t('payment.pendingLabel')}
              </button>
            </div>

            <div className={`p-2 rounded-lg text-xs ${
              guestPaymentStatus === 'pending'
                ? isDark ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-700'
                : isDark ? 'bg-emerald-900/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {guestPaymentStatus === 'pending' 
                ? t('payment.pendingMessage')
                : t('payment.paidMessage')}
            </div>
          </div>

          {/* Match Predictions */}
          <div className={`rounded-lg border mb-4 ${
            isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className={`px-4 py-3 border-b flex items-center justify-between ${
              isDark ? 'border-dark-600' : 'border-gray-200'
            }`}>
              <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('matchPredictions')}
              </h4>
              <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                {completedPredictions}/{totalMatches}
              </span>
            </div>
            
            <div className={`divide-y ${isDark ? 'divide-dark-600' : 'divide-gray-200'}`}>
              {schedule?.matches?.map((match, index) => (
                <div key={match._id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      {t('match.matchNumber', { number: index + 1 })}
                    </span>
                  </div>

                  {/* Prediction buttons - compact */}
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => handlePredictionChange(match._id, 'teamA')}
                      className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                        guestPredictions[match._id] === 'teamA'
                          ? 'bg-purple-600 text-white'
                          : isDark 
                            ? 'bg-dark-600 border border-dark-500 text-dark-200 hover:border-dark-400' 
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate block">{match.teamA}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePredictionChange(match._id, 'draw')}
                      className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                        guestPredictions[match._id] === 'draw'
                          ? 'bg-purple-600 text-white'
                          : isDark 
                            ? 'bg-dark-600 border border-dark-500 text-dark-300 hover:border-dark-400' 
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t('form.draw')}
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePredictionChange(match._id, 'teamB')}
                      className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                        guestPredictions[match._id] === 'teamB'
                          ? 'bg-purple-600 text-white'
                          : isDark 
                            ? 'bg-dark-600 border border-dark-500 text-dark-200 hover:border-dark-400' 
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate block">{match.teamB}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-dark-700 text-dark-200 hover:bg-dark-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting 
                ? (editingGuest ? t('submit.updating') : t('submit.placing')) 
                : (editingGuest ? t('submit.update') : t('submit.place'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Delete Confirmation Modal
export function DeleteConfirmModal({ isOpen, onClose, onConfirm, guestName, isDark, isDeleting }) {
  const { t } = useTranslation('bet')
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-sm rounded-2xl shadow-2xl ${
        isDark ? 'bg-dark-800 border border-dark-700' : 'bg-white'
      }`}>
        <div className="p-6">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-red-900/30' : 'bg-red-100'
          }`}>
            <span className="text-3xl">🗑️</span>
          </div>
          
          <h3 className={`text-lg font-semibold text-center mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {t('guest.deleteGuest')}
          </h3>
          
          <p className={`text-sm text-center mb-6 ${
            isDark ? 'text-dark-300' : 'text-gray-600'
          }`}>
            {t('guest.deleteConfirm')}
            <br />
            <span className="font-medium">{guestName}</span>
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-dark-700 text-dark-200 hover:bg-dark-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
            >
              {isDeleting ? '...' : t('guest.deleteGuest')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuestBetModal
