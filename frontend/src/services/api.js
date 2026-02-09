import axios from 'axios'

// Use environment variable for API URL, fallback to /api for local development
const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// PDF download helper functions
export const downloadPredictionPDF = async (weekNumber, year) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/pdf/prediction/${weekNumber}/${year}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to download PDF')
  }
  
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `predictions-jornada-${weekNumber}-${year}.pdf`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export const downloadResultsPDF = async (weekNumber, year) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/pdf/results/${weekNumber}/${year}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to download PDF')
  }
  
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `results-jornada-${weekNumber}-${year}.pdf`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// Settings API helpers
export const getSettings = async () => {
  const response = await api.get('/admin/settings')
  return response.data.settings
}

export const getBetAmount = async () => {
  const response = await api.get('/admin/settings/betAmount')
  return response.data.value
}

export const updateBetAmount = async (amount) => {
  const response = await api.put('/admin/settings/betAmount', { amount })
  return response.data
}

// Guest Bet API helpers
export const getMyGuestBets = async () => {
  const response = await api.get('/bets/my/guests')
  return response.data
}

export const createGuestBet = async (guestData) => {
  const response = await api.post('/bets/guest', guestData)
  return response.data
}

export const updateGuestBet = async (betId, guestData) => {
  const response = await api.put(`/bets/guest/${betId}`, guestData)
  return response.data
}

export const deleteGuestBet = async (betId) => {
  const response = await api.delete(`/bets/guest/${betId}`)
  return response.data
}

// Admin delete bet (any bet including guest bets)
export const adminDeleteBet = async (betId, isGuestBet = false) => {
  const response = await api.delete(`/admin/bets/${betId}${isGuestBet ? '?isGuestBet=true' : ''}`)
  return response.data
}

// Settled Results API helpers
export const getSettledResults = async () => {
  const response = await api.get('/schedule/settled-results')
  return response.data
}

export const getSettledResultsBets = async () => {
  const response = await api.get('/bets/settled-results')
  return response.data
}

export const deleteSettledResults = async () => {
  const response = await api.delete('/admin/schedule/settled-results')
  return response.data
}

export default api
