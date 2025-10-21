import api from './api'

export interface PayrollSettings {
  id: string
  defaultMethod: 'FIXED_SALARY' | 'HOURLY_RATE' | 'COMMISSION_BASED' | 'PROJECT_BASED' | 'MIXED'
  overtimeMultiplier: number
  regularHoursPerMonth: number
  regularHoursPerDay: number
  overtimeThreshold: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  updatedBy: string
  updatedByUser: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface PayrollMethod {
  value: string
  label: string
  description: string
  icon: string
  calculation: string
}

export interface PayrollCalculation {
  method: string
  basicSalary: number
  overtimePay: number
  totalPay: number
  breakdown: any
}

export const payrollSettingsService = {
  // Get current payroll settings
  async getSettings(): Promise<PayrollSettings> {
    const response = await api.get<{ success: boolean; data: { settings: PayrollSettings } }>('/payroll-settings')
    return response.data.data.settings
  },

  // Update payroll settings
  async updateSettings(data: Partial<PayrollSettings>): Promise<PayrollSettings> {
    const response = await api.put<{ success: boolean; data: { settings: PayrollSettings } }>('/payroll-settings', data)
    return response.data.data.settings
  },

  // Get available payroll methods
  async getMethods(): Promise<PayrollMethod[]> {
    const response = await api.get<{ success: boolean; data: { methods: PayrollMethod[] } }>('/payroll-settings/methods')
    return response.data.data.methods
  },

  // Calculate payroll for employee
  async calculatePayroll(employeeId: string, month: number, year: number, workingHours?: any): Promise<{
    employee: any
    calculation: PayrollCalculation
    workingHours: any
  }> {
    const response = await api.post<{ success: boolean; data: any }>('/payroll-settings/calculate', {
      employeeId,
      month,
      year,
      workingHours
    })
    return response.data.data
  }
}
