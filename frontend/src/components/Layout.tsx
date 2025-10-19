import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  
  console.log('Layout component rendering...', { user })
  
  // Safety check - if no user, show loading
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
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
                Welcome, {user?.firstName || 'User'} {user?.lastName || ''}
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

      {/* Role-based navigation */}
      <div className="bg-white border-b">
        <div className="px-4 py-2">
          <nav className="flex space-x-4">
            <Link to="/" className="text-blue-600 font-medium">Dashboard</Link>
            
            {/* Show different navigation based on user role */}
            {user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER' ? (
              // Admin/HR navigation
              <>
                <Link to="/employees" className="text-gray-600 hover:text-gray-900">Employees</Link>
                <Link to="/attendance" className="text-gray-600 hover:text-gray-900">Attendance</Link>
                <Link to="/leave" className="text-gray-600 hover:text-gray-900">Leave</Link>
                {/* Phase 2 navigation */}
                <Link to="/shifts" className="text-gray-600 hover:text-gray-900">Shifts</Link>
                <Link to="/payroll" className="text-gray-600 hover:text-gray-900">Payroll</Link>
                {user?.role === 'SUPER_ADMIN' && (
                  <>
                    <Link to="/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
                  </>
                )}
              </>
            ) : (
              // Employee navigation
              <>
                <Link to="/my-attendance" className="text-gray-600 hover:text-gray-900">My Attendance</Link>
                <Link to="/my-leave" className="text-gray-600 hover:text-gray-900">My Leave</Link>
                <Link to="/profile" className="text-gray-600 hover:text-gray-900">Profile</Link>
              </>
            )}
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

export default Layout