import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

// Icon Components
const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
    />
  </svg>
)

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
    />
  </svg>
)

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
    />
  </svg>
)

const BetIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
    />
  </svg>
)

const LoginIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
    />
  </svg>
)

const SignupIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
    />
  </svg>
)

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
    />
  </svg>
)

const AboutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default function Navbar() {
  const { user, logout } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
      isDark 
        ? 'bg-dark-900/95 border-dark-700/50' 
        : 'bg-white/95 border-light-300'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <span className="text-xl sm:text-2xl">⚽</span>
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-lg sm:text-xl tracking-tight ${
                isDark ? 'text-white' : 'text-light-900'
              }`}>Quiniela</span>
              <span className="text-primary-500 text-xs sm:text-sm font-medium hidden sm:block">Liga MX</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* About Link */}
            <Link
              to="/about"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-medium ${
                isDark 
                  ? 'text-dark-200 hover:text-primary-400 hover:bg-dark-700/50' 
                  : 'text-light-700 hover:text-primary-600 hover:bg-light-200'
              }`}
            >
              <AboutIcon />
              About
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-dark-700 hover:bg-dark-600 text-yellow-400' 
                  : 'bg-light-200 hover:bg-light-300 text-dark-700'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-medium ${
                    isDark 
                      ? 'text-dark-200 hover:text-primary-400 hover:bg-dark-700/50' 
                      : 'text-light-700 hover:text-primary-600 hover:bg-light-200'
                  }`}
                >
                  <DashboardIcon />
                  Dashboard
                </Link>
                <Link
                  to="/place-bet"
                  className="bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-dark-900 font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                  <BetIcon />
                  Place Bet
                </Link>
                <div className={`flex items-center space-x-4 ml-2 pl-4 border-l ${
                  isDark ? 'border-dark-600' : 'border-light-400'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className={`font-medium ${isDark ? 'text-dark-200' : 'text-light-700'}`}>
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className={`flex items-center gap-1 transition-colors text-sm ${
                      isDark ? 'text-dark-400 hover:text-red-400' : 'text-light-600 hover:text-red-500'
                    }`}
                  >
                    <LogoutIcon />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-medium ${
                    isDark 
                      ? 'text-dark-200 hover:text-primary-400 hover:bg-dark-700/50' 
                      : 'text-light-700 hover:text-primary-600 hover:bg-light-200'
                  }`}
                >
                  <LoginIcon />
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                  <SignupIcon />
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Theme toggle + Menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-dark-700 text-yellow-400' 
                  : 'bg-light-200 text-dark-700'
              }`}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'text-dark-200 hover:text-white hover:bg-dark-700' 
                  : 'text-light-700 hover:text-light-900 hover:bg-light-200'
              }`}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={`md:hidden py-4 border-t transition-colors ${
            isDark ? 'border-dark-700/50' : 'border-light-300'
          }`}>
            {user ? (
              <div className="space-y-1">
                {/* User Info */}
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl mb-2 ${
                  isDark ? 'bg-dark-700/50' : 'bg-light-200'
                }`}>
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium block ${isDark ? 'text-dark-100' : 'text-light-900'}`}>
                      {user.name}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-light-600'}`}>
                      {user.email}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isDark 
                      ? 'text-dark-200 hover:text-primary-400 hover:bg-dark-700/50' 
                      : 'text-light-700 hover:text-primary-600 hover:bg-light-200'
                  }`}
                >
                  <DashboardIcon />
                  <span className="font-medium">Dashboard</span>
                </Link>
                
                <Link
                  to="/place-bet"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isDark 
                      ? 'text-dark-200 hover:text-primary-400 hover:bg-dark-700/50' 
                      : 'text-light-700 hover:text-primary-600 hover:bg-light-200'
                  }`}
                >
                  <BetIcon />
                  <span className="font-medium">Place Bet</span>
                </Link>

                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isDark 
                      ? 'text-dark-200 hover:text-primary-400 hover:bg-dark-700/50' 
                      : 'text-light-700 hover:text-primary-600 hover:bg-light-200'
                  }`}
                >
                  <AboutIcon />
                  <span className="font-medium">About</span>
                </Link>

                <div className={`my-2 border-t ${isDark ? 'border-dark-700' : 'border-light-300'}`}></div>
                
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${
                    isDark 
                      ? 'text-red-400 hover:bg-red-900/20' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogoutIcon />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isDark 
                      ? 'text-dark-200 hover:text-primary-400 hover:bg-dark-700/50' 
                      : 'text-light-700 hover:text-primary-600 hover:bg-light-200'
                  }`}
                >
                  <AboutIcon />
                  <span className="font-medium">About</span>
                </Link>

                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isDark 
                      ? 'text-dark-200 hover:text-primary-400 hover:bg-dark-700/50' 
                      : 'text-light-700 hover:text-primary-600 hover:bg-light-200'
                  }`}
                >
                  <LoginIcon />
                  <span className="font-medium">Login</span>
                </Link>
                
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mx-2 mt-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-300"
                >
                  <SignupIcon />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
