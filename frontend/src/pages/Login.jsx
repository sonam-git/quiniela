import { useState, useTransition } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [showAdminCode, setShowAdminCode] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { login } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        await login(email, password, adminCode.trim() || null)
        toast.success('Welcome back!')
        navigate('/')
      } catch (error) {
        toast.error(error.response?.data?.message || 'Login failed')
      }
    })
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
      {/* Left Column - Branding (visible on lg screens) */}
      <div className={`hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-center items-center px-12 ${
        isDark 
          ? 'bg-gradient-to-br from-dark-800 via-dark-900 to-emerald-950' 
          : 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800'
      }`}>
        <div className="max-w-md text-center">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="/quiniela-logo.png"
              alt="Quiniela Logo"
              className="w-32 h-32 mx-auto drop-shadow-2xl"
            />
          </div>
          
          {/* Title */}
          <h1 className="font-brand text-5xl text-white mb-4">
            Quiniela Liga MX
          </h1>
          <p className={`text-lg ${isDark ? 'text-dark-300' : 'text-emerald-100'}`}>
            The ultimate digital platform for Liga MX quiniela enthusiasts
          </p>
          
          {/* Features */}
          <div className="mt-10 space-y-4">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
              isDark ? 'bg-dark-700/50' : 'bg-white/10'
            }`}>
              <span className="text-2xl">⚽</span>
              <span className="text-white text-left text-sm">Make predictions for Liga MX matches</span>
            </div>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
              isDark ? 'bg-dark-700/50' : 'bg-white/10'
            }`}>
              <span className="text-2xl">🏆</span>
              <span className="text-white text-left text-sm">Compete with friends for the top spot</span>
            </div>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
              isDark ? 'bg-dark-700/50' : 'bg-white/10'
            }`}>
              <span className="text-2xl">📊</span>
              <span className="text-white text-left text-sm">Track your performance in real-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Back to Home */}
          <Link 
            to="/" 
            className={`inline-flex items-center gap-1.5 mb-6 text-sm font-medium transition-colors ${
              isDark ? 'text-dark-400 hover:text-emerald-400' : 'text-gray-500 hover:text-emerald-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          {/* Header (visible on mobile, hidden on lg) */}
          <div className="text-center mb-8 lg:mb-6">
            <div className="lg:hidden rounded-xl mx-auto mb-4 flex items-center justify-center">
              <img
                src="/quiniela-logo.png"
                alt="Quiniela Logo"
                className="w-16 h-16"
              />
            </div>
            <h1 className={`text-2xl font-brand ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Sign in to Quiniela
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              <span className="lg:hidden">Liga MX digital platform for quiniela enthusiasts</span>
              <span className="hidden lg:inline">Enter your credentials to access your account</span>
            </p>
          </div>

          {/* Form Card */}
          <div className={`rounded-xl border p-6 ${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-lg'
          }`}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${
                  isDark ? 'text-dark-200' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm transition-colors
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-dark-700 border border-dark-600 text-dark-100 placeholder-dark-400' 
                      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${
                  isDark ? 'text-dark-200' : 'text-gray-700'
                }`}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm transition-colors
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-dark-700 border border-dark-600 text-dark-100 placeholder-dark-400' 
                      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Admin Code Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdminCode(!showAdminCode)}
                  className={`text-xs font-medium flex items-center gap-1 ${
                    isDark ? 'text-dark-400 hover:text-dark-300' : 'text-gray-500 hover:text-gray-600'
                  }`}
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${showAdminCode ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Admin access
                </button>
                
                {showAdminCode && (
                  <div className="mt-2">
                    <input
                      type="password"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm transition-colors
                        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-dark-700 border border-amber-800/50 text-dark-100 placeholder-dark-400' 
                          : 'bg-white border border-amber-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="Enter admin code (optional)"
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                      Leave empty for regular user login
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                Don't have an account?{' '}
                <Link to="/signup" className="text-emerald-600 hover:text-emerald-500 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
