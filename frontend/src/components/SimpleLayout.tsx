import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface SimpleLayoutProps {
  children: React.ReactNode
}

const SimpleLayout: React.FC<SimpleLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  
  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <div className="bg-white shadow">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Employee Attendance System
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.firstName} {user.lastName}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simple navigation */}
      <div className="bg-white border-b">
        <div className="px-4 py-2">
          <nav className="flex space-x-4">
            <Link to="/" className="text-blue-600 font-medium">Dashboard</Link>
            <Link to="/profile" className="text-gray-600 hover:text-gray-900">Profile</Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}

export default SimpleLayout

