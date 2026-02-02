import { useTheme } from '../context/ThemeContext'
import { Link } from 'react-router-dom'

// Icon Components
const StoryIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
    />
  </svg>
)

const VisionIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
    />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
    />
  </svg>
)

const CalculatorIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
    />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
    />
  </svg>
)

const CodeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" 
    />
  </svg>
)

const HeartIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
)

export default function About() {
  const { isDark } = useTheme()

  const features = [
    {
      icon: <CalendarIcon />,
      title: 'Automated Schedules',
      description: 'No more handwriting fixtures; the app fetches the latest Mexican League matches automatically.'
    },
    {
      icon: <CalculatorIcon />,
      title: 'Precision Scoring',
      description: 'A dedicated algorithm calculates points and manages tie-breakers instantly.'
    },
    {
      icon: <ChartIcon />,
      title: 'Transparency',
      description: 'Real-time visibility into "paid" statuses and live standings ensures the game remains fair and fun.'
    }
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900' 
        : 'bg-gradient-to-br from-light-100 via-white to-light-200'
    }`}>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-glow mb-6">
            <span className="text-4xl sm:text-5xl">⚽</span>
          </div>
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-light-900'
          }`}>
            About <span className="text-primary-500">Quiniela</span>
          </h1>
          <p className={`text-lg sm:text-xl max-w-2xl mx-auto ${
            isDark ? 'text-dark-300' : 'text-light-600'
          }`}>
            A digital home for the workplace football community
          </p>
        </div>

        {/* Our Story Section */}
        <section className={`rounded-2xl p-6 sm:p-8 mb-8 border ${
          isDark 
            ? 'bg-dark-800/50 border-dark-700/50' 
            : 'bg-white border-light-300 shadow-lg'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl ${
              isDark ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-600'
            }`}>
              <StoryIcon />
            </div>
            <h2 className={`text-2xl sm:text-3xl font-bold ${
              isDark ? 'text-white' : 'text-light-900'
            }`}>
              Our Story
            </h2>
          </div>
          
          <div className={`space-y-4 text-base sm:text-lg leading-relaxed ${
            isDark ? 'text-dark-300' : 'text-light-600'
          }`}>
            <h3 className={`text-xl font-semibold ${
              isDark ? 'text-dark-100' : 'text-light-800'
            }`}>
              From Paper to Platform
            </h3>
            <p>
              Quiniela was born out of a weekly tradition in a bustling workplace where a group of 
              Mexican friends shared more than just a shift—they shared a passion for football. 
              Every week, the crew would gather to organize a friendly betting pool, meticulously 
              handwriting match schedules, predictions, and scores on sheets of paper.
            </p>
            <p>
              While the "pen and paper" method carried a certain nostalgic charm, it was prone to 
              lost slips, handwriting disputes, and the tedious manual calculation of points.
            </p>
          </div>
        </section>

        {/* The Vision Section */}
        <section className={`rounded-2xl p-6 sm:p-8 mb-8 border ${
          isDark 
            ? 'bg-dark-800/50 border-dark-700/50' 
            : 'bg-white border-light-300 shadow-lg'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl ${
              isDark ? 'bg-sports-gold/20 text-sports-gold' : 'bg-yellow-100 text-yellow-600'
            }`}>
              <VisionIcon />
            </div>
            <h2 className={`text-2xl sm:text-3xl font-bold ${
              isDark ? 'text-white' : 'text-light-900'
            }`}>
              The Vision
            </h2>
          </div>
          
          <div className={`space-y-4 text-base sm:text-lg leading-relaxed ${
            isDark ? 'text-dark-300' : 'text-light-600'
          }`}>
            <p>
              <strong className={isDark ? 'text-dark-100' : 'text-light-800'}>Sonam Sherpa</strong>, 
              a developer and a regular participant in these weekly bets, saw an opportunity to 
              honor this tradition while removing the friction. Witnessing the effort his colleagues 
              put into maintaining the game by hand, Sonam decided to leverage his technical expertise 
              to build a digital home for the group.
            </p>
          </div>
          
          {/* Developer Card */}
          <div className={`mt-6 p-4 rounded-xl flex items-center gap-4 ${
            isDark ? 'bg-dark-700/50' : 'bg-light-100'
          }`}>
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <h4 className={`font-bold ${isDark ? 'text-dark-100' : 'text-light-800'}`}>
                Sonam Sherpa
              </h4>
              <div className={`flex items-center gap-2 text-sm ${
                isDark ? 'text-dark-400' : 'text-light-500'
              }`}>
                <CodeIcon />
                <span>Developer & Creator</span>
              </div>
            </div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className={`rounded-2xl p-6 sm:p-8 mb-8 border ${
          isDark 
            ? 'bg-dark-800/50 border-dark-700/50' 
            : 'bg-white border-light-300 shadow-lg'
        }`}>
          <h2 className={`text-2xl sm:text-3xl font-bold mb-6 ${
            isDark ? 'text-white' : 'text-light-900'
          }`}>
            What We Do
          </h2>
          
          <p className={`text-base sm:text-lg leading-relaxed mb-8 ${
            isDark ? 'text-dark-300' : 'text-light-600'
          }`}>
            Quiniela is a custom-built digital platform designed specifically for the workplace 
            football community. It streamlines the entire experience:
          </p>

          {/* Features Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`p-5 rounded-xl border transition-all hover:scale-[1.02] ${
                  isDark 
                    ? 'bg-dark-700/50 border-dark-600/50 hover:border-primary-500/50' 
                    : 'bg-light-50 border-light-200 hover:border-primary-300 hover:shadow-md'
                }`}
              >
                <div className={`p-2 rounded-lg inline-block mb-3 ${
                  isDark ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-600'
                }`}>
                  {feature.icon}
                </div>
                <h3 className={`font-bold mb-2 ${
                  isDark ? 'text-dark-100' : 'text-light-800'
                }`}>
                  {feature.title}
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-dark-400' : 'text-light-500'
                }`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing Statement */}
        <section className={`rounded-2xl p-6 sm:p-8 mb-8 text-center border ${
          isDark 
            ? 'bg-gradient-to-br from-primary-900/30 to-dark-800/50 border-primary-700/30' 
            : 'bg-gradient-to-br from-primary-50 to-white border-primary-200 shadow-lg'
        }`}>
          <p className={`text-lg sm:text-xl leading-relaxed ${
            isDark ? 'text-dark-200' : 'text-light-700'
          }`}>
            What started as a way to simplify a workplace hobby has evolved into a sleek, 
            efficient application that keeps the{' '}
            <span className={`font-semibold ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
              spirit of the game alive
            </span>
            —minus the paperwork.
          </p>
        </section>

        {/* CTA Section */}
        <div className="text-center">
          <p className={`mb-6 text-lg ${isDark ? 'text-dark-400' : 'text-light-500'}`}>
            Ready to join the game?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="btn-primary px-8 py-3 text-lg"
            >
              Get Started
            </Link>
            <Link
              to="/dashboard"
              className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
                isDark 
                  ? 'bg-dark-700 hover:bg-dark-600 text-dark-200' 
                  : 'bg-light-200 hover:bg-light-300 text-light-700'
              }`}
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-12 pt-8 border-t text-center ${
          isDark ? 'border-dark-700' : 'border-light-300'
        }`}>
          <p className={`flex items-center justify-center gap-2 text-sm ${
            isDark ? 'text-dark-500' : 'text-light-500'
          }`}>
            Made with <HeartIcon /> for the Liga MX community
          </p>
        </div>
      </div>
    </div>
  )
}
