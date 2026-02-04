import { io } from 'socket.io-client'

// Use environment variable for Socket URL, fallback to current origin for local development
const SOCKET_URL = import.meta.env.VITE_API_URL || ''

// Create socket instance (lazy connection - doesn't connect immediately)
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
})

// Connection event handlers
socket.on('connect', () => {
  console.log('🔌 Socket connected:', socket.id)
})

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket disconnected:', reason)
})

socket.on('connect_error', (error) => {
  console.log('🔌 Socket connection error:', error.message)
})

// Export socket instance
export default socket

// Helper to connect/disconnect
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect()
  }
}

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
  }
}
