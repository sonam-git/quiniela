import { useState, useTransition } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPending, startTransition] = useTransition()
  const { signup } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    startTransition(async () => {
      try {
        await signup(name, email, password)
        toast.success('Account created successfully!')
        navigate('/dashboard')
      } catch (error) {
        toast.error(error.response?.data?.message || 'Signup failed')
      }
    })
  }

  const inputClassName = `w-full px-4 py-3 rounded-lg transition-all duration-300 text-sm sm:text-base
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
    isDark 
      ? 'bg-dark-800 border border-dark-600 text-dark-100 placeholder-dark-400' 
      : 'bg-light-100 border border-light-400 text-light-900 placeholder-light-500'
  }`

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
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
              isDark ? 'bg-sports-gold' : 'bg-accent-400'
            }`}></div>
          </div>
          <h1 className={`text-xl sm:text-2xl font-bold mt-4 ${
            isDark ? 'text-gradient' : 'text-light-900'
          }`}>Join Quiniela</h1>
          <p className={`mt-2 text-sm sm:text-base flex items-center justify-center gap-2 ${
            isDark ? 'text-dark-300' : 'text-light-600'
          }`}>
            <span className="hidden sm:inline">🇲🇽</span> Liga MX - Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-dark-200' : 'text-light-700'
            }`}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
              placeholder="Enter your name"
              required
            />
          </div>

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
              className={inputClassName}
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
              className={inputClassName}
              placeholder="Create a password"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-dark-200' : 'text-light-700'
            }`}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClassName}
              placeholder="Confirm your password"
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
                Creating account...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🏆</span> Create Account
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`text-sm sm:text-base ${isDark ? 'text-dark-300' : 'text-light-600'}`}>
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
