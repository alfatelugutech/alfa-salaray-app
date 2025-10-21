import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceService } from '../services/attendanceService'
import { leaveService } from '../services/leaveService'
import { employeeService } from '../services/employeeService'
import { authService } from '../services/authService'
import { Clock, X, MapPin, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCompleteLocation, getDeviceInfo } from '../utils/geolocation'
import { captureSelfie, compressImage, checkCameraPermissions } from '../utils/camera'
import { locationTracker } from '../utils/locationTracker'
import ConnectionTest from '../components/ConnectionTest'
import LiveCamera from '../components/LiveCamera'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Debug user data
  console.log('👤 Dashboard user data:', user)
  console.log('🔑 User role:', user?.role)
  console.log('🆔 User ID:', user?.id)
  const [showSelfAttendanceModal, setShowSelfAttendanceModal] = useState(false)
  const [location, setLocation] = useState<any>(null)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [isAutoCapturing, setIsAutoCapturing] = useState(false)
  const [showLiveCamera, setShowLiveCamera] = useState(false)
  const queryClient = useQueryClient()


  // Smart status detection
  const getSmartStatus = () => {
    if (attendanceStatus?.status?.isCompleted) {
      return {
        type: 'completed',
        message: '🎉 Work day completed successfully!',
        color: 'green',
        icon: '✅'
      }
    } else if (attendanceStatus?.status?.canCheckOut) {
      return {
        type: 'checkout',
        message: '🌆 Ready for smart check-out',
        color: 'orange',
        icon: '🕐'
      }
    } else {
      return {
        type: 'checkin',
        message: '🌅 Ready for smart check-in',
        color: 'blue',
        icon: '🚀'
      }
    }
  }
  
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

  // Self check-in mutation
  const selfCheckInMutation = useMutation(
    attendanceService.selfCheckIn,
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('my-attendance')
        queryClient.invalidateQueries('attendance-status')
        
        // Start location tracking after successful check-in
        if (data?.id) {
          locationTracker.startTracking(data.id)
          console.log('🚀 Location tracking started for attendance:', data.id)
        }
        
        toast.success('✅ Check-in completed successfully! Location tracking started.')
        setShowSelfAttendanceModal(false)
        setLocation(null)
        setSelfie(null)
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Failed to check in'
        if (errorMessage.includes('already marked')) {
          toast.error('You have already checked in today. Please check out first.')
        } else if (errorMessage.includes('Already completed attendance')) {
          toast.error('Attendance already completed for today')
        } else {
          toast.error(errorMessage)
        }
      }
    }
  )

  // Self check-out mutation
  const selfCheckOutMutation = useMutation(
    attendanceService.selfCheckOut,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-attendance')
        queryClient.invalidateQueries('attendance-status')
        
        // Stop location tracking after successful check-out
        locationTracker.stopTracking()
        console.log('🛑 Location tracking stopped after check-out')
        
        toast.success('✅ Check-out completed successfully! Your attendance has been recorded with selfie and location.')
        setShowSelfAttendanceModal(false)
        setLocation(null)
        setSelfie(null)
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Failed to check out'
        if (errorMessage.includes('No active check-in')) {
          toast.error('❌ Please check in first before checking out')
        } else if (errorMessage.includes('Already checked out')) {
          toast.error('❌ You have already checked out today')
        } else if (errorMessage.includes('User ID required')) {
          toast.error('❌ Authentication error. Please login again.')
        } else {
          toast.error(`❌ Check-out failed: ${errorMessage}`)
        }
      }
    }
  )

  // Smart auto-submit when both selfie and location are ready
  useEffect(() => {
    if (selfie && location && !selfCheckInMutation.isLoading && !selfCheckOutMutation.isLoading) {
      console.log('🧠 Smart system: Both selfie and location ready, auto-submitting...')
      // Smart delay based on data size and network conditions
      const smartDelay = selfie.length > 100000 ? 1000 : 500
      const timer = setTimeout(() => {
        handleAutoSubmitAttendance()
      }, smartDelay)
      return () => clearTimeout(timer)
    }
  }, [selfie, location, selfCheckInMutation.isLoading, selfCheckOutMutation.isLoading])

  // Get current attendance status
  const { data: attendanceStatus } = useQuery(
    'attendance-status',
    () => attendanceService.getAttendanceStatus(),
    {
      enabled: !!user?.employeeId,
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true,
      onSuccess: (data) => {
        console.log('📊 Frontend attendance status:', data);
      }
    }
  )

  // Open live camera for selfie capture
  const handleTakeSelfieAndLocation = async () => {
    // Proceed directly for both check-in and check-out
    await startSelfieCapture()
  }

  // Start the selfie capture process
  const startSelfieCapture = async () => {
    // First capture location automatically
    try {
      const loc = await getCompleteLocation()
      setLocation(loc)
      console.log('📍 Location captured automatically:', {
        hasLocation: !!loc,
        locationData: loc
      })
      toast.success('📍 Location captured automatically!')
    } catch (error: any) {
      console.log('❌ Location capture failed:', error)
      toast.error(error.message || 'Failed to get location')
      return
    }

    // Then open live camera for selfie
    setShowLiveCamera(true)
  }


  // Handle selfie capture from live camera
  const handleSelfieCapture = (imageData: string) => {
    setSelfie(imageData)
    console.log('📸 Selfie captured from live camera:', {
      hasSelfie: !!imageData,
      selfieLength: imageData?.length || 0
    })
    toast.success('📸 Selfie captured successfully!')
    
    // Close the live camera
    setShowLiveCamera(false)
    
    // Show info about what's happening next
    if (location) {
      toast('✅ Both selfie and location ready! Attendance will be marked automatically.', { icon: 'ℹ️' })
    } else {
      toast('📍 Selfie captured! Waiting for location data...', { icon: 'ℹ️' })
    }
  }

  const handleAutoSubmitAttendance = () => {
    // Get device info
    const deviceInfo = getDeviceInfo()
    
    // Debug current state
    console.log('🔍 Auto-submit state check:', {
      hasSelfie: !!selfie,
      selfieLength: selfie?.length || 0,
      hasLocation: !!location,
      locationData: location,
      attendanceStatus: attendanceStatus?.status,
      user: user,
      userId: user?.id,
      isAuthenticated: authService.isAuthenticated()
    })
    
    // Determine if this is check-in or check-out based on current status
    const isCheckOut = attendanceStatus?.status?.canCheckOut
    
    // Enhanced validation for check-out requirements
    if (isCheckOut) {
      // Check-out specific validation
      if (!selfie) {
        toast.error('❌ Check-out requires a selfie. Please capture your selfie first.')
        return
      }
      if (!location) {
        toast.error('❌ Check-out requires location. Please allow location access.')
        return
      }
      console.log('✅ Check-out requirements validated: Selfie + Location captured')
    } else {
      // Check-in specific validation
      if (!selfie) {
        toast.error('❌ Check-in requires a selfie. Please capture your selfie first.')
        return
      }
      if (!location) {
        toast.error('❌ Check-in requires location. Please allow location access.')
        return
      }
      console.log('✅ Check-in requirements validated: Selfie + Location captured')
    }
    
    if (isCheckOut) {
      // Check-out flow
      const checkOutData = {
        notes: undefined, // No notes field
        checkOutSelfie: selfie || undefined,
        checkOutLocation: location || undefined
      }
      
      // Debug logging
      console.log('🔍 Check-out data being sent:', {
        hasSelfie: !!selfie,
        selfieLength: selfie?.length || 0,
        selfiePreview: selfie?.substring(0, 50) + '...',
        hasLocation: !!location,
        locationData: location,
        checkOutData,
        fullPayload: {
          notes: undefined,
          checkOutSelfie: selfie || undefined,
          checkOutLocation: location || undefined
        }
      })
      
      toast.loading('🎯 Automatically checking out...', { duration: 2000 })
      selfCheckOutMutation.mutate(checkOutData)
    } else {
      // Check-in flow
      const checkInData = {
        isRemote: false, // Default to false, no user input needed
        notes: undefined, // No notes field
        checkInSelfie: selfie || undefined,
        checkInLocation: location || undefined,
        deviceInfo: deviceInfo || undefined,
        shiftId: null
      }
      
      // Debug logging
      console.log('🔍 Check-in data being sent:', {
        hasSelfie: !!selfie,
        selfieLength: selfie?.length || 0,
        selfiePreview: selfie?.substring(0, 50) + '...',
        hasLocation: !!location,
        locationData: location,
        checkInData,
        fullPayload: {
          isRemote: false,
          notes: undefined,
          checkInSelfie: selfie || undefined,
          checkInLocation: location || undefined,
          deviceInfo: deviceInfo || undefined,
          shiftId: null
        }
      })
      
      toast.loading('🎯 Automatically checking in...', { duration: 2000 })
      selfCheckInMutation.mutate(checkInData)
    }
  }


  // Check if user is admin/HR
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER'
  
  return (
    <div className="p-6">
      {/* Connection Test Component */}
      <ConnectionTest />
      
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
                      onClick={() => navigate('/employees')}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors cursor-pointer"
                    >
                      User & Role Management
                    </button>
                    <button 
                      onClick={() => navigate('/shifts')}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors cursor-pointer"
                    >
                      Shift Management
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
                <h3 className="font-semibold text-purple-900 mb-2">User Management</h3>
                <p className="text-sm text-purple-700 mb-3">Manage employees and users</p>
                <button 
                  onClick={() => navigate('/employees')}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 text-sm transition-colors cursor-pointer"
                >
                  Manage Employees
                </button>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-900 mb-2">Shift Management</h3>
                <p className="text-sm text-orange-700 mb-3">Create and manage work shifts</p>
                <button 
                  onClick={() => navigate('/shifts')}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 text-sm transition-colors cursor-pointer"
                >
                  Manage Shifts
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
                <h3 className="font-semibold text-indigo-900 mb-2">Payroll Management</h3>
                <p className="text-sm text-indigo-700 mb-3">Manage employee salaries</p>
                <button 
                  onClick={() => navigate('/payroll')}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 text-sm transition-colors cursor-pointer"
                >
                  Manage Payroll
                </button>
              </div>
              
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <h3 className="font-semibold text-teal-900 mb-2">Attendance Reports</h3>
                <p className="text-sm text-teal-700 mb-3">View attendance analytics</p>
                <button 
                  onClick={() => navigate('/attendance')}
                  className="w-full bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 text-sm transition-colors cursor-pointer"
                >
                  View Attendance
                </button>
              </div>
              
              <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                <h3 className="font-semibold text-pink-900 mb-2">Leave Management</h3>
                <p className="text-sm text-pink-700 mb-3">Manage leave requests</p>
                <button 
                  onClick={() => navigate('/leave')}
                  className="w-full bg-pink-600 text-white py-2 px-4 rounded hover:bg-pink-700 text-sm transition-colors cursor-pointer"
                >
                  Manage Leaves
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-auto max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Mark Attendance
              </h2>
              <button
                onClick={() => {
                  setShowSelfAttendanceModal(false)
                  setSelfie(null)
                  setLocation(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Automatic Data Capture Notice */}
              {/* Smart Attendance Status Indicator */}
              {(() => {
                const smartStatus = getSmartStatus()
                return (
                  <div className={`mb-6 p-4 rounded-lg border-2 ${
                    smartStatus.color === 'green' ? 'bg-green-50 border-green-200' :
                    smartStatus.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        smartStatus.color === 'green' ? 'bg-green-500' :
                        smartStatus.color === 'orange' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {smartStatus.icon} {smartStatus.message}
                      </span>
                    </div>
                    {smartStatus.type !== 'completed' && (
                      <div className="mt-2 text-center">
                        <p className="text-xs text-gray-600">
                          🧠 Smart system will handle location + selfie automatically
                        </p>
                      </div>
                    )}
                  </div>
                )
              })()}

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Automatic Data Capture</span>
                </div>
                <p className="text-sm text-blue-700">
                  Date, time, and status will be automatically captured when you take your selfie.
                </p>
              </div>

              {/* Phase 2: Selfie & Location Capture */}
              {!selfie && !location ? (
                <div className="p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-400 rounded-xl shadow-md">
                  <div className="text-center mb-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${
                      attendanceStatus?.status?.canCheckOut 
                        ? 'bg-orange-600' 
                        : attendanceStatus?.status?.isCompleted
                        ? 'bg-green-600'
                        : 'bg-blue-600'
                    }`}>
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {attendanceStatus?.status?.isCompleted 
                        ? '✅ Attendance Completed' 
                        : attendanceStatus?.status?.canCheckOut 
                        ? '📸 Check-Out Selfie' 
                        : '📸 Check-In Selfie'
                      }
                    </h3>
                    <p className="text-base text-gray-700">
                      {attendanceStatus?.status?.isCompleted 
                        ? '🎉 You have completed your attendance for today'
                        : attendanceStatus?.status?.canCheckOut 
                        ? '🌆 Take your check-out selfie' 
                        : '🌅 Take your check-in selfie'
                      }
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {attendanceStatus?.status?.isCompleted 
                        ? 'Great job! See you tomorrow.'
                        : attendanceStatus?.status?.canCheckOut
                        ? '🌆 One-click smart checkout with selfie & location'
                        : '🌅 One-click smart check-in with selfie & location'
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTakeSelfieAndLocation}
                    disabled={isAutoCapturing || attendanceStatus?.status?.isCompleted}
                    className={`w-full flex items-center justify-center gap-3 px-8 py-4 text-white text-xl font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                      attendanceStatus?.status?.isCompleted
                        ? 'bg-gray-500 cursor-not-allowed'
                        : attendanceStatus?.status?.canCheckOut
                        ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800'
                        : 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800'
                    }`}
                  >
                    {isAutoCapturing ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Opening Camera...
                      </>
                    ) : attendanceStatus?.status?.isCompleted ? (
                      <>
                        <div className="w-6 h-6">✅</div>
                        Attendance Completed
                      </>
                    ) : (
                      <>
                        <Camera className="w-6 h-6" />
                        📸 {attendanceStatus?.status?.canCheckOut ? 'Smart Check-Out' : 'Smart Check-In'}
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-600 mt-4 text-center bg-white/50 p-3 rounded-lg">
                    ℹ️ {attendanceStatus?.status?.canCheckOut 
                      ? 'Smart Check-Out: Automatic location + live camera selfie'
                      : 'Smart Check-In: Automatic location + live camera selfie'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Show captured selfie */}
                  {selfie && (
                    <div>
                      <label className="label text-lg font-semibold">
                        📸 Attendance Selfie ✅
                      </label>
                      <div className="relative">
                        <img 
                          src={selfie} 
                          alt="Attendance Selfie" 
                          className="w-full h-80 object-cover rounded-xl border-4 border-green-500 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelfie(null)
                            setLocation(null)
                          }}
                          className="absolute top-3 right-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-lg"
                        >
                          <Camera className="w-5 h-5" />
                          Retake
                        </button>
                      </div>
                      
                      {/* Smart Manual Submit Button */}
                      {selfie && location && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg shadow-lg">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <p className="text-green-800 font-medium">
                                🧠 Smart system ready! Both selfie and location captured
                              </p>
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                            <button
                              type="button"
                              onClick={handleAutoSubmitAttendance}
                              disabled={selfCheckInMutation.isLoading || selfCheckOutMutation.isLoading}
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg transform transition-all duration-300 hover:scale-105"
                            >
                              {selfCheckInMutation.isLoading || selfCheckOutMutation.isLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                  {attendanceStatus?.status?.canCheckOut ? 'Checking Out...' : 'Checking In...'}
                                </>
                              ) : (
                                <>
                                  <Clock className="w-6 h-6" />
                                  {attendanceStatus?.status?.canCheckOut ? 'Complete Check-Out' : 'Complete Check-In'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show captured location */}
                  {location && (
                    <div>
                      <label className="label">Your Location ✅</label>
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">
                              {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Show confirmation only after selfie is captured */}
              {selfie && location && (
                <>
                  {/* Automatic time capture notice */}
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Time will be automatically captured</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Current time will be used for check-in/check-out
                    </p>
                  </div>

                  {/* Info Badge */}
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-center">
                    <p className="text-xs text-blue-700">
                      ✅ Selfie, Location, Device & IP captured
                    </p>
                  </div>
                </>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSelfAttendanceModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const permissionCheck = await checkCameraPermissions()
                      if (permissionCheck.hasPermission) {
                        toast.success('✅ Camera is working perfectly!')
                      } else {
                        toast.error(permissionCheck.message)
                      }
                    } catch (error: any) {
                      toast.error('Camera test failed: ' + error.message)
                    }
                  }}
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors mr-2"
                >
                  Test Camera
                </button>
                <button
                  type="button"
                  onClick={handleTakeSelfieAndLocation}
                  disabled={isAutoCapturing || selfCheckInMutation.isLoading || selfCheckOutMutation.isLoading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isAutoCapturing ? 'Capturing...' : 
                   selfCheckInMutation.isLoading ? 'Checking In...' :
                   selfCheckOutMutation.isLoading ? 'Checking Out...' :
                   'Take Selfie & Mark Attendance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Component */}
      <LiveCamera
        isOpen={showLiveCamera}
        onClose={() => setShowLiveCamera(false)}
        onCapture={handleSelfieCapture}
        title={attendanceStatus?.status?.canCheckOut ? 'Check-Out Selfie' : 'Check-In Selfie'}
      />

    </div>
  )
}

export default Dashboard

