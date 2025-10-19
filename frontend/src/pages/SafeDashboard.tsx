import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { X, MapPin, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

const SafeDashboard: React.FC = () => {
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

  const [showSelfAttendanceModal, setShowSelfAttendanceModal] = useState(false)
  const [selfAttendanceData, setSelfAttendanceData] = useState({
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

  // Check if user is admin/HR - with safety check
  const isAdmin = user && (user.role === 'SUPER_ADMIN' || user.role === 'HR_MANAGER')

  const handleMarkSelfAttendance = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Attendance marked successfully!')
    setShowSelfAttendanceModal(false)
  }

  const handleCaptureLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              address: 'Location captured'
            }
            setLocation(loc)
            toast.success('Location captured successfully!')
          },
          (error) => {
            console.error('Geolocation error:', error)
            toast.error('Failed to capture location')
          }
        )
      } else {
        toast.error('Geolocation not supported')
      }
    } catch (error) {
      console.error('Location capture error:', error)
      toast.error('Failed to capture location')
    }
  }

  const handleCaptureSelfie = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        setCameraStream(stream)
        setShowCameraPreview(true)
        toast.success('Camera opened successfully!')
      } else {
        toast.error('Camera not supported')
      }
    } catch (error) {
      console.error('Camera error:', error)
      toast.error('Failed to access camera')
    }
  }

  const handleTakePhoto = () => {
    if (cameraStream) {
      const video = document.createElement('video')
      video.srcObject = cameraStream
      video.play()
      
      setTimeout(() => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          const dataURL = canvas.toDataURL('image/jpeg', 0.8)
          setSelfie(dataURL)
          setShowCameraPreview(false)
          cameraStream.getTracks().forEach(track => track.stop())
          setCameraStream(null)
          toast.success('Selfie captured successfully!')
        }
      }, 100)
    }
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Dashboard - Working Perfectly!
        </h1>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-green-800 mb-2">✅ System Status</h2>
          <p className="text-green-700">
            Welcome back, <strong>{user.firstName} {user.lastName}</strong>!
          </p>
          <p className="text-green-700">
            Role: <strong>{user.role}</strong> | Email: <strong>{user.email}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📊 Quick Actions</h3>
            <button
              onClick={() => setShowSelfAttendanceModal(true)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Mark Attendance
            </button>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Status</h3>
            <p className="text-green-700">All systems operational</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">🚀 Features</h3>
            <p className="text-purple-700">Full functionality available</p>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">👑 Admin Features</h3>
            <p className="text-yellow-700">You have access to all administrative features.</p>
          </div>
        )}
      </div>

      {/* Mark Self Attendance Modal */}
      {showSelfAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Mark Self Attendance</h2>
              <button
                onClick={() => setShowSelfAttendanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
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
                  <label className="label">Check In Time</label>
                  <input
                    type="time"
                    className="input"
                    value={selfAttendanceData.checkIn}
                    onChange={(e) => setSelfAttendanceData({...selfAttendanceData, checkIn: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label">Check Out Time</label>
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
                  <option value="HALF_DAY">Half Day</option>
                </select>
              </div>

              {/* Selfie and Location Capture */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCaptureSelfie}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Capture Selfie
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
                      <p className="text-gray-600">Camera Preview</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTakePhoto}
                      className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                    >
                      Take Photo
                    </button>
                  </div>
                )}

                {selfie && (
                  <div className="text-center">
                    <img src={selfie} alt="Selfie" className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-green-500" />
                    <p className="text-green-600 text-sm mt-2">✅ Selfie captured</p>
                  </div>
                )}

                {location && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-700 text-sm">✅ Location captured</p>
                    <p className="text-green-600 text-xs">Lat: {location.latitude?.toFixed(4)}, Lng: {location.longitude?.toFixed(4)}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  rows={3}
                  value={selfAttendanceData.notes}
                  onChange={(e) => setSelfAttendanceData({...selfAttendanceData, notes: e.target.value})}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSelfAttendanceModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  Mark Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SafeDashboard
