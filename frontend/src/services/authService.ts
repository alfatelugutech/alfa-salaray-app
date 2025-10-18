import api from './api'
import { LoginCredentials, RegisterData, User, ApiResponse } from '../types'

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials)
    return response.data.data!
  },

  // Register user
  async register(userData: RegisterData): Promise<{ user: User; token: string }> {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', userData)
    return response.data.data!
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me')
    return response.data.data!.user
  },

  // Logout (client-side only)
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  },

  // Get stored user
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  // Store user data
  storeUser(user: User, token: string) {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
  }
}
