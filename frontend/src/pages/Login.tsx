import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Clock, Users, Calendar } from 'lucide-react'

const Login: React.FC = () => {
  const { login, isLoggingIn } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(formData)
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Employee Attendance System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Phase 1 - Core Foundation
          </p>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Features</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-sm text-gray-600">Employee Management</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-sm text-gray-600">Attendance Tracking</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-sm text-gray-600">Leave Management</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 input"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 input"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full btn btn-primary btn-md"
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
            
            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</h4>
              <div className="space-y-1 text-xs text-blue-800">
                <div><strong>Super Admin:</strong> admin@company.com / password</div>
                <div><strong>HR Manager:</strong> hr@company.com / password</div>
                <div><strong>Employee:</strong> employee@company.com / password</div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Employee Attendance System v1.0 - Phase 1
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
