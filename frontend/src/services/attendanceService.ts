import api from './api'
import { Attendance, MarkAttendanceData, PaginatedResponse } from '../types'

export const attendanceService = {
  // Mark attendance
  async markAttendance(data: MarkAttendanceData): Promise<Attendance> {
    console.log('🎯 Marking attendance with data:', data)
    console.log('🔑 Auth token:', localStorage.getItem('token'))
    console.log('👤 User:', localStorage.getItem('user'))
    
    const response = await api.post<{ success: boolean; data: { attendance: Attendance } }>('/attendance/mark', data)
    return response.data.data.attendance
  },

  // Get attendance records
  async getAttendance(params?: {
    page?: number
    limit?: number
    employeeId?: string
    startDate?: string
    endDate?: string
    status?: string
  }): Promise<PaginatedResponse<Attendance>> {
    const response = await api.get<PaginatedResponse<Attendance>>('/attendance', { params })
    return response.data
  },

  // Get attendance by ID
  async getAttendanceById(id: string): Promise<Attendance> {
    const response = await api.get<{ success: boolean; data: { attendance: Attendance } }>(`/attendance/${id}`)
    return response.data.data.attendance
  },

  // Update attendance
  async updateAttendance(id: string, data: Partial<MarkAttendanceData>): Promise<Attendance> {
    const response = await api.put<{ success: boolean; data: { attendance: Attendance } }>(`/attendance/${id}`, data)
    return response.data.data.attendance
  },

  // Delete attendance
  async deleteAttendance(id: string): Promise<void> {
    await api.delete(`/attendance/${id}`)
  },

  // Get attendance statistics
  async getAttendanceStats(params?: {
    startDate?: string
    endDate?: string
  }): Promise<{
    totalRecords: number
    presentCount: number
    absentCount: number
    lateCount: number
    attendanceRate: number
  }> {
    const response = await api.get<{ success: boolean; data: any }>('/attendance/stats/overview', { params })
    return response.data.data
  },

  // Get employee attendance history
  async getEmployeeAttendance(employeeId: string, params?: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
  }): Promise<PaginatedResponse<Attendance>> {
    const response = await api.get<PaginatedResponse<Attendance>>(`/attendance/employee/${employeeId}`, { params })
    return response.data
  },

  // Self check-in (employee marks own attendance)
  async selfCheckIn(payload: {
    isRemote?: boolean
    notes?: string
    checkInSelfie?: string
    checkInLocation?: {
      latitude?: number
      longitude?: number
      address?: string
      accuracy?: number
    } | null
    deviceInfo?: any
    shiftId?: string | null
    userId?: string
  }): Promise<Attendance> {
    // Get user ID from localStorage if not provided
    const userData = localStorage.getItem('user');
    const userId = payload.userId || (userData ? JSON.parse(userData).id : null);
    
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }

    const response = await api.post<{ success: boolean; data: { attendance: Attendance } }>(
      '/attendance/self/check-in',
      { ...payload, userId }
    )
    return response.data.data.attendance
  },

  // Self check-out
  async selfCheckOut(payload: {
    notes?: string
    checkOutSelfie?: string
    checkOutLocation?: {
      latitude?: number
      longitude?: number
      address?: string
      accuracy?: number
    } | null
    userId?: string
  }): Promise<Attendance> {
    // Get user ID from localStorage if not provided
    const userData = localStorage.getItem('user');
    const userId = payload.userId || (userData ? JSON.parse(userData).id : null);
    
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }

    const response = await api.post<{ success: boolean; data: { attendance: Attendance } }>(
      '/attendance/self/check-out',
      { ...payload, userId }
    )
    return response.data.data.attendance
  },

  // Get current attendance status
  async getAttendanceStatus(): Promise<{
    status: {
      canCheckIn: boolean
      canCheckOut: boolean
      isCompleted: boolean
      currentTime: string
      today: string
    }
    attendance: Attendance | null
  }> {
    const response = await api.get<{ success: boolean; data: any }>('/attendance/self/status')
    return response.data.data
  }
}



