import api from './api'
import { LoginCredentials, RegisterData, User } from '../types'

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await api.post<{ success: boolean; message: string; data: { user: User; token: string } }>('/auth/login', credentials)
    return { user: response.data.data.user, token: response.data.data.token }
  },

  // Register user
  async register(userData: RegisterData): Promise<{ user: User; token: string }> {
    const response = await api.post<{ success: boolean; message: string; data: { user: User; token: string } }>('/auth/register', userData)
    return { user: response.data.data.user, token: response.data.data.token }
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me')
    return response.data.data.user
  },

  // Logout (client-side only)
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    try {
      const token = localStorage.getItem('token')
      if (!token || token === 'undefined' || token === 'null' || token === '') {
        return false
      }
      return true
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  },

  // Get stored user
  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr || userStr === 'undefined' || userStr === 'null' || userStr === '') {
        return null
      }
      
      // Additional check to prevent parsing undefined
      if (userStr === 'undefined' || userStr === 'null') {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        return null
      }
      
      return JSON.parse(userStr)
    } catch (error) {
      console.error('Error parsing stored user:', error)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      return null
    }
  },

  // Store user data
  storeUser(user: User, token: string) {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
  }
}
