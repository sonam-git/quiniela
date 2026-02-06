import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { useAndroidBackButton } from './hooks/useAndroidBackButton'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import PlaceBet from './pages/PlaceBet'
import About from './pages/About'
import Instructions from './pages/Instructions'
import HowItWorks from './pages/HowItWorks'
import Admin from './pages/Admin'
import Profile from './pages/Profile'

// Protected Route Component using React 19 patterns
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { isDark } = useTheme()

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-dark-900' : 'bg-light-100'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-dark-300' : 'text-light-600'}`}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return children
}

// Admin Protected Route
function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  const { isDark } = useTheme()

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-dark-900' : 'bg-light-100'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-dark-300' : 'text-light-600'}`}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" />
  }

  return children
}

function AppContent() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const isOnline = useOnlineStatus()
  
  // Handle Android hardware back button
  useAndroidBackButton()

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950' 
        : 'bg-gradient-to-br from-light-100 via-light-200 to-light-100'
    }`}>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
            </svg>
            <span>You're offline. Some features may be limited.</span>
          </div>
        </div>
      )}
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/place-bet" 
            element={
              <ProtectedRoute>
                <PlaceBet />
              </ProtectedRoute>
            } 
          />
          <Route path="/about" element={<About />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <Footer />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: isDark ? {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
          } : {
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: isDark ? '#1e293b' : '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: isDark ? '#1e293b' : '#ffffff',
            },
          },
        }}
      />
    </div>
  )
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
