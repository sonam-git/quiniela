import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { isDark } = useTheme()
  const { user } = useAuth()

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
                isDark 
                  ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25' 
                  : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
              }`}>
                <span>⚽</span>
                <span>Liga MX Clausura 2026</span>
              </div>

              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Welcome to{' '}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  Quiniela
                </span>
              </h1>

              <p className={`text-lg sm:text-xl mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed ${
                isDark ? 'text-dark-300' : 'text-gray-600'
              }`}>
                The ultimate Liga MX prediction game! Predict match outcomes, compete with friends and family, 
                and win weekly prizes. Join the excitement of Mexican football.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {user ? (
                  <>
                    <Link
                      to="/bet"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Place Your Bet
                    </Link>
                    <Link
                      to="/dashboard"
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                        isDark 
                          ? 'bg-dark-700/80 text-white ring-1 ring-dark-600 hover:bg-dark-600' 
                          : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 shadow-md'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      View Standings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Join Now
                    </Link>
                    <Link
                      to="/login"
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                        isDark 
                          ? 'bg-dark-700/80 text-white ring-1 ring-dark-600 hover:bg-dark-600' 
                          : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 shadow-md'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </Link>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className={`mt-12 grid grid-cols-3 gap-6 pt-8 border-t ${
                isDark ? 'border-dark-700/50' : 'border-gray-200'
              }`}>
                <div className="text-center lg:text-left">
                  <div className={`text-2xl sm:text-3xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>9</div>
                  <div className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Matches/Week</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className={`text-2xl sm:text-3xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>17</div>
                  <div className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Weeks</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="flex justify-center lg:justify-start">
                    <svg
                      className="w-8 h-8 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <rect x="2" y="7" width="20" height="10" rx="2" fill="currentColor" opacity="0.1"/>
                      <rect x="2" y="7" width="20" height="10" rx="2" stroke="currentColor" strokeWidth={2}/>
                      <path d="M16 13a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" strokeWidth={2}/>
                      <path d="M6 10h.01M18 14h.01" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Weekly Prizes</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className={`relative rounded-2xl overflow-hidden shadow-2xl ring-1 ${
                isDark ? 'shadow-emerald-500/10 ring-dark-700' : 'shadow-emerald-500/20 ring-gray-200'
              }`}>
                <img
                  src="/hero-quiniela.png"
                  alt="Quiniela - Liga MX Predictions"
                  className="w-full max-w-lg object-cover"
                />
                {/* Overlay gradient */}
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  isDark ? 'from-dark-900/40 to-transparent' : 'from-black/5 to-transparent'
                }`} />

                {/* Floating Card */}
                <div className={`absolute -bottom-4 -left-4 sm:left-4 px-4 py-3 rounded-xl shadow-xl backdrop-blur-sm ${
                  isDark ? 'bg-dark-800/90 ring-1 ring-dark-700' : 'bg-white/95 ring-1 ring-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg shadow-md">
                      🏆
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Test Your Luck
                      </p>
                      <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                        Make your guess & see if fortune favors you!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-12 ${isDark ? 'bg-dark-800' : 'bg-emerald-600'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Join the Action?
          </h2>
          <p className={`text-lg mb-8 ${isDark ? 'text-dark-300' : 'text-emerald-100'}`}>
            Start making predictions and compete for weekly prizes today!
          </p>
          {user ? (
            <Link
              to="/place-bet"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold bg-white text-emerald-600 hover:bg-gray-50 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Place Your Bet Now
            </Link>
          ) : (
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold bg-white text-emerald-600 hover:bg-gray-50 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Free Account
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 ${isDark ? 'bg-dark-900 border-t border-dark-800' : 'bg-white border-t border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/quiniela-logo.png" alt="Quiniela" className="h-8 w-auto" />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Quiniela</span>
            </div>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              © 2026 Quiniela. Liga MX Clausura 2026.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/instructions" className={`text-sm transition-colors ${isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                How to Play
              </Link>
              <Link to="/about" className={`text-sm transition-colors ${isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
