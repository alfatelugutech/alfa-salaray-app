import api from './api'

export const exportService = {
  // Export attendance data
  async exportAttendance(params: {
    startDate?: string
    endDate?: string
    employeeId?: string
    format: 'csv' | 'excel' | 'pdf'
  }) {
    const response = await api.get('/export/attendance', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // Export employee data
  async exportEmployees(params: {
    departmentId?: string
    format: 'csv' | 'excel' | 'pdf'
  }) {
    const response = await api.get('/export/employees', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // Export payroll data
  async exportPayroll(params: {
    month?: number
    year?: number
    format: 'csv' | 'excel' | 'pdf'
  }) {
    const response = await api.get('/export/payroll', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // Export leave data
  async exportLeave(params: {
    startDate?: string
    endDate?: string
    format: 'csv' | 'excel' | 'pdf'
  }) {
    const response = await api.get('/export/leave', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // Download file helper
  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}
