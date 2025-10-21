import api from './api'

export interface SmartInsights {
  insights: {
    totalDays: number
    presentDays: number
    lateDays: number
    absentDays: number
    attendanceRate: number
  }
  patterns: {
    lateArrivals: number
    perfectAttendance: boolean
    consistency: number
    trends: {
      trend: 'IMPROVING' | 'DECLINING' | 'STABLE' | 'INSUFFICIENT_DATA'
      change: number
    }
  }
  recommendations: string[]
  performance: {
    level: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR'
    message: string
  }
}

export interface ProductivityMetrics {
  averageWorkingHours: number
  totalOvertimeHours: number
  efficiencyScore: number
  punctualityScore: number
  workLifeBalance: number
}

export interface SmartPredictions {
  nextWeekPrediction: {
    expectedAttendance: number
    confidence: number
    riskFactors: string[]
  }
  performanceForecast: {
    trend: 'UP' | 'DOWN' | 'STABLE'
    projectedScore: number
  }
  recommendations: string[]
}

export const smartAnalyticsService = {
  // Get smart insights for an employee
  async getSmartInsights(employeeId: string, startDate?: string, endDate?: string): Promise<SmartInsights> {
    const response = await api.get<{ success: boolean; data: SmartInsights }>('/attendance/analytics/smart-insights', {
      params: { employeeId, startDate, endDate }
    })
    return response.data.data
  },

  // Get productivity metrics
  async getProductivityMetrics(employeeId: string, startDate?: string, endDate?: string): Promise<ProductivityMetrics> {
    const response = await api.get<{ success: boolean; data: ProductivityMetrics }>('/attendance/analytics/productivity', {
      params: { employeeId, startDate, endDate }
    })
    return response.data.data
  },

  // Get smart predictions
  async getSmartPredictions(employeeId: string): Promise<SmartPredictions> {
    const response = await api.get<{ success: boolean; data: SmartPredictions }>('/attendance/analytics/predictions', {
      params: { employeeId }
    })
    return response.data.data
  },

  // Get team analytics
  async getTeamAnalytics(startDate?: string, endDate?: string): Promise<{
    teamPerformance: {
      averageAttendance: number
      topPerformers: Array<{ name: string; score: number }>
      improvementAreas: string[]
    }
    departmentComparison: Array<{
      department: string
      attendanceRate: number
      productivity: number
    }>
  }> {
    const response = await api.get<{ success: boolean; data: any }>('/attendance/analytics/team', {
      params: { startDate, endDate }
    })
    return response.data.data
  },

  // Get smart notifications
  async getSmartNotifications(): Promise<Array<{
    id: string
    type: 'WARNING' | 'SUCCESS' | 'INFO' | 'ALERT'
    title: string
    message: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    actionRequired: boolean
    timestamp: string
  }>> {
    const response = await api.get<{ success: boolean; data: any[] }>('/attendance/analytics/notifications')
    return response.data.data
  }
}
