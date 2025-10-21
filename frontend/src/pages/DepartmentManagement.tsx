import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Users, Building, UserCheck } from 'lucide-react'
import departmentService from '../services/departmentService'
import { employeeService } from '../services/employeeService'
import { Department, Employee } from '../types'
import toast from 'react-hot-toast'

const DepartmentManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  // Fetch departments
  const { data: departments, isLoading } = useQuery(
    'departments',
    departmentService.getDepartments
  )

  // Fetch employees for manager selection
  const { data: employeesData } = useQuery(
    'employees',
    () => employeeService.getEmployees({ page: 1, limit: 1000 })
  )

  // Create department mutation
  const createDepartmentMutation = useMutation(
    (data: any) => departmentService.createDepartment(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['departments'] })
        setShowCreateModal(false)
        toast.success('Department created successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create department')
      }
    }
  )

  // Update department mutation
  const updateDepartmentMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => departmentService.updateDepartment(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['departments'] })
        setEditingDepartment(null)
        toast.success('Department updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update department')
      }
    }
  )

  // Delete department mutation
  const deleteDepartmentMutation = useMutation(
    (id: string) => departmentService.deleteDepartment(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['departments'] })
        toast.success('Department deleted successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete department')
      }
    }
  )

  const handleCreateDepartment = (data: any) => {
    createDepartmentMutation.mutate(data)
  }

  const handleUpdateDepartment = (data: any) => {
    if (editingDepartment) {
      updateDepartmentMutation.mutate({ id: editingDepartment.id, data })
    }
  }

  const handleDeleteDepartment = (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteDepartmentMutation.mutate(id)
    }
  }

  const filteredDepartments = (departments || []).filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600">Manage departments and assign managers</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Department
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Departments List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading departments...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employees
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
                {filteredDepartments.map((department) => (
                  <tr key={department.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {department.name}
                          </div>
                          {department.description && (
                            <div className="text-sm text-gray-500">
                              {department.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {department.manager ? (
                        <div className="flex items-center">
                          <div className="p-1 bg-green-100 rounded-full mr-2">
                            <UserCheck className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {department.manager.firstName} {department.manager.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {department.manager.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No manager assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {department._count?.employees || 0} employees
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        department.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {department.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingDepartment(department)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(department.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Create Department Modal */}
      {showCreateModal && (
        <CreateDepartmentModal
          employees={employeesData?.data?.employees || []}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDepartment}
          isLoading={createDepartmentMutation.isLoading}
        />
      )}

      {/* Edit Department Modal */}
      {editingDepartment && (
        <EditDepartmentModal
          department={editingDepartment}
          employees={employeesData?.data?.employees || []}
          onClose={() => setEditingDepartment(null)}
          onSubmit={handleUpdateDepartment}
          isLoading={updateDepartmentMutation.isLoading}
        />
      )}
    </div>
  )
}

// Create Department Modal Component
const CreateDepartmentModal: React.FC<{
  employees: Employee[]
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}> = ({ employees, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create Department</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Department Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input"
              rows={3}
            />
          </div>

          <div>
            <label className="label">Manager (Optional)</label>
            <select
              value={formData.managerId}
              onChange={(e) => setFormData({...formData, managerId: e.target.value})}
              className="input"
            >
              <option value="">Select Manager</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.user.id}>
                  {employee.user.firstName} {employee.user.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Department Modal Component
const EditDepartmentModal: React.FC<{
  department: Department
  employees: Employee[]
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}> = ({ department, employees, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: department.name,
    description: department.description || '',
    managerId: department.managerId || '',
    isActive: department.isActive
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Department</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Department Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input"
              rows={3}
            />
          </div>

          <div>
            <label className="label">Manager</label>
            <select
              value={formData.managerId}
              onChange={(e) => setFormData({...formData, managerId: e.target.value})}
              className="input"
            >
              <option value="">Select Manager</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.user.id}>
                  {employee.user.firstName} {employee.user.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="mr-2"
              />
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DepartmentManagement
