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
    const storedUser = authService.getStoredUser()
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser)
    }
    setIsLoading(false)
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
      toast.error(error.response?.data?.error || 'Login failed')
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
