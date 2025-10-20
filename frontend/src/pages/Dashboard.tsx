import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { attendanceService } from '../services/attendanceService'
import { leaveService } from '../services/leaveService'
import { employeeService } from '../services/employeeService'
import { Clock, X, MapPin, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCompleteLocation, getDeviceInfo } from '../utils/geolocation'
import { captureSelfie, compressImage } from '../utils/camera'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showSelfAttendanceModal, setShowSelfAttendanceModal] = useState(false)
  const [selfAttendanceData, setSelfAttendanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    checkIn: new Date().toTimeString().slice(0, 5), // Auto-set current time
    checkOut: '',
    status: 'PRESENT',
    notes: '',
    isRemote: false,
    overtimeHours: ''
  })
  const [location, setLocation] = useState<any>(null)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [isAutoCapturing, setIsAutoCapturing] = useState(false)
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
    attendanceService.markAttendance,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-attendance')
        toast.success('Attendance marked successfully!')
        setShowSelfAttendanceModal(false)
        setLocation(null)
        setSelfie(null)
        setSelfAttendanceData({
          date: new Date().toISOString().split('T')[0],
          checkIn: '',
          checkOut: '',
          status: 'PRESENT',
          notes: '',
          isRemote: false,
          overtimeHours: ''
        })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to mark attendance')
      }
    }
  )

  // Manual selfie and GPS capture
  const handleTakeSelfieAndLocation = async () => {
    setIsAutoCapturing(true)
    
    // Capture selfie
    try {
      const photo = await captureSelfie()
      const compressed = await compressImage(photo, 800)
      setSelfie(compressed)
      toast.success('📸 Selfie captured successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to capture selfie')
      setIsAutoCapturing(false)
      return
    }

    // Capture GPS location
    try {
      const loc = await getCompleteLocation()
      setLocation(loc)
      toast.success('📍 Location captured successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to get location')
    }

    setIsAutoCapturing(false)
  }

  const handleMarkSelfAttendance = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Get device info
    const deviceInfo = getDeviceInfo()
    
    // Determine if this is check-in or check-out
    const isCheckOut = !!selfAttendanceData.checkOut
    
    // Prepare submit data
    const submitData: any = {
      employeeId: user?.employeeId,
      date: selfAttendanceData.date,
      checkIn: selfAttendanceData.checkIn ? new Date(`${selfAttendanceData.date}T${selfAttendanceData.checkIn}`).toISOString() : undefined,
      checkOut: selfAttendanceData.checkOut ? new Date(`${selfAttendanceData.date}T${selfAttendanceData.checkOut}`).toISOString() : undefined,
      status: selfAttendanceData.status,
      notes: selfAttendanceData.notes || undefined,
      isRemote: selfAttendanceData.isRemote,
      overtimeHours: selfAttendanceData.overtimeHours ? parseFloat(selfAttendanceData.overtimeHours) : undefined,
      deviceInfo,
      // Dual selfies: check-in selfie or check-out selfie
      checkInSelfie: !isCheckOut && selfie ? selfie : undefined,
      checkOutSelfie: isCheckOut && selfie ? selfie : undefined,
      checkInLocation: !isCheckOut && location ? location : undefined,
      checkOutLocation: isCheckOut && location ? location : undefined
    }
    
    markSelfAttendanceMutation.mutate(submitData)
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

              {/* Phase 2: Selfie & Location Capture */}
              {!selfie && !location ? (
                <div className="p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-400 rounded-xl shadow-md">
                  <div className="text-center mb-6">
                    <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selfAttendanceData.checkOut ? '📸 Check-Out Selfie' : '📸 Check-In Selfie'}
                    </h3>
                    <p className="text-base text-gray-700">
                      {selfAttendanceData.checkOut 
                        ? '🏃 Leaving office? Take your check-out selfie'
                        : '🌅 Good morning! Take your check-in selfie'}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {selfAttendanceData.checkOut 
                        ? 'Evening selfie + location will be captured'
                        : 'Morning selfie + location will be captured'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTakeSelfieAndLocation}
                    disabled={isAutoCapturing}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xl font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transform transition hover:scale-105"
                  >
                    {isAutoCapturing ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Opening Camera...
                      </>
                    ) : (
                      <>
                        <Camera className="w-6 h-6" />
                        {selfAttendanceData.checkOut ? '📸 Take Evening Selfie' : '📸 Take Morning Selfie'}
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-600 mt-4 text-center bg-white/50 p-3 rounded-lg">
                    {selfAttendanceData.checkOut 
                      ? 'ℹ️ Auto-marked as HALF_DAY if after 11:59 AM'
                      : 'ℹ️ Camera and location permissions will be requested'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Show captured selfie */}
                  {selfie && (
                    <div>
                      <label className="label text-lg font-semibold">
                        {selfAttendanceData.checkOut ? '📸 Evening Selfie ✅' : '🌅 Morning Selfie ✅'}
                      </label>
                      <div className="relative">
                        <img 
                          src={selfie} 
                          alt={selfAttendanceData.checkOut ? 'Check-Out Selfie' : 'Check-In Selfie'} 
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

              {/* Show additional options only after selfie is captured */}
              {selfie && location && (
                <>
                  {/* Optional: Remote Work & Overtime */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Additional Details (Optional)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isRemote"
                          checked={selfAttendanceData.isRemote}
                          onChange={(e) => setSelfAttendanceData({...selfAttendanceData, isRemote: e.target.checked})}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isRemote" className="ml-2 text-sm text-gray-700">
                          🏠 Remote Work
                        </label>
                      </div>
                      <div>
                        <label className="label text-xs">Overtime (hrs)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="12"
                          className="input text-sm"
                          value={selfAttendanceData.overtimeHours}
                          onChange={(e) => setSelfAttendanceData({...selfAttendanceData, overtimeHours: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional: Check-out time */}
                  <div>
                    <label className="label">Check Out (if marking end of day)</label>
                    <input
                      type="time"
                      className="input"
                      value={selfAttendanceData.checkOut}
                      onChange={(e) => setSelfAttendanceData({...selfAttendanceData, checkOut: e.target.value})}
                    />
                  </div>
                  
                  {/* Optional: Notes */}
                  <div>
                    <label className="label">Notes</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={selfAttendanceData.notes}
                      onChange={(e) => setSelfAttendanceData({...selfAttendanceData, notes: e.target.value})}
                      placeholder="Any additional notes..."
                    />
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
