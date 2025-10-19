import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { attendanceService } from '../services/attendanceService'
import { leaveService } from '../services/leaveService'
import { employeeService } from '../services/employeeService'
import { Clock, X } from 'lucide-react'
import toast from 'react-hot-toast'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showSelfAttendanceModal, setShowSelfAttendanceModal] = useState(false)
  const [selfAttendanceData, setSelfAttendanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'PRESENT',
    notes: ''
  })
  const queryClient = useQueryClient()
  
  // Fetch data based on user role with better error handling
  const { data: attendanceData, error: attendanceError } = useQuery(
    'my-attendance',
    () => attendanceService.getAttendance({ employeeId: user?.employeeId }),
    { 
      enabled: !!user?.employeeId,
      retry: 2,
      retryDelay: 1000,
      onError: (error: any) => {
        if (error.code !== 'NETWORK_ERROR') {
          console.error('Attendance data fetch error:', error)
        }
      }
    }
  )
  
  const { data: leaveData, error: leaveError } = useQuery(
    'my-leave-requests',
    () => leaveService.getLeaveRequests({ employeeId: user?.employeeId }),
    { 
      enabled: !!user?.employeeId,
      retry: 2,
      retryDelay: 1000,
      onError: (error: any) => {
        if (error.code !== 'NETWORK_ERROR') {
          console.error('Leave data fetch error:', error)
        }
      }
    }
  )
  
  const { data: employeeStats, error: employeeStatsError } = useQuery(
    'employee-stats',
    () => employeeService.getEmployeeStats(),
    { 
      enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER',
      retry: 2,
      retryDelay: 1000,
      onError: (error: any) => {
        if (error.code !== 'NETWORK_ERROR') {
          console.error('Employee stats fetch error:', error)
        }
      }
    }
  )
  
  const { data: attendanceStats, error: attendanceStatsError } = useQuery(
    'attendance-stats',
    () => attendanceService.getAttendanceStats(),
    { 
      enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER',
      retry: 2,
      retryDelay: 1000,
      onError: (error: any) => {
        if (error.code !== 'NETWORK_ERROR') {
          console.error('Attendance stats fetch error:', error)
        }
      }
    }
  )
  
  const { data: leaveStats, error: leaveStatsError } = useQuery(
    'leave-stats',
    () => leaveService.getLeaveStats(),
    { 
      enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER',
      retry: 2,
      retryDelay: 1000,
      onError: (error: any) => {
        if (error.code !== 'NETWORK_ERROR') {
          console.error('Leave stats fetch error:', error)
        }
      }
    }
  )

  // Self-attendance mutation
  const markSelfAttendanceMutation = useMutation(
    async (data: any) => {
      if (!user?.employeeId) {
        throw new Error('Employee ID not found')
      }
      return attendanceService.markAttendance({
        employeeId: user.employeeId,
        date: data.date,
        checkIn: data.checkIn || undefined,
        checkOut: data.checkOut || undefined,
        status: data.status,
        notes: data.notes || undefined
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-attendance')
        toast.success('Attendance marked successfully!')
        setShowSelfAttendanceModal(false)
        setSelfAttendanceData({
          date: new Date().toISOString().split('T')[0],
          checkIn: '',
          checkOut: '',
          status: 'PRESENT',
          notes: ''
        })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to mark attendance')
      }
    }
  )

  const handleMarkSelfAttendance = (e: React.FormEvent) => {
    e.preventDefault()
    markSelfAttendanceMutation.mutate(selfAttendanceData)
  }

  // Check if user is admin/HR
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER'
  
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Dashboard Loaded Successfully!
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome to the Employee Attendance System Dashboard
        </p>
        
        {/* Role-based content */}
        {isAdmin ? (
          // Admin/HR Dashboard
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Total Employees</h3>
              <p className="text-2xl font-bold text-blue-600">
                {employeeStats?.totalEmployees || 0}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Active Today</h3>
              <p className="text-2xl font-bold text-green-600">
                {attendanceStats?.presentCount || 0}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Pending Leaves</h3>
              <p className="text-2xl font-bold text-purple-600">
                {leaveStats?.pendingRequests || 0}
              </p>
            </div>
          </div>
        ) : (
          // Employee Dashboard
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">My Attendance</h3>
              <p className="text-2xl font-bold text-blue-600">
                {attendanceData?.data?.attendances?.length || 0}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">My Leave Requests</h3>
              <p className="text-2xl font-bold text-green-600">
                {leaveData?.data?.leaveRequests?.length || 0}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Pending Leaves</h3>
              <p className="text-2xl font-bold text-purple-600">
                {leaveData?.data?.leaveRequests?.filter((leave: any) => leave.status === 'PENDING').length || 0}
              </p>
            </div>
          </div>
        )}
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {isAdmin ? (
              // Admin actions
              <>
                <button 
                  onClick={() => navigate('/attendance')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Mark Attendance
                </button>
                <button 
                  onClick={() => navigate('/employees')}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  View Employees
                </button>
                <button 
                  onClick={() => navigate('/leave-requests')}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Manage Leave Requests
                </button>
                {user?.role === 'SUPER_ADMIN' && (
                  <>
                    <button 
                      onClick={() => toast.info('Role Management feature coming soon!')}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors cursor-pointer"
                    >
                      Role Management
                    </button>
                    <button 
                      onClick={() => toast.info('Features Control coming soon!')}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors cursor-pointer"
                    >
                      Features Control
                    </button>
                    <button 
                      onClick={() => navigate('/settings')}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      System Settings
                    </button>
                  </>
                )}
              </>
            ) : (
              // Employee actions
              <>
                <button 
                  onClick={() => setShowSelfAttendanceModal(true)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors cursor-pointer"
                >
                  Mark Self Attendance
                </button>
                <button 
                  onClick={() => navigate('/my-attendance')}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  View My Attendance
                </button>
                <button 
                  onClick={() => navigate('/my-leave')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Request Leave
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  View My Profile
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Super Admin Features */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Super Admin Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2">Role Management</h3>
                <p className="text-sm text-purple-700 mb-3">Manage user roles and permissions</p>
                <button 
                  onClick={() => toast.info('Role Management feature coming soon!')}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 text-sm transition-colors cursor-pointer"
                >
                  Manage Roles
                </button>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-900 mb-2">Features Control</h3>
                <p className="text-sm text-orange-700 mb-3">Enable/disable system features</p>
                <button 
                  onClick={() => toast.info('Features Control coming soon!')}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 text-sm transition-colors cursor-pointer"
                >
                  Control Features
                </button>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-900 mb-2">System Settings</h3>
                <p className="text-sm text-red-700 mb-3">Configure system-wide settings</p>
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 text-sm transition-colors cursor-pointer"
                >
                  System Config
                </button>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h3 className="font-semibold text-indigo-900 mb-2">User Management</h3>
                <p className="text-sm text-indigo-700 mb-3">Manage all system users</p>
                <button 
                  onClick={() => navigate('/employees')}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 text-sm transition-colors cursor-pointer"
                >
                  Manage Users
                </button>
              </div>
              
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <h3 className="font-semibold text-teal-900 mb-2">Reports & Analytics</h3>
                <p className="text-sm text-teal-700 mb-3">View system reports and analytics</p>
                <button 
                  onClick={() => toast.info('Reports & Analytics feature coming soon!')}
                  className="w-full bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 text-sm transition-colors cursor-pointer"
                >
                  View Reports
                </button>
              </div>
              
              <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                <h3 className="font-semibold text-pink-900 mb-2">Audit Logs</h3>
                <p className="text-sm text-pink-700 mb-3">Monitor system activity and logs</p>
                <button 
                  onClick={() => toast.info('Audit Logs feature coming soon!')}
                  className="w-full bg-pink-600 text-white py-2 px-4 rounded hover:bg-pink-700 text-sm transition-colors cursor-pointer"
                >
                  View Logs
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-900">System Status</h3>
          <p className="text-green-700">✅ All systems operational</p>
          {(attendanceError || leaveError || employeeStatsError || attendanceStatsError || leaveStatsError) && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm">
                ⚠️ Some data may not be up to date due to network issues. Please refresh the page.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Self-Attendance Modal */}
      {showSelfAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Mark Self Attendance
              </h2>
              <button
                onClick={() => setShowSelfAttendanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleMarkSelfAttendance} className="p-6 space-y-4">
              <div>
                <label className="label">Date *</label>
                <input
                  type="date"
                  className="input"
                  value={selfAttendanceData.date}
                  onChange={(e) => setSelfAttendanceData({...selfAttendanceData, date: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Check In</label>
                  <input
                    type="time"
                    className="input"
                    value={selfAttendanceData.checkIn}
                    onChange={(e) => setSelfAttendanceData({...selfAttendanceData, checkIn: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label">Check Out</label>
                  <input
                    type="time"
                    className="input"
                    value={selfAttendanceData.checkOut}
                    onChange={(e) => setSelfAttendanceData({...selfAttendanceData, checkOut: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Status *</label>
                <select
                  className="input"
                  value={selfAttendanceData.status}
                  onChange={(e) => setSelfAttendanceData({...selfAttendanceData, status: e.target.value})}
                  required
                >
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="EARLY_LEAVE">Early Leave</option>
                  <option value="HALF_DAY">Half Day</option>
                </select>
              </div>
              
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  rows={3}
                  value={selfAttendanceData.notes}
                  onChange={(e) => setSelfAttendanceData({...selfAttendanceData, notes: e.target.value})}
                  placeholder="Optional notes about your attendance"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSelfAttendanceModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markSelfAttendanceMutation.isLoading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {markSelfAttendanceMutation.isLoading ? 'Marking...' : 'Mark Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
