import { io } from 'socket.io-client'

// Backend URLs for different environments
const PRODUCTION_API_URL = 'https://quiniela-api-o15f.onrender.com'
const DEV_API_URL = 'http://localhost:5001'

// Use environment variable for Socket URL
// In development, we need to connect directly to the backend server
// In production, we connect to the Render backend
const getSocketUrl = () => {
  // If VITE_API_URL is set, extract the base URL (without /api)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  }
  
  // In development, connect directly to backend on port 5001
  if (import.meta.env.DEV) {
    return DEV_API_URL
  }
  
  // In production, use the Render backend URL
  return PRODUCTION_API_URL
}

const SOCKET_URL = getSocketUrl()
console.log('🔌 Socket URL:', SOCKET_URL || 'same origin')

// Create socket instance (lazy connection - doesn't connect immediately)
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'],
})

// Connection event handlers
socket.on('connect', () => {
  console.log('🔌 Socket connected:', socket.id)
})

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket disconnected:', reason)
  // Attempt to reconnect on disconnect
  if (reason === 'io server disconnect') {
    socket.connect()
  }
})

socket.on('connect_error', (error) => {
  console.log('🔌 Socket connection error:', error.message)
})

socket.on('reconnect', (attemptNumber) => {
  console.log('🔌 Socket reconnected after', attemptNumber, 'attempts')
})

// Export socket instance
export default socket

// Helper to connect/disconnect
export const connectSocket = () => {
  if (!socket.connected) {
    console.log('🔌 Connecting socket...')
    socket.connect()
  }
}

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
  }
}
