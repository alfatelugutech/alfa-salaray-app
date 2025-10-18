import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from 'react-query'
import { attendanceService } from '../services/attendanceService'
import { leaveService } from '../services/leaveService'
import { employeeService } from '../services/employeeService'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  
  // Fetch data based on user role
  const { data: attendanceData } = useQuery(
    'my-attendance',
    () => attendanceService.getAttendance({ employeeId: user?.employeeId }),
    { enabled: !!user?.employeeId }
  )
  
  const { data: leaveData } = useQuery(
    'my-leave-requests',
    () => leaveService.getLeaveRequests({ employeeId: user?.employeeId }),
    { enabled: !!user?.employeeId }
  )
  
  const { data: employeeStats } = useQuery(
    'employee-stats',
    () => employeeService.getEmployeeStats(),
    { enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER' }
  )
  
  const { data: attendanceStats } = useQuery(
    'attendance-stats',
    () => attendanceService.getAttendanceStats(),
    { enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER' }
  )
  
  const { data: leaveStats } = useQuery(
    'leave-stats',
    () => leaveService.getLeaveStats(),
    { enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER' }
  )

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
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                  Mark Attendance
                </button>
                <button className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300">
                  View Employees
                </button>
                <button className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300">
                  Manage Leave Requests
                </button>
              </>
            ) : (
              // Employee actions
              <>
                <button className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300">
                  View My Attendance
                </button>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                  Request Leave
                </button>
                <button className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300">
                  View My Profile
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-900">System Status</h3>
          <p className="text-green-700">✅ All systems operational</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
