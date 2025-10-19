import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const SimpleDashboard: React.FC = () => {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  // Show loading while user data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Safety check - if no user, redirect to login
  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Welcome to Dashboard!
        </h1>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Login Successful!</h2>
          <p className="text-green-700">
            You have successfully logged in as: <strong>{user.firstName} {user.lastName}</strong>
          </p>
          <p className="text-green-700">
            Role: <strong>{user.role}</strong>
          </p>
          <p className="text-green-700">
            Email: <strong>{user.email}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📊 Quick Stats</h3>
            <p className="text-blue-700">Dashboard is working correctly!</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ System Status</h3>
            <p className="text-green-700">All systems operational</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">🚀 Next Steps</h3>
            <p className="text-purple-700">Ready to use the system!</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔧 Debug Information</h3>
          <div className="text-sm text-yellow-700">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Employee ID:</strong> {user.employeeId || 'Not set'}</p>
            <p><strong>Department:</strong> {(user as any).department || 'Not set'}</p>
            <p><strong>Position:</strong> {(user as any).position || 'Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleDashboard
