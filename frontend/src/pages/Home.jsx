import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const { t } = useTranslation('home')

  return (
    <div className={` ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden ">
        {/* Background gradient */}
        <div className={`absolute inset-0 ${
          isDark 
            ? 'bg-gradient-to-br from-dark-900 via-dark-800 to-emerald-900/20' 
            : 'bg-gradient-to-br from-white via-emerald-50 to-teal-100'
        }`} />
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left">
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {user ? (
                  <>
                    <span className="font-welcome">{t('hero.welcomeBack')}</span>{' '}
                    <span className="font-brand bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                      {user.name || user.username || 'Friend'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-welcome">{t('hero.welcomeTo')}</span>{' '}
                    <span className="font-brand bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                      Quiniela
                    </span>
                  </>
                )}
              </h1>

              <p className={`text-lg sm:text-xl lg:text-2xl mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light ${
                isDark ? 'text-dark-300' : 'text-gray-600'
              }`}>
                {user 
                  ? t('hero.subtitleLoggedIn')
                  : t('hero.subtitle')
                }
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {user ? (
                  <>
                       <Link
                      to="/admin"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold text-white bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-emerald-600 hover:to-teal-700 shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {t('cta.admin')}
                    </Link>
                    <Link
                      to="/place-bet"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {t('cta.prediction')}
                    </Link>
                    <Link
                      to="/dashboard"
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:-translate-y-1 ${
                        isDark 
                          ? 'bg-dark-600 text-white ring-1 ring-dark-600 hover:bg-dark-600 hover:ring-dark-500' 
                          : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {t('cta.standings')}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      {t('cta.getStartedFree')}
                    </Link>
                    <Link
                      to="/login"
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:-translate-y-1 ${
                        isDark 
                          ? 'bg-dark-700/80 text-white ring-1 ring-dark-600 hover:bg-dark-600 hover:ring-dark-500' 
                          : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      {t('cta.signIn')}
                    </Link>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className={`mt-14 grid grid-cols-3 gap-8 border-t ${
                isDark ? 'border-dark-700/50' : 'border-gray-200/80'
              }`}>
                <div className="text-center lg:text-left">
                  <div className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>9</div>
                  <div className={`text-sm font-medium mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    Matches / Week
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>17</div>
                  <div className={`text-sm font-medium mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    Weeks Total
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`}>🏆</div>
                  <div className={`text-sm font-medium mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    Weekly Prizes
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className={`relative rounded-3xl overflow-hidden shadow-2xl ring-1 transform hover:scale-[1.02] transition-transform duration-500 ${
                isDark ? 'shadow-emerald-500/10 ring-dark-700' : 'shadow-emerald-500/20 ring-gray-200'
              }`}>
                <img
                  src="/hero-quiniela.png"
                  alt="Quiniela - Liga MX Predictions"
                  className="w-full max-w-lg object-cover"
                />
                {/* Overlay gradient */}
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  isDark ? 'from-dark-900/50 to-transparent' : 'from-black/10 to-transparent'
                }`} />

                {/* Floating Card */}
                <div className={`absolute bottom-6 left-6 right-6 sm:right-auto px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-md ${
                  isDark ? 'bg-transparent ring-1 ring-dark-600' : 'bg-transparent ring-1 ring-gray-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                      🎯
                    </div>
                    <div>
                      <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-100'}`}>
                        Test Your Luck
                      </p>
                      <p className={`text-sm ${isDark ? 'text-yellow-100' : 'text-yellow-100'}`}>
                        Predict & win big!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}