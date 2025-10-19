import React from 'react'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  
  console.log('Layout component rendering...', { user })

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
                Welcome, {user?.firstName} {user?.lastName}
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
            <a href="/" className="text-blue-600 font-medium">Dashboard</a>
            
            {/* Show different navigation based on user role */}
            {user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER' ? (
              // Admin/HR navigation
              <>
                <a href="/employees" className="text-gray-600 hover:text-gray-900">Employees</a>
                <a href="/attendance" className="text-gray-600 hover:text-gray-900">Attendance</a>
                <a href="/leave" className="text-gray-600 hover:text-gray-900">Leave</a>
                {/* Phase 2 navigation */}
                <a href="/shifts" className="text-gray-600 hover:text-gray-900">Shifts</a>
                <a href="/payroll" className="text-gray-600 hover:text-gray-900">Payroll</a>
                {user?.role === 'SUPER_ADMIN' && (
                  <>
                    <a href="/settings" className="text-gray-600 hover:text-gray-900">Settings</a>
                    <a href="/admin/roles" className="text-purple-600 hover:text-purple-900">Role Management</a>
                    <a href="/admin/features" className="text-orange-600 hover:text-orange-900">Features Control</a>
                  </>
                )}
              </>
            ) : (
              // Employee navigation
              <>
                <a href="/attendance" className="text-gray-600 hover:text-gray-900">My Attendance</a>
                <a href="/leave" className="text-gray-600 hover:text-gray-900">My Leave</a>
                <a href="/profile" className="text-gray-600 hover:text-gray-900">Profile</a>
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