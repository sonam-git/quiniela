import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext'

export default function Footer() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`border-t ${isDark ? 'bg-dark-900 border-dark-800' : 'bg-gray-50 border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand Section */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src="/quiniela-logo.png"
                alt="Quiniela Logo"
                className="h-10 w-10"
              />
              <div>
                <h3 className={`text-xl font-brand ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Quiniela
                </h3>
                <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  {t('footer.tagline')}
                </p>
              </div>
            </Link>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-dark-400' : 'text-gray-600'}`}>
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h4 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/dashboard" 
                  className={`text-sm transition-colors ${isDark ? 'text-dark-400 hover:text-emerald-400' : 'text-gray-600 hover:text-emerald-600'}`}
                >
                  {t('nav.dashboard')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/instructions" 
                  className={`text-sm transition-colors ${isDark ? 'text-dark-400 hover:text-emerald-400' : 'text-gray-600 hover:text-emerald-600'}`}
                >
                  {t('footer.howToPlay')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className={`text-sm transition-colors ${isDark ? 'text-dark-400 hover:text-emerald-400' : 'text-gray-600 hover:text-emerald-600'}`}
                >
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Disclaimer Section */}
          <div className="md:col-span-1">
            <h4 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              {t('footer.importantNotice')}
            </h4>
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-amber-500/20' : 'bg-amber-100'
                }`}>
                  <svg className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    {t('footer.notGambling')}
                  </p>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-dark-400' : 'text-gray-600'}`}>
                    {t('footer.entertainmentOnly')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rules & Admin Notice */}
        <div className={`py-6 border-t ${isDark ? 'border-dark-800' : 'border-gray-200'}`}>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-dark-800' : 'bg-white border border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-red-500/10' : 'bg-red-50'
              }`}>
                <svg className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h5 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('footer.communityGuidelines')}
                </h5>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-dark-400' : 'text-gray-600'}`}>
                  {t('footer.communityGuidelinesText')}
                  <span className={`font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}> {t('footer.suspendTerminate')} </span> 
                  {t('footer.communityGuidelinesEnd')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`py-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark ? 'border-dark-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚽</span>
            <p className={`text-sm ${isDark ? 'text-dark-500' : 'text-gray-500'}`}>
              {t('footer.copyright', { year: currentYear })}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              isDark ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {t('footer.forFunOnly')}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              isDark ? 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20' : 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
            }`}>
              🏆 {t('footer.friendsColleagues')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
