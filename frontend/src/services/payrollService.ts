import api from './api'
import { Payroll, CreatePayrollData, PaginatedResponse } from '../types'

export const payrollService = {
  // Get all payroll records
  async getPayrolls(params?: {
    page?: number
    limit?: number
    employeeId?: string
    month?: number
    year?: number
    status?: string
  }): Promise<PaginatedResponse<Payroll>> {
    const response = await api.get<PaginatedResponse<Payroll>>('/payroll', { params })
    return response.data
  },

  // Get payroll by ID
  async getPayroll(id: string): Promise<Payroll> {
    const response = await api.get<{ success: boolean; data: { payroll: Payroll } }>(`/payroll/${id}`)
    return response.data.data.payroll
  },

  // Create payroll record
  async createPayroll(data: CreatePayrollData): Promise<Payroll> {
    const response = await api.post<{ success: boolean; data: { payroll: Payroll } }>('/payroll', data)
    return response.data.data.payroll
  },

  // Update payroll record
  async updatePayroll(id: string, data: Partial<CreatePayrollData>): Promise<Payroll> {
    const response = await api.put<{ success: boolean; data: { payroll: Payroll } }>(`/payroll/${id}`, data)
    return response.data.data.payroll
  },

  // Mark payroll as paid
  async markPayrollAsPaid(id: string): Promise<Payroll> {
    const response = await api.put<{ success: boolean; data: { payroll: Payroll } }>(`/payroll/${id}/mark-paid`)
    return response.data.data.payroll
  },

  // Delete payroll record
  async deletePayroll(id: string): Promise<void> {
    await api.delete(`/payroll/${id}`)
  },

  // Get payroll statistics
  async getPayrollStats(params?: {
    month?: number
    year?: number
  }): Promise<{
    totalPayrolls: number
    pendingPayrolls: number
    processedPayrolls: number
    paidPayrolls: number
    totalAmount: number
  }> {
    const response = await api.get<{ success: boolean; data: any }>('/payroll/stats/overview', { params })
    return response.data.data
  },

  // Get employee's payroll history
  async getEmployeePayrollHistory(employeeId: string, params?: {
    page?: number
    limit?: number
    year?: number
  }): Promise<PaginatedResponse<Payroll>> {
    const response = await api.get<PaginatedResponse<Payroll>>(`/payroll/employee/${employeeId}`, { params })
    return response.data
  }
}
