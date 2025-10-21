import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Users, Clock } from 'lucide-react'
import { shiftService } from '../services/shiftService'
import { employeeService } from '../services/employeeService'
import { Shift, CreateShiftData, AssignShiftData, Employee } from '../types'
import toast from 'react-hot-toast'

const ShiftManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('')

  const queryClient = useQueryClient()

  // Fetch shifts
  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts', searchTerm, activeFilter],
    queryFn: () => shiftService.getShifts({
      search: searchTerm,
      isActive: activeFilter,
      limit: 50
    })
  })

  // Fetch employees for assignment
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees({ limit: 100 })
  })

  // Create shift mutation
  const createShiftMutation = useMutation({
    mutationFn: shiftService.createShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      setShowCreateModal(false)
      toast.success('Shift created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create shift')
    }
  })

  // Update shift mutation
  const updateShiftMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateShiftData> }) =>
      shiftService.updateShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      setEditingShift(null)
      toast.success('Shift updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update shift')
    }
  })

  // Delete shift mutation
  const deleteShiftMutation = useMutation({
    mutationFn: shiftService.deleteShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      toast.success('Shift deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete shift')
    }
  })

  // Assign shift mutation
  const assignShiftMutation = useMutation({
    mutationFn: shiftService.assignShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      setShowAssignModal(false)
      toast.success('Shift assigned successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign shift')
    }
  })

  const handleCreateShift = (data: CreateShiftData) => {
    createShiftMutation.mutate(data)
  }

  const handleUpdateShift = (data: Partial<CreateShiftData>) => {
    if (editingShift) {
      updateShiftMutation.mutate({ id: editingShift.id, data })
    }
  }

  const handleDeleteShift = (id: string) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      deleteShiftMutation.mutate(id)
    }
  }

  const handleAssignShift = (data: AssignShiftData) => {
    assignShiftMutation.mutate(data)
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}:00`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (shiftsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
          <p className="text-gray-600">Manage work shifts and employee assignments</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn btn-secondary"
          >
            <Users className="w-4 h-4 mr-2" />
            Assign Shift
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Shift
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search shifts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">All Shifts</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shiftsData?.data.shifts?.map((shift) => (
          <div key={shift.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{shift.name}</h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingShift(shift)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteShift(shift.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Break Duration:</span>
                <span>{formatDuration(shift.breakDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  shift.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {shift.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Employees:</span>
                <span>{shift.employees?.length || 0}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedShift(shift)
                setShowAssignModal(true)
              }}
              className="w-full mt-4 btn btn-outline"
            >
              <Users className="w-4 h-4 mr-2" />
              Assign Employees
            </button>
          </div>
        ))}
      </div>

      {/* Create Shift Modal */}
      {showCreateModal && (
        <CreateShiftModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateShift}
          isLoading={createShiftMutation.isLoading}
        />
      )}

      {/* Edit Shift Modal */}
      {editingShift && (
        <EditShiftModal
          shift={editingShift}
          onClose={() => setEditingShift(null)}
          onSubmit={handleUpdateShift}
          isLoading={updateShiftMutation.isLoading}
        />
      )}

      {/* Assign Shift Modal */}
      {showAssignModal && (
        <AssignShiftModal
          shift={selectedShift}
          employees={employeesData?.data.employees || []}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedShift(null)
          }}
          onSubmit={handleAssignShift}
          isLoading={assignShiftMutation.isLoading}
        />
      )}
    </div>
  )
}

// Create Shift Modal Component
const CreateShiftModal: React.FC<{
  onClose: () => void
  onSubmit: (data: CreateShiftData) => void
  isLoading: boolean
}> = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CreateShiftData>({
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 60
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Shift</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Shift Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Break Duration (minutes)</label>
            <input
              type="number"
              value={formData.breakDuration}
              onChange={(e) => setFormData({ ...formData, breakDuration: Number(e.target.value) })}
              className="input"
              min="0"
              max="480"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Shift Modal Component
const EditShiftModal: React.FC<{
  shift: Shift
  onClose: () => void
  onSubmit: (data: Partial<CreateShiftData>) => void
  isLoading: boolean
}> = ({ shift, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<Partial<CreateShiftData>>({
    name: shift.name,
    startTime: shift.startTime,
    endTime: shift.endTime,
    breakDuration: shift.breakDuration
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Shift</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Shift Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Break Duration (minutes)</label>
            <input
              type="number"
              value={formData.breakDuration}
              onChange={(e) => setFormData({ ...formData, breakDuration: Number(e.target.value) })}
              className="input"
              min="0"
              max="480"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Assign Shift Modal Component
const AssignShiftModal: React.FC<{
  shift: Shift | null
  employees: Employee[]
  onClose: () => void
  onSubmit: (data: AssignShiftData) => void
  isLoading: boolean
}> = ({ shift, employees, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<AssignShiftData>({
    employeeId: '',
    shiftId: shift?.id || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          Assign Shift {shift ? `- ${shift.name}` : ''}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Employee</label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.user.firstName} {employee.user.lastName} - {employee.employeeId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">End Date (Optional)</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Assigning...' : 'Assign Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ShiftManagement

