import api from './api'

export interface Notification {
  id: string
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  title: string
  message: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  actionRequired: boolean
  timestamp: string
  read: boolean
  userId?: string
  employeeId?: string
}

export const notificationService = {
  // Get notifications for current user
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get('/notifications')
    return response.data.data
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`)
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all')
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`)
  },

  // Get notification preferences
  async getPreferences(): Promise<any> {
    const response = await api.get('/notifications/preferences')
    return response.data.data
  },

  // Update notification preferences
  async updatePreferences(preferences: any): Promise<void> {
    await api.patch('/notifications/preferences', preferences)
  },

  // Send notification to specific user
  async sendNotification(data: {
    userId: string
    type: string
    title: string
    message: string
    priority: string
  }): Promise<void> {
    await api.post('/notifications/send', data)
  }
}
