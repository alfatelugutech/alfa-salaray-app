import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { User, LoginCredentials, RegisterData } from '../types'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const storedUser = authService.getStoredUser()
      if (storedUser && authService.isAuthenticated()) {
        setUser(storedUser)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      authService.logout()
    } finally {
      setIsLoading(false)
    }
  }, [])

  const { data: currentUser, isLoading: isFetchingUser } = useQuery(
    'currentUser',
    authService.getCurrentUser,
    {
      enabled: !!user && authService.isAuthenticated(),
      retry: false,
      onError: () => {
        authService.logout()
        setUser(null)
      }
    }
  )

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser)
      authService.storeUser(currentUser, localStorage.getItem('token')!)
    }
  }, [currentUser])

  const loginMutation = useMutation(authService.login, {
    onSuccess: (data) => {
      authService.storeUser(data.user, data.token)
      setUser(data.user)
      queryClient.invalidateQueries('currentUser')
      toast.success('Login successful!')
      navigate('/dashboard')
    },
    onError: (error: any) => {
      console.error('Login error:', error)
      
      // Handle specific error cases
      if (error.response?.status === 429) {
        toast.error('Server is busy - please try again in a few minutes')
      } else if (error.response?.status === 401) {
        toast.error('Invalid email or password')
      } else if (error.response?.status === 0 || error.code === 'NETWORK_ERROR') {
        toast.error('Cannot connect to server - please check your internet connection')
      } else {
        toast.error(error.response?.data?.error || 'Login failed')
      }
    }
  })

  const registerMutation = useMutation(authService.register, {
    onSuccess: (data) => {
      authService.storeUser(data.user, data.token)
      setUser(data.user)
      queryClient.invalidateQueries('currentUser')
      toast.success('Registration successful!')
      navigate('/dashboard')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Registration failed')
    }
  })

  const logout = () => {
    authService.logout()
    setUser(null)
    queryClient.clear()
    toast.success('Logged out successfully')
  }

  const login = (credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials)
  }

  const register = (userData: RegisterData) => {
    return registerMutation.mutateAsync(userData)
  }

  return {
    user,
    isLoading: isLoading || isFetchingUser,
    login,
    register,
    logout,
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading
  }
}
