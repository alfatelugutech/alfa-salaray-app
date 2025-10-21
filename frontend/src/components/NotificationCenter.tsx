import React, { useState, useEffect } from 'react'
import { Bell, X, Check, Trash2, Settings, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { notificationService } from '../services/notificationService'
import toast from 'react-hot-toast'

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const queryClient = useQueryClient()

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery(
    'notifications',
    notificationService.getNotifications,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true
    }
  )

  // Mark as read mutation
  const markAsReadMutation = useMutation(notificationService.markAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications')
      toast.success('Notification marked as read')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark notification as read')
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(notificationService.markAllAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications')
      toast.success('All notifications marked as read')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark all notifications as read')
    }
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation(notificationService.deleteNotification, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications')
      toast.success('Notification deleted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete notification')
    }
  })

  const notifications = notificationsData || []
  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'WARNING':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'border-l-red-500 bg-red-50'
      case 'HIGH':
        return 'border-l-orange-500 bg-orange-50'
      case 'MEDIUM':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId)
  }

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markAsReadMutation.isLoading}
                              className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            disabled={deleteNotificationMutation.isLoading}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={() => {/* Navigate to all notifications */}}
              className="w-full text-sm text-blue-600 hover:text-blue-800"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
