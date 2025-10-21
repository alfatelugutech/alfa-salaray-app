import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://alfa-salaray-app.onrender.com/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
  },
})

// Debug logging
console.log('🔗 API Base URL:', API_BASE_URL)
console.log('🌍 Environment:', import.meta.env.MODE)

// Health check function with retry logic
export const checkBackendHealth = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Try the API test endpoint first (less likely to be rate limited)
      const response = await axios.get(`${API_BASE_URL}/test`, {
        timeout: 10000
      })
      console.log('✅ Backend health check passed:', response.data)
      return { isHealthy: true, data: response.data }
    } catch (error: any) {
      console.error(`❌ Backend health check attempt ${i + 1} failed:`, error.message)
      
      // If it's a rate limit error, wait longer before retry
      if (error.response?.status === 429 || error.message.includes('Too many requests')) {
        console.log('⏳ Rate limit detected, waiting longer before retry...')
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      } else {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      if (i === retries - 1) {
        return { isHealthy: false, error: error.message }
      }
    }
  }
}

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
      console.error('Backend URL:', API_BASE_URL)
      console.error('Request config:', error.config)
      toast.error('Server timeout. The backend may be slow or overloaded. Please try again.')
      return Promise.reject(error)
    }
    
    // Handle network errors more gracefully
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('Network error - backend may be unavailable at:', API_BASE_URL)
      console.error('Full error:', error)
      toast.error('Network error. Please check your internet connection and try again.')
      return Promise.reject(error)
    }
    
    // Handle connection refused errors
    if (error.code === 'ECONNREFUSED' || error.message.includes('Connection refused')) {
      console.error('Connection refused - backend is not running')
      toast.error('Backend server is not running. Please contact support.')
      return Promise.reject(error)
    }
    
    // Handle 502/503 errors (bad gateway/service unavailable)
    if (error.response?.status === 502 || error.response?.status === 503) {
      console.error('Backend service unavailable:', error.response.status)
      toast.error('Backend service is temporarily unavailable. Please try again later.')
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
