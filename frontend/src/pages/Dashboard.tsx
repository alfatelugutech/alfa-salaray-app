import React from 'react'
import { 
  Users, 
  Clock, 
  Calendar, 
  TrendingUp,
  UserCheck
} from 'lucide-react'

const Dashboard: React.FC = () => {
  // Simplified dashboard without API calls for now

  const stats = [
    {
      name: 'Total Employees',
      value: 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Active Employees',
      value: 0,
      icon: UserCheck,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Present Today',
      value: 0,
      icon: Clock,
      color: 'bg-purple-500',
      change: '+5%',
      changeType: 'positive'
    },
    {
      name: 'Pending Leaves',
      value: 0,
      icon: Calendar,
      color: 'bg-orange-500',
      change: '-2%',
      changeType: 'negative'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Employee Attendance System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className={`h-4 w-4 ${
                  stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                }`} />
                <span className={`text-sm font-medium ml-1 ${
                  stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full btn btn-primary btn-md">
              <Clock className="h-4 w-4 mr-2" />
              Mark Attendance
            </button>
            <button className="w-full btn btn-outline btn-md">
              <Calendar className="h-4 w-4 mr-2" />
              Request Leave
            </button>
            <button className="w-full btn btn-outline btn-md">
              <Users className="h-4 w-4 mr-2" />
              View Employees
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Server</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-sm text-gray-900">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">System Version</span>
              <span className="text-sm text-gray-900">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 1 Features */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Phase 1 Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="bg-blue-100 rounded-lg p-4 mb-3">
              <Users className="h-8 w-8 text-blue-600 mx-auto" />
            </div>
            <h4 className="font-medium text-gray-900">Employee Management</h4>
            <p className="text-sm text-gray-600 mt-1">Add, edit, and manage employee information</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-lg p-4 mb-3">
              <Clock className="h-8 w-8 text-green-600 mx-auto" />
            </div>
            <h4 className="font-medium text-gray-900">Attendance Tracking</h4>
            <p className="text-sm text-gray-600 mt-1">Track employee check-in and check-out times</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-lg p-4 mb-3">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto" />
            </div>
            <h4 className="font-medium text-gray-900">Leave Management</h4>
            <p className="text-sm text-gray-600 mt-1">Handle leave requests and approvals</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
