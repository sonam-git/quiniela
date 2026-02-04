import { createContext, useContext, useState, useEffect, useTransition, useCallback } from 'react'
import api from '../services/api'
import socket, { connectSocket } from '../services/socket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me')
      startTransition(() => {
        setUser(response.data.user)
      })
      return response.data.user
    } catch (error) {
      console.error('Failed to refresh user:', error)
      return null
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [])

  // Listen for admin status changes
  useEffect(() => {
    if (!user) return

    // Connect socket
    connectSocket()

    const handleAdminUpdate = (data) => {
      console.log('🔌 Admin update received:', data)
      // If the update is for the current user, refresh their data
      if (data.userId === user._id || data.userId === user.id) {
        console.log('🔌 Refreshing current user data...')
        refreshUser()
      }
    }

    socket.on('admin:update', handleAdminUpdate)

    return () => {
      socket.off('admin:update', handleAdminUpdate)
    }
  }, [user, refreshUser])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await api.get('/auth/me')
        setUser(response.data.user)
      } catch (error) {
        localStorage.removeItem('token')
        setUser(null)
      }
    }
    setLoading(false)
  }

  const login = async (email, password, adminCode = null) => {
    const payload = { email, password }
    if (adminCode) {
      payload.adminCode = adminCode
    }
    const response = await api.post('/auth/login', payload)
    localStorage.setItem('token', response.data.token)
    startTransition(() => {
      setUser(response.data.user)
    })
    return response.data
  }

  const signup = async (name, email, password, inviteCode) => {
    const response = await api.post('/auth/signup', { name, email, password, inviteCode })
    localStorage.setItem('token', response.data.token)
    startTransition(() => {
      setUser(response.data.user)
    })
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    startTransition(() => {
      setUser(null)
    })
  }

  const isAdmin = user?.isAdmin || false
  const isDeveloper = user?.isDeveloper || false

  return (
    <AuthContext.Provider value={{ user, loading, isPending, isAdmin, isDeveloper, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
