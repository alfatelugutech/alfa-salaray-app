import api from './api'

export interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId: string
  userId: string
  userEmail: string
  timestamp: string
  details: any
  ipAddress: string
  userAgent: string
}

export const auditService = {
  // Get audit logs
  async getAuditLogs(params: {
    page?: number
    limit?: number
    userId?: string
    action?: string
    resource?: string
    startDate?: string
    endDate?: string
  }): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const response = await api.get('/audit/logs', { params })
    return response.data.data
  },

  // Get user activity
  async getUserActivity(userId: string, params?: {
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<AuditLog[]> {
    const response = await api.get(`/audit/user/${userId}`, { params })
    return response.data.data
  },

  // Get system activity
  async getSystemActivity(params?: {
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<AuditLog[]> {
    const response = await api.get('/audit/system', { params })
    return response.data.data
  },

  // Export audit logs
  async exportAuditLogs(params: {
    startDate?: string
    endDate?: string
    format: 'csv' | 'excel' | 'pdf'
  }): Promise<Blob> {
    const response = await api.get('/audit/export', {
      params,
      responseType: 'blob'
    })
    return response.data
  }
}
