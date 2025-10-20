import apiClient from './api'

export interface SmartScheduleData {
  department?: string
  startDate: string
  endDate: string
  constraints?: {
    maxHoursPerDay?: number
    minHoursPerDay?: number
    preferredShifts?: string[]
    avoidOvertime?: boolean
  }
}

export interface AnomalyDetectionData {
  employeeId?: string
  department?: string
  startDate: string
  endDate: string
  threshold?: number
}

export const aiService = {
  // Generate smart schedule
  generateSmartSchedule: async (data: SmartScheduleData) => {
    const response = await apiClient.post('/ai/smart-schedule', data)
    return response.data
  },

  // Detect anomalies
  detectAnomalies: async (data: AnomalyDetectionData) => {
    const response = await apiClient.post('/ai/anomaly-detection', data)
    return response.data
  },

  // Get predictive analytics
  getPredictiveAnalytics: async (department?: string, period?: string) => {
    const params = new URLSearchParams()
    if (department) params.append('department', department)
    if (period) params.append('period', period)
    
    const response = await apiClient.get(`/ai/predictive-analytics?${params.toString()}`)
    return response.data
  },

  // Send chatbot message
  sendChatbotMessage: async (message: string) => {
    const response = await apiClient.post('/ai/chatbot', { message })
    return response.data
  }
}

