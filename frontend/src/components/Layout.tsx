import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  
  console.log('Layout component rendering...', { user })

  // Smart navigation based on user role
  const getSmartNavigation = () => {
    if (!user) return []
    
    const baseNav = [
      { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
      { name: 'My Attendance', href: '/my-attendance', icon: '📅' }
    ]
    
    if (user.role === 'SUPER_ADMIN' || user.role === 'HR_MANAGER') {
      return [
        ...baseNav,
        { name: 'Employees', href: '/employees', icon: '👥' },
        { name: 'Attendance', href: '/attendance', icon: '📊' },
        { name: 'Calendar', href: '/attendance-calendar', icon: '📅' },
        { name: 'Reports', href: '/attendance-reports', icon: '📈' },
        { name: 'Leave Management', href: '/leave', icon: '🏖️' },
        { name: 'Shifts', href: '/shifts', icon: '⏰' },
        { name: 'Payroll', href: '/payroll', icon: '💰' },
        { name: 'Payment Reports', href: '/payment-reports', icon: '💳' },
        { name: 'Departments', href: '/departments', icon: '🏢' },
        { name: 'Roles', href: '/roles', icon: '👤' },
        ...(user.role === 'SUPER_ADMIN' ? [{ name: 'Settings', href: '/settings', icon: '⚙️' }] : [])
      ]
    }
    
    return [
      ...baseNav,
      { name: 'My Leave', href: '/my-leave', icon: '🏖️' },
      { name: 'Profile', href: '/profile', icon: '👤' }
    ]
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

      {/* Smart Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 py-3">
          <nav className="flex flex-wrap gap-2">
            {getSmartNavigation().map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-sm"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
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