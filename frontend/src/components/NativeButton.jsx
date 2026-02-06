import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess, hapticError } from '../utils/haptics'
import { useTheme } from '../context/ThemeContext'

/**
 * Native-style button with haptic feedback
 * Provides tactile feedback on press for native app feel
 * 
 * @param {Object} props
 * @param {'light' | 'medium' | 'heavy' | 'success' | 'error' | 'none'} props.haptic - Type of haptic feedback
 * @param {string} props.variant - Button style variant: 'primary', 'secondary', 'accent', 'danger'
 * @param {boolean} props.disabled - Disable the button
 * @param {boolean} props.fullWidth - Make button full width
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 */
export default function NativeButton({
  haptic = 'light',
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  className = '',
  children,
  onClick,
  ...props
}) {
  const { isDark } = useTheme()

  const handleClick = async (e) => {
    if (disabled) return
    
    // Trigger haptic feedback based on type
    switch (haptic) {
      case 'light':
        await hapticLight()
        break
      case 'medium':
        await hapticMedium()
        break
      case 'heavy':
        await hapticHeavy()
        break
      case 'success':
        await hapticSuccess()
        break
      case 'error':
        await hapticError()
        break
      case 'none':
      default:
        break
    }
    
    // Call the original onClick handler
    if (onClick) {
      onClick(e)
    }
  }

  // Variant styles
  const variants = {
    primary: isDark
      ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white'
      : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white',
    secondary: isDark
      ? 'bg-dark-700 hover:bg-dark-600 text-dark-100 border border-dark-600'
      : 'bg-light-200 hover:bg-light-300 text-light-800 border border-light-400',
    accent: isDark
      ? 'bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-dark-900'
      : 'bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-dark-900',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
  }

  const baseStyles = `
    native-button
    font-semibold py-2.5 px-5 rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    ${fullWidth ? 'w-full' : ''}
    ${variants[variant] || variants.primary}
    ${className}
  `

  return (
    <button
      className={baseStyles}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
