import { useState, useTransition } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPending, startTransition] = useTransition()
  const { login } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        await login(email, password)
        toast.success('Welcome back!')
        navigate('/dashboard')
      } catch (error) {
        toast.error(error.response?.data?.message || 'Login failed')
      }
    })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className={`w-full max-w-md mx-auto rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-dark-800/90 to-dark-900/95 border border-dark-700/50 shadow-card backdrop-blur-sm' 
          : 'bg-white border border-light-300 shadow-card-light'
      }`}>
        {/* Header with sports branding */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="relative inline-block">
            <span className="text-5xl sm:text-6xl animate-pulse-slow">⚽</span>
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping ${
              isDark ? 'bg-sports-green' : 'bg-primary-500'
            }`}></div>
          </div>
          <h1 className={`text-xl sm:text-2xl font-bold mt-4 ${
            isDark ? 'text-gradient' : 'text-light-900'
          }`}>Welcome to Quiniela</h1>
          <p className={`mt-2 text-sm sm:text-base flex items-center justify-center gap-2 ${
            isDark ? 'text-dark-300' : 'text-light-600'
          }`}>
            <span className="hidden sm:inline">🇲🇽</span> Liga MX - Sign in to place your bets
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-dark-200' : 'text-light-700'
            }`}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg transition-all duration-300 text-sm sm:text-base
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                isDark 
                  ? 'bg-dark-800 border border-dark-600 text-dark-100 placeholder-dark-400' 
                  : 'bg-light-100 border border-light-400 text-light-900 placeholder-light-500'
              }`}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-dark-200' : 'text-light-700'
            }`}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg transition-all duration-300 text-sm sm:text-base
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                isDark 
                  ? 'bg-dark-800 border border-dark-600 text-dark-100 placeholder-dark-400' 
                  : 'bg-light-100 border border-light-400 text-light-900 placeholder-light-500'
              }`}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full py-3"
          >
            {isPending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🎯</span> Sign In
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`text-sm sm:text-base ${isDark ? 'text-dark-300' : 'text-light-600'}`}>
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo credentials with sports styling */}
        <div className={`mt-6 p-4 rounded-xl border ${
          isDark 
            ? 'bg-dark-700/50 border-dark-600/50' 
            : 'bg-light-200 border-light-300'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🔑</span>
            <p className={`text-sm font-medium ${isDark ? 'text-dark-200' : 'text-light-700'}`}>
              Demo Credentials:
            </p>
          </div>
          <div className={`space-y-1 text-sm ${isDark ? 'text-dark-400' : 'text-light-600'}`}>
            <p><span className={isDark ? 'text-dark-300' : 'text-light-700'}>Email:</span> carlos@example.com</p>
            <p><span className={isDark ? 'text-dark-300' : 'text-light-700'}>Password:</span> password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
