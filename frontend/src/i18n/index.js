import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enCommon from './locales/en/common.json'
import enHome from './locales/en/home.json'
import enAuth from './locales/en/auth.json'
import enDashboard from './locales/en/dashboard.json'
import enAdmin from './locales/en/admin.json'
import enBet from './locales/en/bet.json'
import enProfile from './locales/en/profile.json'
import enAbout from './locales/en/about.json'
import enInstructions from './locales/en/instructions.json'

import esCommon from './locales/es/common.json'
import esHome from './locales/es/home.json'
import esAuth from './locales/es/auth.json'
import esDashboard from './locales/es/dashboard.json'
import esAdmin from './locales/es/admin.json'
import esBet from './locales/es/bet.json'
import esProfile from './locales/es/profile.json'
import esAbout from './locales/es/about.json'
import esInstructions from './locales/es/instructions.json'

const resources = {
  en: {
    common: enCommon,
    home: enHome,
    auth: enAuth,
    dashboard: enDashboard,
    admin: enAdmin,
    bet: enBet,
    profile: enProfile,
    about: enAbout,
    instructions: enInstructions
  },
  es: {
    common: esCommon,
    home: esHome,
    auth: esAuth,
    dashboard: esDashboard,
    admin: esAdmin,
    bet: esBet,
    profile: esProfile,
    about: esAbout,
    instructions: esInstructions
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'home', 'auth', 'dashboard', 'admin', 'bet', 'profile', 'about', 'instructions'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language'
    },
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    react: {
      useSuspense: false
    }
  })

export default i18n
