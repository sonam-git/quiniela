import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates'
import api, { downloadPredictionPDF, downloadResultsPDF } from '../services/api'
import toast from 'react-hot-toast'
import { EditIcon, CalendarIcon, CheckIcon } from './Profile'

// Confirmation Modal Component
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText, confirmStyle, isLoading }) {
  const { isDark } = useTheme()
  
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
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
            confirmStyle === 'danger' 
              ? isDark ? 'bg-red-900/30' : 'bg-red-100'
              : isDark ? 'bg-amber-900/30' : 'bg-amber-100'
          }`}>
            <span className="text-2xl">
              {confirmStyle === 'danger' ? '⚠️' : '👑'}
            </span>
          </div>
          
          {/* Title */}
          <h3 className={`text-lg font-semibold text-center mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {title}
          </h3>
          
          {/* Message */}
          <p className={`text-sm text-center mb-6 ${
            isDark ? 'text-dark-300' : 'text-gray-600'
          }`}>
            {message}
          </p>
          
          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-dark-700 text-dark-200 hover:bg-dark-600 border border-dark-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                confirmStyle === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              } disabled:opacity-50`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Liga MX Teams (18 teams in Liga MX Clausura 2026)
const LIGA_MX_TEAMS = [
  'Club América',
  'Atlas',
  'Atl. San Luis',
  'Club León',
  'Club Tijuana',
  'Cruz Azul',
  'FC Juárez',
  'Guadalajara Chivas',
  'Mazatlán FC',
  'Monterrey',
  'Necaxa',
  'Pachuca',
  'Puebla',
  'Querétaro',
  'Santos Laguna',
  'Tigres UANL',
  'Toluca',
  'UNAM Pumas'
]

export default function Admin() {
  const [users, setUsers] = useState([])
  const [bets, setBets] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [codes, setCodes] = useState({ signupCode: '', adminCode: '' })
  const [newSignupCode, setNewSignupCode] = useState('')
  const [newAdminCode, setNewAdminCode] = useState('')
  const [showCodeForm, setShowCodeForm] = useState(false)
  const [weekInfo, setWeekInfo] = useState({ weekNumber: 0, year: 0 })
  
  // Schedule/Matches state
  const [schedule, setSchedule] = useState(null)
  const [matchesSubTab, setMatchesSubTab] = useState('schedule') // 'schedule', 'update', 'settle'
  const [editingMatch, setEditingMatch] = useState(null)
  const [matchScores, setMatchScores] = useState({ scoreTeamA: '', scoreTeamB: '' })
  const [matchLoading, setMatchLoading] = useState(false)
  
  // Schedule Management state
  const [allSchedules, setAllSchedules] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [editingScheduleMatch, setEditingScheduleMatch] = useState(null)
  const [scheduleMatchForm, setScheduleMatchForm] = useState({ teamA: '', teamB: '', startTime: '' })
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [showCreateSchedule, setShowCreateSchedule] = useState(false)
  const [newScheduleForm, setNewScheduleForm] = useState({
    weekNumber: '',
    year: new Date().getFullYear(),
    jornada: '',
    matches: Array(9).fill({ teamA: '', teamB: '', date: '', time: '' })
  })
  
  // Announcement state
  const [announcements, setAnnouncements] = useState([])
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' })
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [announcementLoading, setAnnouncementLoading] = useState(false)
  
  // PDF download state
  const [downloadingPDF, setDownloadingPDF] = useState(null) // Tracks which schedule PDF is downloading
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmStyle: 'danger',
    onConfirm: () => {},
    isLoading: false
  })
  
  // Ref to track pending changes to avoid duplicate updates from socket events
  // Maps userId to timestamp of when the change was initiated
  const pendingChangesRef = useRef(new Map())
  
  const { user, isAdmin, isDeveloper } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('admin')
  const navigate = useNavigate()

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      toast.error(t('errors.loadFailed'))
      navigate('/dashboard')
    }
  }, [isAdmin, navigate, t])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Base requests for all admins
      const baseRequests = [
        api.get('/admin/users'),
        api.get('/admin/bets'),
        api.get('/admin/payments'),
        api.get('/admin/announcements'),
        api.get('/admin/schedule').catch(() => ({ data: { schedule: null } })),
        api.get('/admin/schedules').catch(() => ({ data: { schedules: [] } }))
      ]
      
      const [usersRes, betsRes, paymentsRes, announcementsRes, scheduleRes, schedulesRes] = await Promise.all(baseRequests)
      
      setUsers(usersRes.data.users)
      setBets(betsRes.data.bets)
      setPayments(paymentsRes.data.payments || [])
      setWeekInfo(paymentsRes.data.weekInfo || betsRes.data.weekInfo || { weekNumber: 0, year: 0 })
      setAnnouncements(announcementsRes.data.announcements || [])
      setSchedule(scheduleRes.data.schedule)
      setAllSchedules(schedulesRes.data.schedules || [])
      
      // Only fetch codes if user is a developer
      if (isDeveloper) {
        try {
          const codesRes = await api.get('/admin/codes')
          setCodes(codesRes.data)
        } catch (error) {
          console.log('Could not fetch codes - developer access required')
        }
      }
    } catch (error) {
      toast.error('Failed to load admin data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [isDeveloper])

  useEffect(() => {
    if (isAdmin) {
      fetchData()
    }
  }, [isAdmin, fetchData])

  // Targeted real-time update handlers to minimize re-renders

  // Handle payment updates - only update specific user's payment status
  const handlePaymentsUpdate = useCallback((data) => {
    if (!isAdmin) return
    
    console.log('💳 Admin: Payment update received:', data)
    
    if (data?.userId) {
      // Check if this is a pending change we initiated (skip to avoid double-update)
      const pendingChange = pendingChangesRef.current.get(data.userId)
      if (pendingChange) {
        const timeSinceChange = Date.now() - pendingChange.timestamp
        if (timeSinceChange < 5000 && pendingChange.status === data.status) {
          console.log('Skipping socket update for pending change:', data.userId)
          pendingChangesRef.current.delete(data.userId)
          return
        }
      }
      
      // Update payments state locally
      setPayments(prev => prev.map(p => {
        if (p.userId === data.userId || p.userId?.toString() === data.userId) {
          return { 
            ...p, 
            paid: data.paid ?? (data.status === 'paid'),
            paymentStatus: data.status || (data.paid ? 'paid' : 'pending'),
            hasBet: data.status !== 'na'
          }
        }
        return p
      }))
      
      // Also update bets state if betId provided
      if (data.betId) {
        setBets(prev => prev.map(b => 
          b._id === data.betId ? { ...b, paid: data.paid ?? (data.status === 'paid') } : b
        ))
      }
    }
  }, [isAdmin])

  // Handle results updates - only update specific match scores
  const handleResultsUpdate = useCallback((data) => {
    if (!isAdmin) return
    
    console.log('📊 Admin: Results update received:', data)
    
    if (data?.matchId) {
      // Update current schedule
      setSchedule(prev => {
        if (!prev) return prev
        return {
          ...prev,
          matches: prev.matches.map(match => 
            match._id === data.matchId
              ? { 
                  ...match, 
                  scoreTeamA: data.scoreTeamA ?? match.scoreTeamA,
                  scoreTeamB: data.scoreTeamB ?? match.scoreTeamB,
                  isCompleted: data.isCompleted ?? match.isCompleted,
                  result: data.result ?? match.result
                }
              : match
          )
        }
      })
      
      // Also update in allSchedules
      setAllSchedules(prev => prev.map(sched => {
        if (sched.weekNumber === data.weekNumber && sched.year === data.year) {
          return {
            ...sched,
            matches: sched.matches.map(match =>
              match._id === data.matchId
                ? { 
                    ...match, 
                    scoreTeamA: data.scoreTeamA ?? match.scoreTeamA,
                    scoreTeamB: data.scoreTeamB ?? match.scoreTeamB,
                    isCompleted: data.isCompleted ?? match.isCompleted,
                    result: data.result ?? match.result
                  }
                : match
            )
          }
        }
        return sched
      }))
    }
  }, [isAdmin])

  // Handle bets updates - update specific bet or refetch if needed
  const handleBetsUpdate = useCallback((data) => {
    if (!isAdmin) return
    
    console.log('🎯 Admin: Bets update received:', data)
    
    if (data?.bet) {
      setBets(prev => {
        const exists = prev.find(b => b._id === data.bet._id)
        if (exists) {
          return prev.map(b => b._id === data.bet._id ? data.bet : b)
        } else {
          return [...prev, data.bet]
        }
      })
    } else if (data?.betId && data?.deleted) {
      setBets(prev => prev.filter(b => b._id !== data.betId))
    } else if (data?.action === 'create' || data?.action === 'update') {
      // New bet created or updated - refetch just bets
      api.get('/admin/bets').then(res => {
        setBets(res.data.bets)
      }).catch(console.error)
    }
  }, [isAdmin])

  // Handle announcement updates
  const handleAnnouncementUpdate = useCallback((data) => {
    if (!isAdmin) return
    
    console.log('📢 Admin: Announcement update received:', data)
    
    if (data?.announcements) {
      setAnnouncements(data.announcements)
    } else if (data?.announcement) {
      setAnnouncements(prev => {
        const exists = prev.find(a => a._id === data.announcement._id)
        if (exists) {
          return prev.map(a => a._id === data.announcement._id ? data.announcement : a)
        } else {
          return [data.announcement, ...prev]
        }
      })
    } else if (data?.deleted) {
      setAnnouncements(prev => prev.filter(a => a._id !== data.deleted))
    } else {
      // Refetch announcements if no specific data
      api.get('/admin/announcements').then(res => {
        setAnnouncements(res.data.announcements || [])
      }).catch(console.error)
    }
  }, [isAdmin])

  // Handle schedule created event
  const handleScheduleCreated = useCallback((data) => {
    if (!isAdmin || !data?.schedule) return
    
    console.log('📅 Admin: Schedule created:', data)
    toast.success(`📅 New schedule created for Week ${data.schedule.weekNumber}`, { id: 'schedule-created' })
    
    // Update allSchedules state
    setAllSchedules(prev => {
      const exists = prev.some(s => s._id === data.schedule._id)
      if (exists) {
        return prev.map(s => s._id === data.schedule._id ? data.schedule : s)
      }
      return [data.schedule, ...prev].sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year
        return b.weekNumber - a.weekNumber
      })
    })
    
    // Update current schedule if it matches
    if (data.schedule.weekNumber === weekInfo.weekNumber && data.schedule.year === weekInfo.year) {
      setSchedule(data.schedule)
    }
  }, [isAdmin, weekInfo])

  // Handle schedule updated event (team/date changes)
  const handleScheduleUpdated = useCallback((data) => {
    if (!isAdmin || !data?.schedule) return
    
    console.log('📅 Admin: Schedule updated:', data)
    
    // Update allSchedules state
    setAllSchedules(prev => prev.map(s => 
      s._id === data.schedule._id ? data.schedule : s
    ))
    
    // Update current schedule if it matches
    if (data.schedule._id === schedule?._id) {
      setSchedule(data.schedule)
    }
  }, [isAdmin, schedule?._id])

  // Handle schedule deleted event
  const handleScheduleDeleted = useCallback((data) => {
    if (!isAdmin || !data) return
    
    console.log('🗑️ Admin: Schedule deleted:', data)
    toast.success(`📅 Schedule for Week ${data.weekNumber} deleted`, { id: 'schedule-deleted' })
    
    // Remove from allSchedules state
    setAllSchedules(prev => prev.filter(s => s._id !== data.scheduleId))
    
    // Clear current schedule if it was deleted
    if (schedule?._id === data.scheduleId) {
      setSchedule(null)
    }
    
    // Remove bets associated with the deleted schedule's week
    setBets(prev => prev.filter(b => 
      !(b.weekNumber === data.weekNumber && b.year === data.year)
    ))
  }, [isAdmin, schedule?._id])

  // Handle week settled event
  const handleWeekSettled = useCallback((data) => {
    if (!isAdmin || !data) return
    
    console.log('🏆 Admin: Week settled:', data)
    toast.success(
      <div>
        <p className="font-semibold">🏆 Week {data.weekNumber} Settled!</p>
        <p className="text-sm">Total Goals: {data.actualTotalGoals} • Winners: {data.winnersCount}</p>
      </div>,
      { duration: 5000, id: 'week-settled' }
    )
    
    // Update schedule state
    setSchedule(prev => prev ? { ...prev, isSettled: true, actualTotalGoals: data.actualTotalGoals } : prev)
    
    // Update allSchedules state
    setAllSchedules(prev => prev.map(s => 
      s.weekNumber === data.weekNumber && s.year === data.year
        ? { ...s, isSettled: true, actualTotalGoals: data.actualTotalGoals }
        : s
    ))
    
    // Switch to schedule sub-tab to show results
    setMatchesSubTab('schedule')
    
    // Refetch bets to get updated winner info
    api.get('/admin/bets').then(res => {
      setBets(res.data.bets)
    }).catch(console.error)
  }, [isAdmin])

  // Handle generic admin updates (user changes, etc.)
  const handleAdminUpdate = useCallback((data) => {
    if (!isAdmin) return
    
    console.log('👤 Admin: Admin update received:', data)
    
    // For user-related changes, update users state
    if (data?.user) {
      setUsers(prev => prev.map(u => u._id === data.user._id ? data.user : u))
    } else if (data?.deleted && data?.userId) {
      setUsers(prev => prev.filter(u => u._id !== data.userId))
    } else {
      // Unknown admin update - refetch users
      api.get('/admin/users').then(res => {
        setUsers(res.data.users)
      }).catch(console.error)
    }
  }, [isAdmin])

  useRealTimeUpdates({
    onPaymentsUpdate: handlePaymentsUpdate,
    onBetsUpdate: handleBetsUpdate,
    onScheduleUpdate: handleScheduleUpdated,
    onScheduleCreated: handleScheduleCreated,
    onScheduleUpdated: handleScheduleUpdated,
    onScheduleDeleted: handleScheduleDeleted,
    onResultsUpdate: handleResultsUpdate,
    onAnnouncementUpdate: handleAnnouncementUpdate,
    onAdminUpdate: handleAdminUpdate,
    onSettled: handleWeekSettled
  })

  const handleTogglePayment = async (betId, currentStatus) => {
    try {
      const newStatus = !currentStatus
      
      // Optimistically update the UI
      setBets(prev => prev.map(b => 
        b._id === betId ? { ...b, paid: newStatus } : b
      ))
      setPayments(prev => prev.map(p => 
        p.betId === betId ? { ...p, paid: newStatus, paymentStatus: newStatus ? 'paid' : 'pending' } : p
      ))
      
      await api.patch(`/admin/bets/${betId}/payment`, { paid: newStatus })
      toast.success(`Payment status updated to ${newStatus ? 'Paid' : 'Pending'}`)
    } catch (error) {
      // Revert on error
      setBets(prev => prev.map(b => 
        b._id === betId ? { ...b, paid: currentStatus } : b
      ))
      setPayments(prev => prev.map(p => 
        p.betId === betId ? { ...p, paid: currentStatus, paymentStatus: currentStatus ? 'paid' : 'pending' } : p
      ))
      toast.error('Failed to update payment status')
    }
  }

  const handleChangePaymentStatus = async (userId, newStatus) => {
    // Find the current payment data for this user to enable rollback
    // Note: payments use `userId` field (not `id`)
    const currentPayment = payments.find(p => p.userId === userId || p.userId?.toString() === userId)
    const previousStatus = currentPayment?.paymentStatus || 'na'
    
    try {
      // Record this as a pending change to prevent socket event from overwriting
      pendingChangesRef.current.set(userId, {
        status: newStatus,
        timestamp: Date.now()
      })
      
      // Optimistically update the UI
      setPayments(prev => prev.map(p => {
        if (p.userId === userId || p.userId?.toString() === userId) {
          return { 
            ...p, 
            paid: newStatus === 'paid',
            paymentStatus: newStatus,
            hasBet: newStatus !== 'na'
          }
        }
        return p
      }))
      
      await api.patch(`/admin/users/${userId}/payment`, { status: newStatus })
      const statusLabels = { paid: 'Paid', pending: 'Pending', na: 'N/A' }
      toast.success(`Payment status updated to ${statusLabels[newStatus]}`)
    } catch (error) {
      // Remove pending change on error
      pendingChangesRef.current.delete(userId)
      
      // Revert on error
      setPayments(prev => prev.map(p => {
        if (p.userId === userId || p.userId?.toString() === userId) {
          return { 
            ...p, 
            paid: previousStatus === 'paid',
            paymentStatus: previousStatus,
            hasBet: previousStatus !== 'na'
          }
        }
        return p
      }))
      toast.error(error.response?.data?.message || 'Failed to update payment status')
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
      confirmText: 'Delete User',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }))
        try {
          await api.delete(`/admin/users/${userId}`)
          toast.success('User deleted successfully')
          // Update state locally instead of full refetch
          setUsers(prev => prev.filter(u => u._id !== userId))
          setPayments(prev => prev.filter(p => p.userId !== userId))
          setBets(prev => prev.filter(b => b.userId !== userId && b.userId?._id !== userId))
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to delete user')
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }))
        }
      }
    })
  }

  const handleUpdateCodes = async (e) => {
    e.preventDefault()
    try {
      const updates = {}
      if (newSignupCode.trim()) updates.signupCode = newSignupCode.trim()
      if (newAdminCode.trim()) updates.adminCode = newAdminCode.trim()
      
      if (Object.keys(updates).length === 0) {
        toast.error('Please enter at least one new code')
        return
      }

      const response = await api.patch('/admin/codes', updates)
      
      // Build success message based on what was updated
      const updatedCodes = []
      if (newSignupCode.trim()) updatedCodes.push(`Signup code → ${response.data.signupCode}`)
      if (newAdminCode.trim()) updatedCodes.push(`Admin code → ${response.data.adminCode}`)
      
      toast.success(
        <div>
          <p className="font-semibold">✅ Codes updated successfully!</p>
          <p className="text-xs mt-1 opacity-90">{updatedCodes.join(' | ')}</p>
          <p className="text-xs mt-1 opacity-75">Note: Existing users can still login normally.</p>
        </div>,
        { duration: 5000 }
      )
      
      // Update codes state locally instead of full refetch
      setCodes(prev => ({
        ...prev,
        signupCode: response.data.signupCode || prev.signupCode,
        adminCode: response.data.adminCode || prev.adminCode
      }))
      setNewSignupCode('')
      setNewAdminCode('')
      setShowCodeForm(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update codes')
    }
  }

  const handleToggleAdmin = async (userId, currentStatus, userName) => {
    setConfirmModal({
      isOpen: true,
      title: currentStatus ? 'Revoke Admin Privileges' : 'Grant Admin Privileges',
      message: `Are you sure you want to ${currentStatus ? 'remove' : 'grant'} admin privileges for "${userName}"?`,
      confirmText: currentStatus ? 'Revoke Admin' : 'Grant Admin',
      confirmStyle: 'amber',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }))
        try {
          await api.patch(`/admin/users/${userId}/admin`, { isAdmin: !currentStatus })
          toast.success(`Admin privileges ${!currentStatus ? 'granted' : 'removed'} for ${userName}`)
          // Update users state locally instead of full refetch
          setUsers(prev => prev.map(u => 
            u._id === userId ? { ...u, isAdmin: !currentStatus } : u
          ))
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to update admin status')
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }))
        }
      }
    })
  }

  // Announcement handlers
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault()
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      toast.error('Please enter both title and message')
      return
    }

    try {
      setAnnouncementLoading(true)
      const response = await api.post('/admin/announcements', newAnnouncement)
      toast.success('Announcement published successfully!')
      // Update announcements state locally instead of full refetch
      if (response.data.announcement) {
        setAnnouncements(prev => [response.data.announcement, ...prev])
      }
      setNewAnnouncement({ title: '', message: '' })
      setShowAnnouncementForm(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create announcement')
    } finally {
      setAnnouncementLoading(false)
    }
  }

  const handleToggleAnnouncement = async (id, currentStatus) => {
    try {
      await api.patch(`/admin/announcements/${id}`, { isActive: !currentStatus })
      toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`)
      // Update announcements state locally
      setAnnouncements(prev => prev.map(a => 
        a._id === id ? { ...a, isActive: !currentStatus } : a
      ))
    } catch (error) {
      toast.error('Failed to update announcement')
    }
  }

  const handleDeleteAnnouncement = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Announcement',
      message: 'Are you sure you want to delete this announcement? This action cannot be undone.',
      confirmText: 'Delete',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }))
        try {
          await api.delete(`/admin/announcements/${id}`)
          toast.success('Announcement deleted')
          // Update announcements state locally
          setAnnouncements(prev => prev.filter(a => a._id !== id))
        } catch (error) {
          toast.error('Failed to delete announcement')
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }))
        }
      }
    })
  }

  // Match score handlers
  const handleEditMatch = (match) => {
    setEditingMatch(match._id)
    setMatchScores({
      scoreTeamA: match.scoreTeamA !== null ? match.scoreTeamA.toString() : '',
      scoreTeamB: match.scoreTeamB !== null ? match.scoreTeamB.toString() : ''
    })
  }

  const handleCancelEdit = () => {
    setEditingMatch(null)
    setMatchScores({ scoreTeamA: '', scoreTeamB: '' })
  }

  const handleSaveMatchScore = async (matchId) => {
    if (matchScores.scoreTeamA === '' || matchScores.scoreTeamB === '') {
      toast.error('Please enter both scores')
      return
    }

    try {
      setMatchLoading(true)
      const response = await api.patch(`/admin/schedule/match/${matchId}`, {
        scoreTeamA: parseInt(matchScores.scoreTeamA),
        scoreTeamB: parseInt(matchScores.scoreTeamB)
      })
      toast.success('Match score saved successfully')
      setEditingMatch(null)
      setMatchScores({ scoreTeamA: '', scoreTeamB: '' })
      // Update schedule state locally
      if (response.data.schedule) {
        setSchedule(response.data.schedule)
        setAllSchedules(prev => prev.map(s => 
          s._id === response.data.schedule._id ? response.data.schedule : s
        ))
      } else if (response.data.match) {
        // Update just the match in schedule
        setSchedule(prev => ({
          ...prev,
          matches: prev.matches.map(m => 
            m._id === matchId ? response.data.match : m
          )
        }))
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save match score')
    } finally {
      setMatchLoading(false)
    }
  }

  const handleResetMatchScore = async (matchId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Match Score',
      message: 'Are you sure you want to reset this match score? The match will be marked as not completed.',
      confirmText: 'Reset Score',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }))
        try {
          const response = await api.patch(`/admin/schedule/match/${matchId}/reset`)
          toast.success('Match score reset successfully')
          // Update schedule state locally
          if (response.data.schedule) {
            setSchedule(response.data.schedule)
            setAllSchedules(prev => prev.map(s => 
              s._id === response.data.schedule._id ? response.data.schedule : s
            ))
          } else if (response.data.match) {
            setSchedule(prev => ({
              ...prev,
              matches: prev.matches.map(m => 
                m._id === matchId ? response.data.match : m
              )
            }))
          }
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to reset match score')
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }))
        }
      }
    })
  }

  const handleSettleWeek = async () => {
    const completedCount = schedule?.matches?.filter(m => m.isCompleted).length || 0
    const totalMatches = schedule?.matches?.length || 9
    
    if (completedCount < totalMatches) {
      toast.error(`Cannot settle - only ${completedCount}/${totalMatches} matches completed`)
      return
    }

    setConfirmModal({
      isOpen: true,
      title: 'Settle Week',
      message: 'Are you sure you want to settle this week? This will calculate the total goals and finalize the results.',
      confirmText: 'Settle Week',
      confirmStyle: 'amber',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }))
        try {
          const response = await api.post('/admin/schedule/settle')
          toast.success(`Week settled! Total goals: ${response.data.actualTotalGoals}`)
          // Update schedule state locally
          setSchedule(prev => prev ? { 
            ...prev, 
            isSettled: true, 
            actualTotalGoals: response.data.actualTotalGoals 
          } : prev)
          setAllSchedules(prev => prev.map(s => 
            s.weekNumber === weekInfo.weekNumber && s.year === weekInfo.year
              ? { ...s, isSettled: true, actualTotalGoals: response.data.actualTotalGoals }
              : s
          ))
          // Only refetch bets to get updated winner info
          if (response.data.bets) {
            setBets(response.data.bets)
          } else {
            api.get('/admin/bets').then(res => setBets(res.data.bets)).catch(console.error)
          }
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to settle week')
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }))
        }
      }
    })
  }

  // Schedule Management Handlers
  
  // PDF Download handlers for Admin
  const handleDownloadPredictionPDF = async (weekNumber, year) => {
    const key = `pred-${weekNumber}-${year}`
    setDownloadingPDF(key)
    try {
      await downloadPredictionPDF(weekNumber, year)
      toast.success('Predictions PDF downloaded!')
    } catch (error) {
      toast.error(error.message || 'Failed to download PDF')
    } finally {
      setDownloadingPDF(null)
    }
  }

  const handleDownloadResultsPDF = async (weekNumber, year) => {
    const key = `res-${weekNumber}-${year}`
    setDownloadingPDF(key)
    try {
      await downloadResultsPDF(weekNumber, year)
      toast.success('Results PDF downloaded!')
    } catch (error) {
      toast.error(error.message || 'Failed to download PDF')
    } finally {
      setDownloadingPDF(null)
    }
  }
  
  const handleEditScheduleMatch = (scheduleId, match) => {
    setSelectedSchedule(scheduleId)
    setEditingScheduleMatch(match._id)
    setScheduleMatchForm({
      teamA: match.teamA,
      teamB: match.teamB,
      startTime: new Date(match.startTime).toISOString().slice(0, 16) // Format for datetime-local input
    })
  }

  const handleCancelScheduleEdit = () => {
    setEditingScheduleMatch(null)
    setSelectedSchedule(null)
    setScheduleMatchForm({ teamA: '', teamB: '', startTime: '' })
  }

  const handleSaveScheduleMatch = async () => {
    if (!scheduleMatchForm.teamA || !scheduleMatchForm.teamB || !scheduleMatchForm.startTime) {
      toast.error('All fields are required')
      return
    }

    try {
      setScheduleLoading(true)
      const response = await api.put(`/admin/schedules/${selectedSchedule}/match/${editingScheduleMatch}`, {
        teamA: scheduleMatchForm.teamA,
        teamB: scheduleMatchForm.teamB,
        startTime: scheduleMatchForm.startTime
      })
      toast.success('Match updated successfully')
      handleCancelScheduleEdit()
      // Update schedule state locally
      if (response.data.schedule) {
        setAllSchedules(prev => prev.map(s => 
          s._id === response.data.schedule._id ? response.data.schedule : s
        ))
        if (schedule?._id === response.data.schedule._id) {
          setSchedule(response.data.schedule)
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update match')
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleRefreshSchedule = async () => {
    try {
      setScheduleLoading(true)
      const response = await api.post('/admin/schedules/refresh')
      if (response.data.success) {
        toast.success(response.data.message)
        // Update schedule states locally if data provided
        if (response.data.schedule) {
          setSchedule(response.data.schedule)
          setAllSchedules(prev => {
            const exists = prev.some(s => s._id === response.data.schedule._id)
            if (exists) {
              return prev.map(s => s._id === response.data.schedule._id ? response.data.schedule : s)
            }
            return [response.data.schedule, ...prev].sort((a, b) => {
              if (b.year !== a.year) return b.year - a.year
              return b.weekNumber - a.weekNumber
            })
          })
        } else {
          // Refetch schedules if no data provided
          api.get('/admin/schedules').then(res => {
            setAllSchedules(res.data.schedules || [])
          }).catch(console.error)
          api.get('/admin/schedule').then(res => {
            setSchedule(res.data.schedule)
          }).catch(console.error)
        }
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to refresh schedule')
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Schedule',
      message: 'Are you sure you want to delete this schedule? All associated bets will also be deleted. This action cannot be undone.',
      confirmText: 'Delete Schedule',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }))
        try {
          await api.delete(`/admin/schedules/${scheduleId}`)
          toast.success('Schedule deleted successfully')
          // Update schedule states locally
          setAllSchedules(prev => prev.filter(s => s._id !== scheduleId))
          if (schedule?._id === scheduleId) {
            setSchedule(null)
          }
          // Also remove bets associated with this schedule
          setBets(prev => prev.filter(b => b.scheduleId !== scheduleId))
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to delete schedule')
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }))
        }
      }
    })
  }

  const handleCreateSchedule = async (e) => {
    e.preventDefault()
    
    // Validate
    if (!newScheduleForm.weekNumber || !newScheduleForm.year) {
      toast.error('Week number and year are required')
      return
    }

    const validMatches = newScheduleForm.matches.filter(m => m.teamA && m.teamB && m.date && m.time)
    if (validMatches.length !== 9) {
      toast.error('All 9 matches must be filled in')
      return
    }

    try {
      setScheduleLoading(true)
      await api.post('/admin/schedules/create', {
        weekNumber: parseInt(newScheduleForm.weekNumber),
        year: parseInt(newScheduleForm.year),
        jornada: newScheduleForm.jornada ? parseInt(newScheduleForm.jornada) : null,
        matches: newScheduleForm.matches.map(m => ({
          teamA: m.teamA,
          teamB: m.teamB,
          date: m.date,
          time: m.time
        }))
      })
      // Success toast and state updates will be handled by real-time event (handleScheduleCreated)
      setShowCreateSchedule(false)
      setNewScheduleForm({
        weekNumber: '',
        year: new Date().getFullYear(),
        jornada: '',
        matches: Array(9).fill({ teamA: '', teamB: '', date: '', time: '' })
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create schedule')
    } finally {
      setScheduleLoading(false)
    }
  }

  const updateNewScheduleMatch = (index, field, value) => {
    setNewScheduleForm(prev => ({
      ...prev,
      matches: prev.matches.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }))
  }

  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-8 w-8 border-2 mx-auto ${
            isDark ? 'border-emerald-500 border-t-transparent' : 'border-emerald-600 border-t-transparent'
          }`} />
          <p className={`mt-3 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{t('common.loading', { ns: 'common' })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-amber-900/30' : 'bg-amber-100'
            }`}>
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <h1 className={`text-2xl font-brand ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Admin Panel
              </h1>
              <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                Manage users, payments, and settings
              </p>
            </div>
          </div>
        </div>

        {/* Announcements Section - Quick Access */}
        <div className={`mb-6 rounded-xl border ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className={`px-5 py-4 border-b flex items-center justify-between ${
            isDark ? 'border-dark-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'
              }`}>
                <span className="text-lg">📢</span>
              </div>
              <div>
                <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Announcements
                </h2>
                <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  {announcements.filter(a => a.isActive).length} active · {announcements.length} total
                </p>
              </div>
            </div>
            {!showAnnouncementForm && (
              <button
                onClick={() => setShowAnnouncementForm(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <span>➕</span>
                <span className="hidden sm:inline">New Announcement</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
          </div>
          <div className="p-5">
            {/* Create Announcement Form */}
            {showAnnouncementForm && (
              <form onSubmit={handleCreateAnnouncement} className={`mb-6 p-4 rounded-xl border-2 border-dashed ${
                isDark ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-emerald-300 bg-emerald-50/50'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'
                  }`}>
                    <span className="text-lg">✏️</span>
                  </div>
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Create New Announcement
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${
                      isDark ? 'text-dark-300' : 'text-gray-600'
                    }`}>
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                      maxLength={100}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm ${
                        isDark 
                          ? 'bg-dark-700 border border-dark-600 text-dark-100 placeholder-dark-400' 
                          : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                      placeholder="e.g., Important Update, Week 5 Results, etc."
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                      {newAnnouncement.title.length}/100 characters
                    </p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${
                      isDark ? 'text-dark-300' : 'text-gray-600'
                    }`}>
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newAnnouncement.message}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                      maxLength={500}
                      rows={3}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm resize-none ${
                        isDark 
                          ? 'bg-dark-700 border border-dark-600 text-dark-100 placeholder-dark-400' 
                          : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                      placeholder="Write your announcement message here..."
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                      {newAnnouncement.message.length}/500 characters
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAnnouncementForm(false)
                      setNewAnnouncement({ title: '', message: '' })
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-dark-600 text-dark-200 hover:bg-dark-500' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={announcementLoading || !newAnnouncement.title.trim() || !newAnnouncement.message.trim()}
                    className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {announcementLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <span>📢</span>
                        <span>Publish</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Announcements List */}
            {announcements.length === 0 ? (
              <div className={`text-center py-6 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                <p className="text-sm">No announcements yet</p>
                <p className="text-xs mt-1 opacity-75">Create your first announcement to notify users</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {announcements.map((announcement) => (
                  <div
                    key={announcement._id}
                    className={`p-3 rounded-lg border transition-all ${
                      announcement.isActive
                        ? isDark 
                          ? 'bg-emerald-900/10 border-emerald-800/30' 
                          : 'bg-emerald-50/50 border-emerald-200'
                        : isDark 
                          ? 'bg-dark-700/50 border-dark-600 opacity-60' 
                          : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-semibold truncate ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {announcement.title}
                          </h4>
                          <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${
                            announcement.isActive
                              ? isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                              : isDark ? 'bg-dark-600 text-dark-400' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {announcement.isActive ? '🟢 Live' : '⚫ Off'}
                          </span>
                        </div>
                        <p className={`text-xs line-clamp-2 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                          {announcement.message}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleToggleAnnouncement(announcement._id, announcement.isActive)}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            announcement.isActive
                              ? isDark ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : isDark ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                          title={announcement.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {announcement.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement._id)}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards - AWS Style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className={`px-3 py-2.5 rounded-lg border flex items-center gap-3 ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-blue-900/30' : 'bg-blue-50'
            }`}>
              <span className="text-sm">👥</span>
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-medium truncate ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Users</p>
              <p className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {users.length}
              </p>
            </div>
          </div>

          <div className={`px-3 py-2.5 rounded-lg border flex items-center gap-3 ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'
            }`}>
              <span className="text-sm">🎯</span>
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-medium truncate ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Bets</p>
              <p className={`text-lg font-bold leading-tight ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {payments.filter(p => p.hasBet).length}
              </p>
            </div>
          </div>

          <div className={`px-3 py-2.5 rounded-lg border flex items-center gap-3 ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-green-900/30' : 'bg-green-50'
            }`}>
              <span className="text-sm">✅</span>
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-medium truncate ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Paid</p>
              <p className={`text-lg font-bold leading-tight ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                {payments.filter(p => p.paid).length}
              </p>
            </div>
          </div>

          <div className={`px-3 py-2.5 rounded-lg border flex items-center gap-3 ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-amber-900/30' : 'bg-amber-50'
            }`}>
              <span className="text-sm">⏳</span>
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-medium truncate ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Pending</p>
              <p className={`text-lg font-bold leading-tight ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {payments.filter(p => p.hasBet && !p.paid).length}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className={`grid grid-cols-4 gap-2 p-1.5 rounded-xl ${
            isDark ? 'bg-dark-800' : 'bg-gray-100'
          }`}>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'users'
                  ? isDark
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-900 shadow-md'
                  : isDark
                    ? 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className="text-lg sm:text-base">👥</span>
              <span className="text-[10px] sm:text-sm">Users</span>
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'matches'
                  ? isDark
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-900 shadow-md'
                  : isDark
                    ? 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className="text-lg sm:text-base">⚽</span>
              <span className="text-[10px] sm:text-sm">Matches</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'payments'
                  ? isDark
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-900 shadow-md'
                  : isDark
                    ? 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className="text-lg sm:text-base">💳</span>
              <span className="text-[10px] sm:text-sm">Payments</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? isDark
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-900 shadow-md'
                  : isDark
                    ? 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className="text-lg sm:text-base">🔐</span>
              <span className="text-[10px] sm:text-sm">Settings</span>
            </button>
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className={`rounded-xl border ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`px-5 py-4 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                👥 User Management
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? 'bg-dark-700' : 'bg-gray-50'}>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${
                      isDark ? 'text-dark-300' : 'text-gray-600'
                    }`}>User</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${
                      isDark ? 'text-dark-300' : 'text-gray-600'
                    }`}>Email</th>
                    <th className={`px-4 py-3 text-center text-xs font-semibold uppercase ${
                      isDark ? 'text-dark-300' : 'text-gray-600'
                    }`}>Role</th>
                    <th className={`px-4 py-3 text-center text-xs font-semibold uppercase ${
                      isDark ? 'text-dark-300' : 'text-gray-600'
                    }`}>Joined</th>
                    <th className={`px-4 py-3 text-center text-xs font-semibold uppercase ${
                      isDark ? 'text-dark-300' : 'text-gray-600'
                    }`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr 
                      key={u._id} 
                      className={`border-t ${isDark ? 'border-dark-700' : 'border-gray-100'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                            u.isDeveloper
                              ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                              : u.isAdmin 
                                ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                                : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          }`}>
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                        {u.email}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          u.isDeveloper
                            ? isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
                            : u.isAdmin
                              ? isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                              : isDark ? 'bg-dark-600 text-dark-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {u.isDeveloper ? '👨‍💻 Admin | Dev' : u.isAdmin ? '👑 Admin' : 'User'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-center text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {u._id !== user.id && !u.isDeveloper && (
                            <>
                              <button
                                onClick={() => handleToggleAdmin(u._id, u.isAdmin, u.name)}
                                className={`p-1.5 rounded-lg text-xs transition-colors ${
                                  u.isAdmin
                                    ? isDark ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    : isDark ? 'bg-dark-600 text-dark-300 hover:bg-dark-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                              >
                                {u.isAdmin ? '👤' : '👑'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u._id, u.name)}
                                className={`p-1.5 rounded-lg text-xs transition-colors ${
                                  isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-600 hover:bg-red-200'
                                }`}
                                title="Delete user"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                          {u._id === user.id && (
                            <span className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                              (You)
                            </span>
                          )}
                          {u._id !== user.id && u.isDeveloper && (
                            <span className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                              🔒 Protected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className={`rounded-2xl border shadow-lg overflow-hidden ${
            isDark ? 'bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
          }`}>
            {/* Sub-tabs Header - Scrollable on mobile */}
            <div className={`px-4 sm:px-6 py-4 border-b ${
              isDark ? 'border-dark-700 bg-dark-800/50' : 'border-gray-100 bg-white/80'
            }`}>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
                {/* Schedule Sub-tab */}
                <button
                  onClick={() => setMatchesSubTab('schedule')}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
                    matchesSubTab === 'schedule'
                      ? isDark
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-emerald-500 text-white shadow-lg'
                      : isDark
                        ? 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CalendarIcon />
                  <span>Schedule</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    matchesSubTab === 'schedule'
                      ? 'bg-white/20'
                      : isDark ? 'bg-dark-600' : 'bg-gray-200'
                  }`}>
                    {schedule?.matches?.filter(m => m.isCompleted).length || 0} | {schedule?.matches?.length || 9}
                  </span>
                </button>
                
                {/* Update Sub-tab */}
                <button
                  onClick={() => setMatchesSubTab('update')}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
                    matchesSubTab === 'update'
                      ? isDark
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-purple-500 text-white shadow-lg'
                      : isDark
                        ? 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                 <EditIcon/>
                  <span>Update</span>
                </button>
                
                {/* Settle Week Sub-tab */}
                <button
                  onClick={() => {
                    if (schedule?.matches?.every(m => m.isCompleted) && !schedule?.isSettled) {
                      setMatchesSubTab('settle')
                    }
                  }}
                  disabled={!schedule?.matches?.every(m => m.isCompleted) || schedule?.isSettled}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0 whitespace-nowrap ${
                    matchesSubTab === 'settle'
                      ? isDark
                        ? 'bg-amber-600 text-white shadow-lg'
                        : 'bg-amber-500 text-white shadow-lg'
                      : schedule?.matches?.every(m => m.isCompleted) && !schedule?.isSettled
                        ? isDark
                          ? 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : isDark
                          ? 'bg-dark-800 text-dark-500 cursor-not-allowed'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <CheckIcon />
                  <span className="hidden xs:inline">Verify Week</span>
                  <span className="xs:hidden">Verify</span>
                  {schedule?.isSettled && (
                    <span className="text-xs">✅</span>
                  )}
                </button>
              </div>
            </div>

            {/* Schedule Sub-tab Content */}
            {matchesSubTab === 'schedule' && (
              <>
                {/* AWS-Style Header */}
                <div className={`px-4 sm:px-6 py-4 border-b ${
                  isDark ? 'border-dark-700 bg-dark-800/50' : 'border-gray-200 bg-gray-50/80'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Title & Description */}
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg hidden sm:flex ${
                        isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'
                      }`}>
                        <svg className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Match Result
                        </h2>
                        <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          Week {weekInfo.weekNumber} • Enter scores for each match
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* PDF Buttons */}
                     
                      <button
                        onClick={() => handleDownloadPredictionPDF(weekInfo.weekNumber, weekInfo.year)}
                        disabled={downloadingPDF === `pred-${weekInfo.weekNumber}-${weekInfo.year}` || !schedule}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-800/50'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        } disabled:opacity-50`}
                        title="Download Predictions PDF"
                      >
                        {downloadingPDF === `pred-${weekInfo.weekNumber}-${weekInfo.year}` ? (
                          <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                        <p className={` text-left text-xs mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          You can download the PDF file before and after the game completion here.
                        </p>
                      {schedule?.isSettled && (
                        <button
                          onClick={() => handleDownloadResultsPDF(weekInfo.weekNumber, weekInfo.year)}
                          disabled={downloadingPDF === `res-${weekInfo.weekNumber}-${weekInfo.year}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            isDark
                              ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-800/50'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          } disabled:opacity-50`}
                          title="Download Results PDF"
                        >
                          {downloadingPDF === `res-${weekInfo.weekNumber}-${weekInfo.year}` ? (
                            <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          <span className="hidden sm:inline">Results</span>
                        </button>
                      )}
                      
                      {/* Status Badge */}
                      {schedule?.isSettled && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                          isDark ? 'bg-green-900/30 text-green-400 ring-1 ring-green-800/50' : 'bg-green-50 text-green-700 ring-1 ring-green-200'
                        }`}>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="hidden sm:inline">Verified •</span> {schedule.actualTotalGoals} goals
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Matches List */}
                <div className="p-4 sm:p-6">
                  {!schedule ? (
                    <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
                      isDark ? 'border-dark-600' : 'border-gray-200'
                    }`}>
                      <svg className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-dark-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className={`font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>No schedule found</p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                        Create or refresh a schedule first
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                  {schedule.matches?.map((match, index) => (
                    <div
                      key={match._id}
                      className={`rounded-lg border p-3 sm:p-4 transition-all ${
                        match.isCompleted
                          ? isDark
                            ? 'bg-dark-700/30 border-dark-600'
                            : 'bg-gray-50/80 border-gray-200'
                          : isDark
                            ? 'bg-dark-800 border-dark-700 hover:border-dark-600'
                            : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        {/* Match Number */}
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                          match.isCompleted
                            ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                            : isDark ? 'bg-dark-600 text-dark-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className="text-xs sm:text-sm font-bold">{match.isCompleted ? '✓' : index + 1}</span>
                        </div>

                        {/* Teams */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 text-right">
                              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {match.teamA}
                              </span>
                              <span className={`ml-1 text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>🏠</span>
                            </div>
                            
                            {/* Score Display or Edit */}
                            {editingMatch === match._id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={matchScores.scoreTeamA}
                                  onChange={(e) => setMatchScores(prev => ({ ...prev, scoreTeamA: e.target.value }))}
                                  className={`w-12 h-10 text-center text-lg font-bold rounded-lg border ${
                                    isDark
                                      ? 'bg-dark-700 border-dark-600 text-white focus:border-emerald-500'
                                      : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                                />
                                <span className={`text-lg font-bold ${isDark ? 'text-dark-400' : 'text-gray-400'}`}>-</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={matchScores.scoreTeamB}
                                  onChange={(e) => setMatchScores(prev => ({ ...prev, scoreTeamB: e.target.value }))}
                                  className={`w-12 h-10 text-center text-lg font-bold rounded-lg border ${
                                    isDark
                                      ? 'bg-dark-700 border-dark-600 text-white focus:border-emerald-500'
                                      : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                                />
                              </div>
                            ) : (
                              <div className={`px-4 py-2 rounded-lg min-w-[80px] text-center ${
                                match.isCompleted
                                  ? isDark ? 'bg-dark-600' : 'bg-gray-200'
                                  : isDark ? 'bg-dark-700' : 'bg-gray-100'
                              }`}>
                                {match.isCompleted ? (
                                  <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {match.scoreTeamA} - {match.scoreTeamB}
                                  </span>
                                ) : (
                                  <span className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-400'}`}>
                                    vs
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="flex-1 text-left">
                              <span className={`ml-1 text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>✈️</span>
                              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {match.teamB}
                              </span>
                            </div>
                          </div>
                          
                          {/* Match Time */}
                          <p className={`text-xs mt-1 text-center ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                            {new Date(match.startTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {editingMatch === match._id ? (
                            <>
                              <button
                                onClick={handleCancelEdit}
                                disabled={matchLoading}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                  isDark
                                    ? 'bg-dark-600 text-dark-300 hover:bg-dark-500'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                } disabled:opacity-50`}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveMatchScore(match._id)}
                                disabled={matchLoading}
                                className="px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                {matchLoading ? (
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <span>💾</span>
                                    <span>Save</span>
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditMatch(match)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                                  isDark
                                    ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                }`}
                              >
                                <EditIcon /> Edit
                              </button>
                              {match.isCompleted && (
                                <button
                                  onClick={() => handleResetMatchScore(match._id)}
                                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    isDark
                                      ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                                  }`}
                                >
                                  🔄 Reset
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </>
            )}

            {/* Update Sub-tab Content */}
            {matchesSubTab === 'update' && (
              <>
                {/* AWS-Style Header */}
                <div className={`px-4 sm:px-6 py-4 border-b ${
                  isDark ? 'border-dark-700 bg-dark-800/50' : 'border-gray-200 bg-gray-50/80'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Title & Description */}
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg hidden sm:flex ${
                        isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                      }`}>
                        <svg className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Schedule Management
                        </h2>
                        <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          {allSchedules.length} schedule{allSchedules.length !== 1 ? 's' : ''} available
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons - AWS Style */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRefreshSchedule}
                        disabled={scheduleLoading}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium border transition-all ${
                          isDark
                            ? 'bg-dark-700 border-dark-600 text-dark-200 hover:bg-dark-600 hover:border-dark-500'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {scheduleLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        <span>Refresh</span>
                      </button>
                      <button
                        onClick={() => setShowCreateSchedule(!showCreateSchedule)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                          showCreateSchedule
                            ? isDark
                              ? 'bg-dark-700 border border-dark-600 text-dark-300'
                              : 'bg-gray-100 border border-gray-300 text-gray-600'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                        }`}
                      >
                        {showCreateSchedule ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Cancel</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>New</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
              {/* Create Schedule Form - AWS Style Card */}
              {showCreateSchedule && (
                <form onSubmit={handleCreateSchedule} className={`mb-6 rounded-lg border overflow-hidden ${
                  isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  {/* Form Header */}
                  <div className={`px-4 py-3 border-b ${
                    isDark ? 'border-dark-600 bg-dark-700/50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Create New Schedule
                    </h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      Configure week details and add 9 matches
                    </p>
                  </div>
                  
                  {/* Form Body */}
                  <div className="p-4 space-y-4">
                    {/* Week Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                          Week Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={newScheduleForm.weekNumber}
                          onChange={(e) => setNewScheduleForm(prev => ({ ...prev, weekNumber: e.target.value }))}
                          className={`w-full px-3 py-2 rounded-md border text-sm transition-colors ${
                            isDark
                              ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-500 focus:border-purple-500'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                          } focus:outline-none focus:ring-1 focus:ring-purple-500/30`}
                          placeholder="6"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                          Year <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={newScheduleForm.year}
                          onChange={(e) => setNewScheduleForm(prev => ({ ...prev, year: e.target.value }))}
                          className={`w-full px-3 py-2 rounded-md border text-sm transition-colors ${
                            isDark
                              ? 'bg-dark-700 border-dark-600 text-white focus:border-purple-500'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500'
                          } focus:outline-none focus:ring-1 focus:ring-purple-500/30`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                          Jornada <span className={`text-xs font-normal ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>(optional)</span>
                        </label>
                        <input
                          type="number"
                          value={newScheduleForm.jornada}
                          onChange={(e) => setNewScheduleForm(prev => ({ ...prev, jornada: e.target.value }))}
                          className={`w-full px-3 py-2 rounded-md border text-sm transition-colors ${
                            isDark
                              ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-500 focus:border-purple-500'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                          } focus:outline-none focus:ring-1 focus:ring-purple-500/30`}
                          placeholder="5"
                        />
                      </div>
                    </div>

                    {/* Matches Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className={`text-xs font-medium ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                          Matches <span className="text-red-500">*</span>
                        </label>
                        <span className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                          {newScheduleForm.matches.filter(m => m.teamA && m.teamB && m.date && m.time).length}/9 complete
                        </span>
                      </div>
                      
                      <div className={`rounded-md border overflow-hidden ${
                        isDark ? 'border-dark-600' : 'border-gray-200'
                      }`}>
                        <div className="max-h-[400px] overflow-y-auto">
                          {newScheduleForm.matches.map((match, index) => (
                            <div 
                              key={index} 
                              className={`p-3 ${
                                index !== 0 ? (isDark ? 'border-t border-dark-700' : 'border-t border-gray-100') : ''
                              } ${isDark ? 'hover:bg-dark-700/30' : 'hover:bg-gray-50'}`}
                            >
                              {/* Match Header - Mobile */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-5 h-5 rounded text-xs font-medium flex items-center justify-center ${
                                  match.teamA && match.teamB && match.date && match.time
                                    ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                                    : isDark ? 'bg-dark-600 text-dark-400' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {index + 1}
                                </span>
                                <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                                  Match {index + 1}
                                </span>
                              </div>
                              
                              {/* Teams - Responsive Grid */}
                              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mb-2">
                                <select
                                  value={match.teamA}
                                  onChange={(e) => updateNewScheduleMatch(index, 'teamA', e.target.value)}
                                  className={`w-full px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
                                    isDark
                                      ? 'bg-dark-700 border-dark-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  } focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500`}
                                >
                                  <option value="">🏠 Home Team</option>
                                  {LIGA_MX_TEAMS.map(team => (
                                    <option key={team} value={team}>{team}</option>
                                  ))}
                                </select>
                                <select
                                  value={match.teamB}
                                  onChange={(e) => updateNewScheduleMatch(index, 'teamB', e.target.value)}
                                  className={`w-full px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
                                    isDark
                                      ? 'bg-dark-700 border-dark-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  } focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500`}
                                >
                                  <option value="">✈️ Away Team</option>
                                  {LIGA_MX_TEAMS.map(team => (
                                    <option key={team} value={team}>{team}</option>
                                  ))}
                                </select>
                              </div>
                              
                              {/* Date & Time - Responsive Grid */}
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="date"
                                  value={match.date}
                                  onChange={(e) => updateNewScheduleMatch(index, 'date', e.target.value)}
                                  className={`w-full px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
                                    isDark
                                      ? 'bg-dark-700 border-dark-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  } focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500`}
                                />
                                <input
                                  type="time"
                                  value={match.time}
                                  onChange={(e) => updateNewScheduleMatch(index, 'time', e.target.value)}
                                  className={`w-full px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
                                    isDark
                                      ? 'bg-dark-700 border-dark-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  } focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Footer */}
                  <div className={`px-4 py-3 border-t flex justify-end ${
                    isDark ? 'border-dark-600 bg-dark-700/30' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <button
                      type="submit"
                      disabled={scheduleLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {scheduleLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span>Create Schedule</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Schedules List - AWS Style */}
              {allSchedules.length === 0 ? (
                <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
                  isDark ? 'border-dark-600' : 'border-gray-200'
                }`}>
                  <svg className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-dark-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className={`font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>No schedules found</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                    Click "Sync API" or "Create" to add a schedule
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allSchedules.map((sched) => {
                    const isCurrentWeek = sched.weekNumber === weekInfo.weekNumber && sched.year === weekInfo.year
                    const firstMatchTime = sched.matches?.reduce((earliest, m) => 
                      new Date(m.startTime) < new Date(earliest) ? m.startTime : earliest
                    , sched.matches?.[0]?.startTime)
                    const hasStarted = new Date() >= new Date(firstMatchTime)
                    const completedMatches = sched.matches?.filter(m => m.isCompleted).length || 0
                    
                    return (
                      <div
                        key={sched._id}
                        className={`rounded-lg border overflow-hidden transition-all ${
                          isCurrentWeek
                            ? isDark
                              ? 'border-purple-500/50 bg-purple-900/5 ring-1 ring-purple-500/20'
                              : 'border-purple-300 bg-purple-50/30 ring-1 ring-purple-200'
                            : isDark
                              ? 'border-dark-600 bg-dark-800/50 hover:border-dark-500'
                              : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                        }`}
                      >
                        {/* Schedule Header - AWS Style */}
                        <div className={`px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isDark ? 'bg-dark-700/30' : 'bg-gray-50/80'
                        }`}>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Week Badge */}
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                              isCurrentWeek
                                ? isDark ? 'bg-purple-900/50 text-purple-300 ring-1 ring-purple-500/30' : 'bg-purple-100 text-purple-700'
                                : isDark ? 'bg-dark-600 text-dark-200' : 'bg-gray-200 text-gray-700'
                            }`}>
                              Week {sched.weekNumber}
                            </span>
                            
                            {/* Year & Jornada */}
                            <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                              {sched.year}{sched.jornada ? ` • J${sched.jornada}` : ''}
                            </span>
                            
                            {/* Data Source Badge */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              sched.dataSource === 'api'
                                ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                                : sched.dataSource === 'admin'
                                  ? isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'
                                  : isDark ? 'bg-dark-600 text-dark-400' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {sched.dataSource === 'api' && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                              {sched.dataSource || 'manual'}
                            </span>
                            
                            {/* Status Badges */}
                            {sched.isSettled && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600 ring-1 ring-green-200'
                              }`}>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Settled
                              </span>
                            )}
                            
                            {/* Progress indicator */}
                            {!sched.isSettled && completedMatches > 0 && (
                              <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                                {completedMatches}/{sched.matches?.length || 9} played
                              </span>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5">
                            {/* Predictions PDF Button */}
                            <button
                              onClick={() => handleDownloadPredictionPDF(sched.weekNumber, sched.year)}
                              disabled={downloadingPDF === `pred-${sched.weekNumber}-${sched.year}`}
                              className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                isDark
                                  ? 'text-blue-400 hover:bg-blue-900/30'
                                  : 'text-blue-600 hover:bg-blue-50'
                              } disabled:opacity-50`}
                              title="Download Predictions PDF"
                            >
                              {downloadingPDF === `pred-${sched.weekNumber}-${sched.year}` ? (
                                <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                              <span className="hidden sm:inline">Pred</span>
                            </button>
                            
                            {/* Results PDF Button - Only show if settled */}
                            {sched.isSettled && (
                              <button
                                onClick={() => handleDownloadResultsPDF(sched.weekNumber, sched.year)}
                                disabled={downloadingPDF === `res-${sched.weekNumber}-${sched.year}`}
                                className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                  isDark
                                    ? 'text-emerald-400 hover:bg-emerald-900/30'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                } disabled:opacity-50`}
                                title="Download Results PDF"
                              >
                                {downloadingPDF === `res-${sched.weekNumber}-${sched.year}` ? (
                                  <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                                <span className="hidden sm:inline">Results</span>
                              </button>
                            )}
                            
                            {/* Delete Button */}
                            {!hasStarted && !sched.isSettled && (
                              <button
                                onClick={() => handleDeleteSchedule(sched._id)}
                                className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                  isDark
                                    ? 'text-red-400 hover:bg-red-900/30'
                                    : 'text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Matches List - Compact */}
                        <div className="p-2 sm:p-3">
                          <div className="space-y-1">
                            {sched.matches?.map((match, idx) => (
                              <div
                                key={match._id}
                                className={`rounded-md text-xs transition-all ${
                                  isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'
                                } ${editingScheduleMatch === match._id && selectedSchedule === sched._id 
                                  ? isDark ? 'bg-dark-700 ring-1 ring-purple-500/30' : 'bg-purple-50 ring-1 ring-purple-200' 
                                  : ''
                                }`}
                              >
                                {editingScheduleMatch === match._id && selectedSchedule === sched._id ? (
                                  /* Edit Mode - Stacked for Mobile */
                                  <div className="p-3 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium ${
                                        isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-600'
                                      }`}>
                                        {idx + 1}
                                      </span>
                                      <span className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                                        Editing Match
                                      </span>
                                    </div>
                                    
                                    {/* Teams Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div>
                                        <label className={`block text-xs mb-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                                          Home Team
                                        </label>
                                        <select
                                          value={scheduleMatchForm.teamA}
                                          onChange={(e) => setScheduleMatchForm(prev => ({ ...prev, teamA: e.target.value }))}
                                          className={`w-full px-2.5 py-2 rounded-md border text-sm ${
                                            isDark
                                              ? 'bg-dark-700 border-dark-600 text-white'
                                              : 'bg-white border-gray-300 text-gray-900'
                                          } focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500`}
                                        >
                                          <option value="">Select Team</option>
                                          {LIGA_MX_TEAMS.map(team => (
                                            <option key={team} value={team}>{team}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className={`block text-xs mb-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                                          Away Team
                                        </label>
                                        <select
                                          value={scheduleMatchForm.teamB}
                                          onChange={(e) => setScheduleMatchForm(prev => ({ ...prev, teamB: e.target.value }))}
                                          className={`w-full px-2.5 py-2 rounded-md border text-sm ${
                                            isDark
                                              ? 'bg-dark-700 border-dark-600 text-white'
                                              : 'bg-white border-gray-300 text-gray-900'
                                          } focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500`}
                                        >
                                          <option value="">Select Team</option>
                                          {LIGA_MX_TEAMS.map(team => (
                                            <option key={team} value={team}>{team}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                    
                                    {/* DateTime */}
                                    <div>
                                      <label className={`block text-xs mb-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                                        Date & Time
                                      </label>
                                      <input
                                        type="datetime-local"
                                        value={scheduleMatchForm.startTime}
                                        onChange={(e) => setScheduleMatchForm(prev => ({ ...prev, startTime: e.target.value }))}
                                        className={`w-full px-2.5 py-2 rounded-md border text-sm ${
                                          isDark
                                            ? 'bg-dark-700 border-dark-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                        } focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500`}
                                      />
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="flex gap-2 pt-1">
                                      <button
                                        onClick={handleCancelScheduleEdit}
                                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                          isDark ? 'bg-dark-600 text-dark-300 hover:bg-dark-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                        }`}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={handleSaveScheduleMatch}
                                        disabled={scheduleLoading}
                                        className="flex-1 px-3 py-2 rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-colors"
                                      >
                                        {scheduleLoading ? 'Saving...' : 'Save'}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* View Mode - Responsive */
                                  <div className="px-2 py-1.5 flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs ${
                                      match.isCompleted
                                        ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                                        : isDark ? 'bg-dark-600 text-dark-400' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                      {match.isCompleted ? '✓' : idx + 1}
                                    </span>
                                    
                                    <div className="flex-1 min-w-0 flex flex-col xs:flex-row xs:items-center gap-0.5 xs:gap-2">
                                      <div className="flex items-center gap-1 min-w-0">
                                        <span className={`truncate text-xs sm:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                          {match.teamA}
                                        </span>
                                        <span className={`flex-shrink-0 text-[10px] sm:text-xs px-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                                          vs
                                        </span>
                                        <span className={`truncate text-xs sm:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                          {match.teamB}
                                        </span>
                                      </div>
                                      
                                      <span className={`text-[10px] sm:text-xs flex-shrink-0 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                                        {new Date(match.startTime).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    
                                    {!hasStarted && !sched.isSettled && (
                                      <button
                                        onClick={() => handleEditScheduleMatch(sched._id, match)}
                                        className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                                          isDark
                                            ? 'text-dark-400 hover:text-blue-400 hover:bg-blue-900/30'
                                            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
              </>
            )}

            {/* Verify Week Sub-tab Content */}
            {matchesSubTab === 'settle' && (
              <>
                {/* AWS-Style Header */}
                <div className={`px-4 sm:px-6 py-4 border-b ${
                  isDark ? 'border-dark-700 bg-dark-800/50' : 'border-gray-200 bg-gray-50/80'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Title & Description */}
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg hidden sm:flex ${
                        isDark ? 'bg-amber-900/30' : 'bg-amber-100'
                      }`}>
                        <svg className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Verify Week {weekInfo.weekNumber}
                        </h2>
                        <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          Finalize results and determine winners
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className={`max-w-md mx-auto rounded-lg border overflow-hidden ${
                    isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    {/* Card Header */}
                    <div className={`px-4 py-3 border-b text-center ${
                      isDark ? 'border-dark-600 bg-dark-700/50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                        isDark ? 'bg-amber-900/30' : 'bg-amber-100'
                      }`}>
                        <span className="text-2xl">🏆</span>
                      </div>
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Ready to Verify
                      </h3>
                      <p className={`text-xs mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                        All {schedule?.matches?.length || 9} matches completed
                      </p>
                    </div>
                    
                    {/* Summary Stats */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className={`p-3 rounded-md text-center ${
                          isDark ? 'bg-dark-700' : 'bg-gray-50'
                        }`}>
                          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                            Total Goals
                          </p>
                          <p className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {schedule?.matches?.reduce((sum, m) => sum + (m.scoreTeamA || 0) + (m.scoreTeamB || 0), 0) || 0}
                          </p>
                        </div>
                        <div className={`p-3 rounded-md text-center ${
                          isDark ? 'bg-dark-700' : 'bg-gray-50'
                        }`}>
                          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                            Matches Played
                          </p>
                          <p className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {schedule?.matches?.filter(m => m.isCompleted).length || 0}/{schedule?.matches?.length || 9}
                          </p>
                        </div>
                      </div>
                      
                      {/* Info Box */}
                      <div className={`p-3 rounded-md mb-4 ${
                        isDark ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-100'
                      }`}>
                        <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                          <span className="font-medium">Note:</span> Verifying the week will calculate final standings and cannot be undone.
                        </p>
                      </div>
                      
                      {/* Action Button */}
                      <button
                        onClick={handleSettleWeek}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Verify & Finalize Results</span>
                      </button>
                      
                      {/* PDF Download Buttons */}
                      <div className="mt-4 pt-4 border-t border-dashed flex flex-col gap-2">
                        <p className={`text-xs font-medium text-center mb-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          Download Reports
                        </p>
                        <button
                          onClick={() => handleDownloadPredictionPDF(weekInfo.weekNumber, weekInfo.year)}
                          disabled={downloadingPDF === `pred-${weekInfo.weekNumber}-${weekInfo.year}`}
                          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            isDark
                              ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-800/50'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          } disabled:opacity-50`}
                        >
                          {downloadingPDF === `pred-${weekInfo.weekNumber}-${weekInfo.year}` ? (
                            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          <span>Predictions PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className={`rounded-2xl border shadow-lg overflow-hidden ${
            isDark ? 'bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
          }`}>
            {/* Header */}
            <div className={`px-6 py-5 border-b ${
              isDark ? 'border-dark-700 bg-dark-800/50' : 'border-gray-100 bg-white/80'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    isDark ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  } shadow-lg`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Payment Records
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      Week {weekInfo.weekNumber}, {weekInfo.year} · Manage participant payments
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    isDark ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {payments.filter(p => p.hasBet).length} Bets
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {payments.filter(p => p.paid).length} Paid
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    isDark ? 'bg-amber-900/30 text-amber-400 border border-amber-800/50' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    {payments.filter(p => p.hasBet && !p.paid).length} Pending
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className={`px-6 py-3 ${isDark ? 'bg-dark-700/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                  Payment Collection Progress (Users with Bets)
                </span>
                <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {payments.filter(p => p.hasBet).length > 0 
                    ? Math.round((payments.filter(p => p.paid).length / payments.filter(p => p.hasBet).length) * 100) 
                    : 0}%
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-dark-600' : 'bg-gray-200'}`}>
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ 
                    width: `${payments.filter(p => p.hasBet).length > 0 
                      ? (payments.filter(p => p.paid).length / payments.filter(p => p.hasBet).length) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? 'bg-dark-700/50' : 'bg-gray-50'}>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                      isDark ? 'text-dark-300' : 'text-gray-500'
                    }`}>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Username
                      </div>
                    </th>
                    <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                      isDark ? 'text-dark-300' : 'text-gray-500'
                    }`}>
                      <div className="flex items-center justify-center gap-1">
                        <span>💵</span> Payment Status
                      </div>
                    </th>
                    <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                      isDark ? 'text-dark-300' : 'text-gray-500'
                    }`}>
                      <div className="flex items-center justify-center gap-1">
                        <span>⚡</span> Action
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12">
                        <div className="text-center">
                          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                            isDark ? 'bg-dark-700' : 'bg-gray-100'
                          }`}>
                            <span className="text-3xl">📭</span>
                          </div>
                          <p className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                            No users found
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                            Users will appear here once they register
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr 
                        key={payment.userId} 
                        className={`transition-all duration-200 ${
                          payment.paymentStatus === 'paid'
                            ? isDark 
                              ? 'bg-emerald-900/10 hover:bg-emerald-900/20' 
                              : 'bg-emerald-50/50 hover:bg-emerald-50'
                            : payment.paymentStatus === 'pending'
                              ? isDark 
                                ? 'bg-amber-900/5 hover:bg-amber-900/15' 
                                : 'bg-amber-50/30 hover:bg-amber-50/60'
                              : isDark 
                                ? 'bg-dark-800/50 hover:bg-dark-700/50' 
                                : 'bg-gray-50/50 hover:bg-gray-100/50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-md ${
                                payment.paymentStatus === 'paid'
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                  : payment.paymentStatus === 'pending'
                                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                    : 'bg-gradient-to-br from-gray-400 to-gray-600'
                              }`}>
                                {payment.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              {payment.paymentStatus === 'paid' && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-dark-800">
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              {payment.isAdmin && (
                                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-dark-800 ${
                                  payment.isDeveloper ? 'bg-purple-500' : 'bg-amber-500'
                                }`}>
                                  <span className="text-[8px]">{payment.isDeveloper ? '👨‍💻' : '👑'}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {payment.name || 'Unknown User'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                            payment.paymentStatus === 'na' || (!payment.hasBet && !payment.isPlaceholder && !payment.paid)
                              ? isDark 
                                ? 'bg-gray-800/50 text-gray-400 border border-gray-700/50' 
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                              : payment.paid
                                ? isDark 
                                  ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50' 
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : isDark 
                                  ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50' 
                                  : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {payment.paymentStatus === 'na' || (!payment.hasBet && !payment.isPlaceholder && !payment.paid) ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                N/A
                              </>
                            ) : payment.paid ? (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Paid
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                Pending
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <select
                            value={payment.paymentStatus || 'na'}
                            onChange={(e) => handleChangePaymentStatus(payment.userId, e.target.value)}
                            className={`px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                              isDark 
                                ? 'bg-dark-700 border border-dark-600 text-dark-100' 
                                : 'bg-white border border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="na">N/A</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                          </select>
                          {payment.hasBet && (
                            <span className={`block text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              ✓ Has bet
                            </span>
                          )}
                          {payment.isPlaceholder && !payment.hasBet && (
                            <span className={`block text-xs mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                              Payment only
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            {payments.length > 0 && (
              <div className={`px-6 py-4 border-t ${
                isDark ? 'border-dark-700 bg-dark-800/30' : 'border-gray-100 bg-gray-50/50'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className={`flex flex-wrap items-center gap-4 text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Total Users: {payments.length}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      With Bets: {payments.filter(p => p.hasBet).length}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Paid: {payments.filter(p => p.paid).length}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Pending: {payments.filter(p => p.hasBet && !p.paid).length}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                      No Bet: {payments.filter(p => !p.hasBet).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Developer-only access check */}
            {!isDeveloper ? (
              /* Unauthorized Message for non-developers */
              <div className={`rounded-xl border ${
                isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="p-8 sm:p-12 text-center">
                  <div className={`w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                    isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
                  }`}>
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Access Restricted
                  </h3>
                  <p className={`text-sm mb-4 max-w-md mx-auto ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    You are not authorized to access these settings. Only developers can view and modify access codes.
                  </p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                    isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <span>👨‍💻</span>
                    <span>Developer access required</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Developer has access - show settings */
              <>
                {/* Current Codes */}
                <div className={`rounded-xl border ${
                  isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className={`px-5 py-4 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                    <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      🔐 Access Codes
                    </h2>
                    <p className={`text-xs mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      Changing codes only affects new signups. Existing users can still login normally.
                    </p>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className={`p-4 rounded-lg border ${
                        isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🎟️</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                            Signup Invite Code
                          </span>
                        </div>
                        <code className={`text-lg font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {codes.signupCode || 'QL2026'}
                        </code>
                        <p className={`text-xs mt-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          Required for <strong>new users</strong> to create an account
                        </p>
                      </div>

                      <div className={`p-4 rounded-lg border ${
                        isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">👑</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                            Admin Access Code
                          </span>
                        </div>
                        <code className={`text-lg font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          {codes.adminCode || 'QLADMIN2026'}
                        </code>
                        <p className={`text-xs mt-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          Used during login to get admin privileges (optional)
                        </p>
                      </div>
                    </div>

                    {/* Info Banner */}
                    <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
                      isDark ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <span className="text-blue-500 mt-0.5">ℹ️</span>
                      <div>
                        <p className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                          Important: Code changes do not affect existing users
                        </p>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-blue-400/80' : 'text-blue-600'}`}>
                          Users who have already signed up can continue to login with their email and password. 
                          Only new signups will need the updated invite code.
                        </p>
                      </div>
                    </div>

                    {/* Change Codes Form */}
                    {!showCodeForm ? (
                      <button
                        onClick={() => setShowCodeForm(true)}
                        className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                          isDark 
                            ? 'bg-dark-700 text-dark-200 hover:bg-dark-600 border border-dark-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        ✏️ Change Codes
                      </button>
                    ) : (
                      <form onSubmit={handleUpdateCodes} className={`p-4 rounded-lg border ${
                        isDark ? 'bg-dark-700/30 border-dark-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Update Access Codes
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className={`block text-xs font-medium mb-1.5 ${
                              isDark ? 'text-dark-300' : 'text-gray-600'
                            }`}>
                              New Signup Code (leave empty to keep current)
                            </label>
                            <input
                              type="text"
                              value={newSignupCode}
                              onChange={(e) => setNewSignupCode(e.target.value.toUpperCase())}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-mono ${
                                isDark 
                                  ? 'bg-dark-700 border border-dark-600 text-dark-100' 
                                  : 'bg-white border border-gray-300 text-gray-900'
                              }`}
                              placeholder="e.g., QL2027"
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-medium mb-1.5 ${
                              isDark ? 'text-dark-300' : 'text-gray-600'
                            }`}>
                              New Admin Code (leave empty to keep current)
                            </label>
                            <input
                              type="text"
                              value={newAdminCode}
                              onChange={(e) => setNewAdminCode(e.target.value.toUpperCase())}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-mono ${
                                isDark 
                                  ? 'bg-dark-700 border border-dark-600 text-dark-100' 
                                  : 'bg-white border border-gray-300 text-gray-900'
                              }`}
                              placeholder="e.g., QLADMIN2027"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowCodeForm(false)
                              setNewSignupCode('')
                              setNewAdminCode('')
                            }}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                              isDark 
                                ? 'bg-dark-600 text-dark-200 hover:bg-dark-500' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className={`rounded-xl border ${
                  isDark ? 'bg-red-900/10 border-red-800/50' : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`px-5 py-4 border-b ${isDark ? 'border-red-800/50' : 'border-red-200'}`}>
                    <h2 className={`text-base font-semibold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                      ⚠️ Danger Zone
                    </h2>
                  </div>
                  <div className="p-5">
                    <p className={`text-sm mb-4 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                      These actions are irreversible. Be careful when using them.
                    </p>
                    <ul className={`text-xs space-y-2 ${isDark ? 'text-red-400/80' : 'text-red-500'}`}>
                      <li>• Deleting a user will remove all their bets and data permanently</li>
                      <li>• Changing the <strong>signup code</strong> only affects new user registrations (existing users unaffected)</li>
                      <li>• Changing the <strong>admin code</strong> affects future admin logins</li>
                      <li>• Make sure to communicate new codes to authorized users</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmStyle={confirmModal.confirmStyle}
        isLoading={confirmModal.isLoading}
      />
    </div>
  )
}
