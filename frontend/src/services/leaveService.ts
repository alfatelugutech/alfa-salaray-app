import api from './api'
import { LeaveRequest, CreateLeaveRequestData, UpdateLeaveRequestData, PaginatedResponse } from '../types'

export const leaveService = {
  // Create leave request
  async createLeaveRequest(data: CreateLeaveRequestData): Promise<LeaveRequest> {
    const response = await api.post<{ success: boolean; data: { leaveRequest: LeaveRequest } }>('/leave/request', data)
    return response.data.data.leaveRequest
  },

  // Get leave requests
  async getLeaveRequests(params?: {
    page?: number
    limit?: number
    employeeId?: string
    status?: string
    leaveType?: string
    startDate?: string
    endDate?: string
  }): Promise<PaginatedResponse<LeaveRequest>> {
    const response = await api.get<PaginatedResponse<LeaveRequest>>('/leave', { params })
    return response.data
  },

  // Get leave request by ID
  async getLeaveRequestById(id: string): Promise<LeaveRequest> {
    const response = await api.get<{ success: boolean; data: { leaveRequest: LeaveRequest } }>(`/leave/${id}`)
    return response.data.data.leaveRequest
  },

  // Update leave request status
  async updateLeaveRequestStatus(id: string, data: UpdateLeaveRequestData): Promise<LeaveRequest> {
    const response = await api.put<{ success: boolean; data: { leaveRequest: LeaveRequest } }>(`/leave/${id}/status`, data)
    return response.data.data.leaveRequest
  },

  // Cancel leave request
  async cancelLeaveRequest(id: string): Promise<LeaveRequest> {
    const response = await api.put<{ success: boolean; data: { leaveRequest: LeaveRequest } }>(`/leave/${id}/cancel`)
    return response.data.data.leaveRequest
  },

  // Delete leave request
  async deleteLeaveRequest(id: string): Promise<void> {
    await api.delete(`/leave/${id}`)
  },

  // Get leave statistics
  async getLeaveStats(params?: {
    startDate?: string
    endDate?: string
  }): Promise<{
    totalRequests: number
    pendingRequests: number
    approvedRequests: number
    rejectedRequests: number
    approvalRate: number
  }> {
    const response = await api.get<{ success: boolean; data: any }>('/leave/stats/overview', { params })
    return response.data.data
  },

  // Get employee leave history
  async getEmployeeLeaveHistory(employeeId: string, params?: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
  }): Promise<PaginatedResponse<LeaveRequest>> {
    const response = await api.get<PaginatedResponse<LeaveRequest>>(`/leave/employee/${employeeId}`, { params })
    return response.data
  }
}
