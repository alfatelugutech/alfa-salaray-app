import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: React.ReactNode
}

interface NavigationItem {
  name: string
  href?: string
  icon: string
  type: 'main' | 'dropdown'
  submenu?: {
    name: string
    href: string
    icon: string
  }[]
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  
  console.log('Layout component rendering...', { user })

  // Smart navigation with submenus based on user role
  const getSmartNavigation = (): NavigationItem[] => {
    if (!user) return []
    
    const baseNav: NavigationItem[] = [
      { name: 'Dashboard', href: '/dashboard', icon: '🏠', type: 'main' }
    ]
    
    if (user.role === 'SUPER_ADMIN' || user.role === 'HR_MANAGER') {
      return [
        ...baseNav,
        { 
          name: 'Attendance', 
          icon: '📊', 
          type: 'dropdown',
          submenu: [
            { name: 'Mark Attendance', href: '/attendance', icon: '📝' },
            { name: 'Calendar View', href: '/attendance-calendar', icon: '📅' },
            { name: 'Reports', href: '/attendance-reports', icon: '📈' }
          ]
        },
        { 
          name: 'Employees', 
          icon: '👥', 
          type: 'dropdown',
          submenu: [
            { name: 'All Employees', href: '/employees', icon: '👥' },
            { name: 'Departments', href: '/departments', icon: '🏢' },
            { name: 'Roles', href: '/roles', icon: '👤' }
          ]
        },
        { 
          name: 'Leave Management', 
          icon: '🏖️', 
          type: 'dropdown',
          submenu: [
            { name: 'Leave Requests', href: '/leave', icon: '📋' },
            { name: 'My Leave', href: '/my-leave', icon: '🏖️' }
          ]
        },
        { 
          name: 'Payroll', 
          icon: '💰', 
          type: 'dropdown',
          submenu: [
            { name: 'Payroll Management', href: '/payroll', icon: '💰' },
            { name: 'Payment Reports', href: '/payment-reports', icon: '💳' }
          ]
        },
        { name: 'Shifts', href: '/shifts', icon: '⏰', type: 'main' as const },
        ...(user.role === 'SUPER_ADMIN' ? [{ name: 'Settings', href: '/settings', icon: '⚙️', type: 'main' as const }] : [])
      ]
    }
    
    return [
      ...baseNav,
      { name: 'My Attendance', href: '/my-attendance', icon: '📅', type: 'main' as const },
      { name: 'My Leave', href: '/my-leave', icon: '🏖️', type: 'main' as const },
      { name: 'Profile', href: '/profile', icon: '👤', type: 'main' as const }
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

      {/* Enhanced Smart Navigation with Dropdowns */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 py-3">
          <nav className="flex flex-wrap gap-2">
            {getSmartNavigation().map((item, index) => (
              <div key={index} className="relative group">
                {item.type === 'dropdown' ? (
                  <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-sm cursor-pointer">
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                    <span className="text-xs">▼</span>
                  </div>
                ) : (
                  <Link
                    to={item.href || '#'}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-sm"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                )}
                
                {/* Dropdown Menu */}
                {item.type === 'dropdown' && 'submenu' in item && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      {item.submenu?.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.href}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <span className="text-lg">{subItem.icon}</span>
                          <span>{subItem.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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