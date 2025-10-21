import api from './api'
import { Role, UserRole } from '../types'

export interface CreateRoleData {
  name: string
  description?: string
  permissions?: string[]
}

export interface UpdateRoleData {
  name?: string
  description?: string
  isActive?: boolean
  permissions?: string[]
}

export interface AssignRoleData {
  userId: string
  roleId: string
}

const roleService = {
  // Get all roles
  async getRoles(): Promise<Role[]> {
    const response = await api.get('/roles')
    return response.data.data
  },

  // Get role by ID
  async getRole(id: string): Promise<Role> {
    const response = await api.get(`/roles/${id}`)
    return response.data.data
  },

  // Create new role
  async createRole(data: CreateRoleData): Promise<Role> {
    const response = await api.post('/roles', data)
    return response.data.data
  },

  // Update role
  async updateRole(id: string, data: UpdateRoleData): Promise<Role> {
    const response = await api.put(`/roles/${id}`, data)
    return response.data.data
  },

  // Delete role
  async deleteRole(id: string): Promise<void> {
    await api.delete(`/roles/${id}`)
  },

  // Assign role to user
  async assignRole(data: AssignRoleData): Promise<UserRole> {
    const response = await api.post('/roles/assign', data)
    return response.data.data
  },

  // Remove role from user
  async unassignRole(userId: string, roleId: string): Promise<void> {
    await api.delete(`/roles/unassign/${userId}/${roleId}`)
  }
}

export default roleService


