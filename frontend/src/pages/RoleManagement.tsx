import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Users, Shield, Key, UserCheck } from 'lucide-react'
import roleService from '../services/roleService'
import permissionService from '../services/permissionService'
import { employeeService } from '../services/employeeService'
import { Role, Permission, Employee } from '../types'
import toast from 'react-hot-toast'

const RoleManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  // Fetch roles
  const { data: roles, isLoading } = useQuery(
    'roles',
    roleService.getRoles
  )

  // Fetch permissions
  const { data: permissionsData } = useQuery(
    'permissions',
    permissionService.getPermissions
  )

  // Fetch employees for assignment
  const { data: employeesData } = useQuery(
    'employees',
    () => employeeService.getEmployees({ page: 1, limit: 1000 })
  )

  // Create role mutation
  const createRoleMutation = useMutation(
    (data: any) => roleService.createRole(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles'] })
        setShowCreateModal(false)
        toast.success('Role created successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create role')
      }
    }
  )

  // Update role mutation
  const updateRoleMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => roleService.updateRole(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles'] })
        setEditingRole(null)
        toast.success('Role updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update role')
      }
    }
  )

  // Delete role mutation
  const deleteRoleMutation = useMutation(
    (id: string) => roleService.deleteRole(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles'] })
        toast.success('Role deleted successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete role')
      }
    }
  )

  // Assign role mutation
  const assignRoleMutation = useMutation(
    (data: any) => roleService.assignRole(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles'] })
        setShowAssignModal(false)
        toast.success('Role assigned successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to assign role')
      }
    }
  )

  const handleCreateRole = (data: any) => {
    createRoleMutation.mutate(data)
  }

  const handleUpdateRole = (data: any) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data })
    }
  }

  const handleDeleteRole = (id: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      deleteRoleMutation.mutate(id)
    }
  }

  const handleAssignRole = (data: any) => {
    assignRoleMutation.mutate(data)
  }

  const filteredRoles = (roles || []).filter((role: Role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">Create and manage custom roles with specific permissions</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn btn-secondary"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Assign Role
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading roles...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
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
                {filteredRoles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {role.name}
                            {role.isSystem && (
                              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                System
                              </span>
                            )}
                          </div>
                          {role.description && (
                            <div className="text-sm text-gray-500">
                              {role.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Key className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {role.permissions?.length || 0} permissions
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {role._count?.users || 0} users
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        role.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingRole(role)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={role.isSystem}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRole(role)
                            setShowAssignModal(true)
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={role.isSystem}
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

      {/* Create Role Modal */}
      {showCreateModal && (
        <CreateRoleModal
          permissions={(permissionsData as any)?.data || []}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRole}
          isLoading={createRoleMutation.isLoading}
        />
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <EditRoleModal
          role={editingRole}
          permissions={(permissionsData as any)?.data || []}
          onClose={() => setEditingRole(null)}
          onSubmit={handleUpdateRole}
          isLoading={updateRoleMutation.isLoading}
        />
      )}

      {/* Assign Role Modal */}
      {showAssignModal && (
        <AssignRoleModal
          role={selectedRole}
          employees={employeesData?.data?.employees || []}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedRole(null)
          }}
          onSubmit={handleAssignRole}
          isLoading={assignRoleMutation.isLoading}
        />
      )}
    </div>
  )
}

// Create Role Modal Component
const CreateRoleModal: React.FC<{
  permissions: Permission[]
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}> = ({ permissions, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Create Role</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Role Name</label>
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
            <label className="label">Permissions</label>
            <div className="max-h-64 overflow-y-auto border rounded-lg p-4">
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                <div key={category} className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 capitalize">{category}</h4>
                  <div className="space-y-2">
                    {categoryPermissions.map((permission) => (
                      <label key={permission.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {permission.description || permission.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
              {isLoading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Role Modal Component
const EditRoleModal: React.FC<{
  role: Role
  permissions: Permission[]
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}> = ({ role, permissions, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description || '',
    isActive: role.isActive,
    permissions: role.permissions?.map(rp => rp.permissionId) || []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Edit Role</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Role Name</label>
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

          <div>
            <label className="label">Permissions</label>
            <div className="max-h-64 overflow-y-auto border rounded-lg p-4">
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                <div key={category} className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 capitalize">{category}</h4>
                  <div className="space-y-2">
                    {categoryPermissions.map((permission) => (
                      <label key={permission.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {permission.description || permission.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
              {isLoading ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Assign Role Modal Component
const AssignRoleModal: React.FC<{
  role: Role | null
  employees: Employee[]
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}> = ({ role, employees, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    userId: '',
    roleId: role?.id || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Assign Role</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Role</label>
            <input
              type="text"
              value={role?.name || ''}
              className="input"
              disabled
            />
          </div>

          <div>
            <label className="label">Employee</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
              className="input"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.user.id}>
                  {employee.user.firstName} {employee.user.lastName} ({employee.user.email})
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
              {isLoading ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RoleManagement
