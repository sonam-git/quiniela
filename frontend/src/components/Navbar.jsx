import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

// Icon Components - Clean, modern style
const SunIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
    />
  </svg>
)

const MoonIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
    />
  </svg>
)

const DashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" 
    />
  </svg>
)

export const BetIcon = () => (
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
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
    />
  </svg>
)

const AdminIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
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

const LanguageIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
    />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

// NavLink component for consistent styling
const NavLink = ({ to, icon: Icon, children, isActive, isDark, onClick, className = '' }) => {
  const baseClasses = 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200'
  const activeClasses = isDark
    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  const inactiveClasses = isDark
    ? 'text-gray-300 hover:bg-dark-700/50 hover:text-white border border-transparent'
    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${className}`}
    >
      {Icon && <Icon />}
      {children}
    </Link>
  )
}

// AdminNavLink with special amber styling
const AdminNavLink = ({ to, icon: Icon, children, isActive, isDark, onClick }) => {
  const baseClasses = 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200'
  const activeClasses = isDark
    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
    : 'bg-amber-50 text-amber-700 border border-amber-200'
  const inactiveClasses = isDark
    ? 'text-amber-400/80 hover:bg-amber-500/10 hover:text-amber-400 border border-transparent'
    : 'text-amber-600 hover:bg-amber-50 hover:text-amber-700 border border-transparent'
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {Icon && <Icon />}
      {children}
    </Link>
  )
}

// Primary button-style link
const PrimaryButton = ({ to, icon: Icon, children, isActive, isDark, onClick }) => {
  const baseClasses = 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm'
  const activeClasses = 'bg-emerald-600 text-white ring-2 ring-emerald-500 ring-offset-2 ' + 
    (isDark ? 'ring-offset-dark-800' : 'ring-offset-white')
  const inactiveClasses = 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white hover:shadow-md hover:shadow-emerald-500/25'
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {Icon && <Icon />}
      {children}
    </Link>
  )
}

export default function Navbar() {
  const { user, logout, isAdmin, isDeveloper } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const { t, i18n } = useTranslation()

  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'en'
  
  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
    setLangMenuOpen(false)
  }

  // Handle scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isDark 
        ? 'bg-dark-800/95 backdrop-blur-md border-b border-dark-700/50' 
        : 'bg-white/95 backdrop-blur-md border-b border-gray-200/50'
    } ${scrolled ? (isDark ? 'shadow-lg shadow-black/20' : 'shadow-lg shadow-gray-200/50') : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-md transition-transform group-hover:scale-105 ${
              isDark ? 'bg-dark-700 ring-1 ring-dark-600' : 'bg-white ring-1 ring-gray-200'
            }`}>
              <img 
                src="/quiniela-logo.png" 
                alt="Quiniela" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-xl">⚽</span>';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className={`font-brand text-3xl leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Quiniela</span>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-semibold leading-tight ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}>{t('ligaMXYear', { year: 2026 })}</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Main Nav Links */}
            <div className={`flex items-center gap-1 px-1 py-1 rounded-xl ${
              isDark ? 'bg-dark-700/40' : 'bg-gray-100/60'
            }`}>
              <NavLink to="/" icon={HomeIcon} isActive={isActive('/')} isDark={isDark}>
                {t('navbar.home')}
              </NavLink>
              <NavLink to="/about" icon={AboutIcon} isActive={isActive('/about')} isDark={isDark}>
                {t('navbar.about')}
              </NavLink>
              <NavLink to="/instructions" icon={InstructionsIcon} isActive={isActive('/instructions')} isDark={isDark}>
                {t('navbar.how_to_play')}
              </NavLink>
            </div>

            {/* Divider */}
            <div className={`h-8 w-px mx-3 ${isDark ? 'bg-dark-600' : 'bg-gray-200'}`} />
            {user ? (
              <>
                {/* User Nav Links */}
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <AdminNavLink to="/admin" icon={AdminIcon} isActive={isActive('/admin')} isDark={isDark}>
                      {isDeveloper ? 'Admin | Dev' : t('navbar.admin')}
                    </AdminNavLink>
                  )}
                    <NavLink to="/dashboard" icon={DashboardIcon} isActive={isActive('/dashboard')} isDark={isDark}>
                    {t('navbar.dashboard')}
                  </NavLink>
                  <PrimaryButton to="/place-bet" icon={BetIcon} isActive={isActive('/place-bet')} isDark={isDark}>
                    {t('navbar.predict_now')}
                  </PrimaryButton>
                </div>
                {/* User Profile */}
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                      isActive('/profile')
                        ? isDark 
                          ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30' 
                          : 'bg-emerald-50 ring-1 ring-emerald-200'
                        : isDark 
                          ? 'bg-dark-700/50 hover:bg-dark-700 hover:ring-1 hover:ring-dark-600' 
                          : 'bg-gray-100/80 hover:bg-gray-200 hover:ring-1 hover:ring-gray-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-xs">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {user.name?.charAt(0).toUpperCase() + user.name?.slice(1)}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDark 
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:ring-1 hover:ring-red-500/20' 
                        : 'text-red-500 hover:text-red-600 hover:bg-red-50 hover:ring-1 hover:ring-red-200'
                    }`}
                    title="Sign out"
                  >
                    <LogoutIcon />
                  </button>
                   {/* Divider */}
                <div className={`h-8 w-px mx-3 ${isDark ? 'bg-dark-600' : 'bg-gray-200'}`} />
                     {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isDark 
                  ? 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 hover:ring-1 hover:ring-amber-500/20' 
                  : 'text-gray-500 hover:text-amber-500 hover:bg-amber-50 hover:ring-1 hover:ring-amber-200'
              }`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
                  {/* Language Switcher */}
                  <div className="relative">
                    <button
                      onClick={() => setLangMenuOpen(!langMenuOpen)}
                      className={`p-2.5 rounded-xl transition-all duration-200 flex items-center gap-1 ${
                        isDark 
                          ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 hover:ring-1 hover:ring-blue-500/20' 
                          : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200'
                      }`}
                      title={t('common:language')}
                    >
                      <LanguageIcon />
                      <span className="text-xs font-semibold uppercase">{currentLang}</span>
                    </button>
                    {langMenuOpen && (
                      <div className={`absolute right-0 mt-2 w-32 rounded-lg shadow-lg py-1 z-50 ${
                        isDark ? 'bg-dark-700 border border-dark-600' : 'bg-white border border-gray-200'
                      }`}>
                        <button
                          onClick={() => toggleLanguage('en')}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                            currentLang === 'en' 
                              ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                              : isDark ? 'text-gray-300 hover:bg-dark-600' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>🇺🇸</span> English
                        </button>
                        <button
                          onClick={() => toggleLanguage('es')}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                            currentLang === 'es' 
                              ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                              : isDark ? 'text-gray-300 hover:bg-dark-600' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>🇲🇽</span> Español
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Divider */}
                <div className={`h-8 w-px mx-3 ${isDark ? 'bg-dark-600' : 'bg-gray-200'}`} />
                
                {/* Auth Links */}
                <div className="flex items-center gap-2">
                  <NavLink to="/login" icon={LoginIcon} isActive={isActive('/login')} isDark={isDark}>
                    {t('navbar.sign_in')}
                  </NavLink>
                  <PrimaryButton to="/signup" icon={SignupIcon} isActive={isActive('/signup')} isDark={isDark}>
                    {t('navbar.get_started')}
                  </PrimaryButton>
                             <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isDark 
                  ? 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 hover:ring-1 hover:ring-amber-500/20' 
                  : 'text-gray-500 hover:text-amber-500 hover:bg-amber-50 hover:ring-1 hover:ring-amber-200'
              }`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
                  {/* Language Switcher */}
                  <div className="relative">
                    <button
                      onClick={() => setLangMenuOpen(!langMenuOpen)}
                      className={`p-2.5 rounded-xl transition-all duration-200 flex items-center gap-1 ${
                        isDark 
                          ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 hover:ring-1 hover:ring-blue-500/20' 
                          : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200'
                      }`}
                      title={t('common:language')}
                    >
                      <LanguageIcon />
                      <span className="text-xs font-semibold uppercase">{currentLang}</span>
                    </button>
                    {langMenuOpen && (
                      <div className={`absolute right-0 mt-2 w-32 rounded-lg shadow-lg py-1 z-50 ${
                        isDark ? 'bg-dark-700 border border-dark-600' : 'bg-white border border-gray-200'
                      }`}>
                        <button
                          onClick={() => toggleLanguage('en')}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                            currentLang === 'en' 
                              ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                              : isDark ? 'text-gray-300 hover:bg-dark-600' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>🇺🇸</span> English
                        </button>
                        <button
                          onClick={() => toggleLanguage('es')}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                            currentLang === 'es' 
                              ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                              : isDark ? 'text-gray-300 hover:bg-dark-600' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>🇲🇽</span> Español
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Language Switcher - Mobile */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className={`p-2.5 rounded-xl transition-colors flex items-center gap-1 ${
                  isDark ? 'text-gray-400 hover:text-blue-400 hover:bg-dark-700' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
                }`}
              >
                <LanguageIcon />
                <span className="text-xs font-semibold uppercase">{currentLang}</span>
              </button>
              {langMenuOpen && (
                <div className={`absolute right-0 mt-2 w-32 rounded-lg shadow-lg py-1 z-50 ${
                  isDark ? 'bg-dark-700 border border-dark-600' : 'bg-white border border-gray-200'
                }`}>
                  <button
                    onClick={() => toggleLanguage('en')}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      currentLang === 'en' 
                        ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                        : isDark ? 'text-gray-300 hover:bg-dark-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>🇺🇸</span> English
                  </button>
                  <button
                    onClick={() => toggleLanguage('es')}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      currentLang === 'es' 
                        ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                        : isDark ? 'text-gray-300 hover:bg-dark-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>🇲🇽</span> Español
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-colors ${
                isDark ? 'text-gray-400 hover:text-amber-400 hover:bg-dark-700' : 'text-gray-500 hover:text-amber-500 hover:bg-gray-100'
              }`}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2.5 rounded-xl transition-colors ${
                isDark ? 'text-gray-300 hover:bg-dark-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0'
        }`}>
          <div className={`pt-3 border-t ${isDark ? 'border-dark-700/50' : 'border-gray-200/50'}`}>
            {user ? (
              <div className="space-y-2">
                {/* User Info */}
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl mx-1 transition-all ${
                    isActive('/profile')
                      ? isDark 
                        ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30' 
                        : 'bg-emerald-50 ring-1 ring-emerald-200'
                      : isDark 
                        ? 'bg-dark-700/50 hover:bg-dark-700' 
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className={`font-semibold text-sm block ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user.name?.charAt(0).toUpperCase() + user.name?.slice(1)}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user.email}
                    </span>
                  </div>
                  <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {t('navbar.view_profile')} →
                  </span>
                </Link>

                {/* Mobile Nav Links */}
                <div className="space-y-1 px-1">
                  <NavLink to="/" icon={HomeIcon} isActive={isActive('/')} isDark={isDark} onClick={closeMobileMenu}>
                    {t('navbar.home')}
                  </NavLink>
                  <NavLink to="/dashboard" icon={DashboardIcon} isActive={isActive('/dashboard')} isDark={isDark} onClick={closeMobileMenu}>
                    {t('navbar.dashboard')}
                  </NavLink>
                  {isAdmin && (
                    <AdminNavLink to="/admin" icon={AdminIcon} isActive={isActive('/admin')} isDark={isDark} onClick={closeMobileMenu}>
                      {isDeveloper ? 'Admin | Dev' : t('navbar.admin')}
                    </AdminNavLink>
                  )}
                  <NavLink to="/about" icon={AboutIcon} isActive={isActive('/about')} isDark={isDark} onClick={closeMobileMenu}>
                    {t('navbar.about')}
                  </NavLink>
                  <NavLink to="/instructions" icon={InstructionsIcon} isActive={isActive('/instructions')} isDark={isDark} onClick={closeMobileMenu}>
                    {t('navbar.how_to_play')}
                  </NavLink>
                </div>

                {/* CTA Button */}
                <div className="px-1 pt-2">
                  <PrimaryButton to="/place-bet" icon={BetIcon} isActive={isActive('/place-bet')} isDark={isDark} onClick={closeMobileMenu}>
                    {t('navbar.place_bet')}
                  </PrimaryButton>
                </div>

                <div className={`my-3 border-t mx-1 ${isDark ? 'border-dark-700/50' : 'border-gray-200/50'}`} />
                
                {/* Logout Button */}
                <button
                  onClick={() => { handleLogout(); closeMobileMenu(); }}
                  className={`flex items-center gap-2 w-full mx-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isDark 
                      ? 'text-red-400 hover:bg-red-500/10 hover:ring-1 hover:ring-red-500/20' 
                      : 'text-red-600 hover:bg-red-50 hover:ring-1 hover:ring-red-200'
                  }`}
                >
                  <LogoutIcon />
                  {t('navbar.sign_out')}
                </button>
              </div>
            ) : (
              <div className="space-y-2 px-1">
                <NavLink to="/" icon={HomeIcon} isActive={isActive('/')} isDark={isDark} onClick={closeMobileMenu}>
                  {t('navbar.home')}
                </NavLink>
                <NavLink to="/about" icon={AboutIcon} isActive={isActive('/about')} isDark={isDark} onClick={closeMobileMenu}>
                  {t('navbar.about')}
                </NavLink>
                <NavLink to="/instructions" icon={InstructionsIcon} isActive={isActive('/instructions')} isDark={isDark} onClick={closeMobileMenu}>
                  {t('navbar.how_to_play')}
                </NavLink>
                <NavLink to="/login" icon={LoginIcon} isActive={isActive('/login')} isDark={isDark} onClick={closeMobileMenu}>
                  {t('navbar.sign_in')}
                </NavLink>
                
                <div className="pt-2">
                  <Link
                    to="/signup"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-emerald-500/25"
                  >
                    <SignupIcon />
                    {t('navbar.get_started')} — {t('navbar.its_free')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
