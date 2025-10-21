import React, { useState } from 'react'
import { Calendar, Plus, Search, Filter, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { leaveService } from '../services/leaveService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const MyLeave: React.FC = () => {
  const { user } = useAuth()
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const queryClient = useQueryClient()

  // Fetch my leave requests
  const { data: leaveData, isLoading, error } = useQuery(
    ['my-leave-requests', searchTerm, statusFilter, typeFilter],
    () => leaveService.getLeaveRequests({
      employeeId: user?.employeeId,
      status: statusFilter,
      leaveType: typeFilter
    })
  )

  // Cancel leave request mutation
  const cancelLeaveMutation = useMutation(leaveService.cancelLeaveRequest, {
    onSuccess: () => {
      queryClient.invalidateQueries('my-leave-requests')
      toast.success('Leave request cancelled successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel leave request')
    }
  })

  const handleCancelLeave = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      cancelLeaveMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
          <p className="text-gray-600">Manage your leave requests and history</p>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="btn btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Leave
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {leaveData?.data?.leaveRequests?.filter((leave: any) => leave.status === 'PENDING').length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-xl font-bold text-gray-900">
                {leaveData?.data?.leaveRequests?.filter((leave: any) => leave.status === 'APPROVED').length || 0}
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
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-xl font-bold text-gray-900">
                {leaveData?.data?.leaveRequests?.filter((leave: any) => leave.status === 'REJECTED').length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">
                {leaveData?.data?.leaveRequests?.length || 0}
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
                placeholder="Search leave requests..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select 
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select 
              className="input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="SICK_LEAVE">Sick Leave</option>
              <option value="VACATION">Vacation</option>
              <option value="PERSONAL_LEAVE">Personal Leave</option>
              <option value="EMERGENCY_LEAVE">Emergency Leave</option>
              <option value="MATERNITY_LEAVE">Maternity Leave</option>
              <option value="PATERNITY_LEAVE">Paternity Leave</option>
            </select>
            <button 
              className="btn btn-outline btn-md"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setTypeFilter('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">My Leave Requests</h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading leave requests...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading leave requests</p>
            </div>
          ) : !leaveData?.data?.leaveRequests?.length ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests found</h3>
              <p className="text-gray-600 mb-4">Start by creating a new leave request</p>
              <button 
                onClick={() => setShowRequestModal(true)}
                className="btn btn-primary btn-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Leave
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days
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
                  {leaveData.data.leaveRequests.map((leave: any) => (
                    <tr key={leave.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.leaveType.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(leave.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          leave.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-800'
                            : leave.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : leave.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {leave.status === 'PENDING' && (
                          <button 
                            onClick={() => handleCancelLeave(leave.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel Leave Request"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Request Leave Modal */}
      {showRequestModal && (
        <RequestLeaveModal 
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false)
            queryClient.invalidateQueries('my-leave-requests')
          }}
        />
      )}
    </div>
  )
}

// Request Leave Modal Component
const RequestLeaveModal: React.FC<{
  onClose: () => void
  onSuccess: () => void
}> = ({ onClose, onSuccess }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    leaveType: 'SICK_LEAVE',
    startDate: '',
    endDate: '',
    reason: ''
  })

  const requestLeaveMutation = useMutation(leaveService.createLeaveRequest, {
    onSuccess: () => {
      toast.success('Leave request submitted successfully!')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit leave request')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (user?.employeeId) {
      requestLeaveMutation.mutate({
        employeeId: user.employeeId,
        ...formData
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Request Leave</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Leave Type *</label>
            <select
              className="input"
              value={formData.leaveType}
              onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
              required
            >
              <option value="SICK_LEAVE">Sick Leave</option>
              <option value="VACATION">Vacation</option>
              <option value="PERSONAL_LEAVE">Personal Leave</option>
              <option value="EMERGENCY_LEAVE">Emergency Leave</option>
              <option value="MATERNITY_LEAVE">Maternity Leave</option>
              <option value="PATERNITY_LEAVE">Paternity Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                className="input"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input
                type="date"
                className="input"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Reason *</label>
            <textarea
              className="input"
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              placeholder="Please provide a reason for your leave request..."
              required
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
              disabled={requestLeaveMutation.isLoading}
              className="btn btn-primary btn-md"
            >
              {requestLeaveMutation.isLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MyLeave
