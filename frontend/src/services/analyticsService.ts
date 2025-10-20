import apiClient from './api'

export interface AnalyticsQuery {
  startDate?: string
  endDate?: string
  department?: string
  employeeId?: string
  groupBy?: 'day' | 'week' | 'month' | 'department' | 'employee'
}

export interface AttendanceAnalytics {
  summary: {
    totalDays: number
    presentDays: number
    absentDays: number
    lateDays: number
    halfDays: number
    totalHours: number
    totalRegularHours: number
    totalOvertimeHours: number
    totalBreakHours: number
    remoteWorkDays: number
    attendanceRate: number
    absenceRate: number
    lateRate: number
    remoteWorkRate: number
  }
  groupedData: any[]
  rawData: any[]
}

export interface DepartmentAnalytics {
  department: string
  employeeCount: number
  totalDays: number
  presentDays: number
  totalHours: number
  attendanceRate: number
}

export interface PerformanceAnalytics {
  employeeId: string
  period: string
  metrics: {
    totalDays: number
    presentDays: number
    lateDays: number
    absentDays: number
    halfDays: number
    totalHours: number
    totalOvertimeHours: number
    remoteWorkDays: number
  }
  scores: {
    attendanceScore: number
    punctualityScore: number
    overtimeScore: number
    remoteWorkScore: number
    overallScore: number
  }
}

export const analyticsService = {
  // Get attendance analytics
  getAttendanceAnalytics: async (query: AnalyticsQuery) => {
    const params = new URLSearchParams()
    
    if (query.startDate) params.append('startDate', query.startDate)
    if (query.endDate) params.append('endDate', query.endDate)
    if (query.department) params.append('department', query.department)
    if (query.employeeId) params.append('employeeId', query.employeeId)
    if (query.groupBy) params.append('groupBy', query.groupBy)

    const response = await apiClient.get(`/analytics/attendance?${params.toString()}`)
    return response.data
  },

  // Get department analytics
  getDepartmentAnalytics: async () => {
    const response = await apiClient.get('/analytics/departments')
    return response.data
  },

  // Get employee performance analytics
  getPerformanceAnalytics: async (employeeId: string) => {
    const response = await apiClient.get(`/analytics/performance?employeeId=${employeeId}`)
    return response.data
  },

  // Export analytics data as PDF
  exportPDF: async (query: AnalyticsQuery) => {
    const params = new URLSearchParams()
    
    if (query.startDate) params.append('startDate', query.startDate)
    if (query.endDate) params.append('endDate', query.endDate)
    if (query.department) params.append('department', query.department)
    if (query.employeeId) params.append('employeeId', query.employeeId)
    if (query.groupBy) params.append('groupBy', query.groupBy)

    const response = await apiClient.get(`/analytics/export/pdf?${params.toString()}`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Export analytics data as Excel
  exportExcel: async (query: AnalyticsQuery) => {
    const params = new URLSearchParams()
    
    if (query.startDate) params.append('startDate', query.startDate)
    if (query.endDate) params.append('endDate', query.endDate)
    if (query.department) params.append('department', query.department)
    if (query.employeeId) params.append('employeeId', query.employeeId)
    if (query.groupBy) params.append('groupBy', query.groupBy)

    const response = await apiClient.get(`/analytics/export/excel?${params.toString()}`, {
      responseType: 'blob'
    })
    return response.data
  }
}
