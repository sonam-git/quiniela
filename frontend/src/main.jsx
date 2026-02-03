import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './i18n' // Initialize i18n
import './index.css'
import App from './App.jsx'

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Show a prompt to the user that a new version is available
    if (confirm('New content available! Click OK to update.')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
  onRegistered(registration) {
    console.log('Service Worker registered:', registration)
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error)
  }
})

createRoot(document.getElementById('root')).render(<App />)
