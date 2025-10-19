import React, { useState } from 'react'
import { Clock, Plus, Search, Filter, CheckCircle, XCircle, Edit, Trash2, Eye, MapPin, Smartphone, Home, X, Camera, Upload } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { attendanceService } from '../services/attendanceService'
import { employeeService } from '../services/employeeService'
import { shiftService } from '../services/shiftService'
import type { Attendance } from '../types'
import toast from 'react-hot-toast'
import { getCompleteLocation, getDeviceInfo } from '../utils/geolocation'
import { captureSelfie, selectImageFile, compressImage } from '../utils/camera'
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
  const { data: attendanceData, isLoading, error } = useQuery(
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
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">Track employee attendance and working hours</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowMarkModal(true)}
            className="btn btn-primary btn-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Present Today</p>
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
              <p className="text-sm font-medium text-gray-600">Absent Today</p>
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
              <p className="text-sm font-medium text-gray-600">Late Today</p>
              <p className="text-xl font-bold text-gray-900">
                {attendanceData?.data?.attendances?.filter((att: any) => att.status === 'LATE').length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {attendanceData?.data?.attendances?.length ? 
                  `${Math.round((attendanceData.data.attendances.filter((att: any) => att.status === 'PRESENT').length / attendanceData.data.attendances.length) * 100)}%` : '0%'}
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
          <h3 className="text-lg font-medium text-gray-900">Today's Attendance</h3>
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
              <p className="text-gray-600 mb-4">Start tracking attendance by marking check-ins</p>
              <button 
                onClick={() => setShowMarkModal(true)}
                className="btn btn-primary btn-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Mark Attendance
              </button>
            </div>
          ) : (
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
                      Check In/Out
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
                  {attendanceData.data.attendances.map((attendance: Attendance) => (
                    <tr key={attendance.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {attendance.employee?.user?.firstName?.charAt(0)}{attendance.employee?.user?.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {attendance.employee?.user?.firstName} {attendance.employee?.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{attendance.employee?.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(attendance.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-col gap-1">
                          <span>{attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span>
                          <span className="text-gray-500">{attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span>
                        </div>
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
                          {(attendance as any).isRemote && (
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
                        {(attendance as any).location ? (
                          <a
                            href={`https://www.google.com/maps?q=${(attendance as any).location.latitude},${(attendance as any).location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            title={(attendance as any).location.address}
                          >
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs">Map</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
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
                          {(attendance as any).shift && (
                            <span className="text-xs text-purple-600">
                              🔄 {(attendance as any).shift.name}
                            </span>
                          )}
                          {attendance.notes && (
                            <span className="text-xs text-gray-600" title={attendance.notes}>
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
          )}
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
    </div>
  )
}

// Mark Attendance Modal Component
const MarkAttendanceModal: React.FC<{
  onClose: () => void
  onSuccess: () => void
  employees: any[]
  shifts: any[]
}> = ({ onClose, onSuccess, employees, shifts }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'PRESENT',
    notes: '',
    shiftId: '',
    isRemote: false,
    overtimeHours: ''
  })
  const [location, setLocation] = useState<any>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [isCapturingSelfie, setIsCapturingSelfie] = useState(false)

  const markAttendanceMutation = useMutation(attendanceService.markAttendance, {
    onSuccess: () => {
      toast.success('Attendance marked successfully!')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark attendance')
    }
  })

  const handleGetLocation = async () => {
    setIsGettingLocation(true)
    try {
      const loc = await getCompleteLocation()
      setLocation(loc)
      toast.success('📍 Location captured successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to get location')
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleCaptureSelfie = async () => {
    setIsCapturingSelfie(true)
    try {
      const photo = await captureSelfie()
      const compressed = await compressImage(photo, 800)
      setSelfie(compressed)
      toast.success('📸 Selfie captured successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to capture selfie')
    } finally {
      setIsCapturingSelfie(false)
    }
  }

  const handleUploadSelfie = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const imageData = await selectImageFile(file)
      const compressed = await compressImage(imageData, 800)
      setSelfie(compressed)
      toast.success('📸 Photo uploaded successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Get device info
    const deviceInfo = getDeviceInfo()
    
    // Combine date and time for checkIn and checkOut
    const submitData: any = {
      employeeId: formData.employeeId,
      date: formData.date,
      status: formData.status,
      notes: formData.notes || undefined,
      shiftId: formData.shiftId || undefined,
      isRemote: formData.isRemote,
      overtimeHours: formData.overtimeHours ? parseFloat(formData.overtimeHours) : undefined,
      location: location || undefined,
      deviceInfo,
      selfieUrl: selfie || undefined
    }
    
    // Convert time to ISO datetime if provided
    if (formData.checkIn) {
      submitData.checkIn = new Date(`${formData.date}T${formData.checkIn}`).toISOString()
    }
    
    if (formData.checkOut) {
      submitData.checkOut = new Date(`${formData.date}T${formData.checkOut}`).toISOString()
    }
    
    markAttendanceMutation.mutate(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Employee *</label>
            <select
              className="input"
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.user?.firstName} {employee.user?.lastName} ({employee.user?.email})
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
              <option value="EARLY_LEAVE">Early Leave</option>
              <option value="HALF_DAY">Half Day</option>
            </select>
          </div>

          {/* Phase 2: Shift Selection */}
          <div>
            <label className="label">Shift (Optional)</label>
            <select
              className="input"
              value={formData.shiftId}
              onChange={(e) => setFormData({...formData, shiftId: e.target.value})}
            >
              <option value="">No Shift</option>
              {shifts.map((shift: any) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* Phase 2: GPS Location */}
          <div>
            <label className="label">Location (Optional)</label>
            {location ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                <MapPin className="w-4 h-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Location Captured</p>
                  <p className="text-xs text-green-700">{location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocation(null)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50"
              >
                <MapPin className="w-4 h-4" />
                {isGettingLocation ? 'Getting Location...' : 'Capture GPS Location'}
              </button>
            )}
          </div>

          {/* Phase 2: Selfie Capture */}
          <div>
            <label className="label">Selfie/Photo (Optional)</label>
            {selfie ? (
              <div className="space-y-2">
                <div className="relative">
                  <img 
                    src={selfie} 
                    alt="Attendance Selfie" 
                    className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setSelfie(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-green-700 text-center">✅ Photo captured successfully</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCaptureSelfie}
                  disabled={isCapturingSelfie}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {isCapturingSelfie ? 'Opening...' : 'Take Photo'}
                </button>
                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-100 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadSelfie}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

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

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-md"
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

      {/* Attendance Verification Modal */}
      {showVerificationModal && selectedAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-6 h-6 text-green-600" />
                Attendance Verification
              </h2>
              <button
                onClick={closeVerificationModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Employee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-blue-700">Employee Name</label>
                    <p className="text-blue-900 font-semibold">{selectedAttendance.employee?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-700">Employee ID</label>
                    <p className="text-blue-900">{selectedAttendance.employee?.employeeId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-700">Department</label>
                    <p className="text-blue-900">{selectedAttendance.employee?.department || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Attendance Details */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Attendance Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-green-700">Date</label>
                    <p className="text-green-900 font-semibold">{new Date(selectedAttendance.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedAttendance.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                      selectedAttendance.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                      selectedAttendance.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedAttendance.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-700">Check In</label>
                    <p className="text-green-900">{selectedAttendance.checkIn ? new Date(selectedAttendance.checkIn).toLocaleString() : 'Not recorded'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-700">Check Out</label>
                    <p className="text-green-900">{selectedAttendance.checkOut ? new Date(selectedAttendance.checkOut).toLocaleString() : 'Not recorded'}</p>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              {selectedAttendance.totalHours && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">Working Hours Analysis</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{selectedAttendance.totalHours}h</div>
                      <div className="text-sm text-purple-700">Total Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{(selectedAttendance as any).regularHours || 0}h</div>
                      <div className="text-sm text-blue-700">Regular Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{(selectedAttendance as any).overtimeHours || 0}h</div>
                      <div className="text-sm text-orange-700">Overtime Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{(selectedAttendance as any).breakHours || 0}h</div>
                      <div className="text-sm text-gray-700">Break Hours</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selfies Section */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">Employee Selfies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Check-in Selfie */}
                  <div>
                    <h4 className="text-md font-medium text-yellow-800 mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Check-In Selfie
                    </h4>
                    {(selectedAttendance as any).checkInSelfie ? (
                      <div className="relative">
                        <img 
                          src={(selectedAttendance as any).checkInSelfie} 
                          alt="Check-In Selfie" 
                          className="w-full h-64 object-cover rounded-lg border-2 border-green-500 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open((selectedAttendance as any).checkInSelfie, '_blank')}
                        />
                        <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                          🌅 Morning Check-In
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                          Click to enlarge
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <Camera className="w-8 h-8 mx-auto mb-2" />
                          <p>No check-in selfie</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Check-out Selfie */}
                  <div>
                    <h4 className="text-md font-medium text-yellow-800 mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Check-Out Selfie
                    </h4>
                    {(selectedAttendance as any).checkOutSelfie ? (
                      <div className="relative">
                        <img 
                          src={(selectedAttendance as any).checkOutSelfie} 
                          alt="Check-Out Selfie" 
                          className="w-full h-64 object-cover rounded-lg border-2 border-orange-500 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open((selectedAttendance as any).checkOutSelfie, '_blank')}
                        />
                        <div className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">
                          🌆 Evening Check-Out
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                          Click to enlarge
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <Camera className="w-8 h-8 mx-auto mb-2" />
                          <p>No check-out selfie</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3">Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Check-in Location */}
                  <div>
                    <h4 className="text-md font-medium text-indigo-800 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Check-In Location
                    </h4>
                    {(selectedAttendance as any).checkInLocation ? (
                      <div className="p-3 bg-white rounded-lg border border-indigo-200">
                        <p className="text-sm text-indigo-900 font-medium">
                          {(selectedAttendance as any).checkInLocation.address || 'Location captured'}
                        </p>
                        <p className="text-xs text-indigo-700 mt-1">
                          📍 {(selectedAttendance as any).checkInLocation.latitude?.toFixed(6)}, {(selectedAttendance as any).checkInLocation.longitude?.toFixed(6)}
                        </p>
                        <p className="text-xs text-indigo-700">
                          🎯 Accuracy: ±{(selectedAttendance as any).checkInLocation.accuracy?.toFixed(0)}m
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">No check-in location recorded</p>
                      </div>
                    )}
                  </div>

                  {/* Check-out Location */}
                  <div>
                    <h4 className="text-md font-medium text-indigo-800 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Check-Out Location
                    </h4>
                    {(selectedAttendance as any).checkOutLocation ? (
                      <div className="p-3 bg-white rounded-lg border border-indigo-200">
                        <p className="text-sm text-indigo-900 font-medium">
                          {(selectedAttendance as any).checkOutLocation.address || 'Location captured'}
                        </p>
                        <p className="text-xs text-indigo-700 mt-1">
                          📍 {(selectedAttendance as any).checkOutLocation.latitude?.toFixed(6)}, {(selectedAttendance as any).checkOutLocation.longitude?.toFixed(6)}
                        </p>
                        <p className="text-xs text-indigo-700">
                          🎯 Accuracy: ±{(selectedAttendance as any).checkOutLocation.accuracy?.toFixed(0)}m
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">No check-out location recorded</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Device Information */}
              {(selectedAttendance as any).deviceInfo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Device Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Device Type</label>
                      <p className="text-gray-900">{(selectedAttendance as any).deviceInfo.deviceType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Operating System</label>
                      <p className="text-gray-900">{(selectedAttendance as any).deviceInfo.os || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Browser</label>
                      <p className="text-gray-900">{(selectedAttendance as any).deviceInfo.browser || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">IP Address</label>
                      <p className="text-gray-900">{(selectedAttendance as any).ipAddress || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-900 mb-3">Additional Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-orange-700">Remote Work</label>
                    <p className="text-orange-900">
                      {selectedAttendance.isRemote ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          <Home className="w-3 h-3 mr-1" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          <Smartphone className="w-3 h-3 mr-1" />
                          No
                        </span>
                      )}
                    </p>
                  </div>
                  {selectedAttendance.notes && (
                    <div>
                      <label className="text-sm font-medium text-orange-700">Notes</label>
                      <p className="text-orange-900 bg-white p-2 rounded border">{selectedAttendance.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={closeVerificationModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Add verification action here
                  toast.success('Attendance verified successfully!')
                  closeVerificationModal()
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ Mark as Verified
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Attendance Verification Modal */}
    <AttendanceVerificationModal
      isOpen={showVerificationModal}
      onClose={closeVerificationModal}
      attendance={selectedAttendance}
    />
    </>
  )
}

export default Attendance
