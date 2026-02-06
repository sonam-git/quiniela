import { Capacitor } from '@capacitor/core'

/**
 * Platform detection utility for Capacitor apps
 * Detects whether the app is running on iOS, Android, or Web
 */

// Get the current platform
export const getPlatform = () => Capacitor.getPlatform()

// Check if running on native (iOS or Android)
export const isNative = () => Capacitor.isNativePlatform()

// Check if running on iOS
export const isIOS = () => Capacitor.getPlatform() === 'ios'

// Check if running on Android
export const isAndroid = () => Capacitor.getPlatform() === 'android'

// Check if running on web
export const isWeb = () => Capacitor.getPlatform() === 'web'

// Check if a specific plugin is available
export const isPluginAvailable = (pluginName) => Capacitor.isPluginAvailable(pluginName)

// Platform info object for convenience
export const platform = {
  get current() {
    return getPlatform()
  },
  get isNative() {
    return isNative()
  },
  get isIOS() {
    return isIOS()
  },
  get isAndroid() {
    return isAndroid()
  },
  get isWeb() {
    return isWeb()
  }
}

export default platform
