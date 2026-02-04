import { useTheme } from '../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function About() {
  const { isDark } = useTheme()
  const { t } = useTranslation('about')

  const features = [
    {
      icon: '📅',
      title: t('features.automatedSchedules.title'),
      description: t('features.automatedSchedules.description')
    },
    {
      icon: '🧮',
      title: t('features.precisionScoring.title'),
      description: t('features.precisionScoring.description')
    },
    {
      icon: '📊',
      title: t('features.transparency.title'),
      description: t('features.transparency.description')
    }
  ]

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className={`text-3xl font-brand mb-2 flex items-center justify-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="9" strokeWidth="2" />
              <path strokeWidth="2" d="M12 3v4M12 17v4M3 12h4M17 12h4M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83" />
            </svg>
            {t('title')}
          </h1>
          <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            {t('subtitle')}
          </p>
        </div>

        {/* Our Story */}
        <section className={`rounded-lg border p-6 mb-6 ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📖</span>
            <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('story.title')}
            </h2>
          </div>
          
          <div className={`space-y-3 text-sm leading-relaxed ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
            <p className={`font-medium ${isDark ? 'text-dark-100' : 'text-gray-800'}`}>
              {t('story.heading')}
            </p>
            <p>
              {t('story.p1')}
            </p>
            <p>
              {t('story.p2')}
            </p>
          </div>
        </section>

        {/* The Vision */}
        <section className={`rounded-lg border p-6 mb-6 ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">👁️</span>
            <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('vision.title')}
            </h2>
          </div>
          
          <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
            <strong>Sonam Sherpa</strong>{t('vision.p1')}
          </p>
          <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
            {t('vision.p2')}
          </p>
          
          {/* Developer Card */}
          <div className={`p-3 rounded-lg flex items-center gap-3 ${
            isDark ? 'bg-dark-700' : 'bg-gray-50'
          }`}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">S</span>
            </div>
            <div>
              <p className={`font-medium text-sm ${isDark ? 'text-dark-100' : 'text-gray-800'}`}>
                Sonam Sherpa
              </p>
              <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                {t('vision.developerRole')}
              </p>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className={`rounded-lg border p-6 mb-6 ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('whatWeDo.title')}
          </h2>
          
          <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
            {t('whatWeDo.description')}
          </p>

          {/* Features */}
          <div className="grid gap-3 sm:grid-cols-3">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  isDark ? 'bg-dark-700 border-dark-600' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className="text-xl mb-2 block">{feature.icon}</span>
                <h3 className={`font-medium text-sm mb-1 ${isDark ? 'text-dark-100' : 'text-gray-800'}`}>
                  {feature.title}
                </h3>
                <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing */}
        <section className={`rounded-lg border p-6 mb-6 text-center ${
          isDark ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100'
        }`}>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>
            {t('closing.text')}{' '}
            <span className={`font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {t('closing.highlight')}
            </span>
            {t('closing.suffix')}
          </p>
        </section>

        {/* CTA */}
        <div className="text-center">
          <p className={`mb-4 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            {t('cta.ready')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="px-6 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              {t('cta.getStarted')}
            </Link>
            <Link
              to="/dashboard"
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-dark-700 hover:bg-dark-600 text-dark-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {t('cta.backHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
