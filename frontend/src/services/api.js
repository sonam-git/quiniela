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

export default api
