import { useEffect, useCallback } from 'react'
import socket, { connectSocket, disconnectSocket } from '../services/socket'

/**
 * Hook to subscribe to real-time updates
 * @param {Object} handlers - Object with event handlers
 * @param {Function} handlers.onScheduleUpdate - Called when schedule is updated
 * @param {Function} handlers.onBetsUpdate - Called when bets are updated
 * @param {Function} handlers.onResultsUpdate - Called when match results are updated
 * @param {Function} handlers.onAnnouncementUpdate - Called when announcements change
 * @param {Function} handlers.onPaymentsUpdate - Called when payment status changes
 * @param {Function} handlers.onSettled - Called when week is settled
 */
export function useRealTimeUpdates(handlers = {}) {
  const {
    onScheduleUpdate,
    onBetsUpdate,
    onResultsUpdate,
    onAnnouncementUpdate,
    onPaymentsUpdate,
    onSettled
  } = handlers

  useEffect(() => {
    // Connect socket on mount
    connectSocket()

    // Set up event listeners
    if (onScheduleUpdate) {
      socket.on('schedule:update', onScheduleUpdate)
    }
    if (onBetsUpdate) {
      socket.on('bets:update', onBetsUpdate)
    }
    if (onResultsUpdate) {
      socket.on('results:update', onResultsUpdate)
    }
    if (onAnnouncementUpdate) {
      socket.on('announcement:update', onAnnouncementUpdate)
    }
    if (onPaymentsUpdate) {
      socket.on('payments:update', onPaymentsUpdate)
    }
    if (onSettled) {
      socket.on('week:settled', onSettled)
    }

    // Cleanup on unmount
    return () => {
      if (onScheduleUpdate) {
        socket.off('schedule:update', onScheduleUpdate)
      }
      if (onBetsUpdate) {
        socket.off('bets:update', onBetsUpdate)
      }
      if (onResultsUpdate) {
        socket.off('results:update', onResultsUpdate)
      }
      if (onAnnouncementUpdate) {
        socket.off('announcement:update', onAnnouncementUpdate)
      }
      if (onPaymentsUpdate) {
        socket.off('payments:update', onPaymentsUpdate)
      }
      if (onSettled) {
        socket.off('week:settled', onSettled)
      }
    }
  }, [onScheduleUpdate, onBetsUpdate, onResultsUpdate, onAnnouncementUpdate, onPaymentsUpdate, onSettled])

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
