import api from './api'
import { Shift, EmployeeShift, CreateShiftData, AssignShiftData, PaginatedResponse } from '../types'

export const shiftService = {
  // Get all shifts
  async getShifts(params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: string
  }): Promise<PaginatedResponse<Shift>> {
    const response = await api.get<PaginatedResponse<Shift>>('/shifts', { params })
    return response.data
  },

  // Get shift by ID
  async getShift(id: string): Promise<Shift> {
    const response = await api.get<{ success: boolean; data: { shift: Shift } }>(`/shifts/${id}`)
    return response.data.data.shift
  },

  // Create shift
  async createShift(data: CreateShiftData): Promise<Shift> {
    const response = await api.post<{ success: boolean; data: { shift: Shift } }>('/shifts', data)
    return response.data.data.shift
  },

  // Update shift
  async updateShift(id: string, data: Partial<CreateShiftData>): Promise<Shift> {
    const response = await api.put<{ success: boolean; data: { shift: Shift } }>(`/shifts/${id}`, data)
    return response.data.data.shift
  },

  // Delete shift
  async deleteShift(id: string): Promise<void> {
    await api.delete(`/shifts/${id}`)
  },

  // Assign shift to employee
  async assignShift(data: AssignShiftData): Promise<EmployeeShift> {
    const response = await api.post<{ success: boolean; data: { assignment: EmployeeShift } }>('/shifts/assign', data)
    return response.data.data.assignment
  },

  // Get employee's current shift
  async getCurrentShift(employeeId: string): Promise<EmployeeShift | null> {
    const response = await api.get<{ success: boolean; data: { currentShift: EmployeeShift | null } }>(`/shifts/employee/${employeeId}/current`)
    return response.data.data.currentShift
  }
}



