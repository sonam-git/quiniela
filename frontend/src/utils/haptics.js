import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNative } from '../utils/platform'

/**
 * Haptic feedback utilities for native-like feel
 * Falls back gracefully on web (no-op)
 */

// Light tap - for button presses, selections
export const hapticLight = async () => {
  if (!isNative()) return
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch (e) {
    console.warn('Haptics not available:', e)
  }
}

// Medium tap - for toggles, important selections
export const hapticMedium = async () => {
  if (!isNative()) return
  try {
    await Haptics.impact({ style: ImpactStyle.Medium })
  } catch (e) {
    console.warn('Haptics not available:', e)
  }
}

// Heavy tap - for significant actions like bet submission
export const hapticHeavy = async () => {
  if (!isNative()) return
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy })
  } catch (e) {
    console.warn('Haptics not available:', e)
  }
}

// Success feedback - for completed actions
export const hapticSuccess = async () => {
  if (!isNative()) return
  try {
    await Haptics.notification({ type: NotificationType.Success })
  } catch (e) {
    console.warn('Haptics not available:', e)
  }
}

// Warning feedback - for warnings
export const hapticWarning = async () => {
  if (!isNative()) return
  try {
    await Haptics.notification({ type: NotificationType.Warning })
  } catch (e) {
    console.warn('Haptics not available:', e)
  }
}

// Error feedback - for errors
export const hapticError = async () => {
  if (!isNative()) return
  try {
    await Haptics.notification({ type: NotificationType.Error })
  } catch (e) {
    console.warn('Haptics not available:', e)
  }
}

// Selection change - for scrolling through lists, pickers
export const hapticSelection = async () => {
  if (!isNative()) return
  try {
    await Haptics.selectionStart()
    await Haptics.selectionChanged()
    await Haptics.selectionEnd()
  } catch (e) {
    console.warn('Haptics not available:', e)
  }
}

// Vibrate for a duration (Android-style)
export const vibrate = async (duration = 300) => {
  if (!isNative()) return
  try {
    await Haptics.vibrate({ duration })
  } catch (e) {
    console.warn('Haptics not available:', e)
  }
}

// Export all as default object for convenience
export const haptics = {
  light: hapticLight,
  medium: hapticMedium,
  heavy: hapticHeavy,
  success: hapticSuccess,
  warning: hapticWarning,
  error: hapticError,
  selection: hapticSelection,
  vibrate
}

export default haptics
