import React, { useState } from 'react'
import { Users, Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeService } from '../services/employeeService'
import { authService } from '../services/authService'
import { Employee } from '../types'
import toast from 'react-hot-toast'

const Employees: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [smartSuggestions, setSmartSuggestions] = useState<any>(null)
  const queryClient = useQueryClient()

  // Fetch employees
  const { data: employeesData, isLoading, error } = useQuery(
    ['employees', searchTerm, departmentFilter, statusFilter],
    () => employeeService.getEmployees({
      search: searchTerm,
      department: departmentFilter,
      status: statusFilter
    })
  )

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation(employeeService.deleteEmployee, {
    onSuccess: () => {
      queryClient.invalidateQueries('employees')
      toast.success('Employee deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete employee')
    }
  })

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteEmployeeMutation.mutate(id)
    }
  }

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowViewModal(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowEditModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage employee information and details</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
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
            <select 
              className="input"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="HR">HR</option>
              <option value="IT">IT</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
            </select>
            <select 
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
            <button 
              className="btn btn-outline btn-md"
              onClick={() => {
                setSearchTerm('')
                setDepartmentFilter('')
                setStatusFilter('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Employee List</h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading employees...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading employees</p>
            </div>
          ) : !employeesData?.data?.employees?.length ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first employee</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary btn-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
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
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
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
                  {employeesData.data.employees.map((employee: Employee) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {employee.user?.firstName?.charAt(0)}{employee.user?.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.user?.firstName} {employee.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{employee.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.department?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800'
                            : employee.status === 'INACTIVE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewEmployee(employee)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Employee"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditEmployee(employee)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Employee"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Employee"
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

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            queryClient.invalidateQueries('employees')
          }}
        />
      )}

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <ViewEmployeeModal 
          employee={selectedEmployee}
          onClose={() => {
            setShowViewModal(false)
            setSelectedEmployee(null)
          }}
        />
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <EditEmployeeModal 
          employee={selectedEmployee}
          onClose={() => {
            setShowEditModal(false)
            setSelectedEmployee(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedEmployee(null)
            queryClient.invalidateQueries('employees')
          }}
        />
      )}
    </div>
  )
}

// Add Employee Modal Component
const AddEmployeeModal: React.FC<{
  onClose: () => void
  onSuccess: () => void
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    employeeId: '',
    department: '',
    position: '',
    hireDate: '',
    salary: '',
    workLocation: ''
  })

  const createEmployeeMutation = useMutation(
    async (data: any) => {
      try {
        // First create user using authService
        const userData = await authService.register({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || undefined, // Send undefined if empty
          role: 'EMPLOYEE'
        })
        
        // Then create employee record
        return employeeService.createEmployee({
          userId: userData.user.id,
          employeeId: data.employeeId,
          department: data.department,
          position: data.position,
          hireDate: data.hireDate,
          salary: data.salary ? parseFloat(data.salary) : undefined,
          workLocation: data.workLocation
        })
      } catch (error: any) {
        console.error('Employee creation error:', error)
        // Check if it's a user already exists error
        if (error.response?.data?.code === 'USER_EXISTS') {
          throw new Error('User with this email already exists. Please use a different email.')
        }
        // Check if it's a validation error
        if (error.response?.data?.code === 'VALIDATION_ERROR') {
          throw new Error(error.response.data.error || 'Validation failed. Please check your input.')
        }
        // Generic error
        throw new Error(error.response?.data?.error || error.message || 'Failed to create employee')
      }
    },
    {
      onSuccess: () => {
        toast.success('Employee created successfully!')
        onSuccess()
      },
      onError: (error: any) => {
        console.error('Employee creation failed:', error)
        toast.error(error.message || 'Failed to create employee')
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.employeeId || !formData.hireDate || !formData.workLocation) {
      toast.error('Please fill in all required fields')
      return
    }
    
    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && formData.phone.length < 10) {
      toast.error('Please enter a valid phone number (at least 10 digits)')
      return
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    
    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    
    createEmployeeMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="label">Password *</label>
            <input
              type="password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                type="text"
                className="input"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input
                type="text"
                className="input"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="label">Employee ID *</label>
            <input
              type="text"
              className="input"
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Department</label>
              <select
                className="input"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              >
                <option value="">Select Department</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
            <div>
              <label className="label">Position</label>
              <input
                type="text"
                className="input"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Salary</label>
              <input
                type="number"
                className="input"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: e.target.value})}
                placeholder="Enter salary"
              />
            </div>
            <div>
              <label className="label">Work Location *</label>
              <input
                type="text"
                className="input"
                value={formData.workLocation}
                onChange={(e) => setFormData({...formData, workLocation: e.target.value})}
                placeholder="Enter work location"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Hire Date *</label>
            <input
              type="date"
              className="input"
              value={formData.hireDate}
              onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
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
              disabled={createEmployeeMutation.isLoading}
              className="btn btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createEmployeeMutation.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Employee'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// View Employee Modal Component
