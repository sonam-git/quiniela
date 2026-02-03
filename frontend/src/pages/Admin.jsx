import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import toast from 'react-hot-toast'

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
  
  // Announcement state
  const [announcements, setAnnouncements] = useState([])
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' })
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [announcementLoading, setAnnouncementLoading] = useState(false)
  
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
  
  const { user, isAdmin } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.')
      navigate('/dashboard')
    }
  }, [isAdmin, navigate])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [usersRes, betsRes, paymentsRes, codesRes, announcementsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/bets'),
        api.get('/admin/payments'),
        api.get('/admin/codes'),
        api.get('/admin/announcements')
      ])
      setUsers(usersRes.data.users)
      setBets(betsRes.data.bets)
      setPayments(paymentsRes.data.payments || [])
      setCodes(codesRes.data)
      setWeekInfo(paymentsRes.data.weekInfo || betsRes.data.weekInfo || { weekNumber: 0, year: 0 })
      setAnnouncements(announcementsRes.data.announcements || [])
    } catch (error) {
      toast.error('Failed to load admin data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchData()
    }
  }, [isAdmin, fetchData])

  const handleTogglePayment = async (betId, currentStatus) => {
    try {
      await api.patch(`/admin/bets/${betId}/payment`, { paid: !currentStatus })
      toast.success(`Payment status updated to ${!currentStatus ? 'Paid' : 'Pending'}`)
      fetchData()
    } catch (error) {
      toast.error('Failed to update payment status')
    }
  }

  const handleChangePaymentStatus = async (userId, newStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/payment`, { status: newStatus })
      const statusLabels = { paid: 'Paid', pending: 'Pending', na: 'N/A' }
      toast.success(`Payment status updated to ${statusLabels[newStatus]}`)
      fetchData()
    } catch (error) {
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
          fetchData()
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
      
      setNewSignupCode('')
      setNewAdminCode('')
      setShowCodeForm(false)
      fetchData()
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
          fetchData()
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
      await api.post('/admin/announcements', newAnnouncement)
      toast.success('Announcement published successfully!')
      setNewAnnouncement({ title: '', message: '' })
      setShowAnnouncementForm(false)
      fetchData()
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
      fetchData()
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
          fetchData()
        } catch (error) {
          toast.error('Failed to delete announcement')
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }))
        }
      }
    })
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
          <p className={`mt-3 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Loading admin panel...</p>
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
          <div className={`grid grid-cols-3 gap-2 p-1.5 rounded-xl ${
            isDark ? 'bg-dark-800' : 'bg-gray-100'
          }`}>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'users'
                  ? isDark
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-900 shadow-md'
                  : isDark
                    ? 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span>👥</span>
              <span>Users</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'payments'
                  ? isDark
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-900 shadow-md'
                  : isDark
                    ? 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span>💳</span>
              <span>Payments</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? isDark
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-900 shadow-md'
                  : isDark
                    ? 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span>🔐</span>
              <span>Settings</span>
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
                            u.isAdmin 
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
                          u.isAdmin
                            ? isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                            : isDark ? 'bg-dark-600 text-dark-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {u.isAdmin ? '👑 Admin' : 'User'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-center text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {u._id !== user.id && (
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white dark:border-dark-800">
                                  <span className="text-[8px]">👑</span>
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
