import React, { useState } from 'react'
import { Clock, Search, Filter, CheckCircle, XCircle, MapPin, Home } from 'lucide-react'
import { useQuery } from 'react-query'
import { attendanceService } from '../services/attendanceService'
import { useAuth } from '../hooks/useAuth'

const MyAttendance: React.FC = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('')

  // Fetch my attendance records
  const { data: attendanceData, isLoading, error } = useQuery(
    ['my-attendance', searchTerm, dateFilter, statusFilter],
    () => attendanceService.getAttendance({
      employeeId: user?.employeeId,
      startDate: dateFilter,
      endDate: dateFilter,
      status: statusFilter
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600">View your attendance records and history</p>
        </div>
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
