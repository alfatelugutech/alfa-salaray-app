import api from './api'
import { Department } from '../types'

export interface CreateDepartmentData {
  name: string
  description?: string
  managerId?: string
}

export interface UpdateDepartmentData {
  name?: string
  description?: string
  managerId?: string
  isActive?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const departmentService = {
  // Get all departments
  async getDepartments(): Promise<Department[]> {
    const response = await api.get('/departments')
    return response.data.data
  },

  // Get department by ID
  async getDepartment(id: string): Promise<Department> {
    const response = await api.get(`/departments/${id}`)
    return response.data.data
  },

  // Create new department
  async createDepartment(data: CreateDepartmentData): Promise<Department> {
    const response = await api.post('/departments', data)
    return response.data.data
  },

  // Update department
  async updateDepartment(id: string, data: UpdateDepartmentData): Promise<Department> {
    const response = await api.put(`/departments/${id}`, data)
    return response.data.data
  },

  // Delete department
  async deleteDepartment(id: string): Promise<void> {
    await api.delete(`/departments/${id}`)
  }
}

export default departmentService


