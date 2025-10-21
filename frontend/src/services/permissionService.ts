import api from './api'
import { Permission } from '../types'

export interface CreatePermissionData {
  name: string
  description?: string
  category: string
  action: string
  resource: string
}

export interface UpdatePermissionData {
  name?: string
  description?: string
  category?: string
  action?: string
  resource?: string
  isActive?: boolean
}

const permissionService = {
  // Get all permissions
  async getPermissions(): Promise<{ data: Permission[]; grouped: Record<string, Permission[]> }> {
    const response = await api.get('/permissions')
    return response.data
  },

  // Get permissions by category
  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    const response = await api.get(`/permissions/category/${category}`)
    return response.data.data
  },

  // Get permission by ID
  async getPermission(id: string): Promise<Permission> {
    const response = await api.get(`/permissions/${id}`)
    return response.data.data
  },

  // Create new permission
  async createPermission(data: CreatePermissionData): Promise<Permission> {
    const response = await api.post('/permissions', data)
    return response.data.data
  },

  // Update permission
  async updatePermission(id: string, data: UpdatePermissionData): Promise<Permission> {
    const response = await api.put(`/permissions/${id}`, data)
    return response.data.data
  },

  // Delete permission
  async deletePermission(id: string): Promise<void> {
    await api.delete(`/permissions/${id}`)
  },

  // Initialize default permissions
  async initializePermissions(): Promise<{ created: number; total: number }> {
    const response = await api.post('/permissions/initialize')
    return response.data.data
  }
}

export default permissionService


