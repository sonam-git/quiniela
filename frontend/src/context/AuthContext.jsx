import { createContext, useContext, useState, useEffect, useTransition } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    checkAuth()
  }, [])

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

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', response.data.token)
    startTransition(() => {
      setUser(response.data.user)
    })
    return response.data
  }

  const signup = async (name, email, password) => {
    const response = await api.post('/auth/signup', { name, email, password })
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

  return (
    <AuthContext.Provider value={{ user, loading, isPending, login, signup, logout }}>
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
