import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://alfa-salaray-app.onrender.com/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Debug logging
console.log('🔗 API Base URL:', API_BASE_URL)
console.log('🌍 Environment:', import.meta.env.MODE)

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Log detailed error information
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('Request timeout - backend is not responding')
      toast.error('Cannot connect to server. Please ensure the backend is running at ' + API_BASE_URL.replace('/api', ''))
      return Promise.reject(error)
    }
    
    // Handle network errors more gracefully
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('Network error - backend may be unavailable at:', API_BASE_URL)
      toast.error('Cannot connect to server. Please check if the backend is running.')
      return Promise.reject(error)
    }
    
    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded - backend may be temporarily unavailable')
      toast.error('Server is busy - please try again in a few minutes')
      return Promise.reject(error)
    }
    
    // Handle server errors (5xx)
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.data)
      toast.error('Server error - please try again later')
      return Promise.reject(error)
    }
    
    // Handle client errors (4xx) with specific messages
    if (error.response?.status >= 400 && error.response?.status < 500) {
      const message = error.response?.data?.error || 'Request failed'
      toast.error(message)
      return Promise.reject(error)
    }
    
    // Handle other errors
    const message = error.response?.data?.error || error.message || 'An error occurred'
    toast.error(message)
    
    return Promise.reject(error)
  }
)

export default api
