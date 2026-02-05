import { useTheme } from '../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function HowItWorks() {
  const { isDark } = useTheme()
  const { t } = useTranslation('howitworks')

  // Section component for consistent styling
  const Section = ({ icon, title, children, highlight = false }) => (
    <section className={`rounded-xl border p-5 sm:p-6 transition-all ${
      highlight 
        ? isDark 
          ? 'bg-emerald-900/20 border-emerald-500/30 ring-1 ring-emerald-500/10' 
          : 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100'
        : isDark 
          ? 'bg-dark-800 border-dark-700' 
          : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
          highlight
            ? isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
            : isDark ? 'bg-dark-700' : 'bg-gray-100'
        }`}>
          {icon}
        </div>
        <h2 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h2>
      </div>
      <div className={`space-y-3 text-sm leading-relaxed ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
        {children}
      </div>
    </section>
  )

  // Info card component
  const InfoCard = ({ icon, title, description, color = 'emerald' }) => {
    const colors = {
      emerald: isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700',
      blue: isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700',
      amber: isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700',
      red: isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700',
    }
    
    return (
      <div className={`p-4 rounded-lg border ${colors[color]}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <p className={`text-xs ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>{description}</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Hero Header */}
        <div className="text-center mb-10">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 ${
            isDark ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          }`}>
            <span>⚙️</span>
            {t('badge')}
          </div>
          <h1 className={`text-2xl sm:text-3xl font-brand flex items-center justify-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {t('title')}
          </h1>
          <p className={`mt-3 text-sm sm:text-base max-w-2xl mx-auto ${isDark ? 'text-dark-400' : 'text-gray-600'}`}>
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-5">
          
          {/* Winner Selection */}
          <Section icon="🏆" title={t('winner.title')} highlight={true}>
            <p className="font-medium">{t('winner.intro')}</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <InfoCard 
                icon="✅" 
                title={t('winner.points.title')} 
                description={t('winner.points.description')}
                color="emerald"
              />
              <InfoCard 
                icon="⚽" 
                title={t('winner.tiebreaker.title')} 
                description={t('winner.tiebreaker.description')}
                color="blue"
              />
              <InfoCard 
                icon="🤝" 
                title={t('winner.split.title')} 
                description={t('winner.split.description')}
                color="amber"
              />
            </div>
            <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'}`}>
              <p className="font-medium mb-2">📊 {t('winner.example.title')}</p>
              <ul className="space-y-1 text-xs">
                <li>• {t('winner.example.player1')}</li>
                <li>• {t('winner.example.player2')}</li>
                <li>• {t('winner.example.result')}</li>
              </ul>
            </div>
          </Section>

          {/* Total Goals Calculation */}
          <Section icon="⚽" title={t('goals.title')}>
            <p>{t('goals.intro')}</p>
            <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'}`}>
              <p className="font-medium mb-2">{t('goals.example.title')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-3">
                <span>Match 1: 2-1 (3 {t('goals.goals')})</span>
                <span>Match 2: 0-0 (0 {t('goals.goals')})</span>
                <span>Match 3: 3-2 (5 {t('goals.goals')})</span>
                <span>Match 4: 1-1 (2 {t('goals.goals')})</span>
                <span>Match 5: 2-0 (2 {t('goals.goals')})</span>
                <span>Match 6: 1-2 (3 {t('goals.goals')})</span>
                <span>Match 7: 0-1 (1 {t('goals.goals')})</span>
                <span>Match 8: 2-2 (4 {t('goals.goals')})</span>
                <span>Match 9: 1-0 (1 {t('goals.goals')})</span>
              </div>
              <p className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                📊 {t('goals.example.total')}
              </p>
            </div>
            <p className={`mt-3 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              <span className="font-medium">💡 {t('goals.tip.title')}</span> {t('goals.tip.description')}
            </p>
          </Section>

          {/* Countdown & Lockout */}
          <Section icon="⏰" title={t('lockout.title')}>
            <p>{t('lockout.intro')}</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-500 text-lg">🟢</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('lockout.before.title')}</span>
                </div>
                <ul className="space-y-1 text-xs">
                  <li>✅ {t('lockout.before.place')}</li>
                  <li>✅ {t('lockout.before.edit')}</li>
                  <li>✅ {t('lockout.before.change')}</li>
                </ul>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-500 text-lg">🔴</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('lockout.after.title')}</span>
                </div>
                <ul className="space-y-1 text-xs">
                  <li>❌ {t('lockout.after.noNew')}</li>
                  <li>❌ {t('lockout.after.noEdit')}</li>
                  <li>❌ {t('lockout.after.noChange')}</li>
                </ul>
              </div>
            </div>
            <p className={`mt-4 p-3 rounded-lg text-xs ${
              isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
            }`}>
              ℹ️ {t('lockout.note')}
            </p>
          </Section>

          {/* Fairness & Privacy */}
          <Section icon="🔒" title={t('fairness.title')}>
            <p>{t('fairness.intro')}</p>
            <div className="grid gap-3 mt-4">
              <InfoCard 
                icon="👁️‍🗨️" 
                title={t('fairness.privacy.title')} 
                description={t('fairness.privacy.description')}
                color="blue"
              />
              <InfoCard 
                icon="⏱️" 
                title={t('fairness.timing.title')} 
                description={t('fairness.timing.description')}
                color="emerald"
              />
              <InfoCard 
                icon="🚫" 
                title={t('fairness.noCheat.title')} 
                description={t('fairness.noCheat.description')}
                color="red"
              />
            </div>
          </Section>

          {/* What You Can See */}
          <Section icon="👀" title={t('visibility.title')}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className={`font-semibold mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  ✅ {t('visibility.canSee.title')}
                </p>
                <ul className="space-y-1 text-xs">
                  <li>• {t('visibility.canSee.own')}</li>
                  <li>• {t('visibility.canSee.schedule')}</li>
                  <li>• {t('visibility.canSee.leaderboard')}</li>
                  <li>• {t('visibility.canSee.results')}</li>
                </ul>
              </div>
              <div>
                <p className={`font-semibold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  ❌ {t('visibility.cantSee.title')}
                </p>
                <ul className="space-y-1 text-xs">
                  <li>• {t('visibility.cantSee.others')}</li>
                  <li>• {t('visibility.cantSee.goalPredictions')}</li>
                  <li>• {t('visibility.cantSee.strategies')}</li>
                </ul>
              </div>
            </div>
            <p className={`mt-4 text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              💡 {t('visibility.note')}
            </p>
          </Section>

          {/* Admin Settlement */}
          <Section icon="⚡" title={t('settlement.title')}>
            <p>{t('settlement.intro')}</p>
            <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'}`}>
              <p className="font-medium mb-3">{t('settlement.process.title')}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>1</span>
                  <span className="text-xs">{t('settlement.process.step1')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>2</span>
                  <span className="text-xs">{t('settlement.process.step2')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>3</span>
                  <span className="text-xs">{t('settlement.process.step3')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>4</span>
                  <span className="text-xs">{t('settlement.process.step4')}</span>
                </div>
              </div>
            </div>
            <p className={`mt-3 text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              ⚠️ {t('settlement.note')}
            </p>
          </Section>

          {/* Quick Reference */}
          <Section icon="📋" title={t('quickRef.title')}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'}`}>
                <p className="font-semibold mb-2">🎯 {t('quickRef.scoring.title')}</p>
                <ul className="space-y-1 text-xs">
                  <li>• {t('quickRef.scoring.correct')}</li>
                  <li>• {t('quickRef.scoring.max')}</li>
                  <li>• {t('quickRef.scoring.tiebreaker')}</li>
                </ul>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'}`}>
                <p className="font-semibold mb-2">🏅 {t('quickRef.predictions.title')}</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>L</strong> = {t('quickRef.predictions.home')}</li>
                  <li>• <strong>E</strong> = {t('quickRef.predictions.draw')}</li>
                  <li>• <strong>V</strong> = {t('quickRef.predictions.away')}</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* CTA */}
          <div className={`rounded-xl border p-6 text-center ${
            isDark ? 'bg-gradient-to-br from-emerald-900/30 to-dark-800 border-emerald-500/20' : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('cta.title')}
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
              {t('cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/instructions"
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isDark 
                    ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📖 {t('cta.howToPlay')}
              </Link>
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
              >
                🎯 {t('cta.goToDashboard')}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
