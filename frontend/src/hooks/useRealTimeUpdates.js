import { useEffect, useRef, useCallback } from 'react'
import socket, { connectSocket, disconnectSocket } from '../services/socket'

/**
 * Hook to subscribe to real-time updates
 * @param {Object} handlers - Object with event handlers
 * @param {Function} handlers.onScheduleUpdate - Called when schedule is updated
 * @param {Function} handlers.onBetsUpdate - Called when bets are updated
 * @param {Function} handlers.onResultsUpdate - Called when match results are updated
 * @param {Function} handlers.onAnnouncementUpdate - Called when announcements change
 * @param {Function} handlers.onPaymentsUpdate - Called when payment status changes
 * @param {Function} handlers.onAdminUpdate - Called when admin status changes
 * @param {Function} handlers.onSettled - Called when week is settled
 */
export function useRealTimeUpdates(handlers = {}) {
  // Use refs to store handlers so we don't need them in dependency array
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    // Connect socket on mount
    connectSocket()

    // Create stable handler wrappers
    const scheduleHandler = (data) => {
      console.log('🔌 Received schedule:update', data)
      handlersRef.current.onScheduleUpdate?.(data)
    }
    const betsHandler = (data) => {
      console.log('🔌 Received bets:update', data)
      handlersRef.current.onBetsUpdate?.(data)
    }
    const resultsHandler = (data) => {
      console.log('🔌 Received results:update', data)
      handlersRef.current.onResultsUpdate?.(data)
    }
    const announcementHandler = (data) => {
      console.log('🔌 Received announcement:update', data)
      handlersRef.current.onAnnouncementUpdate?.(data)
    }
    const paymentsHandler = (data) => {
      console.log('🔌 Received payments:update', data)
      handlersRef.current.onPaymentsUpdate?.(data)
    }
    const adminHandler = (data) => {
      console.log('🔌 Received admin:update', data)
      handlersRef.current.onAdminUpdate?.(data)
    }
    const settledHandler = (data) => {
      console.log('🔌 Received week:settled', data)
      handlersRef.current.onSettled?.(data)
    }

    // Set up event listeners
    socket.on('schedule:update', scheduleHandler)
    socket.on('bets:update', betsHandler)
    socket.on('results:update', resultsHandler)
    socket.on('announcement:update', announcementHandler)
    socket.on('payments:update', paymentsHandler)
    socket.on('admin:update', adminHandler)
    socket.on('week:settled', settledHandler)

    // Cleanup on unmount
    return () => {
      socket.off('schedule:update', scheduleHandler)
      socket.off('bets:update', betsHandler)
      socket.off('results:update', resultsHandler)
      socket.off('announcement:update', announcementHandler)
      socket.off('payments:update', paymentsHandler)
      socket.off('admin:update', adminHandler)
      socket.off('week:settled', settledHandler)
    }
  }, []) // Empty dependency array - handlers are accessed via ref

  // Return socket status
  return {
    isConnected: socket.connected,
    socketId: socket.id
  }
}

/**
 * Simple hook just for connection management
 */
export function useSocketConnection() {
  useEffect(() => {
    connectSocket()
    
    return () => {
      // Don't disconnect on unmount - let App manage this
    }
  }, [])

  return {
    isConnected: socket.connected,
    connect: connectSocket,
    disconnect: disconnectSocket
  }
}

export default useRealTimeUpdates
