import apiClient from './api'

export interface PerformanceReviewData {
  employeeId: string
  period: string
  goals: Array<{
    title: string
    description: string
    targetValue: number
    actualValue: number
    weight: number
  }>
  competencies: Array<{
    name: string
    rating: number
    comments?: string
  }>
  overallRating: number
  comments?: string
  strengths?: string[]
  areasForImprovement?: string[]
}

export interface GoalData {
  employeeId: string
  title: string
  description: string
  category: 'PERFORMANCE' | 'DEVELOPMENT' | 'BEHAVIORAL' | 'QUANTITATIVE'
  targetValue: number
  unit: string
  startDate: string
  endDate: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
}

export interface TrainingData {
  title: string
  description: string
  category: string
  duration: number
  instructor: string
  startDate: string
  endDate: string
  maxParticipants: number
  requirements?: string[]
}

export interface DocumentData {
  employeeId: string
  title: string
  description?: string
  category: string
  documentType: string
  fileUrl: string
  expiryDate?: string
}

export const hrService = {
  // Performance Reviews
  createPerformanceReview: async (data: PerformanceReviewData) => {
    const response = await apiClient.post('/hr/performance-reviews', data)
    return response.data
  },

  getPerformanceReviews: async (params?: {
    employeeId?: string
    period?: string
    page?: number
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId)
    if (params?.period) queryParams.append('period', params.period)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await apiClient.get(`/hr/performance-reviews?${queryParams.toString()}`)
    return response.data
  },

  // Goals
  createGoal: async (data: GoalData) => {
    const response = await apiClient.post('/hr/goals', data)
    return response.data
  },

  getGoals: async (params?: {
    employeeId?: string
    status?: string
    category?: string
    page?: number
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await apiClient.get(`/hr/goals?${queryParams.toString()}`)
    return response.data
  },

  updateGoalProgress: async (goalId: string, data: {
    actualValue?: number
    status?: string
    comments?: string
  }) => {
    const response = await apiClient.patch(`/hr/goals/${goalId}/progress`, data)
    return response.data
  },

  // Training
  createTraining: async (data: TrainingData) => {
    const response = await apiClient.post('/hr/trainings', data)
    return response.data
  },

  getTrainings: async (params?: {
    status?: string
    category?: string
    page?: number
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await apiClient.get(`/hr/trainings?${queryParams.toString()}`)
    return response.data
  },

  enrollInTraining: async (trainingId: string) => {
    const response = await apiClient.post(`/hr/trainings/${trainingId}/enroll`)
    return response.data
  },

  // Documents
  createDocument: async (data: DocumentData) => {
    const response = await apiClient.post('/hr/documents', data)
    return response.data
  },

  getDocuments: async (params?: {
    employeeId?: string
    category?: string
    documentType?: string
    status?: string
    page?: number
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.documentType) queryParams.append('documentType', params.documentType)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await apiClient.get(`/hr/documents?${queryParams.toString()}`)
    return response.data
  }
}

