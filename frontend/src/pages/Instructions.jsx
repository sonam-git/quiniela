import { useTheme } from '../context/ThemeContext'
import { Link } from 'react-router-dom'

export default function Instructions() {
  const { isDark } = useTheme()

  const steps = [
    {
      number: 1,
      icon: '📝',
      title: 'Sign Up for an Account',
      description: 'Create your Quiniela account by clicking "Sign Up" in the navigation bar. Enter your name, email, invitation code and create a password to get started.'
    },
    {
      number: 2,
      icon: '📊',
      title: 'View the Dashboard',
      description: 'Once logged in, go to the Dashboard to see the current week\'s matches and schedule. You\'ll see all 9 Liga MX games for that jornada along with match times.'
    },
    {
      number: 3,
      icon: '🎯',
      title: 'Place your predictions',
      description: 'Click on "Predict Now" to make your predictions. For each of the 9 matches, choose your guess: 🏠 Home Win, ✈️ Away Win, or E for Draw. You can also update your prediction before the first game. Once the first game is started you cannot change your prediction'
    },
    {
      number: 4,
      icon: '⚽',
      title: 'Predict Total Goals',
      description: 'Guess the total number of goals that will be scored across all 9 games for the week. This is your tiebreaker if multiple players have the same points!'
    },
    {
      number: 5,
      icon: '💰',
      title: 'Pay the Entry Fee',
      description: 'Pay the entry amount to the game administrator. Your prediction will show as "Pending Payment" until confirmed by the admin.'
    },
    {
      number: 6,
      icon: '✅',
      title: 'Submit Your Prediction',
      description: 'Once you\'ve made all your predictions and your payment is confirmed, submit your prediction before the first match begins. Betting closes when the first game starts!'
    },
    {
      number: 7,
      icon: '📺',
      title: 'Watch the Games',
      description: 'Follow the matches throughout the week. The standings on the Dashboard update as games are completed, showing everyone\'s points in real-time.'
    },
    {
      number: 8,
      icon: '🏆',
      title: 'Win the Prize',
      description: 'After all games are finished, the participant with the highest points wins! If multiple players tie on points, the closest total goals prediction wins. If still tied, the prize is split between the winners.'
    }
  ]

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className={`text-2xl sm:text-3xl font-bold flex items-center justify-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            How to Play Quiniela
          </h1>
          <p className={`mt-3 text-base ${isDark ? 'text-dark-400' : 'text-gray-600'}`}>
            Follow these simple steps to join the Liga MX prediction game
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`relative rounded-xl border p-5 transition-all hover:shadow-lg ${
                isDark 
                  ? 'bg-dark-800 border-dark-700 hover:border-dark-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Step Number & Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    isDark ? 'bg-dark-700' : 'bg-gray-100'
                  }`}>
                    {step.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isDark 
                        ? 'bg-emerald-900/40 text-emerald-400' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      Step {step.number}
                    </span>
                  </div>
                  <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-dark-400' : 'text-gray-600'}`}>
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`absolute left-9 top-[4.5rem] w-0.5 h-6 ${
                  isDark ? 'bg-dark-700' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Scoring Rules */}
        <div className={`mt-10 rounded-xl border p-6 ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <span>📋</span> Scoring Rules
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'}`}>
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ✓ Correct Prediction
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                +1 Point
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                Per correct match result
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'}`}>
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ⚽ Total Goals Tiebreaker
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                Closest Wins
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                Used when points are tied
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className={`mt-6 rounded-xl border p-6 ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <span>🔤</span> Prediction Legend
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'}`}>
              <span className="text-lg">🏠</span>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Home Team Wins</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'}`}>
              <span className="text-lg">✈️</span>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Away Team Wins</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'}`}>
              <span className={`text-lg font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>E</span>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Draw (Empate)</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className={`text-sm mb-4 ${isDark ? 'text-dark-400' : 'text-gray-600'}`}>
            Ready to start playing?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              <span>📝</span> Sign Up Now
            </Link>
            <Link
              to="/dashboard"
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-dark-700 hover:bg-dark-600 text-white border border-dark-600'
                  : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
              }`}
            >
              <span>📊</span> Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
