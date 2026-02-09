import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { downloadPredictionPDF, downloadResultsPDF, getMyGuestBets, deleteGuestBet, createGuestBet, updateGuestBet } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates'
import { GuestBetModal } from '../components/GuestBetModal'
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

export const CalendarIcon = () => (
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

export const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

export const CheckIcon = () => (
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

const GuestIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

// Reusable Prediction Content Component
const PredictionContent = ({ 
  bet, 
  schedule, 
  stats, 
  lockStatus, 
  isSettled, 
  isAdmin, 
  isDark, 
  weekInfo,
  onEdit, 
  onDelete, 
  onDownloadPDF, 
  downloadingPDF,
  getPredictionLabel,
  getPredictionStatus,
  isGuest = false,
  guestName = null,
  t
}) => {
  if (!bet || !schedule?.matches) {
    return (
      <div className="p-8 sm:p-12 text-center">
        <div className={`w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center ${
          isDark ? 'bg-dark-700' : 'bg-gray-100'
        }`}>
          <span className="text-3xl">🎯</span>
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {isGuest ? `No Predictions for ${guestName}` : 'No Predictions Yet'}
        </h3>
        <p className={`text-sm mb-6 max-w-sm mx-auto ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
          {isGuest 
            ? 'This guest hasn\'t placed any predictions for this week yet.'
            : 'You haven\'t placed any predictions for this week. Start now to compete with other players!'}
        </p>
        {!isGuest && (
          <Link
            to="/place-bet"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Place Your Prediction
          </Link>
        )}
      </div>
    )
  }

  return (
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
          <p className={`text-xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{bet?.totalGoals ?? '-'}</p>
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
        <div className={`divide-y ${isDark ? 'divide-dark-600' : 'divide-gray-200'}`}>
          {schedule.matches.map((match, index) => {
            const prediction = bet.predictions?.find(p => p.matchId === match._id)
            const status = getPredictionStatus(match._id, bet)
            
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
              {bet.totalGoals}
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
                  Math.abs(bet.totalGoals - schedule.actualTotalGoals) === 0
                    ? 'bg-emerald-500 text-white'
                    : isDark ? 'bg-dark-600 text-dark-400' : 'bg-gray-200 text-gray-500'
                }`}>
                  {Math.abs(bet.totalGoals - schedule.actualTotalGoals) === 0 ? '✓ Exact' : `±${Math.abs(bet.totalGoals - schedule.actualTotalGoals)}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Payment Status for Guest */}
      {isGuest && (
        <div className={`mt-4 p-4 rounded-lg flex items-center justify-between ${
          bet?.paid 
            ? isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
            : isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <PaymentIcon />
            <span className={`text-sm font-medium ${
              bet?.paid 
                ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                : isDark ? 'text-amber-400' : 'text-amber-700'
            }`}>
              Payment Status
            </span>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            bet?.paid 
              ? 'bg-emerald-500 text-white'
              : 'bg-amber-500 text-white'
          }`}>
            {bet?.paid ? 'PAID' : 'PENDING'}
          </span>
        </div>
      )}
    </div>
  )
}

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
  const { user, isAdmin, isDeveloper, refreshUser } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [myBet, setMyBet] = useState(null)
  const [guestBets, setGuestBets] = useState([])
  const [schedule, setSchedule] = useState(null)
  const [weekInfo, setWeekInfo] = useState({ weekNumber: 0, year: 0 })
  const [lockStatus, setLockStatus] = useState({ locked: false, hasStarted: false, lockoutTime: null })
  const [isSettled, setIsSettled] = useState(false)
  
  // Tab state
  const [activeTab, setActiveTab] = useState('my') // 'my' or 'guests'
  const [selectedGuestId, setSelectedGuestId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { type: 'my' | 'guest', betId?: string, guestName?: string }
  const [deleting, setDeleting] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  
  // Guest bet modal state
  const [guestBetModal, setGuestBetModal] = useState({
    isOpen: false,
    editingGuest: null
  })
  const [isSubmittingGuest, setIsSubmittingGuest] = useState(false)
  
  // Developer upgrade state
  const [showDevUpgrade, setShowDevUpgrade] = useState(false)
  const [devCode, setDevCode] = useState('')
  const [upgrading, setUpgrading] = useState(false)
  const [devCodeError, setDevCodeError] = useState('')
  const [devCodeAttempts, setDevCodeAttempts] = useState(() => {
    const stored = localStorage.getItem('devCodeAttempts')
    if (stored) {
      const { count, lockedUntil } = JSON.parse(stored)
      // Check if lock has expired
      if (lockedUntil && Date.now() > lockedUntil) {
        localStorage.removeItem('devCodeAttempts')
        return 0
      }
      return count || 0
    }
    return 0
  })
  const [lockedUntil, setLockedUntil] = useState(() => {
    const stored = localStorage.getItem('devCodeAttempts')
    if (stored) {
      const { lockedUntil } = JSON.parse(stored)
      if (lockedUntil && Date.now() > lockedUntil) {
        return null
      }
      return lockedUntil || null
    }
    return null
  })
  
  const isDevCodeDisabled = devCodeAttempts >= 3 && lockedUntil && Date.now() < lockedUntil
  
  // Calculate remaining lock time
  const getRemainingLockTime = () => {
    if (!lockedUntil) return null
    const remaining = lockedUntil - Date.now()
    if (remaining <= 0) return null
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [betRes, scheduleRes, announcementsRes, guestBetsRes] = await Promise.all([
        api.get('/bets/my/current'),
        api.get('/schedule/current'),
        api.get('/announcements'),
        getMyGuestBets().catch(() => ({ guestBets: [] }))
      ])
      
      setMyBet(betRes.data.bet)
      setGuestBets(guestBetsRes.guestBets || [])
      setWeekInfo({ 
        weekNumber: betRes.data.weekNumber, 
        year: betRes.data.year 
      })
      setLockStatus({ 
        locked: betRes.data.locked,
        hasStarted: scheduleRes.data.hasStarted || false,
        lockoutTime: betRes.data.lockoutTime ? new Date(betRes.data.lockoutTime) : null
      })
      setSchedule(scheduleRes.data.schedule)
      setIsSettled(scheduleRes.data.schedule?.isSettled || false)
      
      // Auto-select first guest if on guest tab and none selected
      if (guestBetsRes.guestBets?.length > 0 && !selectedGuestId) {
        setSelectedGuestId(guestBetsRes.guestBets[0]._id)
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedGuestId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-update lock status when lockout time approaches
  useEffect(() => {
    // If already locked or no lockout time, no need to check
    if (lockStatus.locked || !lockStatus.lockoutTime) return

    const checkLockStatus = () => {
      const now = new Date()
      if (now >= lockStatus.lockoutTime) {
        setLockStatus(prev => ({ ...prev, locked: true, hasStarted: true }))
      }
    }

    // Check immediately
    checkLockStatus()

    // Set up interval to check every 10 seconds
    const interval = setInterval(checkLockStatus, 10000)

    return () => clearInterval(interval)
  }, [lockStatus.locked, lockStatus.lockoutTime])

  // Targeted real-time update handlers - only update specific state without full reload
  const handleResultsUpdate = useCallback((data) => {
    console.log('📊 Results update received:', data)
    // Update only the schedule/matches state with new scores
    if (data?.schedule) {
      setSchedule(prev => {
        if (!prev) return data.schedule
        // Update only the matches that changed
        return {
          ...prev,
          matches: prev.matches.map(match => {
            const updatedMatch = data.schedule.matches?.find(m => m._id === match._id)
            return updatedMatch || match
          })
        }
      })
      toast.success('Match scores updated', { id: 'results-update', duration: 2000 })
    } else if (data?.matchId) {
      // Single match update
      setSchedule(prev => {
        if (!prev) return prev
        return {
          ...prev,
          matches: prev.matches.map(match => 
            match._id === data.matchId
              ? { ...match, scoreTeamA: data.scoreTeamA, scoreTeamB: data.scoreTeamB, isCompleted: data.isCompleted ?? match.isCompleted }
              : match
          )
        }
      })
      toast.success('Match score updated', { id: 'match-update', duration: 2000 })
    }
  }, [])

  const handlePaymentsUpdate = useCallback((data) => {
    console.log('💳 Payment update received:', data)
    // Check if this update is for the current user's bet
    if (data?.userId === user?._id || data?.betId === myBet?._id) {
      setMyBet(prev => {
        if (!prev) return prev
        return { ...prev, paid: data.paid }
      })
      toast.success(
        data.paid ? 'Payment confirmed! ✅' : 'Payment status changed to pending',
        { id: 'payment-update', duration: 3000 }
      )
    }
    // Check if update is for a guest bet
    if (data?.betId) {
      setGuestBets(prev => prev.map(gb => 
        gb._id === data.betId ? { ...gb, paid: data.paid } : gb
      ))
    }
    if (data?.bets) {
      // Batch update - find if current user's bet is affected
      const userBetUpdate = data.bets.find(b => b.betId === myBet?._id || b.userId === user?._id)
      if (userBetUpdate) {
        setMyBet(prev => {
          if (!prev) return prev
          return { ...prev, paid: userBetUpdate.paid }
        })
        toast.success(
          userBetUpdate.paid ? 'Payment confirmed! ✅' : 'Payment status changed to pending',
          { id: 'payment-update', duration: 3000 }
        )
      }
      // Update guest bets
      setGuestBets(prev => prev.map(gb => {
        const update = data.bets.find(b => b.betId === gb._id)
        return update ? { ...gb, paid: update.paid } : gb
      }))
    }
  }, [user?._id, myBet?._id])

  // Handle schedule creation - show new schedule to users
  const handleScheduleCreated = useCallback((data) => {
    console.log('📅 Profile: Schedule created received:', data)
    if (data?.schedule) {
      setSchedule(data.schedule)
      setWeekInfo({
        weekNumber: data.schedule.weekNumber,
        year: data.schedule.year
      })
      // Calculate lockout time (5 min before first match)
      const firstMatchTime = data.schedule.firstMatchTime ? new Date(data.schedule.firstMatchTime) : null
      const lockoutTime = firstMatchTime ? new Date(firstMatchTime.getTime() - 5 * 60 * 1000) : null
      setLockStatus({ locked: false, hasStarted: false, lockoutTime })
      toast.success('New schedule available!', { id: 'schedule-created', duration: 3000 })
    }
  }, [])

  const handleScheduleUpdate = useCallback((data) => {
    console.log('📅 Schedule update received:', data)
    // Update schedule if it's for the current week or if we have no schedule
    if (data?.schedule) {
      if (!schedule || (data.schedule.weekNumber === weekInfo.weekNumber && data.schedule.year === weekInfo.year)) {
        setSchedule(data.schedule)
      }
    }
  }, [weekInfo.weekNumber, weekInfo.year, schedule])

  const handleBetsUpdate = useCallback((data) => {
    console.log('🎯 Bets update received:', data)
    
    // Handle guest bet deletions (from user or admin)
    if (data?.action === 'delete' && data?.betId && data?.isGuestBet) {
      // Check if this guest bet belongs to current user
      const isMyGuestBet = guestBets.some(gb => gb._id === data.betId)
      if (isMyGuestBet) {
        setGuestBets(prev => prev.filter(gb => gb._id !== data.betId))
        // If deleted guest was selected, select another or switch tab
        if (selectedGuestId === data.betId) {
          setGuestBets(prev => {
            if (prev.length > 0) {
              setSelectedGuestId(prev[0]._id)
            } else {
              setActiveTab('my')
              setSelectedGuestId(null)
            }
            return prev
          })
        }
        toast.success(`Guest prediction removed`, { id: 'guest-deleted', duration: 2000 })
      }
      return
    }
    
    // Handle guest bet creates/updates for current user
    if (data?.isGuestBet && (data?.userId === user?._id || data?.userId?.toString() === user?._id?.toString())) {
      if (data.action === 'create' || data.action === 'update') {
        // Refetch guest bets for create/update
        getMyGuestBets().then(res => {
          setGuestBets(res.guestBets || [])
          if (data.action === 'create' && res.guestBets?.length > 0) {
            // Auto-select the newest guest bet
            const newest = res.guestBets[res.guestBets.length - 1]
            setSelectedGuestId(newest._id)
            setActiveTab('guests')
          }
        }).catch(console.error)
      }
      return
    }
    
    // Handle current user's own bet updates
    if (data?.userId === user?._id || data?.betId === myBet?._id) {
      // Targeted update if data provided
      if (data.bet) {
        setMyBet(data.bet)
      } else {
        // Minimal refetch - only bet data
        api.get('/bets/my/current').then(res => {
          setMyBet(res.data.bet)
          setLockStatus(prev => ({ 
            ...prev, 
            locked: res.data.locked,
            lockoutTime: res.data.lockoutTime ? new Date(res.data.lockoutTime) : prev.lockoutTime
          }))
        }).catch(console.error)
      }
    }
  }, [user?._id, myBet?._id, selectedGuestId, guestBets])

  const handleSettledUpdate = useCallback((data) => {
    console.log('✅ Week settled:', data)
    // Week settlement affects stats calculation - need to refresh
    if (data?.weekNumber === weekInfo.weekNumber && data?.year === weekInfo.year) {
      fetchData()
      toast.success('Week has been settled! Final results are in.', { id: 'settled', duration: 4000 })
    }
  }, [weekInfo.weekNumber, weekInfo.year, fetchData])

  // Handle schedule deleted event
  const handleScheduleDeleted = useCallback((data) => {
    console.log('🗑️ Profile: Schedule deleted:', data)
    // If the deleted schedule is the current one, clear it
    // Match by scheduleId if available, or by week/year
    const isCurrentSchedule = 
      (data?.scheduleId && schedule?._id === data.scheduleId) ||
      (data?.weekNumber === weekInfo.weekNumber && data?.year === weekInfo.year);
    
    if (isCurrentSchedule) {
      setSchedule(null)
      setMyBet(null)
      toast.info('Schedule has been removed by admin', { id: 'schedule-deleted', duration: 4000 })
    }
  }, [weekInfo.weekNumber, weekInfo.year, schedule?._id])

  // Real-time updates for profile data - targeted handlers to minimize re-renders
  useRealTimeUpdates({
    onResultsUpdate: handleResultsUpdate,
    onPaymentsUpdate: handlePaymentsUpdate,
    onScheduleUpdate: handleScheduleUpdate,
    onScheduleCreated: handleScheduleCreated,
    onScheduleDeleted: handleScheduleDeleted,
    onBetsUpdate: handleBetsUpdate,
    onSettled: handleSettledUpdate
  })

  const handleDeleteBet = async () => {
    // Check lock status before attempting delete
    if (lockStatus.locked) {
      toast.error('Betting is locked. Predictions cannot be deleted after betting closes.')
      setShowDeleteModal(false)
      setDeleteTarget(null)
      return
    }
    
    try {
      setDeleting(true)
      
      if (deleteTarget?.type === 'guest' && deleteTarget?.betId) {
        await deleteGuestBet(deleteTarget.betId)
        toast.success(`Guest prediction for "${deleteTarget.guestName}" deleted successfully`)
        setGuestBets(prev => prev.filter(gb => gb._id !== deleteTarget.betId))
        // If deleted guest was selected, select another or switch tab
        if (selectedGuestId === deleteTarget.betId) {
          const remaining = guestBets.filter(gb => gb._id !== deleteTarget.betId)
          if (remaining.length > 0) {
            setSelectedGuestId(remaining[0]._id)
          } else {
            setActiveTab('my')
            setSelectedGuestId(null)
          }
        }
      } else {
        await api.delete('/bets/my/current')
        toast.success('Prediction deleted successfully')
        setMyBet(null)
      }
      
      setShowDeleteModal(false)
      setDeleteTarget(null)
    } catch (error) {
      // If betting is locked, update the UI state accordingly
      if (error.response?.status === 403 && error.response?.data?.locked) {
        setLockStatus(prev => ({ ...prev, locked: true, hasStarted: true }))
        toast.error('Betting is now locked. Predictions cannot be deleted after betting closes.')
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete prediction')
      }
      setShowDeleteModal(false)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }
  
  const openDeleteModal = (type, betId = null, guestName = null) => {
    // Double-check lock status before allowing delete
    if (lockStatus.locked) {
      toast.error('Betting is locked. Predictions cannot be deleted after betting closes.')
      return
    }
    setDeleteTarget({ type, betId, guestName })
    setShowDeleteModal(true)
  }

  // Guest bet modal handlers
  const handleOpenGuestModal = (guest = null) => {
    setGuestBetModal({
      isOpen: true,
      editingGuest: guest
    })
  }

  const handleCloseGuestModal = () => {
    setGuestBetModal({
      isOpen: false,
      editingGuest: null
    })
  }

  const handleGuestBetSubmit = async (guestData, existingGuestId) => {
    setIsSubmittingGuest(true)
    try {
      if (existingGuestId) {
        await updateGuestBet(existingGuestId, guestData)
        toast.success(`Guest prediction for "${guestData.participantName}" updated successfully`)
      } else {
        await createGuestBet(guestData)
        toast.success(`Guest prediction for "${guestData.participantName}" created successfully`)
      }
      handleCloseGuestModal()
      // Refresh guest bets
      const res = await getMyGuestBets()
      setGuestBets(res.guestBets || [])
      // Auto-select the new/updated guest
      if (!existingGuestId && res.guestBets?.length > 0) {
        const newGuest = res.guestBets.find(g => g.participantName === guestData.participantName)
        if (newGuest) {
          setSelectedGuestId(newGuest._id)
          setActiveTab('guests')
        }
      }
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        toast.error('A guest with this name already exists for this week')
      } else {
        toast.error(error.response?.data?.message || 'Failed to save guest prediction')
      }
    } finally {
      setIsSubmittingGuest(false)
    }
  }

  const handleUpgradeToDeveloper = async () => {
    if (!devCode.trim()) {
      toast.error('Please enter the developer code')
      return
    }

    if (isDevCodeDisabled) {
      return
    }
    
    try {
      setUpgrading(true)
      setDevCodeError('')
      await api.post('/admin/upgrade-to-developer', { devCode: devCode.trim() })
      toast.success('🎉 Successfully upgraded to developer!')
      setShowDevUpgrade(false)
      setDevCode('')
      setDevCodeAttempts(0)
      setLockedUntil(null)
      localStorage.removeItem('devCodeAttempts')
      // Refresh user data to get updated isDeveloper status
      await refreshUser()
    } catch (error) {
      const newAttempts = devCodeAttempts + 1
      setDevCodeAttempts(newAttempts)
      
      if (newAttempts >= 3) {
        // Lock for 24 hours
        const lockTime = Date.now() + (24 * 60 * 60 * 1000)
        setLockedUntil(lockTime)
        localStorage.setItem('devCodeAttempts', JSON.stringify({ count: newAttempts, lockedUntil: lockTime }))
        setDevCodeError('Too many failed attempts. Try again in 24 hours.')
        toast.error('Too many failed attempts. Input disabled for 24 hours.')
      } else {
        localStorage.setItem('devCodeAttempts', JSON.stringify({ count: newAttempts, lockedUntil: null }))
        const remainingAttempts = 3 - newAttempts
        setDevCodeError(`Invalid developer code. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`)
        toast.error(error.response?.data?.message || 'Invalid developer code')
      }
      setDevCode('')
    } finally {
      setUpgrading(false)
    }
  }

  // PDF Download handler
  const handleDownloadPDF = async (betToDownload = null) => {
    try {
      setDownloadingPDF(true)
      if (isSettled) {
        await downloadResultsPDF(weekInfo.weekNumber, weekInfo.year)
        toast.success('Results PDF downloaded!')
      } else {
        await downloadPredictionPDF(weekInfo.weekNumber, weekInfo.year)
        toast.success('Predictions PDF downloaded!')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF')
    } finally {
      setDownloadingPDF(false)
    }
  }

  // Calculate stats for any bet
  const calculateStats = useCallback((bet) => {
    if (!bet || !schedule) return { correctPredictions: 0, totalPoints: 0, completedMatches: 0, accuracy: 0 }
    
    let correctPredictions = 0
    let completedMatches = 0
    
    schedule.matches?.forEach(match => {
      if (!match.isCompleted) return
      completedMatches++
      
      const prediction = bet.predictions?.find(p => p.matchId === match._id)
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
  }, [schedule])

  // Memoize stats calculation to only recalculate when schedule or bet changes
  const stats = useMemo(() => {
    return calculateStats(myBet)
  }, [myBet, calculateStats])
  
  // Get selected guest bet and its stats
  const selectedGuestBet = useMemo(() => {
    return guestBets.find(gb => gb._id === selectedGuestId) || null
  }, [guestBets, selectedGuestId])
  
  const guestStats = useMemo(() => {
    return calculateStats(selectedGuestBet)
  }, [selectedGuestBet, calculateStats])

  const getPredictionLabel = (prediction) => {
    switch (prediction) {
      case 'teamA': return 'L'
      case 'teamB': return 'V'
      case 'draw': return 'E'
      default: return '-'
    }
  }

  const getPredictionStatus = (matchId, bet = myBet) => {
    if (!schedule || !bet) return null
    
    const match = schedule.matches?.find(m => m._id === matchId)
    if (!match?.isCompleted) return null
    
    const prediction = bet.predictions?.find(p => p.matchId === matchId)
    if (!prediction) return null
    
    const actualResult = match.scoreTeamA > match.scoreTeamB ? 'teamA' 
      : match.scoreTeamA < match.scoreTeamB ? 'teamB' 
      : 'draw'
    
    return prediction.prediction === actualResult ? 'correct' : 'incorrect'
  }

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

            {/* Developer Upgrade Section - Only show if not already a developer */}
            {!isDeveloper && (
              <div className={`rounded-xl border p-5 ${
                isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 ${
                  isDark ? 'text-dark-400' : 'text-gray-500'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Developer Access
                </h3>
                
                {!showDevUpgrade ? (
                  <div>
                    <p className={`text-sm mb-3 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      Have a developer code? Upgrade your account to get protected admin privileges.
                    </p>
                    <button
                      onClick={() => setShowDevUpgrade(true)}
                      className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        isDark 
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30' 
                          : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      Enter Developer Code
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isDevCodeDisabled ? (
                      <div className={`p-3 rounded-lg text-sm ${
                        isDark ? 'bg-red-900/20 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span>🔒</span>
                          <div>
                            <span>Too many failed attempts.</span>
                            {getRemainingLockTime() && (
                              <span className="block text-xs mt-0.5 opacity-80">
                                Try again in {getRemainingLockTime()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <input
                          type="password"
                          value={devCode}
                          onChange={(e) => {
                            setDevCode(e.target.value)
                            if (devCodeError) setDevCodeError('')
                          }}
                          placeholder="Enter developer code"
                          disabled={isDevCodeDisabled}
                          className={`w-full px-3 py-2 rounded-lg text-sm border transition-colors ${
                            devCodeError
                              ? isDark
                                ? 'bg-dark-700 border-red-500 text-white placeholder-dark-400'
                                : 'bg-white border-red-500 text-gray-900 placeholder-gray-400'
                              : isDark 
                                ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400 focus:border-purple-500' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                          } focus:outline-none focus:ring-1 ${devCodeError ? 'focus:ring-red-500' : 'focus:ring-purple-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        />
                        {devCodeError && (
                          <p className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            {devCodeError}
                          </p>
                        )}
                      </>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDevUpgrade(false)
                          setDevCode('')
                          setDevCodeError('')
                        }}
                        disabled={upgrading}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          isDark 
                            ? 'bg-dark-700 text-dark-300 hover:bg-dark-600 border border-dark-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        Cancel
                      </button>
                      {!isDevCodeDisabled && (
                        <button
                          onClick={handleUpgradeToDeveloper}
                          disabled={upgrading || !devCode.trim()}
                          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {upgrading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Upgrading...
                            </>
                          ) : (
                            'Upgrade'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Developer Badge - Show if user is a developer */}
            {isDeveloper && (
              <div className={`rounded-xl border p-5 ${
                isDark ? 'bg-purple-900/20 border-purple-500/30' : 'bg-purple-50 border-purple-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                  }`}>
                    <span className="text-xl">👨‍💻</span>
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                      Developer Account
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                      Protected admin privileges • Cannot be deleted or demoted
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Predictions with Tabs */}
          <div className="lg:col-span-2">
            <div className={`rounded-xl border ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              {/* Tab Navigation */}
              <div className={`px-4 pt-4 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab('my')}
                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
                      activeTab === 'my'
                        ? isDark 
                          ? 'text-emerald-400 bg-dark-700/50' 
                          : 'text-emerald-600 bg-emerald-50'
                        : isDark 
                          ? 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/30' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <UserIcon />
                      My Predictions
                    </span>
                    {activeTab === 'my' && (
                      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                        isDark ? 'bg-emerald-500' : 'bg-emerald-600'
                      }`} />
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveTab('guests')
                      // Auto-select first guest if none selected
                      if (guestBets.length > 0 && !selectedGuestId) {
                        setSelectedGuestId(guestBets[0]._id)
                      }
                    }}
                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
                      activeTab === 'guests'
                        ? isDark 
                          ? 'text-purple-400 bg-dark-700/50' 
                          : 'text-purple-600 bg-purple-50'
                        : isDark 
                          ? 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/30' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <GuestIcon />
                      Guest Predictions
                      {guestBets.length > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          activeTab === 'guests'
                            ? isDark ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-200 text-purple-700'
                            : isDark ? 'bg-dark-600 text-dark-400' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {guestBets.length}
                        </span>
                      )}
                    </span>
                    {activeTab === 'guests' && (
                      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                        isDark ? 'bg-purple-500' : 'bg-purple-600'
                      }`} />
                    )}
                  </button>
                </div>
              </div>

              {/* My Predictions Tab Content */}
              {activeTab === 'my' && (
                <>
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
                              <span className="hidden sm:inline">{t('predictions.updatePrediction')}</span>
                              <span className="sm:hidden">Edit</span>
                            </Link>
                            <button
                              onClick={() => openDeleteModal('my')}
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
                        {/* PDF Download Button */}
                        <button
                          onClick={() => handleDownloadPDF()}
                          disabled={downloadingPDF || (!isAdmin && !lockStatus.hasStarted)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            downloadingPDF || (!isAdmin && !lockStatus.hasStarted)
                              ? 'opacity-50 cursor-not-allowed'
                              : isDark
                                ? 'bg-dark-700 hover:bg-dark-600 text-dark-200 border border-dark-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                          }`}
                          title={
                            !isAdmin && !lockStatus.hasStarted 
                              ? 'PDF only clickable after first game starts' 
                              : isSettled 
                                ? 'Download Results PDF' 
                                : 'Download Predictions PDF'
                          }
                        >
                          {downloadingPDF ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <PredictionContent
                    bet={myBet}
                    schedule={schedule}
                    stats={stats}
                    lockStatus={lockStatus}
                    isSettled={isSettled}
                    isAdmin={isAdmin}
                    isDark={isDark}
                    weekInfo={weekInfo}
                    onEdit={() => navigate('/place-bet')}
                    onDelete={() => openDeleteModal('my')}
                    onDownloadPDF={handleDownloadPDF}
                    downloadingPDF={downloadingPDF}
                    getPredictionLabel={getPredictionLabel}
                    getPredictionStatus={getPredictionStatus}
                    t={t}
                  />
                </>
              )}

              {/* Guest Predictions Tab Content */}
              {activeTab === 'guests' && (
                <>
                  {guestBets.length === 0 ? (
                    /* Empty State for Guests */
                    <div className="p-8 sm:p-12 text-center">
                      <div className={`w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                        isDark ? 'bg-dark-700' : 'bg-gray-100'
                      }`}>
                        <span className="text-3xl">👥</span>
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        No Guest Predictions
                      </h3>
                      <p className={`text-sm mb-6 max-w-sm mx-auto ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                        You haven't added any guest predictions yet. Click below to add one.
                      </p>
                      <button
                        onClick={() => handleOpenGuestModal()}
                        disabled={lockStatus.locked}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Guest Prediction
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Guest Sub-tabs */}
                      <div className={`px-4 py-3 border-b overflow-x-auto ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                        <div className="flex gap-2 min-w-max">
                          {guestBets.map((guest) => (
                            <button
                              key={guest._id}
                              onClick={() => setSelectedGuestId(guest._id)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                                selectedGuestId === guest._id
                                  ? isDark 
                                    ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40' 
                                    : 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
                                  : isDark 
                                    ? 'text-dark-400 hover:text-dark-200 hover:bg-dark-700' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                selectedGuestId === guest._id
                                  ? 'bg-purple-500 text-white'
                                  : isDark ? 'bg-dark-600 text-dark-300' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {guest.participantName?.charAt(0).toUpperCase()}
                              </span>
                              <span className="truncate max-w-[100px]">{guest.participantName}</span>
                              {guest.paid && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Paid" />
                              )}
                            </button>
                          ))}
                          {/* Add Guest Button */}
                          {!lockStatus.locked && (
                            <button
                              onClick={() => handleOpenGuestModal()}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                                isDark 
                                  ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-dashed border-purple-500/30' 
                                  : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-dashed border-purple-300'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Guest Header with Actions */}
                      {selectedGuestBet && (
                        <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDark ? 'border-dark-700' : 'border-gray-200'
                        }`}>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {selectedGuestBet.participantName}'s Predictions
                              </h2>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                              }`}>
                                Guest
                              </span>
                            </div>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                              Week {weekInfo.weekNumber}, {weekInfo.year} • {schedule?.matches?.length || 0} matches
                            </p>
                          </div>
                          
                          {/* Guest Action Buttons */}
                          <div className="flex items-center gap-2">
                            {!lockStatus.locked && (
                              <>
                                <button
                                  onClick={() => handleOpenGuestModal(selectedGuestBet)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                                >
                                  <EditIcon />
                                  <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button
                                  onClick={() => openDeleteModal('guest', selectedGuestBet._id, selectedGuestBet.participantName)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    isDark 
                                      ? 'text-red-400 hover:bg-red-500/10 border border-red-500/30' 
                                      : 'text-red-600 hover:bg-red-50 border border-red-200'
                                  }`}
                                >
                                  <TrashIcon />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              </>
                            )}
                            {lockStatus.locked && (
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                isDark ? 'bg-dark-700 text-dark-400' : 'bg-gray-100 text-gray-500'
                              }`}>
                                🔒 Locked
                              </span>
                            )}
                            {/* PDF Download Button */}
                            <button
                              onClick={() => handleDownloadPDF(selectedGuestBet)}
                              disabled={downloadingPDF || (!isAdmin && !lockStatus.hasStarted)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                downloadingPDF || (!isAdmin && !lockStatus.hasStarted)
                                  ? 'opacity-50 cursor-not-allowed'
                                  : isDark
                                    ? 'bg-dark-700 hover:bg-dark-600 text-dark-200 border border-dark-600'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                              }`}
                            >
                              {downloadingPDF ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                              <span className="hidden sm:inline">PDF</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Guest Content */}
                      {selectedGuestBet && (
                        <PredictionContent
                          bet={selectedGuestBet}
                          schedule={schedule}
                          stats={guestStats}
                          lockStatus={lockStatus}
                          isSettled={isSettled}
                          isAdmin={isAdmin}
                          isDark={isDark}
                          weekInfo={weekInfo}
                          onEdit={() => navigate(`/place-bet?editGuest=${selectedGuestBet._id}`)}
                          onDelete={() => openDeleteModal('guest', selectedGuestBet._id, selectedGuestBet.participantName)}
                          onDownloadPDF={() => handleDownloadPDF(selectedGuestBet)}
                          downloadingPDF={downloadingPDF}
                          getPredictionLabel={getPredictionLabel}
                          getPredictionStatus={getPredictionStatus}
                          isGuest={true}
                          guestName={selectedGuestBet.participantName}
                          t={t}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleDeleteBet}
        title={deleteTarget?.type === 'guest' ? `Delete Guest Prediction` : 'Delete Prediction'}
        message={deleteTarget?.type === 'guest' 
          ? `Are you sure you want to delete the prediction for "${deleteTarget?.guestName}"? This action cannot be undone.`
          : "This action cannot be undone. You'll need to place a new prediction."}
        confirmText="Delete"
        isDark={isDark}
        isLoading={deleting}
      />

      {/* Guest Bet Modal */}
      <GuestBetModal
        isOpen={guestBetModal.isOpen}
        onClose={handleCloseGuestModal}
        schedule={schedule}
        weekInfo={weekInfo}
        isDark={isDark}
        onSubmit={handleGuestBetSubmit}
        editingGuest={guestBetModal.editingGuest}
        isSubmitting={isSubmittingGuest}
      />
    </div>
  )
}
