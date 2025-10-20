import api from './api'
import { Employee, CreateEmployeeData, PaginatedResponse } from '../types'

export const employeeService = {
  // Get all employees
  async getEmployees(params?: {
    page?: number
    limit?: number
    search?: string
    department?: string
    status?: string
  }): Promise<PaginatedResponse<Employee>> {
    const response = await api.get<PaginatedResponse<Employee>>('/employees', { params })
    return response.data
  },

  // Get employee by ID
  async getEmployee(id: string): Promise<Employee> {
    const response = await api.get<{ success: boolean; data: { employee: Employee } }>(`/employees/${id}`)
    return response.data.data.employee
  },

  // Create employee
  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    const response = await api.post<{ success: boolean; data: { employee: Employee } }>('/employees', data)
    return response.data.data.employee
  },

  // Update employee
  async updateEmployee(id: string, data: Partial<CreateEmployeeData>): Promise<Employee> {
    const response = await api.put<{ success: boolean; data: { employee: Employee } }>(`/employees/${id}`, data)
    return response.data.data.employee
  },

  // Delete employee
  async deleteEmployee(id: string): Promise<void> {
    await api.delete(`/employees/${id}`)
  },

  // Get employee statistics
  async getEmployeeStats(): Promise<{
    totalEmployees: number
    activeEmployees: number
    inactiveEmployees: number
    onLeaveEmployees: number
  }> {
    const response = await api.get<{ success: boolean; data: any }>('/employees/stats/overview')
    return response.data.data
  }
}



