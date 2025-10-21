import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { attendanceService } from '../services/attendanceService'
import { leaveService } from '../services/leaveService'
import { employeeService } from '../services/employeeService'
import { Clock, X, MapPin, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCompleteLocation, getDeviceInfo } from '../utils/geolocation'
import { captureSelfie, compressImage, checkCameraPermissions } from '../utils/camera'
import ConnectionTest from '../components/ConnectionTest'
import LiveCamera from '../components/LiveCamera'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Debug user data
  console.log('👤 Dashboard user data:', user)
  console.log('🔑 User role:', user?.role)
  console.log('🆔 User ID:', user?.id)

  const [showSelfAttendanceModal, setShowSelfAttendanceModal] = useState(false)
  const [location, setLocation] = useState<any>(null)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [isAutoCapturing, setIsAutoCapturing] = useState(false)
  const [showLiveCamera, setShowLiveCamera] = useState(false)

  // Fetch attendance data
  const { data: attendanceData, error: attendanceError } = useQuery(
    'my-attendance',
    () => attendanceService.getAttendance({ employeeId: user?.employeeId }),
    {
      enabled: !!user?.employeeId,
      retry: 2,
      retryDelay: 1000
    }
  )

  // Fetch leave data
  const { data: leaveData, error: leaveError } = useQuery(
    'my-leave-requests',
    () => leaveService.getLeaveRequests({ employeeId: user?.employeeId }),
    {
      enabled: !!user?.employeeId,
      retry: 2,
      retryDelay: 1000
    }
  )

  // Fetch employee stats (for admin)
  const { data: employeeStats, error: employeeStatsError } = useQuery(
    'employee-stats',
    () => employeeService.getEmployeeStats(),
    {
      enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER'
    }
  )

  // Fetch attendance stats (for admin)
  const { data: attendanceStats, error: attendanceStatsError } = useQuery(
    'attendance-stats',
    () => attendanceService.getAttendanceStats(),
    {
      enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER'
    }
  )

  // Fetch leave stats (for admin)
  const { data: leaveStats, error: leaveStatsError } = useQuery(
    'leave-stats',
    () => leaveService.getLeaveStats(),
    {
      enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER'
    }
  )

  // Check-in mutation
  const checkInMutation = useMutation(attendanceService.markAttendance, {
    onSuccess: () => {
      queryClient.invalidateQueries('my-attendance')
      queryClient.invalidateQueries('attendance-status')
      toast.success('Check-in successful!')
      setShowSelfAttendanceModal(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Check-in failed')
    }
  })

  // Check-out mutation
  const checkOutMutation = useMutation(attendanceService.markAttendance, {
    onSuccess: () => {
      queryClient.invalidateQueries('my-attendance')
      queryClient.invalidateQueries('attendance-status')
      toast.success('Check-out successful!')
      setShowSelfAttendanceModal(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Check-out failed')
    }
  })

  // Get attendance status
  const { data: attendanceStatus } = useQuery(
    'attendance-status',
    () => attendanceService.getAttendanceStatus(),
    {
      enabled: !!user?.employeeId,
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true
    }
  )

  const handleCheckIn = async () => {
    try {
      const location = await getCompleteLocation()
      const deviceInfo = getDeviceInfo()
      
      if (isAutoCapturing) {
        const selfie = await captureSelfie()
        setSelfie(selfie)
      }

      await checkInMutation.mutateAsync({
        employeeId: user?.employeeId,
        date: new Date().toISOString().split('T')[0],
        checkIn: new Date().toISOString(),
        status: 'PRESENT',
        notes: 'Check-in via dashboard'
      })
    } catch (error) {
      console.error('Check-in error:', error)
    }
  }

  const handleCheckOut = async () => {
    try {
      const location = await getCompleteLocation()
      
      if (isAutoCapturing) {
        const selfie = await captureSelfie()
        setSelfie(selfie)
      }

      await checkOutMutation.mutateAsync({
        employeeId: user?.employeeId,
        date: new Date().toISOString().split('T')[0],
        checkOut: new Date().toISOString(),
        status: 'PRESENT',
        notes: 'Check-out via dashboard'
      })
    } catch (error) {
      console.error('Check-out error:', error)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'HR_MANAGER'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600">
                {isAdmin ? 'Admin Dashboard' : 'Employee Dashboard'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Time</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Connection Test */}
        <ConnectionTest />

        {/* Employee Dashboard */}
        {!isAdmin && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleCheckIn}
                disabled={checkInMutation.isLoading || !attendanceStatus?.status?.canCheckIn}
                className="card p-4 flex items-center justify-center gap-3 hover:bg-green-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Clock className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">
                  {attendanceStatus?.status?.canCheckIn ? "Check In" : "Already Checked In"}
                </span>
              </button>
              <button
                onClick={handleCheckOut}
                disabled={checkOutMutation.isLoading || !attendanceStatus?.status?.canCheckOut}
                className="card p-4 flex items-center justify-center gap-3 hover:bg-orange-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-700">
                  {attendanceStatus?.status?.canCheckOut ? "Check Out" : 
                   attendanceStatus?.status?.isCompleted ? "Already Checked Out" : "Check In First"}
                </span>
              </button>
            </div>

            {/* Today's Hours */}
            {attendanceData && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Working Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {'0.00'}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Regular Hours</p>
                    <p className="text-2xl font-bold text-green-600">
                      {'0.00'}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Overtime Hours</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {'0.00'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin Dashboard */}
        {isAdmin && (
          <div className="space-y-6">
            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">Total Employees</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {employeeStats?.totalEmployees || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900">Present Today</h3>
                <p className="text-2xl font-bold text-green-600">
                  {attendanceStats?.presentCount || 0}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900">Late Today</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {attendanceStats?.lateCount || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900">Pending Leaves</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {leaveStats?.pendingRequests || 0}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/employees')}
                className="card p-4 flex items-center justify-center gap-3 hover:bg-blue-50"
              >
                <span className="text-2xl">👥</span>
                <span className="font-medium text-blue-700">Manage Employees</span>
              </button>
              <button
                onClick={() => navigate('/attendance')}
                className="card p-4 flex items-center justify-center gap-3 hover:bg-green-50"
              >
                <span className="text-2xl">📊</span>
                <span className="font-medium text-green-700">Attendance</span>
              </button>
              <button
                onClick={() => navigate('/leave')}
                className="card p-4 flex items-center justify-center gap-3 hover:bg-orange-50"
              >
                <span className="text-2xl">🏖️</span>
                <span className="font-medium text-orange-700">Leave Requests</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
