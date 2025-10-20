import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Home } from 'lucide-react'
import { attendanceService } from '../services/attendanceService'
import { employeeService } from '../services/employeeService'
import toast from 'react-hot-toast'
import { getCompleteLocation, getDeviceInfo } from '../utils/geolocation'
import { captureSelfie, compressImage } from '../utils/camera'

const AttendanceCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [showMarkModal, setShowMarkModal] = useState(false)
  const [markFormData, setMarkFormData] = useState({
    checkIn: '',
    checkOut: '',
    status: 'PRESENT',
    notes: '',
    isRemote: false
  })
  const [selfie, setSelfie] = useState<string | null>(null)
  const [location, setLocation] = useState<any>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const queryClient = useQueryClient()

  // Fetch employees
  const { data: employeesData } = useQuery(
    'employees',
    () => employeeService.getEmployees({ page: 1, limit: 1000 })
  )

  // Fetch attendance for selected date
  const { data: attendanceData, isLoading } = useQuery(
    ['attendance-calendar', selectedDate.toISOString().split('T')[0]],
    () => attendanceService.getAttendance({
      startDate: selectedDate.toISOString().split('T')[0],
      endDate: selectedDate.toISOString().split('T')[0]
    })
  )

  // Mark attendance mutation
  const markAttendanceMutation = useMutation(attendanceService.markAttendance, {
    onSuccess: () => {
      queryClient.invalidateQueries('attendance-calendar')
      toast.success('Attendance marked successfully!')
      setShowMarkModal(false)
      setSelfie(null)
      setLocation(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark attendance')
    }
  })

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  // Handle employee selection
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId)
    setShowMarkModal(true)
  }

  // Handle selfie capture
  const handleCaptureSelfie = async () => {
    setIsCapturing(true)
    try {
      const photo = await captureSelfie()
      const compressed = await compressImage(photo)
      setSelfie(compressed)
      toast.success('📸 Selfie captured successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to capture selfie')
    } finally {
      setIsCapturing(false)
    }
  }

  // Handle location capture
  const handleCaptureLocation = async () => {
    try {
      const loc = await getCompleteLocation()
      setLocation(loc)
      toast.success('📍 Location captured successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to get location')
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedEmployee) {
      toast.error('Please select an employee')
      return
    }

    const attendanceData = {
      employeeId: selectedEmployee,
      date: selectedDate.toISOString().split('T')[0],
      checkIn: markFormData.checkIn || undefined,
      checkOut: markFormData.checkOut || undefined,
      status: markFormData.status as any,
      notes: markFormData.notes || undefined,
      isRemote: markFormData.isRemote,
      checkInSelfie: selfie || undefined,
      checkInLocation: location || undefined,
      deviceInfo: getDeviceInfo() || undefined
    }

    markAttendanceMutation.mutate(attendanceData)
  }

  // Get attendance status for employee on selected date
  const getEmployeeAttendanceStatus = (employeeId: string) => {
    const attendance = attendanceData?.data?.attendances?.find(
      (att: any) => att.employeeId === employeeId && 
      new Date(att.date).toDateString() === selectedDate.toDateString()
    )
    return attendance
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800 border-green-200'
      case 'LATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ABSENT': return 'bg-red-100 text-red-800 border-red-200'
      case 'HALF_DAY': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EARLY_LEAVE': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return <CheckCircle className="w-4 h-4" />
      case 'LATE': return <Clock className="w-4 h-4" />
      case 'ABSENT': return <XCircle className="w-4 h-4" />
      case 'HALF_DAY': return <AlertCircle className="w-4 h-4" />
      case 'EARLY_LEAVE': return <Home className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Calendar</h1>
          <p className="text-gray-600">Mark attendance for any employee on any date</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Selected: {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Calendar and Employee Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Picker */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Date
          </h3>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => handleDateChange(new Date(e.target.value))}
            className="w-full input"
          />
        </div>

        {/* Employee Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Select Employee
          </h3>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full input"
          >
            <option value="">Choose an employee...</option>
            {employeesData?.data?.employees?.map((employee: any) => (
              <option key={employee.id} value={employee.id}>
                {employee.user.firstName} {employee.user.lastName} - {employee.employeeId}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="w-full btn btn-outline btn-sm"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(new Date(Date.now() - 24 * 60 * 60 * 1000))}
              className="w-full btn btn-outline btn-sm"
            >
              Yesterday
            </button>
            <button
              onClick={() => setSelectedDate(new Date(Date.now() + 24 * 60 * 60 * 1000))}
              className="w-full btn btn-outline btn-sm"
            >
              Tomorrow
            </button>
          </div>
        </div>
      </div>

      {/* Employee Attendance Status */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Employee Attendance Status - {selectedDate.toLocaleDateString()}
          </h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading attendance data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employeesData?.data?.employees?.map((employee: any) => {
                const attendance = getEmployeeAttendanceStatus(employee.id)
                return (
                  <div
                    key={employee.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      attendance 
                        ? getStatusColor(attendance.status)
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleEmployeeSelect(employee.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {employee.user.firstName} {employee.user.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{employee.employeeId}</p>
                        <p className="text-xs text-gray-500">{employee.department}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {attendance ? (
                          <>
                            {getStatusIcon(attendance.status)}
                            <span className="text-sm font-medium">
                              {attendance.status.replace('_', ' ')}
                            </span>
                          </>
                        ) : (
                          <div className="text-gray-400">
                            <XCircle className="w-5 h-5" />
                            <span className="text-xs">Not Marked</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {attendance && (
                      <div className="mt-2 text-xs text-gray-600">
                        {attendance.checkIn && (
                          <div>In: {new Date(attendance.checkIn).toLocaleTimeString()}</div>
                        )}
                        {attendance.checkOut && (
                          <div>Out: {new Date(attendance.checkOut).toLocaleTimeString()}</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
                <p className="text-gray-600">
                  {employeesData?.data?.employees?.find((emp: any) => emp.id === selectedEmployee)?.user?.firstName} {' '}
                  {employeesData?.data?.employees?.find((emp: any) => emp.id === selectedEmployee)?.user?.lastName} - {' '}
                  {selectedDate.toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setShowMarkModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Check-in Time */}
                <div>
                  <label className="label">Check-in Time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={markFormData.checkIn}
                    onChange={(e) => setMarkFormData({...markFormData, checkIn: e.target.value})}
                  />
                </div>

                {/* Check-out Time */}
                <div>
                  <label className="label">Check-out Time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={markFormData.checkOut}
                    onChange={(e) => setMarkFormData({...markFormData, checkOut: e.target.value})}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="label">Status</label>
                  <select
                    className="input"
                    value={markFormData.status}
                    onChange={(e) => setMarkFormData({...markFormData, status: e.target.value})}
                    required
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="EARLY_LEAVE">Early Leave</option>
                  </select>
                </div>

                {/* Remote Work */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRemote"
                    checked={markFormData.isRemote}
                    onChange={(e) => setMarkFormData({...markFormData, isRemote: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isRemote" className="ml-2 text-sm text-gray-700">
                    🏠 Remote Work
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  rows={3}
                  value={markFormData.notes}
                  onChange={(e) => setMarkFormData({...markFormData, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Selfie and Location Capture */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Selfie (Optional)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCaptureSelfie}
                      disabled={isCapturing}
                      className="btn btn-outline btn-sm"
                    >
                      {isCapturing ? 'Capturing...' : '📸 Capture Selfie'}
                    </button>
                    {selfie && (
                      <div className="text-green-600 text-sm">✓ Captured</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">Location (Optional)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCaptureLocation}
                      className="btn btn-outline btn-sm"
                    >
                      📍 Capture Location
                    </button>
                    {location && (
                      <div className="text-green-600 text-sm">✓ Captured</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowMarkModal(false)}
                  className="btn btn-outline btn-md"
                  disabled={markAttendanceMutation.isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-md"
                  disabled={markAttendanceMutation.isLoading}
                >
                  {markAttendanceMutation.isLoading ? 'Marking...' : 'Mark Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AttendanceCalendar
