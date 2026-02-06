import { useState, useEffect } from 'react'
import { isIOS, isNative } from '../utils/platform'

/**
 * Hook to get safe area insets for iPhone notch and home indicator
 * Returns CSS environment variable values or fallbacks
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  })

  useEffect(() => {
    // Only calculate on native iOS (though CSS env() works everywhere)
    const updateInsets = () => {
      // Get computed CSS environment variables
      const computedStyle = getComputedStyle(document.documentElement)
      
      // Create a temporary element to measure safe area insets
      const testEl = document.createElement('div')
      testEl.style.cssText = `
        position: fixed;
        top: env(safe-area-inset-top, 0px);
        bottom: env(safe-area-inset-bottom, 0px);
        left: env(safe-area-inset-left, 0px);
        right: env(safe-area-inset-right, 0px);
        pointer-events: none;
        visibility: hidden;
      `
      document.body.appendChild(testEl)
      
      const rect = testEl.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const windowWidth = window.innerWidth
      
      setInsets({
        top: rect.top,
        bottom: windowHeight - rect.bottom,
        left: rect.left,
        right: windowWidth - rect.right
      })
      
      document.body.removeChild(testEl)
    }

    updateInsets()
    
    // Update on resize/orientation change
    window.addEventListener('resize', updateInsets)
    window.addEventListener('orientationchange', updateInsets)

    return () => {
      window.removeEventListener('resize', updateInsets)
      window.removeEventListener('orientationchange', updateInsets)
    }
  }, [])

  return {
    ...insets,
    // Helper to check if device has notch
    hasNotch: isIOS() && isNative() && (insets.top > 20 || insets.bottom > 0)
  }
}

export default useSafeAreaInsets
