import { useEffect, useRef, useCallback } from 'react'
import socket, { connectSocket, disconnectSocket } from '../services/socket'

/**
 * Hook to subscribe to real-time updates
 * @param {Object} handlers - Object with event handlers
 * @param {Function} handlers.onScheduleUpdate - Called when schedule is updated
 * @param {Function} handlers.onScheduleCreated - Called when a new schedule is created
 * @param {Function} handlers.onScheduleUpdated - Called when schedule details are updated
 * @param {Function} handlers.onScheduleDeleted - Called when a schedule is deleted
 * @param {Function} handlers.onBetsUpdate - Called when bets are updated
 * @param {Function} handlers.onResultsUpdate - Called when match results are updated
 * @param {Function} handlers.onResultsDeleted - Called when settled results are deleted
 * @param {Function} handlers.onAnnouncementUpdate - Called when announcements change
 * @param {Function} handlers.onPaymentsUpdate - Called when payment status changes
 * @param {Function} handlers.onAdminUpdate - Called when admin status changes
 * @param {Function} handlers.onSettled - Called when week is settled
 * @param {Function} handlers.onSettingsUpdate - Called when settings are updated
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
    const scheduleCreatedHandler = (data) => {
      console.log('🔌 Received schedule:created', data)
      handlersRef.current.onScheduleCreated?.(data)
      // Also call general schedule update handler as fallback
      handlersRef.current.onScheduleUpdate?.(data)
    }
    const scheduleUpdatedHandler = (data) => {
      console.log('🔌 Received schedule:updated', data)
      handlersRef.current.onScheduleUpdated?.(data)
      // Also call general schedule update handler as fallback
      handlersRef.current.onScheduleUpdate?.(data)
    }
    const scheduleDeletedHandler = (data) => {
      console.log('🔌 Received schedule:deleted', data)
      handlersRef.current.onScheduleDeleted?.(data)
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
      console.log('🔌 Handler exists:', !!handlersRef.current.onPaymentsUpdate)
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
    const settingsHandler = (data) => {
      console.log('🔌 Received settings:update', data)
      handlersRef.current.onSettingsUpdate?.(data)
    }
    const resultsDeletedHandler = (data) => {
      console.log('🔌 Received results:deleted', data)
      handlersRef.current.onResultsDeleted?.(data)
    }

    // Set up event listeners
    socket.on('schedule:update', scheduleHandler)
    socket.on('schedule:created', scheduleCreatedHandler)
    socket.on('schedule:updated', scheduleUpdatedHandler)
    socket.on('schedule:deleted', scheduleDeletedHandler)
    socket.on('bets:update', betsHandler)
    socket.on('results:update', resultsHandler)
    socket.on('results:deleted', resultsDeletedHandler)
    socket.on('announcement:update', announcementHandler)
    socket.on('payments:update', paymentsHandler)
    socket.on('admin:update', adminHandler)
    socket.on('week:settled', settledHandler)
    socket.on('settings:update', settingsHandler)

    // Cleanup on unmount
    return () => {
      socket.off('schedule:update', scheduleHandler)
      socket.off('schedule:created', scheduleCreatedHandler)
      socket.off('schedule:updated', scheduleUpdatedHandler)
      socket.off('schedule:deleted', scheduleDeletedHandler)
      socket.off('bets:update', betsHandler)
      socket.off('results:update', resultsHandler)
      socket.off('results:deleted', resultsDeletedHandler)
      socket.off('announcement:update', announcementHandler)
      socket.off('payments:update', paymentsHandler)
      socket.off('admin:update', adminHandler)
      socket.off('week:settled', settledHandler)
      socket.off('settings:update', settingsHandler)
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