const ViewEmployeeModal: React.FC<{
  employee: Employee
  onClose: () => void
}> = ({ employee, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Employee Details</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium text-xl">
                {employee.user?.firstName?.charAt(0)}{employee.user?.lastName?.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {employee.user?.firstName} {employee.user?.lastName}
              </h3>
              <p className="text-gray-600">{employee.user?.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <p className="text-gray-900">{employee.user?.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="label">Employee ID</label>
              <p className="text-gray-900">{employee.employeeId}</p>
            </div>
            <div>
              <label className="label">Department</label>
              <p className="text-gray-900">{employee.department?.name || 'N/A'}</p>
            </div>
            <div>
              <label className="label">Position</label>
              <p className="text-gray-900">{employee.position || 'N/A'}</p>
            </div>
            <div>
              <label className="label">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                employee.status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800'
                  : employee.status === 'INACTIVE'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {employee.status}
              </span>
            </div>
            <div>
              <label className="label">Work Location</label>
              <p className="text-gray-900">{employee.workLocation || 'N/A'}</p>
            </div>
            <div>
              <label className="label">Hire Date</label>
              <p className="text-gray-900">{new Date(employee.hireDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="label">Salary</label>
              <p className="text-gray-900">{employee.salary ? `₹${employee.salary}` : 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="btn btn-outline btn-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Edit Employee Modal Component
const EditEmployeeModal: React.FC<{
  employee: Employee
  onClose: () => void
  onSuccess: () => void
}> = ({ employee, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    // User information
    firstName: employee.user?.firstName || '',
    lastName: employee.user?.lastName || '',
    email: employee.user?.email || '',
    phone: employee.user?.phone || '',
    // Employee information
    employeeId: employee.employeeId || '',
    department: employee.department?.name || '',
    position: employee.position || '',
    status: employee.status,
    salary: employee.salary?.toString() || '',
    workLocation: employee.workLocation || '',
    hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : ''
  })

  const updateEmployeeMutation = useMutation(
    (data: any) => employeeService.updateEmployee(employee.id, data),
    {
      onSuccess: () => {
        toast.success('Employee updated successfully!')
        onSuccess()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update employee')
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.employeeId) {
      toast.error('Please fill in all required fields')
      return
    }
    
    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    
    // Prepare data for submission
    const submitData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      employeeId: formData.employeeId,
      department: formData.department,
      position: formData.position,
      status: formData.status,
      salary: formData.salary ? parseFloat(formData.salary) : undefined,
      workLocation: formData.workLocation,
      hireDate: formData.hireDate
    }
    
    updateEmployeeMutation.mutate(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
        <h2 className="text-xl font-bold mb-4">Edit Employee</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information Section */}
          <div className="border-b pb-4">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Employment Information Section */}
          <div className="border-b pb-4">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Employment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Employee ID *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="label">Department</label>
                <select
                  className="input"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                >
                  <option value="">Select Department</option>
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="label">Position</label>
                <input
                  type="text"
                  className="input"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  placeholder="Enter position"
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE'})}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="label">Hire Date</label>
                <input
                  type="date"
                  className="input"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                />
              </div>
              <div>
                <label className="label">Salary</label>
                <input
                  type="number"
                  className="input"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  placeholder="Enter salary"
                />
              </div>
              <div>
                <label className="label">Work Location</label>
                <input
                  type="text"
                  className="input"
                  value={formData.workLocation}
                  onChange={(e) => setFormData({...formData, workLocation: e.target.value})}
                  placeholder="Location"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateEmployeeMutation.isLoading}
              className="btn btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateEmployeeMutation.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Update Employee'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Employees
