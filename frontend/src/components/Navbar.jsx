import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

// Icon Components - Smaller, cleaner AWS style
const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
    />
  </svg>
)

const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
    />
  </svg>
)

const DashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
    />
  </svg>
)

const BetIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
    />
  </svg>
)

const LoginIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
    />
  </svg>
)

const SignupIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
    />
  </svg>
)

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
    />
  </svg>
)

const AboutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  </svg>
)

const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
    />
  </svg>
)

const InstructionsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
    />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default function Navbar() {
  const { user, logout } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const getLinkClasses = (path, isButton = false) => {
    if (isButton) return '' // Buttons like Place Bet have their own styling
    
    const active = isActive(path)
    if (active) {
      return isDark
        ? 'text-white bg-dark-700'
        : 'text-gray-900 bg-gray-100'
    }
    return isDark
      ? 'text-dark-200 hover:text-white hover:bg-dark-700'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  }

  const getMobileLinkClasses = (path) => {
    const active = isActive(path)
    if (active) {
      return isDark
        ? 'text-white bg-dark-700'
        : 'text-gray-900 bg-gray-100'
    }
    return isDark
      ? 'text-dark-200 hover:bg-dark-800'
      : 'text-gray-700 hover:bg-gray-50'
  }

  return (
    <nav className={`sticky top-0 z-50 border-b transition-colors ${
      isDark 
        ? 'bg-dark-900 border-dark-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ">
              <img 
                src="/quiniela-logo.png" 
                alt="Quiniela" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-lg">⚽</span>';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className={`font-semibold text-base leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Quiniela</span>
              <span className={`text-[10px] font-medium leading-tight ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}>Liga MX</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${getLinkClasses('/')}`}
            >
              <HomeIcon />
              Home
            </Link>
            <Link
              to="/about"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${getLinkClasses('/about')}`}
            >
              <AboutIcon />
              About
            </Link>
            <Link
              to="/instructions"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${getLinkClasses('/instructions')}`}
            >
              <InstructionsIcon />
              How to Play
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded transition-colors ${
                isDark 
                  ? 'text-dark-300 hover:text-amber-400 hover:bg-dark-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            <div className={`h-5 w-px mx-2 ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`} />

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${getLinkClasses('/dashboard')}`}
                >
                  <DashboardIcon />
                  Dashboard
                </Link>
                <Link
                  to="/place-bet"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold transition-all duration-200 ${
                    isActive('/place-bet')
                      ? 'bg-emerald-700 text-white ring-2 ring-emerald-500 ring-offset-2 ' + (isDark ? 'ring-offset-dark-900' : 'ring-offset-white')
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <BetIcon />
                  Place Bet
                </Link>

                <div className={`h-5 w-px mx-2 ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`} />

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>
                    {user.name[0].toUpperCase() + user.name.slice(1)}
                  </span>
                  <button
                    onClick={handleLogout}
                    className={`p-1.5 rounded transition-colors ${
                      isDark ? 'text-red-300 hover:text-red-400 hover:bg-dark-700' : 'text-red-400 hover:text-red-500 hover:bg-red-100'
                    }`}
                    title="Logout"
                  >
                    <LogoutIcon />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${getLinkClasses('/login')}`}
                >
                  <LoginIcon />
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold transition-all duration-200 ${
                    isActive('/signup')
                      ? 'bg-emerald-700 text-white ring-2 ring-emerald-500 ring-offset-2 ' + (isDark ? 'ring-offset-dark-900' : 'ring-offset-white')
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <SignupIcon />
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded transition-colors ${
                isDark ? 'text-dark-300 hover:text-amber-400' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded transition-colors ${
                isDark ? 'text-dark-200 hover:bg-dark-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={`md:hidden py-3 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
            {user ? (
              <div className="space-y-1">
                {/* User Info */}
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-2 ${
                  isDark ? 'bg-dark-800' : 'bg-gray-50'
                }`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium text-sm block ${isDark ? 'text-dark-100' : 'text-gray-900'}`}>
                      {user.name}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      {user.email}
                    </span>
                  </div>
                </div>

                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${getMobileLinkClasses('/')}`}
                >
                  <HomeIcon />
                  Home
                </Link>

                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${getMobileLinkClasses('/dashboard')}`}
                >
                  <DashboardIcon />
                  Dashboard
                </Link>
                
                <Link
                  to="/place-bet"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${getMobileLinkClasses('/place-bet')}`}
                >
                  <BetIcon />
                  Place Bet
                </Link>

                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${getMobileLinkClasses('/about')}`}
                >
                  <AboutIcon />
                  About
                </Link>

                <Link
                  to="/instructions"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${getMobileLinkClasses('/instructions')}`}
                >
                  <InstructionsIcon />
                  How to Play
                </Link>

                <div className={`my-2 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`} />
                
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium ${
                    isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogoutIcon />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${getMobileLinkClasses('/')}`}
                >
                  <HomeIcon />
                  Home
                </Link>

                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${getMobileLinkClasses('/about')}`}
                >
                  <AboutIcon />
                  About
                </Link>

                <Link
                  to="/instructions"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${getMobileLinkClasses('/instructions')}`}
                >
                  <InstructionsIcon />
                  How to Play
                </Link>

                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${getMobileLinkClasses('/login')}`}
                >
                  <LoginIcon />
                  Sign in
                </Link>
                
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mx-2 mt-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-200"
                >
                  <SignupIcon />
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
