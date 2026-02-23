import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { downloadPredictionPDF, downloadResultsPDF, getBetAmount, getSettledResults, getSettledResultsBets, deleteSettledResults, getMyGuestBets, createGuestBet, updateGuestBet } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates'
import QuinielaTable from '../components/QuinielaTable'
import { GuestBetModal } from '../components/GuestBetModal'
import { BetIcon } from '../components/Navbar'
import { CalendarIcon } from './Profile'
import toast from 'react-hot-toast'

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
  const [betAmount, setBetAmount] = useState(20) // Default bet amount
  
  // Settled results data (for Results tab)
  const [resultsSchedule, setResultsSchedule] = useState(null)
  const [resultsBets, setResultsBets] = useState([])
  const [resultsInfo, setResultsInfo] = useState({ weekNumber: 0, year: 0, jornada: 0, settledAt: null })
  const [hasResults, setHasResults] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [deletingResults, setDeletingResults] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Guest bet modal state
  const [guestBetModal, setGuestBetModal] = useState({
    isOpen: false,
    editingGuest: null
  })
  const [isSubmittingGuest, setIsSubmittingGuest] = useState(false)
  
  const { isDark } = useTheme()
  const { user, isAdmin } = useAuth()
  const { t } = useTranslation('dashboard')
  const { t: tBet } = useTranslation('bet')

  // PDF Download handlers
  const handleDownloadPredictionPDF = async () => {
    if (!weekInfo.weekNumber || !weekInfo.year) return
    setDownloadingPDF(true)
    try {
      await downloadPredictionPDF(weekInfo.weekNumber, weekInfo.year)
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      toast.error(error.message || 'Failed to download PDF')
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleDownloadResultsPDF = async () => {
    if (!weekInfo.weekNumber || !weekInfo.year) return
    setDownloadingPDF(true)
    try {
      await downloadResultsPDF(weekInfo.weekNumber, weekInfo.year)
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      toast.error(error.message || 'Failed to download PDF')
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleDownloadLastWeekResultsPDF = async () => {
    if (!resultsInfo.weekNumber || !resultsInfo.year) return
    setDownloadingPDF(true)
    try {
      await downloadResultsPDF(resultsInfo.weekNumber, resultsInfo.year)
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      toast.error(error.message || 'Failed to download PDF')
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleDeleteResults = async () => {
    setDeletingResults(true)
    try {
      await deleteSettledResults()
      toast.success(t('results.deleteSuccess', 'Results deleted successfully'))
      // Only clear results-related state, don't refresh the whole page
      setHasResults(false)
      setResultsSchedule(null)
      setResultsBets([])
      setShowDeleteConfirm(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete results')
    } finally {
      setDeletingResults(false)
    }
  }

  // Guest bet modal handlers
  const handleOpenGuestModal = () => {
    setGuestBetModal({
      isOpen: true,
      editingGuest: null
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
        toast.success(tBet('guest.success.updated', { name: guestData.participantName }))
      } else {
        await createGuestBet(guestData)
        toast.success(tBet('guest.success.created', { name: guestData.participantName }))
      }
      handleCloseGuestModal()
      // Refresh bets to show new guest bet
      fetchData()
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        toast.error(tBet('guest.errors.alreadyExists'))
      } else {
        toast.error(error.response?.data?.message || tBet('errors.submitFailed'))
      }
    } finally {
      setIsSubmittingGuest(false)
    }
  }

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      
      // First, always try to fetch settled results (for Results tab)
      // This should work even if current schedule doesn't exist
      try {
        const [settledScheduleRes, settledBetsRes] = await Promise.all([
          getSettledResults(),
          getSettledResultsBets()
        ])
        
        setResultsSchedule(settledScheduleRes.schedule)
        setResultsBets(settledBetsRes.bets)
        setResultsInfo({
          weekNumber: settledScheduleRes.weekNumber,
          year: settledScheduleRes.year,
          jornada: settledScheduleRes.jornada,
          settledAt: settledScheduleRes.settledAt
        })
        setHasResults(true)
      } catch (resultsError) {
        // No settled results available - that's OK
        setHasResults(false)
        setResultsSchedule(null)
        setResultsBets([])
      }
      
      // Now fetch current schedule and bets
      const [scheduleRes, betsRes, announcementsRes, betAmountValue] = await Promise.all([
        api.get('/schedule/current'),
        api.get('/bets/current'),
        api.get('/announcements'),
        getBetAmount().catch(() => 20) // Default to 20 if settings not available
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
      setBetAmount(betAmountValue || 20)
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

  // Targeted real-time update handlers to minimize re-renders
  const handleResultsUpdate = useCallback((data) => {
    console.log('📊 Dashboard: Results update received:', data)
    
    // Check if this update is for the current week
    const isCurrentWeek = data?.weekNumber === weekInfo.weekNumber && data?.year === weekInfo.year
    
    // Update schedule matches with new scores
    if (data?.schedule) {
      setSchedule(prev => {
        if (!prev) return data.schedule
        return {
          ...prev,
          matches: prev.matches.map(match => {
            const updatedMatch = data.schedule.matches?.find(m => m._id === match._id)
            return updatedMatch || match
          })
        }
      })
      toast.success('Match scores updated', { id: 'results-update', duration: 2000 })
    } else if (data?.matchId && isCurrentWeek) {
      // Single match update - update schedule
      setSchedule(prev => {
        if (!prev) return prev
        return {
          ...prev,
          matches: prev.matches.map(match => 
            match._id === data.matchId
              ? { 
                  ...match, 
                  scoreTeamA: data.scoreTeamA, 
                  scoreTeamB: data.scoreTeamB, 
                  isCompleted: data.isCompleted ?? match.isCompleted,
                  result: data.result ?? match.result
                }
              : match
          )
        }
      })
      
      // Update bets with recalculated points if provided
      if (data?.bets && Array.isArray(data.bets)) {
        console.log('📊 Dashboard: Updating bets with recalculated points')
        setBets(data.bets)
      }
      
      // Show toast for score update
      const actionText = data.action === 'reset' ? 'Match score reset' : 'Match score updated'
      toast.success(actionText, { id: 'match-update', duration: 2000 })
    }
  }, [weekInfo.weekNumber, weekInfo.year])

  const handlePaymentsUpdate = useCallback((data) => {
    console.log('💳 Dashboard: Payment update received:', data)
    
    // Normalize paid value - handle both `paid` boolean and `status` string
    const isPaid = data?.paid ?? (data?.status === 'paid')
    
    // Helper to match by userId
    const matchByUserId = (bet, targetUserId) => {
      const betUserId = typeof bet.userId === 'object' 
        ? (bet.userId?._id?.toString?.() || bet.userId?._id)
        : (bet.userId?.toString?.() || bet.userId)
      return betUserId === targetUserId
    }
    
    // Update only the affected bet's payment status
    if (data?.betId) {
      // Convert both IDs to strings for comparison
      const targetBetId = data.betId?.toString?.() || data.betId
      const targetUserId = data.userId?.toString?.() || data.userId
      console.log('💳 Dashboard: Looking for betId:', targetBetId, 'or userId:', targetUserId)
      
      setBets(prev => {
        console.log('💳 Dashboard: Prev bets IDs:', prev.map(b => b._id))
        let foundMatch = false
        
        const updated = prev.map(bet => {
          const betId = bet._id?.toString?.() || bet._id
          
          // Try matching by betId first
          if (betId === targetBetId) {
            console.log('💳 Dashboard: Found matching bet by betId, updating paid from', bet.paid, 'to:', isPaid)
            foundMatch = true
            return { ...bet, paid: isPaid }
          }
          
          // If no betId match but we have userId, try matching by userId
          if (!foundMatch && targetUserId && matchByUserId(bet, targetUserId)) {
            console.log('💳 Dashboard: Found matching bet by userId, updating paid from', bet.paid, 'to:', isPaid)
            foundMatch = true
            return { ...bet, paid: isPaid }
          }
          
          return bet
        })
        
        if (!foundMatch) {
          console.log('💳 Dashboard: No matching bet found for betId or userId')
        }
        
        return updated
      })
    } else if (data?.bets) {
      // Batch update
      setBets(prev => prev.map(bet => {
        const betId = bet._id?.toString?.() || bet._id
        const update = data.bets.find(b => (b.betId?.toString?.() || b.betId) === betId)
        return update ? { ...bet, paid: update.paid ?? (update.status === 'paid') } : bet
      }))
    } else if (data?.userId) {
      // Update by user ID only
      const targetUserId = data.userId?.toString?.() || data.userId
      console.log('💳 Dashboard: Looking for userId:', targetUserId)
      setBets(prev => {
        const updated = prev.map(bet => {
          if (matchByUserId(bet, targetUserId)) {
            console.log('💳 Dashboard: Found matching bet by userId, updating paid to:', isPaid)
            return { ...bet, paid: isPaid }
          }
          return bet
        })
        return updated
      })
    }
  }, [])

  const handleBetsUpdate = useCallback((data) => {
    console.log('🎯 Dashboard: Bets update received:', data)
    
    // Handle action-based updates
    if (data?.action === 'delete' && data?.betId) {
      // Bet deleted - remove from list
      setBets(prev => prev.filter(b => b._id !== data.betId))
      if (data?.isGuestBet) {
        toast.success(`Guest prediction removed`, { id: 'bet-deleted', duration: 2000 })
      }
      return
    }
    
    if (data?.action === 'create' || data?.action === 'update') {
      // New bet created or updated - refetch to get full data including guest bets
      api.get('/bets/current').then(res => {
        setBets(res.data.bets)
        setIsSettled(res.data.isSettled)
        if (data?.action === 'create' && data?.isGuestBet) {
          toast.success('New guest prediction added', { id: 'bet-created', duration: 2000 })
        }
      }).catch(console.error)
      return
    }
    
    // Legacy handlers for backward compatibility
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
      // Bet deleted
      setBets(prev => prev.filter(b => b._id !== data.betId))
    } else {
      // Full refetch if no specific data
      api.get('/bets/current').then(res => {
        setBets(res.data.bets)
        setIsSettled(res.data.isSettled)
      }).catch(console.error)
    }
  }, [])

  // Handle schedule creation - show new schedule to non-admin users
  const handleScheduleCreated = useCallback((data) => {
    console.log('📅 Dashboard: Schedule created received:', data)
    if (data?.schedule) {
      // Set the new schedule
      setSchedule(data.schedule)
      // Update week info to match the new schedule
      setWeekInfo({
        weekNumber: data.schedule.weekNumber,
        year: data.schedule.year
      })
      // Clear any error state
      setError(null)
      // Reset lock status for new schedule
      setLockStatus({
        isBettingLocked: false,
        hasStarted: false,
        lockoutTime: data.schedule.matches?.[0]?.startTime || null
      })
      toast.success('New schedule available!', { id: 'schedule-created', duration: 3000 })
    }
  }, [])

  const handleScheduleUpdate = useCallback((data) => {
    console.log('📅 Dashboard: Schedule update received:', data)
    if (data?.schedule) {
      setSchedule(data.schedule)
      // Update week info if provided in schedule
      if (data.schedule.weekNumber && data.schedule.year) {
        setWeekInfo({
          weekNumber: data.schedule.weekNumber,
          year: data.schedule.year
        })
      }
      // Update lock status if provided
      if (data.isBettingLocked !== undefined) {
        setLockStatus(prev => ({ ...prev, isBettingLocked: data.isBettingLocked }))
      }
      // Clear any error state
      setError(null)
    }
  }, [])

  const handleAnnouncementUpdate = useCallback((data) => {
    console.log('📢 Dashboard: Announcement update received:', data)
    if (data?.announcements) {
      setAnnouncements(data.announcements)
    } else if (data?.announcement) {
      // Single announcement added/updated
      setAnnouncements(prev => {
        const exists = prev.find(a => a._id === data.announcement._id)
        if (exists) {
          return prev.map(a => a._id === data.announcement._id ? data.announcement : a)
        } else {
          return [data.announcement, ...prev]
        }
      })
      toast.success('New announcement!', { id: 'announcement', duration: 3000 })
    } else if (data?.deleted) {
      setAnnouncements(prev => prev.filter(a => a._id !== data.deleted))
    } else {
      // Refetch announcements if no specific data
      api.get('/announcements').then(res => {
        setAnnouncements(res.data.announcements || [])
      }).catch(console.error)
    }
  }, [])

  const handleSettledUpdate = useCallback((data) => {
    console.log('✅ Dashboard: Week settled:', data)
    
    // Update the Results tab with the settled week data
    Promise.all([getSettledResults(), getSettledResultsBets()])
      .then(([scheduleRes, betsRes]) => {
        setResultsSchedule(scheduleRes.schedule)
        setResultsBets(betsRes.bets)
        setResultsInfo({
          weekNumber: scheduleRes.weekNumber,
          year: scheduleRes.year,
          jornada: scheduleRes.jornada,
          settledAt: scheduleRes.settledAt
        })
        setHasResults(true)
      })
      .catch(console.error)
    
    // Fetch the new current schedule (next jornada) for the Standings tab
    Promise.all([
      api.get('/schedule/current'),
      api.get('/bets/current')
    ]).then(([scheduleRes, betsRes]) => {
      // Update schedule to the new week
      setSchedule(scheduleRes.data.schedule)
      setBets(betsRes.data.bets)
      setIsSettled(betsRes.data.isSettled)
      setWeekInfo({
        weekNumber: scheduleRes.data.weekNumber,
        year: scheduleRes.data.year
      })
      setLockStatus({
        isBettingLocked: scheduleRes.data.isBettingLocked,
        hasStarted: scheduleRes.data.hasStarted,
        lockoutTime: scheduleRes.data.lockoutTime
      })
      setError(null)
    }).catch(error => {
      // If no new schedule exists yet, that's OK - admin will create it
      if (error.response?.status === 404) {
        setSchedule(null)
        setBets([])
        setIsSettled(false)
      }
    })
    
    toast.success('Week has been settled! Check Results tab for final standings.', { id: 'settled', duration: 4000 })
  }, [])

  // Handle results deleted event
  const handleResultsDeleted = useCallback((data) => {
    console.log('🗑️ Dashboard: Results deleted:', data)
    setHasResults(false)
    setResultsSchedule(null)
    setResultsBets([])
    toast.info('Results have been cleared by admin', { id: 'results-deleted', duration: 4000 })
  }, [])

  // Handle schedule deleted event
  const handleScheduleDeleted = useCallback((data) => {
    console.log('🗑️ Dashboard: Schedule deleted:', data)
    // If the deleted schedule is the current one, clear it (don't set error - let UI handle empty schedule)
    // Match by scheduleId if available, or by week/year
    const isCurrentSchedule = 
      (data?.scheduleId && schedule?._id === data.scheduleId) ||
      (data?.weekNumber === weekInfo.weekNumber && data?.year === weekInfo.year);
    
    if (isCurrentSchedule) {
      setSchedule(null)
      setBets([])
      setError(null) // Clear any existing error to show inline message
      toast.info('Schedule has been removed by admin', { id: 'schedule-deleted', duration: 4000 })
    }
  }, [weekInfo.weekNumber, weekInfo.year, schedule?._id])

  // Handle settings update (e.g., bet amount changes)
  const handleSettingsUpdate = useCallback((data) => {
    console.log('⚙️ Dashboard: Settings update:', data)
    if (data?.key === 'betAmount' && data?.value) {
      setBetAmount(data.value)
    }
  }, [])

  // Real-time updates - targeted handlers to minimize re-renders
  const { isConnected, socketId } = useRealTimeUpdates({
    onScheduleUpdate: handleScheduleUpdate,
    onScheduleCreated: handleScheduleCreated,
    onScheduleUpdated: handleScheduleUpdate,
    onScheduleDeleted: handleScheduleDeleted,
    onBetsUpdate: handleBetsUpdate,
    onResultsUpdate: handleResultsUpdate,
    onPaymentsUpdate: handlePaymentsUpdate,
    onAnnouncementUpdate: handleAnnouncementUpdate,
    onSettled: handleSettledUpdate,
    onSettingsUpdate: handleSettingsUpdate,
    onResultsDeleted: handleResultsDeleted
  })

  // Log socket connection status on mount
  useEffect(() => {
    console.log('📊 Dashboard mounted - Socket connected:', isConnected, 'ID:', socketId)
  }, [isConnected, socketId])

  useEffect(() => {
    fetchData()
    // Fallback polling every 2 minutes only when socket is disconnected
    // With real-time updates working, we reduce polling frequency
    const interval = setInterval(() => {
      if (!isConnected) {
        console.log('📊 Dashboard: Socket disconnected, fetching data via polling')
        fetchData()
      }
    }, 120000) // 2 minutes fallback
    return () => clearInterval(interval)
  }, [fetchData, isConnected])

  // Auto-switch to results tab if there's no current schedule but there are settled results
  useEffect(() => {
    if (!loading && !schedule && hasResults && error?.type === 'not_found') {
      setActiveTab('results')
    }
  }, [loading, schedule, hasResults, error])

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
      const newCountdown = getTimeUntilLockout()
      setCountdown(newCountdown)
      
      // Auto-lock betting when countdown reaches zero
      if (!newCountdown && lockStatus.lockoutTime && !lockStatus.isBettingLocked) {
        setLockStatus(prev => ({ ...prev, isBettingLocked: true, hasStarted: true }))
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [lockStatus.lockoutTime, lockStatus.isBettingLocked])

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
          <p className={`mt-3 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{t('loading')}</p>
        </div>
      </div>
    )
  }

  // Only show full-page error for network/server errors, or if there's no schedule AND no results
  // If there's no current schedule but there ARE settled results, show the dashboard with results
  if (error && (error.type !== 'not_found' || !hasResults)) {
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
                {t('tryAgain')}
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
                {t('howToPlay')}
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
          {/* Large screen layout - everything in one row */}
          <div className="hidden lg:flex lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-brand flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                  <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                  <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                </svg>
                {t('title')}
              </h1>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                {t('subtitle', { week: weekInfo.weekNumber, year: weekInfo.year })}
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
                  {t('status.bettingClosed')}
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
                    <>
                      <Link
                        to="/place-bet"
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        <BetIcon /> {bets.some(bet => {
                          const odId = user?._id || user?.id
                          const betUserId = bet.userId?._id || bet.userId
                          return odId && betUserId && betUserId.toString() === odId.toString()
                        }) ? t('cta.updateBetShort') : t('cta.placeBet')}
                      </Link>
                      <button
                        onClick={handleOpenGuestModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                        title={tBet('guest.addGuest')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        {tBet('guest.addGuest')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Small/Medium screen layout */}
          <div className="lg:hidden space-y-3">
            {/* Row 1: Dashboard heading (left) + Live countdown (right) */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className={`text-xl sm:text-2xl font-brand flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                    <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                    <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                    <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                  </svg>
                  {t('title')}
                </h1>
                <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  {t('subtitle', { week: weekInfo.weekNumber, year: weekInfo.year })}
                </p>
              </div>

              {/* Right side: Status/Countdown */}
              <div className="flex items-center gap-2">
                {lockStatus.isBettingLocked ? (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                    isDark 
                      ? 'bg-red-900/30 text-red-400 border border-red-800/50' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {t('status.bettingClosed')}
                  </span>
                ) : (
                  <>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                      isDark 
                        ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      LIVE
                    </span>
                    {countdown && (
                      <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs ${
                        isDark 
                          ? 'bg-dark-700 border border-dark-600' 
                          : 'bg-white border border-gray-200 shadow-sm'
                      }`}>
                        <svg className={`w-3 h-3 mr-0.5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {countdown.days > 0 && (
                          <>
                            <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {String(countdown.days).padStart(2, '0')}
                            </span>
                            <span className={`text-[8px] ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>d</span>
                            <span className={`font-bold ${isDark ? 'text-dark-500' : 'text-gray-300'}`}>:</span>
                          </>
                        )}
                        <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {String(countdown.hours).padStart(2, '0')}
                        </span>
                        <span className={`text-[8px] ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>h</span>
                        <span className={`font-bold animate-pulse ${isDark ? 'text-dark-500' : 'text-gray-300'}`}>:</span>
                        <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {String(countdown.minutes).padStart(2, '0')}
                        </span>
                        <span className={`text-[8px] ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>m</span>
                        <span className={`font-bold animate-pulse ${isDark ? 'text-dark-500' : 'text-gray-300'}`}>:</span>
                        <span className={`font-mono font-bold tabular-nums ${
                          countdown.hours === 0 && countdown.minutes < 10 
                            ? 'text-red-500' 
                            : isDark ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          {String(countdown.seconds).padStart(2, '0')}
                        </span>
                        <span className={`text-[8px] ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>s</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Row 2: Two buttons in equal columns */}
            {!lockStatus.isBettingLocked && (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/place-bet"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  <BetIcon />
                  <span>{bets.some(bet => {
                    const odId = user?._id || user?.id
                    const betUserId = bet.userId?._id || bet.userId
                    return odId && betUserId && betUserId.toString() === odId.toString()
                  }) ? t('cta.updateBetShort') : t('cta.placeBet')}</span>
                </Link>
                <button
                  onClick={handleOpenGuestModal}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>{tBet('guest.addGuest')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        {schedule && (
          <div className="mb-6">
            <div className={`grid grid-cols-4 gap-2 p-1.5 rounded-xl ${
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
                <span className="hidden sm:inline">{t('tabs.standings')}</span>
                <span className="sm:hidden">{t('tabs.standingsShort', t('tabs.standings'))}</span>
              </button>
              
              {/* Results Tab - Always shown */}
              <button
                onClick={() => setActiveTab('results')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'results'
                    ? isDark
                      ? 'bg-amber-600 text-white shadow-lg'
                      : 'bg-white text-gray-900 shadow-md'
                    : isDark
                      ? 'text-dark-100 hover:text-yellow-300 hover:bg-dark-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">{t('tabs.results', 'Results')}</span>
                <span className="sm:hidden">{t('tabs.resultsShort', 'Results')}</span>
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
                <span className="hidden sm:inline">{t('tabs.schedule')}</span>
                <span className="sm:hidden">{t('tabs.scheduleShort', t('tabs.schedule'))}</span>
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
                <span className="hidden sm:inline">{t('statsTab')}</span>
                <span className="sm:hidden">{t('statsTabShort', 'Stats')}</span>
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
                <span>📊</span> {t('weekStats', { week: weekInfo.weekNumber })}
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
                    {t('stats.totalMatches')}
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
                    {t('stats.completed')}
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
                    {t('stats.participants')}
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
                    {t('stats.totalGoals')}
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
                <span><CalendarIcon/></span> Week {weekInfo.weekNumber} 
              </h2>
              <div className="flex items-center gap-3">
                {/* PDF Download Button - Always visible when there are bets, disabled for non-admin until first game starts */}
                {bets.length > 0 && (
                  <button
                    onClick={isSettled ? handleDownloadResultsPDF : handleDownloadPredictionPDF}
                    disabled={downloadingPDF}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      downloadingPDF
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark
                          ? 'bg-dark-700 hover:bg-dark-600 text-dark-200 border border-dark-600'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                    }`}
                    title={isSettled ? 'Download Results PDF' : 'Download Predictions PDF'}
                  >
                    {downloadingPDF ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    PDF
                  </button>
                )}
              </div>
            </div>
            <div className="p-4">
              <QuinielaTable 
                bets={bets} 
                schedule={schedule} 
                isSettled={isSettled}
                hasStarted={lockStatus.hasStarted}
                currentUserId={user?.id}
                betAmount={betAmount}
              />
            </div>
          </div>
        )}

        {/* Standings Tab - No Schedule Available */}
        {activeTab === 'standings' && !schedule && !loading && !error && (
          <div className={`rounded-xl border ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="p-8 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDark ? 'bg-amber-500/10' : 'bg-amber-50'
              }`}>
                <span className="text-3xl">📅</span>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                No Schedule Available
              </h3>
              <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                The schedule for this week hasn't been created yet or has been removed. Please check back later.
              </p>
            </div>
          </div>
        )}

        {/* Results Tab Content */}
        {activeTab === 'results' && (
          <div className={`rounded-xl border ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            {hasResults && resultsSchedule ? (
              <>
                {/* Header with data */}
                <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  isDark ? 'border-dark-700' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <h2 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <span>🏆</span> {t('results.title', { week: resultsInfo.jornada || resultsInfo.weekNumber })}
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {t('results.finalResults', 'Final Results')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      <span>👥</span> {resultsBets.length} participant{resultsBets.length !== 1 ? 's' : ''}
                    </span>
                    
                    {/* Results PDF Download Button */}
                    {resultsBets.length > 0 && (
                      <button
                        onClick={handleDownloadLastWeekResultsPDF}
                        disabled={downloadingPDF}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          downloadingPDF
                            ? 'opacity-50 cursor-not-allowed'
                            : isDark
                              ? 'bg-dark-700 hover:bg-dark-600 text-dark-200 border border-dark-600'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                        }`}
                        title={t('results.downloadPDF', 'Download PDF')}
                      >
                        {downloadingPDF ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        PDF
                      </button>
                    )}
                    
                    {/* Admin Delete Results Button */}
                    {isAdmin && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isDark
                            ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50'
                            : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                        }`}
                        title={t('results.deleteResults', 'Delete Results')}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {t('results.deleteResults', 'Delete')}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Results Summary Stats - Winner Highlight */}
                <div className={`px-5 py-4 border-b ${
                  isDark ? 'border-dark-700 bg-gradient-to-r from-yellow-900/20 to-amber-900/20' : 'border-gray-100 bg-gradient-to-r from-yellow-50 to-amber-50'
                }`}>
                  {/* Winner Section */}
                  {resultsBets.length > 0 && resultsBets[0].totalPoints !== undefined && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                          isDark ? 'bg-yellow-900/50 border-2 border-yellow-500' : 'bg-yellow-100 border-2 border-yellow-400'
                        }`}>
                          <span className="text-2xl">🏆</span>
                        </div>
                        <div>
                          <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>
                            {resultsBets.filter(b => b.isWinner).length > 1 
                              ? t('results.coChampions', 'Co-Champions')
                              : t('results.winner', 'Winner')}
                          </p>
                          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {resultsBets.filter(b => b.isWinner).map(b => 
                              b.isGuestBet ? b.participantName : (b.userId?.name || 'Unknown')
                            ).join(', ')}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                            {resultsBets[0].totalPoints} {t('results.pointsLabel', 'pts')} · 
                            {t('results.goalDiff', 'Goal Diff')}: {resultsBets[0].goalDifference}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-center sm:text-right">
                        <div className={`px-4 py-2 rounded-lg ${isDark ? 'bg-dark-700/50' : 'bg-white/70'}`}>
                          <p className={`text-xs font-medium ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                            {t('results.totalGoals', 'Total Goals')}
                          </p>
                          <p className={`text-xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            {resultsSchedule.actualTotalGoals ?? '—'}
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg ${isDark ? 'bg-dark-700/50' : 'bg-white/70'}`}>
                          <p className={`text-xs font-medium ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                            {t('results.prize', 'Prize')}
                          </p>
                          <p className={`text-xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            ${resultsBets.length * betAmount}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Match Results Summary */}
                <div className={`px-5 py-3 border-b ${isDark ? 'border-dark-700' : 'border-gray-100'}`}>
                  <h3 className={`text-xs font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    {t('results.matchResults', 'Match Results')}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                    {resultsSchedule.matches?.map((match, idx) => (
                      <div
                        key={match._id}
                        className={`p-2 rounded-lg text-center ${
                          isDark ? 'bg-dark-700/50' : 'bg-gray-50'
                        }`}
                      >
                        <p className={`text-[10px] truncate ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          {idx + 1}. {match.teamA?.substring(0, 3).toUpperCase()}
                        </p>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {match.scoreTeamA ?? '-'} - {match.scoreTeamB ?? '-'}
                        </p>
                        <p className={`text-[10px] truncate ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          {match.teamB?.substring(0, 3).toUpperCase()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Detailed QuinielaTable */}
                <div className="p-4">
                  <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <span>📊</span> {t('results.detailedReport', 'Detailed Report')}
                  </h3>
                  <QuinielaTable 
                    bets={resultsBets} 
                    schedule={resultsSchedule} 
                    isSettled={true}
                    hasStarted={true}
                    currentUserId={user?.id}
                    isLastWeek={true}
                    betAmount={betAmount}
                  />
                </div>
                
                {/* Settled info footer */}
                {resultsInfo.settledAt && (
                  <div className={`px-5 py-3 border-t ${
                    isDark ? 'border-dark-700 bg-dark-700/20' : 'border-gray-100 bg-gray-50/50'
                  }`}>
                    <p className={`text-xs text-center ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('results.settledOn', { date: new Date(resultsInfo.settledAt).toLocaleDateString() })}
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Placeholder when no results */
              <div className="p-8 text-center">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                  isDark ? 'bg-dark-700' : 'bg-gray-100'
                }`}>
                  <svg className={`w-10 h-10 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('results.noResultsTitle', 'No Results Available')}
                </h3>
                
                <p className={`text-sm mb-4 max-w-md mx-auto ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  {t('results.noResultsDescription', 'Results will appear here after the admin settles the current week. Check back after all matches are completed.')}
                </p>
                
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                  isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('results.checkBackLater', 'Waiting for week to be settled')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Results Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
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
                  {t('results.deleteResults', 'Delete Results')}
                </h3>
                
                <p className={`text-sm text-center mb-6 ${
                  isDark ? 'text-dark-300' : 'text-gray-600'
                }`}>
                  {t('results.deleteConfirm', 'Are you sure you want to delete these results? This action cannot be undone.')}
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-dark-700 text-dark-200 hover:bg-dark-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteResults}
                    disabled={deletingResults}
                    className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                  >
                    {deletingResults ? '...' : t('results.deleteResults', 'Delete')}
                  </button>
                </div>
              </div>
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
