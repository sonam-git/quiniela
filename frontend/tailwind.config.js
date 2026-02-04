/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.25rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.375rem' }],
        'base': ['0.875rem', { lineHeight: '1.5rem' }],
        'lg': ['1rem', { lineHeight: '1.625rem' }],
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.25rem', { lineHeight: '1.875rem' }],
        '3xl': ['1.5rem', { lineHeight: '2rem' }],
      },
      colors: {
        // AWS-inspired color palette
        dark: {
          50: '#f9fafb',
          100: '#d1d5db',
          200: '#9ca3af',
          300: '#6b7280',
          400: '#4b5563',
          500: '#374151',
          600: '#252f3d',
          700: '#1a212e',
          800: '#161d26',
          900: '#0f1419',
          950: '#0a0d10',
        },
        // Light theme - AWS console style
        light: {
          50: '#ffffff',
          100: '#fafafa',
          200: '#f5f5f5',
          300: '#e5e7eb',
          400: '#d1d5db',
          500: '#9ca3af',
          600: '#6b7280',
          700: '#4b5563',
          800: '#374151',
          900: '#232f3e',
        },
        // AWS Orange accent
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        // AWS-style status colors
        aws: {
          orange: '#ff9900',
          squid: '#232f3e',
          blue: '#147ebb',
          teal: '#1d8102',
          red: '#d13212',
        },
        sports: {
          green: '#10b981',
          gold: '#f59e0b',
          orange: '#f97316',
          blue: '#3b82f6',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'sports-pattern': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
        'light-pattern': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-accent': '0 0 20px rgba(251, 191, 36, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-light': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
