import React, { useEffect, useRef, useState } from 'react'
import { Clock, Search, Filter, CheckCircle, XCircle, MapPin, Home, Camera, LogIn, LogOut } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { attendanceService } from '../services/attendanceService'
import { useAuth } from '../hooks/useAuth'
import { isCameraAvailable, getImageThumbnail } from '../utils/camera'
import { getCompleteLocation, getDeviceInfo } from '../utils/geolocation'
import toast from 'react-hot-toast'

const MyAttendance: React.FC = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('')

  // Fetch my attendance records
  const queryClient = useQueryClient()

  const { data: attendanceData, isLoading, error } = useQuery(
    ['my-attendance', searchTerm, dateFilter, statusFilter],
    () => attendanceService.getAttendance({
      employeeId: user?.employeeId,
      startDate: dateFilter,
      endDate: dateFilter,
      status: statusFilter
    })
  )

  const selfCheckInMutation = useMutation(attendanceService.selfCheckIn, {
    onSuccess: () => {
      toast.success('Checked in successfully')
      queryClient.invalidateQueries('my-attendance')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to check in'
      if (errorMessage.includes('Already checked in')) {
        toast.error('You have already checked in today. Please check out first.')
      } else if (errorMessage.includes('Already completed attendance')) {
        toast.error('You have already completed attendance for today')
      } else {
        toast.error(errorMessage)
      }
    }
  })

  const selfCheckOutMutation = useMutation(attendanceService.selfCheckOut, {
    onSuccess: () => {
      toast.success('Checked out successfully')
      queryClient.invalidateQueries('my-attendance')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to check out'
      if (errorMessage.includes('No active check-in')) {
        toast.error('Please check in first before checking out')
      } else if (errorMessage.includes('Already checked out')) {
        toast.error('You have already checked out today')
      } else {
        toast.error(errorMessage)
      }
    }
  })

  // Live camera modal state
  const [showCamera, setShowCamera] = useState<false | 'checkin' | 'checkout'>(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const startStream = async () => {
      try {
        if (!showCamera) return
        if (!isCameraAvailable()) {
          toast.error('Camera not available on this device')
          setShowCamera(false)
          return
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        })
        mediaStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (err: any) {
        toast.error(err?.message || 'Unable to access camera')
        setShowCamera(false)
      }
    }
    startStream()
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
      }
    }
  }, [showCamera])

  const captureFromLive = async (): Promise<string | undefined> => {
    try {
      const video = videoRef.current
      if (!video) return undefined
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      return await getImageThumbnail(dataUrl)
    } catch (e) {
      toast.error('Failed to capture photo')
      return undefined
    }
  }

  const closeCamera = () => {
    setShowCamera(false)
  }

  const handleOpenCheckIn = () => setShowCamera('checkin')
  const handleOpenCheckOut = () => setShowCamera('checkout')

  const handleConfirmCapture = async () => {
    try {
      const selfie = await captureFromLive()
      const deviceInfo = getDeviceInfo()
      const location = await getCompleteLocation().catch(() => null)
      if (showCamera === 'checkin') {
        await selfCheckInMutation.mutateAsync({
          isRemote: false,
          checkInSelfie: selfie,
          checkInLocation: location,
          deviceInfo
        })
      } else if (showCamera === 'checkout') {
        await selfCheckOutMutation.mutateAsync({
          checkOutSelfie: selfie,
          checkOutLocation: location
        })
      }
      setShowCamera(false)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record attendance')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600">View your attendance records and history</p>
        </div>
      </div>

      {/* Live Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {showCamera === 'checkin' ? 'Check In Selfie' : 'Check Out Selfie'}
              </h3>
              <button
                onClick={closeCamera}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-gray-900 rounded-lg"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={handleConfirmCapture}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600 text-center">
              Position your face in the camera frame and click "Capture Photo"
            </div>
          </div>
        </div>
      )}

      {/* Current Status */}
      {attendanceData?.data?.attendances && attendanceData.data.attendances.length > 0 && (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Today's Status</h3>
                <p className="text-sm text-blue-700">
                  {(() => {
                    const today = new Date().toISOString().split('T')[0]
                    const todayAttendance = attendanceData?.data?.attendances?.find((att: any) => 
                      new Date(att.date).toISOString().split('T')[0] === today
                    )
                    if (!todayAttendance) return "Not checked in yet"
                    if (todayAttendance.checkIn && !todayAttendance.checkOut) return "Checked in - Ready to check out"
                    if (todayAttendance.checkIn && todayAttendance.checkOut) return "Completed for today"
                    return "No attendance recorded"
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleOpenCheckIn}
          disabled={selfCheckInMutation.isLoading || (() => {
            const today = new Date().toISOString().split('T')[0]
            const todayAttendance = attendanceData?.data?.attendances?.find((att: any) => 
              new Date(att.date).toISOString().split('T')[0] === today
            )
            return Boolean(todayAttendance?.checkIn && !todayAttendance?.checkOut)
          })()}
          className="card p-4 flex items-center justify-center gap-3 hover:bg-green-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <LogIn className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-700">
            {(() => {
              const today = new Date().toISOString().split('T')[0]
              const todayAttendance = attendanceData?.data?.attendances?.find((att: any) => 
                new Date(att.date).toISOString().split('T')[0] === today
              )
              if (todayAttendance?.checkIn && !todayAttendance?.checkOut) return "Already Checked In"
              return "Check In (Selfie + Location)"
            })()}
          </span>
        </button>
        <button
          onClick={handleOpenCheckOut}
          disabled={selfCheckOutMutation.isLoading || (() => {
            const today = new Date().toISOString().split('T')[0]
            const todayAttendance = attendanceData?.data?.attendances?.find((att: any) => 
              new Date(att.date).toISOString().split('T')[0] === today
            )
            return Boolean(!todayAttendance?.checkIn || todayAttendance?.checkOut)
          })()}
          className="card p-4 flex items-center justify-center gap-3 hover:bg-orange-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <LogOut className="h-5 w-5 text-orange-600" />
          <span className="font-medium text-orange-700">
            {(() => {
              const today = new Date().toISOString().split('T')[0]
              const todayAttendance = attendanceData?.data?.attendances?.find((att: any) => 
                new Date(att.date).toISOString().split('T')[0] === today
              )
              if (!todayAttendance?.checkIn) return "Check In First"
              if (todayAttendance?.checkOut) return "Already Checked Out"
              return "Check Out (Selfie + Location)"
            })()}
          </span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Present Days</p>
              <p className="text-xl font-bold text-gray-900">
                {attendanceData?.data?.attendances?.filter((att: any) => att.status === 'PRESENT').length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Absent Days</p>
              <p className="text-xl font-bold text-gray-900">
                {attendanceData?.data?.attendances?.filter((att: any) => att.status === 'ABSENT').length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Late Days</p>
              <p className="text-xl font-bold text-gray-900">
                {attendanceData?.data?.attendances?.filter((att: any) => att.status === 'LATE').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search attendance records..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              className="input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <select 
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
              <option value="EARLY_LEAVE">Early Leave</option>
              <option value="HALF_DAY">Half Day</option>
            </select>
            <button 
              className="btn btn-outline btn-md"
              onClick={() => {
                setSearchTerm('')
                setDateFilter(new Date().toISOString().split('T')[0])
                setStatusFilter('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">My Attendance Records</h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading attendance records...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading attendance records</p>
            </div>
          ) : !attendanceData?.data?.attendances?.length ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
              <p className="text-gray-600">Your attendance records will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Selfies
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Working Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.data.attendances.map((attendance: any) => (
                    <tr key={attendance.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(attendance.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            attendance.status === 'PRESENT' 
                              ? 'bg-green-100 text-green-800'
                              : attendance.status === 'ABSENT'
                              ? 'bg-red-100 text-red-800'
                              : attendance.status === 'LATE'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {attendance.status}
                          </span>
                          {attendance.isRemote && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded">
                              <Home className="w-3 h-3" />
                              Remote
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {(attendance as any).checkInSelfie ? (
                            <div className="flex flex-col items-center">
                              <img 
                                src={(attendance as any).checkInSelfie} 
                                alt="Check-In" 
                                className="w-16 h-16 object-cover rounded-lg border-2 border-green-500 cursor-pointer hover:scale-110 transition-transform shadow-md"
                                onClick={() => window.open((attendance as any).checkInSelfie, '_blank')}
                                title="Click to view check-in selfie"
                              />
                              <span className="text-xs text-green-700 mt-1">🌅 In</span>
                            </div>
                          ) : null}
                          {(attendance as any).checkOutSelfie ? (
                            <div className="flex flex-col items-center">
                              <img 
                                src={(attendance as any).checkOutSelfie} 
                                alt="Check-Out" 
                                className="w-16 h-16 object-cover rounded-lg border-2 border-orange-500 cursor-pointer hover:scale-110 transition-transform shadow-md"
                                onClick={() => window.open((attendance as any).checkOutSelfie, '_blank')}
                                title="Click to view check-out selfie"
                              />
                              <span className="text-xs text-orange-700 mt-1">🌆 Out</span>
                            </div>
                          ) : null}
                          {!(attendance as any).checkInSelfie && !(attendance as any).checkOutSelfie && (
                            <span className="text-gray-400 text-xs">No photos</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {attendance.location ? (
                          <a
                            href={`https://www.google.com/maps?q=${attendance.location.latitude},${attendance.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            title={attendance.location.address}
                          >
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs">View Map</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">No location</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-col gap-1">
                          {attendance.totalHours && (
                            <div className="text-sm font-medium text-gray-900">
                              ⏱️ Total: {attendance.totalHours}h
                            </div>
                          )}
                          {(attendance as any).regularHours && (
                            <div className="text-xs text-blue-600">
                              📊 Regular: {(attendance as any).regularHours}h
                            </div>
                          )}
                          {(attendance as any).overtimeHours && (attendance as any).overtimeHours > 0 && (
                            <div className="text-xs text-orange-600 font-medium">
                              ⏰ OT: +{(attendance as any).overtimeHours}h
                            </div>
                          )}
                          {(attendance as any).breakHours && (attendance as any).breakHours > 0 && (
                            <div className="text-xs text-gray-500">
                              🍽️ Break: {(attendance as any).breakHours}h
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-col gap-1">
                          {attendance.shift && (
                            <span className="text-xs text-purple-600">
                              🔄 {attendance.shift.name}
                            </span>
                          )}
                          {attendance.notes && (
                            <span className="text-xs text-gray-600" title={attendance.notes}>
                              📝 {attendance.notes.substring(0, 20)}{attendance.notes.length > 20 ? '...' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyAttendance

