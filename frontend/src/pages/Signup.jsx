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
  const [inviteCode, setInviteCode] = useState('')
  const [isPending, startTransition] = useTransition()
  const { signup } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!inviteCode.trim()) {
      toast.error('Invite code is required')
      return
    }

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
        await signup(name, email, password, inviteCode)
        toast.success('Account created successfully!')
        navigate('/')
      } catch (error) {
        toast.error(error.response?.data?.message || 'Signup failed')
      }
    })
  }

  const inputClassName = `w-full px-3 py-2 rounded-lg text-sm transition-colors
    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
    isDark 
      ? 'bg-dark-700 border border-dark-600 text-dark-100 placeholder-dark-400' 
      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
  }`

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${
      isDark ? 'bg-dark-900' : 'bg-gray-50'
    }`}>
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

        {/* Header */}
        <div className="text-center mb-4">
                <div className=" rounded-xl mx-auto mb-4 flex items-center justify-center">
            <img
              src="/quiniela-logo.png"
              alt="Quiniela Logo"
              className="w-15 h-15"
            />
          </div>
          <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Create your account
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            Join the Liga MX Quiniela Community
          </p>
        </div>

        {/* Form Card */}
        <div className={`rounded-lg border p-6 ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${
                isDark ? 'text-dark-200' : 'text-gray-700'
              }`}>
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClassName}
                placeholder="Your name"
                required
              />
            </div>

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
                className={inputClassName}
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
                className={inputClassName}
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${
                isDark ? 'text-dark-200' : 'text-gray-700'
              }`}>
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClassName}
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${
                isDark ? 'text-dark-200' : 'text-gray-700'
              }`}>
                Invite code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className={inputClassName}
                placeholder="Enter your invite code"
                required
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                You need a valid invite code to create an account
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
