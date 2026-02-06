import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { App } from '@capacitor/app'
import { isAndroid } from '../utils/platform'

/**
 * Hook to handle Android hardware back button
 * Navigates through React Router history instead of closing the app
 */
export function useAndroidBackButton() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Only run on Android
    if (!isAndroid()) return

    let backButtonListener

    const setupBackButton = async () => {
      backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
        // Define routes where back button should exit the app
        const exitRoutes = ['/', '/login', '/signup']
        
        if (exitRoutes.includes(location.pathname)) {
          // On home/login/signup, exit the app
          App.exitApp()
        } else if (canGoBack || window.history.length > 1) {
          // Navigate back in React Router history
          navigate(-1)
        } else {
          // Fallback: go to home
          navigate('/')
        }
      })
    }

    setupBackButton()

    // Cleanup listener on unmount
    return () => {
      if (backButtonListener) {
        backButtonListener.remove()
      }
    }
  }, [navigate, location.pathname])
}

export default useAndroidBackButton
