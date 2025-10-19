import apiClient from './api'

export interface NotificationQuery {
  type?: 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP'
  status?: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED'
  page?: number
  limit?: number
}

export interface SendNotificationData {
  type: 'email' | 'sms' | 'push' | 'whatsapp'
  recipient: string
  subject?: string
  message: string
  template?: string
  data?: any
}

export interface NotificationPreferences {
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  whatsappEnabled: boolean
  quietHours?: {
    enabled: boolean
    start: string
    end: string
  }
}

export const notificationService = {
  // Send notification
  sendNotification: async (data: SendNotificationData) => {
    const response = await apiClient.post('/notifications/send', data)
    return response.data
  },

  // Get notifications
  getNotifications: async (query: NotificationQuery = {}) => {
    const params = new URLSearchParams()
    
    if (query.type) params.append('type', query.type)
    if (query.status) params.append('status', query.status)
    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())

    const response = await apiClient.get(`/notifications?${params.toString()}`)
    return response.data
  },

  // Get notification preferences
  getPreferences: async () => {
    const response = await apiClient.get('/notifications/preferences')
    return response.data
  },

  // Update notification preferences
  updatePreferences: async (preferences: NotificationPreferences) => {
    const response = await apiClient.put('/notifications/preferences', preferences)
    return response.data
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`)
    return response.data
  },

  // Request notification permission
  requestPermission: async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  },

  // Send test notification
  sendTestNotification: async (type: 'email' | 'sms' | 'push' | 'whatsapp', recipient: string) => {
    const testMessage = `This is a test ${type} notification from the Employee Management System.`
    
    return await notificationService.sendNotification({
      type,
      recipient,
      subject: `Test ${type.toUpperCase()} Notification`,
      message: testMessage,
      template: 'test-notification',
      data: {
        type,
        timestamp: new Date().toISOString(),
        system: 'Employee Management System'
      }
    })
  },

  // Send attendance reminder
  sendAttendanceReminder: async (employeeEmail: string, employeeName: string) => {
    return await notificationService.sendNotification({
      type: 'email',
      recipient: employeeEmail,
      subject: 'Daily Attendance Reminder',
      message: `Hello ${employeeName}, don't forget to mark your attendance today!`,
      template: 'attendance-reminder',
      data: {
        name: employeeName,
        attendanceUrl: `${window.location.origin}/my-attendance`,
        currentTime: new Date().toLocaleString()
      }
    })
  },

  // Send leave request notification
  sendLeaveRequestNotification: async (managerEmail: string, employeeName: string, leaveData: any) => {
    return await notificationService.sendNotification({
      type: 'email',
      recipient: managerEmail,
      subject: 'New Leave Request',
      message: `${employeeName} has submitted a new leave request.`,
      template: 'leave-request',
      data: {
        managerName: 'Manager',
        employeeName,
        leaveType: leaveData.leaveType,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        reason: leaveData.reason,
        approvalUrl: `${window.location.origin}/leave`
      }
    })
  },

  // Send leave approval notification
  sendLeaveApprovalNotification: async (employeeEmail: string, employeeName: string, leaveData: any) => {
    return await notificationService.sendNotification({
      type: 'email',
      recipient: employeeEmail,
      subject: 'Leave Request Approved',
      message: `Your leave request has been approved.`,
      template: 'leave-approved',
      data: {
        name: employeeName,
        leaveType: leaveData.leaveType,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate
      }
    })
  },

  // Send system alert
  sendSystemAlert: async (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    // Send to all active users
    return await notificationService.sendNotification({
      type: 'push',
      recipient: 'all',
      subject: 'System Alert',
      message,
      template: 'system-alert',
      data: {
        type,
        timestamp: new Date().toISOString(),
        priority: type === 'error' ? 'high' : 'normal'
      }
    })
  }
}
