import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext'

export default function OfflineFallback() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${
      isDark ? 'bg-dark-900' : 'bg-gray-50'
    }`}>
      <div className="text-center max-w-md">
        {/* Offline Icon */}
        <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
          isDark ? 'bg-dark-800' : 'bg-white shadow-lg'
        }`}>
          <svg 
            className={`w-10 h-10 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" 
            />
          </svg>
        </div>

        {/* Logo */}
        <img 
          src="/quiniela-logo.png" 
          alt="Quiniela" 
          className="w-16 h-16 mx-auto mb-4"
        />

        {/* Title */}
        <h1 className={`text-2xl font-bold mb-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {t('offline.title')}
        </h1>

        {/* Description */}
        <p className={`text-sm mb-6 ${
          isDark ? 'text-dark-400' : 'text-gray-500'
        }`}>
          {t('offline.description')}
        </p>

        {/* Retry Button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-lg hover:shadow-xl"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('offline.tryAgain')}
        </button>

        {/* Cached Data Notice */}
        <div className={`mt-8 p-4 rounded-xl border ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💡</span>
            <span className={`text-sm font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {t('offline.didYouKnow')}
            </span>
          </div>
          <p className={`text-xs ${
            isDark ? 'text-dark-400' : 'text-gray-500'
          }`}>
            {t('offline.cachedData')}
          </p>
        </div>
      </div>
    </div>
  )
}
