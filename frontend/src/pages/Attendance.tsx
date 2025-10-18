import React, { useState } from 'react'
import { Clock, Plus, Search, Filter, CheckCircle, XCircle, Edit, Trash2, Eye } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { attendanceService } from '../services/attendanceService'
import { employeeService } from '../services/employeeService'
import type { Attendance } from '../types'
import toast from 'react-hot-toast'

const Attendance: React.FC = () => {
  const [showMarkModal, setShowMarkModal] = useState(false)
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
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
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
}> = ({ onClose, onSuccess, employees }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'PRESENT',
    notes: ''
  })

  const markAttendanceMutation = useMutation(attendanceService.markAttendance, {
    onSuccess: () => {
      toast.success('Attendance marked successfully!')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark attendance')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    markAttendanceMutation.mutate(formData)
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
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Optional notes..."
            />
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
    </div>
  )
}

export default Attendance
