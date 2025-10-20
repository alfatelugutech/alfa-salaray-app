import React, { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, MapPin, Smartphone, Home, X, Camera, RefreshCw, Globe, Monitor, Clock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { attendanceService } from '../services/attendanceService'
import { employeeService } from '../services/employeeService'
import { shiftService } from '../services/shiftService'
import type { Attendance } from '../types'
import toast from 'react-hot-toast'

const Attendance: React.FC = () => {
  const [showMarkModal, setShowMarkModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
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

  // Mark attendance mutation
  const markAttendanceMutation = useMutation(attendanceService.markAttendance, {
    onSuccess: () => {
      queryClient.invalidateQueries('attendance')
      toast.success('Attendance marked successfully')
      setShowMarkModal(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark attendance')
    }
  })

  const handleDeleteAttendance = (id: string) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      deleteAttendanceMutation.mutate(id)
    }
  }

  const handleViewDetails = (attendance: any) => {
    setSelectedAttendance(attendance)
    setShowDetailsModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800'
      case 'ABSENT': return 'bg-red-100 text-red-800'
      case 'LATE': return 'bg-yellow-100 text-yellow-800'
      case 'EARLY_LEAVE': return 'bg-orange-100 text-orange-800'
      case 'HALF_DAY': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDeviceInfo = (deviceInfo: any) => {
    if (!deviceInfo) return 'No device info'
    
    const parts = []
    if (deviceInfo.browser) parts.push(`Browser: ${deviceInfo.browser}`)
    if (deviceInfo.os) parts.push(`OS: ${deviceInfo.os}`)
    if (deviceInfo.device) parts.push(`Device: ${deviceInfo.device}`)
    if (deviceInfo.screenResolution) parts.push(`Screen: ${deviceInfo.screenResolution}`)
    
    return parts.join(', ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Manage employee attendance records</p>
        </div>
        <button
          onClick={() => setShowMarkModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Mark Attendance
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
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
              className="btn btn-outline"
              onClick={() => {
                setSearchTerm('')
                setDateFilter(new Date().toISOString().split('T')[0])
                setStatusFilter('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => refetchAttendance()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Attendance Records</h3>
        </div>
        <div className="p-6">
          {!attendanceData?.data?.attendances?.length ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
              <p className="text-gray-600">No attendance records found for the selected date</p>
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
                      Date & Times
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
                      Device Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.data.attendances.map((attendance: any) => (
                    <tr key={attendance.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {attendance.employee?.user?.firstName?.charAt(0)}{attendance.employee?.user?.lastName?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {attendance.employee?.user?.firstName} {attendance.employee?.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {attendance.employee?.user?.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {attendance.employee?.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(attendance.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(attendance.status)}`}>
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
                          {attendance.checkInSelfie && (
                            <div className="flex flex-col items-center">
                              <img 
                                src={attendance.checkInSelfie} 
                                alt="Check-In Selfie" 
                                className="w-12 h-12 object-cover rounded-lg border-2 border-green-500 cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => window.open(attendance.checkInSelfie, '_blank')}
                                title="Click to view check-in selfie"
                              />
                              <span className="text-xs text-green-700 mt-1">🌅 In</span>
                            </div>
                          )}
                          {attendance.checkOutSelfie && (
                            <div className="flex flex-col items-center">
                              <img 
                                src={attendance.checkOutSelfie} 
                                alt="Check-Out Selfie" 
                                className="w-12 h-12 object-cover rounded-lg border-2 border-orange-500 cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => window.open(attendance.checkOutSelfie, '_blank')}
                                title="Click to view check-out selfie"
                              />
                              <span className="text-xs text-orange-700 mt-1">🌆 Out</span>
                            </div>
                          )}
                          {!attendance.checkInSelfie && !attendance.checkOutSelfie && (
                            <span className="text-gray-400 text-xs">No photos</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {attendance.checkInLocation || attendance.checkOutLocation ? (
                          <div className="space-y-1">
                            {attendance.checkInLocation && (
                              <a
                                href={`https://www.google.com/maps?q=${attendance.checkInLocation.latitude},${attendance.checkInLocation.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                              >
                                <MapPin className="w-3 h-3" />
                                Check-In
                              </a>
                            )}
                            {attendance.checkOutLocation && (
                              <a
                                href={`https://www.google.com/maps?q=${attendance.checkOutLocation.latitude},${attendance.checkOutLocation.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-orange-600 hover:text-orange-800 text-xs"
                              >
                                <MapPin className="w-3 h-3" />
                                Check-Out
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No location</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          {attendance.deviceInfo && (
                            <>
                              <div className="flex items-center gap-1 text-xs">
                                <Monitor className="w-3 h-3 text-blue-500" />
                                <span>{attendance.deviceInfo.browser || 'Unknown Browser'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Smartphone className="w-3 h-3 text-green-500" />
                                <span>{attendance.deviceInfo.os || 'Unknown OS'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Globe className="w-3 h-3 text-purple-500" />
                                <span>{attendance.deviceInfo.ipAddress || 'Unknown IP'}</span>
                              </div>
                            </>
                          )}
                          {!attendance.deviceInfo && (
                            <span className="text-gray-400 text-xs">No device info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-col gap-1">
                          {attendance.totalHours && (
                            <div className="text-sm font-medium">
                              ⏱️ {attendance.totalHours}h
                            </div>
                          )}
                          {attendance.regularHours && (
                            <div className="text-xs text-blue-600">
                              Regular: {attendance.regularHours}h
                            </div>
                          )}
                          {attendance.overtimeHours && attendance.overtimeHours > 0 && (
                            <div className="text-xs text-orange-600 font-medium">
                              OT: +{attendance.overtimeHours}h
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(attendance)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttendance(attendance.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
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

      {/* Details Modal */}
      {showDetailsModal && selectedAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Attendance Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Employee Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedAttendance.employee?.user?.firstName} {selectedAttendance.employee?.user?.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedAttendance.employee?.user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employee ID:</span>
                      <span className="font-medium">{selectedAttendance.employee?.employeeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{selectedAttendance.employee?.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span className="font-medium">{selectedAttendance.employee?.position || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Attendance Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{new Date(selectedAttendance.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check In:</span>
                      <span className="font-medium">{selectedAttendance.checkIn ? new Date(selectedAttendance.checkIn).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check Out:</span>
                      <span className="font-medium">{selectedAttendance.checkOut ? new Date(selectedAttendance.checkOut).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAttendance.status)}`}>
                        {selectedAttendance.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remote Work:</span>
                      <span className="font-medium">{selectedAttendance.isRemote ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Information */}
              {selectedAttendance.deviceInfo && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Device & Browser Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Browser:</span>
                        <span className="font-medium">{selectedAttendance.deviceInfo.browser || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Operating System:</span>
                        <span className="font-medium">{selectedAttendance.deviceInfo.os || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Device Type:</span>
                        <span className="font-medium">{selectedAttendance.deviceInfo.device || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">IP Address:</span>
                        <span className="font-medium">{selectedAttendance.deviceInfo.ipAddress || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Screen Resolution:</span>
                        <span className="font-medium">{selectedAttendance.deviceInfo.screenResolution || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">User Agent:</span>
                        <span className="font-medium text-xs break-all">{selectedAttendance.deviceInfo.userAgent || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Information */}
              {(selectedAttendance.checkInLocation || selectedAttendance.checkOutLocation) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAttendance.checkInLocation && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-700">Check-In Location</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Latitude:</span>
                            <span className="font-medium">{selectedAttendance.checkInLocation.latitude?.toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Longitude:</span>
                            <span className="font-medium">{selectedAttendance.checkInLocation.longitude?.toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Accuracy:</span>
                            <span className="font-medium">±{selectedAttendance.checkInLocation.accuracy?.toFixed(0)}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Address:</span>
                            <span className="font-medium text-xs">{selectedAttendance.checkInLocation.address || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedAttendance.checkOutLocation && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-orange-700">Check-Out Location</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Latitude:</span>
                            <span className="font-medium">{selectedAttendance.checkOutLocation.latitude?.toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Longitude:</span>
                            <span className="font-medium">{selectedAttendance.checkOutLocation.longitude?.toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Accuracy:</span>
                            <span className="font-medium">±{selectedAttendance.checkOutLocation.accuracy?.toFixed(0)}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Address:</span>
                            <span className="font-medium text-xs">{selectedAttendance.checkOutLocation.address || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selfies */}
              {(selectedAttendance.checkInSelfie || selectedAttendance.checkOutSelfie) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Selfie Photos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAttendance.checkInSelfie && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-700">Check-In Selfie</h4>
                        <img 
                          src={selectedAttendance.checkInSelfie} 
                          alt="Check-In Selfie" 
                          className="w-full h-64 object-cover rounded-lg border-2 border-green-500 cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(selectedAttendance.checkInSelfie, '_blank')}
                        />
                      </div>
                    )}
                    {selectedAttendance.checkOutSelfie && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-orange-700">Check-Out Selfie</h4>
                        <img 
                          src={selectedAttendance.checkOutSelfie} 
                          alt="Check-Out Selfie" 
                          className="w-full h-64 object-cover rounded-lg border-2 border-orange-500 cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(selectedAttendance.checkOutSelfie, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Working Hours */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Working Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedAttendance.totalHours || 0}h</div>
                    <div className="text-sm text-gray-600">Total Hours</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedAttendance.regularHours || 0}h</div>
                    <div className="text-sm text-gray-600">Regular Hours</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{selectedAttendance.overtimeHours || 0}h</div>
                    <div className="text-sm text-gray-600">Overtime Hours</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedAttendance.notes && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{selectedAttendance.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Attendance