import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { attendanceService } from '../services/attendanceService'
import { leaveService } from '../services/leaveService'
import { employeeService } from '../services/employeeService'
import { Clock, X, MapPin, Camera, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCompleteLocation, getDeviceInfo } from '../utils/geolocation'
import { compressImage } from '../utils/camera'

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  
  // Show loading while user data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  // Safety check - if no user, redirect to login
  if (!user) {
    navigate('/login')
    return null
  }

  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [attendanceData, setAttendanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    checkIn: new Date().toTimeString().slice(0, 5),
    checkOut: '',
    status: 'PRESENT',
    notes: '',
    isRemote: false,
    overtimeHours: '',
    checkOutReason: '',
    workSummary: '',
    nextDayTasks: ''
  })
  const [location, setLocation] = useState<any>(null)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [showCameraPreview, setShowCameraPreview] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [currentStatus, setCurrentStatus] = useState<'NO_ATTENDANCE' | 'CHECKED_IN' | 'CHECKED_OUT' | 'ON_LEAVE'>('NO_ATTENDANCE')
  const queryClient = useQueryClient()

  // Fetch today's attendance to determine status
  useQuery(
    'today-attendance',
    () => attendanceService.getAttendance({ 
      employeeId: user?.employeeId,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }),
    { 
      enabled: !!user && !!user.employeeId,
      retry: 1,
      onSuccess: (data) => {
        const todayAttendance = data?.data?.attendances?.[0]
        if (todayAttendance) {
          if (todayAttendance.checkIn && !todayAttendance.checkOut) {
            setCurrentStatus('CHECKED_IN')
          } else if (todayAttendance.checkIn && todayAttendance.checkOut) {
            setCurrentStatus('CHECKED_OUT')
          }
        }
      }
    }
  )

  // Fetch data based on user role
  const { data: employeeStats } = useQuery(
    'employee-stats',
    () => employeeService.getEmployeeStats(),
    { 
      enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER',
      retry: 2,
    }
  )
  
  const { data: attendanceStats } = useQuery(
    'attendance-stats',
    () => attendanceService.getAttendanceStats(),
    { 
      enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER',
      retry: 2,
    }
  )
  
  const { data: leaveStats } = useQuery(
    'leave-stats',
    () => leaveService.getLeaveStats(),
    { 
      enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER',
      retry: 2,
    }
  )

  // Attendance mutation
  const markAttendanceMutation = useMutation(
    attendanceService.markAttendance,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('today-attendance')
        queryClient.invalidateQueries('my-attendance')
        toast.success('Attendance marked successfully!')
        setShowAttendanceModal(false)
        setLocation(null)
        setSelfie(null)
        
        // Update status based on action
        if (currentStatus === 'NO_ATTENDANCE') {
          setCurrentStatus('CHECKED_IN')
        } else if (currentStatus === 'CHECKED_IN') {
          setCurrentStatus('CHECKED_OUT')
        }
        
        setAttendanceData({
          date: new Date().toISOString().split('T')[0],
          checkIn: '',
          checkOut: '',
          status: 'PRESENT',
          notes: '',
          isRemote: false,
          overtimeHours: '',
          checkOutReason: '',
          workSummary: '',
          nextDayTasks: ''
        })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to mark attendance')
      }
    }
  )

  // Start camera preview
  const startCameraPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 960, min: 480 }
        }
      })
      setCameraStream(stream)
      setShowCameraPreview(true)
      toast.success('📸 Camera ready! Position yourself and click capture.')
    } catch (error: any) {
      toast.error('Failed to access camera: ' + error.message)
    }
  }

  // Stop camera preview
  const stopCameraPreview = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCameraPreview(false)
  }

  // Capture photo from preview
  const captureFromPreview = async () => {
    if (!cameraStream) return
    
    try {
      // Create video element to capture from stream
      const video = document.createElement('video')
      video.srcObject = cameraStream
      video.autoplay = true
      await video.play()
      
      // Wait for video to be ready
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Create canvas for capture
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 960
      
      const context = canvas.getContext('2d')
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
      }
      
      // Convert to base64
      const photo = canvas.toDataURL('image/jpeg', 0.9)
      const compressed = await compressImage(photo, 1200)
      setSelfie(compressed)
      
      // Stop camera
      stopCameraPreview()
      
      toast.success('📸 Photo captured successfully!')
    } catch (error: any) {
      toast.error('Failed to capture photo: ' + error.message)
    }
  }

  // Capture location
  const handleCaptureLocation = async () => {
    try {
      const loc = await getCompleteLocation()
      setLocation(loc)
      toast.success('📍 Location captured successfully!')
    } catch (error: any) {
      toast.error('Failed to get location: ' + error.message)
    }
  }

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (currentStatus === 'NO_ATTENDANCE' && !selfie) {
      toast.error('Please take a photo for check-in')
      return
    }
    
    if (currentStatus === 'CHECKED_IN' && !attendanceData.checkOut) {
      toast.error('Please select check-out time')
      return
    }
    
    // Get device info
    const deviceInfo = getDeviceInfo()
    
    let submitData: any = {
      employeeId: user?.employeeId,
      date: attendanceData.date,
      deviceInfo,
      notes: attendanceData.notes || undefined,
      isRemote: attendanceData.isRemote,
      overtimeHours: attendanceData.overtimeHours ? parseFloat(attendanceData.overtimeHours) : undefined,
    }
    
    if (currentStatus === 'NO_ATTENDANCE') {
      // Check-in with selfie
      submitData.checkIn = new Date(`${attendanceData.date}T${attendanceData.checkIn}`).toISOString()
      submitData.status = attendanceData.status
      submitData.checkInSelfie = selfie
      submitData.checkInLocation = location
    } else if (currentStatus === 'CHECKED_IN') {
      // Check-out
      submitData.checkOut = new Date(`${attendanceData.date}T${attendanceData.checkOut}`).toISOString()
      submitData.checkOutSelfie = selfie
      submitData.checkOutLocation = location
      submitData.checkOutReason = attendanceData.checkOutReason
      submitData.workSummary = attendanceData.workSummary
      submitData.nextDayTasks = attendanceData.nextDayTasks
    }
    
    markAttendanceMutation.mutate(submitData)
  }

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'NO_ATTENDANCE': return 'bg-red-50 border-red-200 text-red-800'
      case 'CHECKED_IN': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'CHECKED_OUT': return 'bg-green-50 border-green-200 text-green-800'
      case 'ON_LEAVE': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getStatusText = () => {
    switch (currentStatus) {
      case 'NO_ATTENDANCE': return 'Not Checked In'
      case 'CHECKED_IN': return 'Checked In - Ready to Check Out'
      case 'CHECKED_OUT': return 'Checked Out - Day Complete'
      case 'ON_LEAVE': return 'On Leave'
      default: return 'Unknown'
    }
  }

  // Check if user is admin/HR
  const isAdmin = user && (user.role === 'SUPER_ADMIN' || user.role === 'HR_MANAGER')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600">Employee Dashboard</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Role: {user.role}</p>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Current Status */}
      <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
        <div className="flex items-center gap-2 mb-2">
          {currentStatus === 'NO_ATTENDANCE' && <XCircle className="w-5 h-5" />}
          {currentStatus === 'CHECKED_IN' && <Clock className="w-5 h-5" />}
          {currentStatus === 'CHECKED_OUT' && <CheckCircle className="w-5 h-5" />}
          <h3 className="text-lg font-semibold">Current Status: {getStatusText()}</h3>
        </div>
        <p className="text-sm">
          {currentStatus === 'NO_ATTENDANCE' && 'You haven\'t checked in today. Take a photo to check in.'}
          {currentStatus === 'CHECKED_IN' && 'You are currently checked in. You can now check out when leaving.'}
          {currentStatus === 'CHECKED_OUT' && 'You have completed your attendance for today.'}
          {currentStatus === 'ON_LEAVE' && 'You are on leave today.'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Action */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance</h3>
          <p className="text-gray-600 mb-4">
            {currentStatus === 'NO_ATTENDANCE' ? 'Check in with photo' : 
             currentStatus === 'CHECKED_IN' ? 'Check out when leaving' : 
             'Attendance complete'}
          </p>
          <button
            onClick={() => setShowAttendanceModal(true)}
            className={`w-full py-2 px-4 rounded-lg font-medium ${
              currentStatus === 'CHECKED_OUT' 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : currentStatus === 'NO_ATTENDANCE'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
            disabled={currentStatus === 'CHECKED_OUT'}
          >
            {currentStatus === 'NO_ATTENDANCE' ? '📸 Check In' : 
             currentStatus === 'CHECKED_IN' ? '📸 Check Out' : 
             '✅ Complete'}
          </button>
        </div>

        {/* Admin Stats */}
        {isAdmin && (
          <>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Employees</h3>
              <p className="text-3xl font-bold text-gray-900">
                {employeeStats?.totalEmployees || 0}
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Present Today</h3>
              <p className="text-3xl font-bold text-gray-900">
                {attendanceStats?.presentToday || 0}
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Leaves</h3>
              <p className="text-3xl font-bold text-gray-900">
                {leaveStats?.pendingLeaves || 0}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {currentStatus === 'NO_ATTENDANCE' ? '📸 Check In with Photo' : '📸 Check Out'}
              </h2>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleMarkAttendance} className="p-6 space-y-4">
              <div>
                <label className="label">Date *</label>
                <input
                  type="date"
                  className="input"
                  value={attendanceData.date}
                  onChange={(e) => setAttendanceData({...attendanceData, date: e.target.value})}
                  required
                />
              </div>

              {/* Time Selection Based on Status */}
              {currentStatus === 'NO_ATTENDANCE' && (
                <div>
                  <label className="label flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    Check In Time *
                  </label>
                  <input
                    type="time"
                    className="input"
                    value={attendanceData.checkIn}
                    onChange={(e) => setAttendanceData({...attendanceData, checkIn: e.target.value})}
                    required
                  />
                </div>
              )}
              
              {currentStatus === 'CHECKED_IN' && (
                <div>
                  <label className="label flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Check Out Time *
                  </label>
                  <input
                    type="time"
                    className="input"
                    value={attendanceData.checkOut}
                    onChange={(e) => setAttendanceData({...attendanceData, checkOut: e.target.value})}
                    required
                  />
                </div>
              )}

              {currentStatus === 'NO_ATTENDANCE' && (
                <div>
                  <label className="label">Status *</label>
                  <select
                    className="input"
                    value={attendanceData.status}
                    onChange={(e) => setAttendanceData({...attendanceData, status: e.target.value})}
                    required
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                </div>
              )}

              {/* Photo Capture Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">
                  📸 {currentStatus === 'NO_ATTENDANCE' ? 'Check-In Photo' : 'Check-Out Photo'} *
                </h4>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={startCameraPreview}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Open Camera
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureLocation}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Capture Location
                  </button>
                </div>

                {showCameraPreview && (
                  <div className="text-center">
                    <div className="bg-gray-100 rounded-lg p-4 mb-2">
                      <p className="text-gray-600">Camera Preview - Click "Capture Photo" to take picture</p>
                    </div>
                    <button
                      type="button"
                      onClick={captureFromPreview}
                      className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                    >
                      Capture Photo
                    </button>
                  </div>
                )}

                {selfie && (
                  <div className="text-center">
                    <img src={selfie} alt="Captured Photo" className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-green-500" />
                    <p className="text-green-600 text-sm mt-2">✅ Photo captured successfully</p>
                  </div>
                )}

                {location && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-700 text-sm">✅ Location captured</p>
                    <p className="text-green-600 text-xs">Lat: {location.latitude?.toFixed(4)}, Lng: {location.longitude?.toFixed(4)}</p>
                  </div>
                )}
              </div>

              {/* Check-out specific fields */}
              {currentStatus === 'CHECKED_IN' && (
                <div className="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-800">Check-Out Details</h4>
                  
                  <div>
                    <label className="label">Check-Out Reason *</label>
                    <select
                      className="input"
                      value={attendanceData.checkOutReason}
                      onChange={(e) => setAttendanceData({...attendanceData, checkOutReason: e.target.value})}
                      required
                    >
                      <option value="">Select reason</option>
                      <option value="WORK_COMPLETED">Work Completed</option>
                      <option value="PERSONAL_EMERGENCY">Personal Emergency</option>
                      <option value="HEALTH_ISSUE">Health Issue</option>
                      <option value="FAMILY_MATTER">Family Matter</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Today's Work Summary *</label>
                    <textarea
                      className="input"
                      rows={3}
                      value={attendanceData.workSummary}
                      onChange={(e) => setAttendanceData({...attendanceData, workSummary: e.target.value})}
                      placeholder="Describe what you accomplished today..."
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label">Notes (Optional)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={attendanceData.notes}
                  onChange={(e) => setAttendanceData({...attendanceData, notes: e.target.value})}
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markAttendanceMutation.isLoading}
                  className={`flex-1 py-2 px-4 rounded font-medium ${
                    currentStatus === 'NO_ATTENDANCE'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  } ${markAttendanceMutation.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {markAttendanceMutation.isLoading ? 'Processing...' : 
                   currentStatus === 'NO_ATTENDANCE' ? 'Check In' : 'Check Out'}
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