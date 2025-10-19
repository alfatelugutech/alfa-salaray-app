import React, { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, MapPin, Smartphone, Home, X, Camera, RefreshCw } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { attendanceService } from '../services/attendanceService'
import { employeeService } from '../services/employeeService'
import { shiftService } from '../services/shiftService'
import type { Attendance } from '../types'
import toast from 'react-hot-toast'
import { getCompleteLocation, getDeviceInfo } from '../utils/geolocation'
import { captureSelfie, compressImage } from '../utils/camera'
import AttendanceVerificationModal from '../components/AttendanceVerificationModal'

const Attendance: React.FC = () => {
  const [showMarkModal, setShowMarkModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('')
  const queryClient = useQueryClient()

  // Fetch attendance records
  const { data: attendanceData, refetch: refetchAttendance } = useQuery(
    ['attendance', searchTerm, dateFilter, statusFilter],
    () => attendanceService.getAttendance({
      startDate: dateFilter,
      endDate: dateFilter,
      status: statusFilter
    })
  )

  // Fetch employees for marking attendance
  const { data: employeesData } = useQuery(
    'employees',
    () => employeeService.getEmployees()
  )

  // Fetch shifts for shift selection
  const { data: shiftsData } = useQuery(
    'shifts',
    () => shiftService.getShifts()
  )

  // Delete attendance mutation
  const deleteAttendanceMutation = useMutation(attendanceService.deleteAttendance, {
    onSuccess: () => {
      queryClient.invalidateQueries('attendance')
      toast.success('Attendance record deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete attendance record')
    }
  })

  // Open verification modal
  const openVerificationModal = (attendance: any) => {
    setSelectedAttendance(attendance)
    setShowVerificationModal(true)
  }

  // Close verification modal
  const closeVerificationModal = () => {
    setShowVerificationModal(false)
    setSelectedAttendance(null)
  }

  const handleDeleteAttendance = (id: string) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      deleteAttendanceMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">Track employee attendance and working hours</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              refetchAttendance()
              toast.success('Attendance data refreshed!')
            }}
            className="btn btn-secondary flex items-center gap-2"
            title="Refresh attendance data"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowMarkModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Search Employee</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn btn-secondary w-full">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData?.data?.attendances?.map((attendance: Attendance) => (
                <tr key={attendance.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {attendance.employee?.user?.firstName?.charAt(0) || 'E'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {attendance.employee?.user?.firstName} {attendance.employee?.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {attendance.employee?.user?.email || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(attendance.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      attendance.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                      attendance.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                      attendance.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {attendance.status}
                    </span>
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
                            title="Morning check-in selfie"
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
                            title="Evening check-out selfie"
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
                    <div className="flex flex-col gap-2">
                      {(attendance as any).checkInLocation && (
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center gap-1 mb-1">
                            <MapPin className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-green-700">Check-in Location</span>
                          </div>
                          <div className="text-xs text-green-800">
                            {(attendance as any).checkInLocation.address || 
                             `${(attendance as any).checkInLocation.latitude?.toFixed(4)}, ${(attendance as any).checkInLocation.longitude?.toFixed(4)}`}
                          </div>
                          {(attendance as any).checkInLocation.accuracy && (
                            <div className="text-xs text-green-600 mt-1">
                              ±{(attendance as any).checkInLocation.accuracy.toFixed(0)}m accuracy
                            </div>
                          )}
                        </div>
                      )}
                      {(attendance as any).checkOutLocation && (
                        <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                          <div className="flex items-center gap-1 mb-1">
                            <MapPin className="w-3 h-3 text-orange-600" />
                            <span className="text-xs font-medium text-orange-700">Check-out Location</span>
                          </div>
                          <div className="text-xs text-orange-800">
                            {(attendance as any).checkOutLocation.address || 
                             `${(attendance as any).checkOutLocation.latitude?.toFixed(4)}, ${(attendance as any).checkOutLocation.longitude?.toFixed(4)}`}
                          </div>
                          {(attendance as any).checkOutLocation.accuracy && (
                            <div className="text-xs text-orange-600 mt-1">
                              ±{(attendance as any).checkOutLocation.accuracy.toFixed(0)}m accuracy
                            </div>
                          )}
                        </div>
                      )}
                      {!(attendance as any).checkInLocation && !(attendance as any).checkOutLocation && (
                        <span className="text-gray-400 text-xs">No location data</span>
                      )}
                    </div>
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
                      {(attendance as any).isRemote && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          <Home className="w-3 h-3 mr-1" />
                          Remote
                        </span>
                      )}
                      {attendance.notes && (
                        <span className="text-xs text-gray-600">
                          📝 Note
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openVerificationModal(attendance)}
                        className="text-green-600 hover:text-green-900"
                        title="Verify Attendance Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAttendance(attendance.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <MarkAttendanceModal
          onClose={() => setShowMarkModal(false)}
          onSuccess={() => {
            setShowMarkModal(false)
            queryClient.invalidateQueries('attendance')
          }}
          employees={employeesData?.data?.employees || []}
          shifts={shiftsData?.data?.shifts || []}
        />
      )}

      {/* Attendance Verification Modal */}
      <AttendanceVerificationModal
        isOpen={showVerificationModal}
        onClose={closeVerificationModal}
        attendance={selectedAttendance}
      />
    </div>
  )
}

// Mark Attendance Modal Component
const MarkAttendanceModal: React.FC<{
  onClose: () => void
  onSuccess: () => void
  employees: any[]
  shifts: any[]
}> = ({ onClose, onSuccess, employees }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'PRESENT',
    notes: '',
    isRemote: false,
    overtimeHours: ''
  })
  const [location, setLocation] = useState<any>(null)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const markAttendanceMutation = useMutation(attendanceService.markAttendance, {
    onSuccess: () => {
      toast.success('Attendance marked successfully!')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark attendance')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Get device info
    const deviceInfo = getDeviceInfo()
    
    const submitData = {
      ...formData,
      checkIn: formData.checkIn ? new Date(`${formData.date}T${formData.checkIn}`).toISOString() : undefined,
      checkOut: formData.checkOut ? new Date(`${formData.date}T${formData.checkOut}`).toISOString() : undefined,
      overtimeHours: formData.overtimeHours ? parseFloat(formData.overtimeHours) : undefined,
      deviceInfo,
      selfieUrl: selfie,
      location: location
    }
    
    markAttendanceMutation.mutate(submitData)
  }

  const handleTakeSelfie = async () => {
    setIsCapturing(true)
    try {
      const photo = await captureSelfie()
      const compressed = await compressImage(photo, 800)
      setSelfie(compressed)
      toast.success('Selfie captured successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to capture selfie')
    }
    setIsCapturing(false)
  }

  const handleCaptureLocation = async () => {
    try {
      const loc = await getCompleteLocation()
      setLocation(loc)
      toast.success('Location captured successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to get location')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Mark Attendance</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Employee *</label>
            <select
              className="input"
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((employee: any) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date *</label>
            <input
              type="date"
              className="input"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Check In</label>
              <input
                type="time"
                className="input"
                value={formData.checkIn}
                onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
              />
            </div>
            <div>
              <label className="label">Check Out</label>
              <input
                type="time"
                className="input"
                value={formData.checkOut}
                onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="label">Status *</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              required
            >
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="EARLY_LEAVE">Early Leave</option>
            </select>
          </div>

          {/* Phase 2: Selfie & Location Capture */}
          {!selfie && !location ? (
            <div className="p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-400 rounded-xl shadow-md">
              <div className="text-center mb-6">
                <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">📸 Selfie & Location</h3>
                <p className="text-base text-gray-700">Capture selfie and location for verification</p>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleTakeSelfie}
                  disabled={isCapturing}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white text-xl font-bold rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transform transition hover:scale-105"
                >
                  {isCapturing ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6" />
                      📸 Take Selfie
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xl font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-xl transform transition hover:scale-105"
                >
                  <MapPin className="w-6 h-6" />
                  📍 Capture Location
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Show captured selfie */}
              {selfie && (
                <div>
                  <label className="label">Selfie ✅</label>
                  <div className="relative">
                    <img 
                      src={selfie} 
                      alt="Selfie" 
                      className="w-full h-80 object-cover rounded-xl border-4 border-green-500 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setSelfie(null)}
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
                  <label className="label">Location ✅</label>
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

          {/* Phase 2: Remote Work & Overtime */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRemoteAdmin"
                checked={formData.isRemote}
                onChange={(e) => setFormData({...formData, isRemote: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isRemoteAdmin" className="ml-2 text-sm text-gray-700">
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
                value={formData.overtimeHours}
                onChange={(e) => setFormData({...formData, overtimeHours: e.target.value})}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Optional notes..."
            />
          </div>

          {/* Device Info Display */}
          <div className="p-2 bg-gray-50 border border-gray-200 rounded">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Smartphone className="w-3 h-3" />
              <span>Device & IP info captured automatically</span>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={markAttendanceMutation.isLoading}
              className="btn btn-primary btn-md"
            >
              {markAttendanceMutation.isLoading ? 'Marking...' : 'Mark Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Attendance