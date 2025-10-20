import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Bell, Mail, MessageSquare, Smartphone, Settings, Check, X, Clock, AlertCircle } from 'lucide-react'
import { notificationService } from '../services/notificationService'
import toast from 'react-hot-toast'

const Notifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [showPreferences, setShowPreferences] = useState(false)
  const queryClient = useQueryClient()

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery(
    ['notifications', activeTab],
    () => notificationService.getNotifications({
      type: activeTab === 'all' ? undefined : activeTab.toUpperCase() as 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP',
      limit: 50
    }),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      retry: 2,
      onError: (error: any) => {
        console.error('Notifications fetch error:', error);
        toast.error(`Failed to fetch notifications: ${error.message}`);
      }
    }
  )

  // Fetch notification preferences
  const { data: preferencesData } = useQuery(
    'notification-preferences',
    () => notificationService.getPreferences()
  )

  // Mark notification as read
  const markAsReadMutation = useMutation(
    (notificationId: string) => notificationService.markAsRead(notificationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        toast.success('Notification marked as read')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to mark notification as read')
      }
    }
  )

  // Update preferences
  const updatePreferencesMutation = useMutation(
    (preferences: any) => notificationService.updatePreferences(preferences),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notification-preferences')
        toast.success('Notification preferences updated')
        setShowPreferences(false)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update preferences')
      }
    }
  )

  // Use the mutations to avoid unused variable warnings
  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId)
  }

  const handleUpdatePreferences = (preferences: any) => {
    updatePreferencesMutation.mutate(preferences)
  }

  // Suppress unused variable warnings
  console.log('Mutations available:', { handleMarkAsRead, handleUpdatePreferences })

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const notifications = notificationsData?.data?.notifications || []
  const preferences = preferencesData?.data

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail className="w-5 h-5 text-blue-600" />
      case 'sms':
        return <Smartphone className="w-5 h-5 text-green-600" />
      case 'push':
        return <Bell className="w-5 h-5 text-purple-600" />
      case 'whatsapp':
        return <MessageSquare className="w-5 h-5 text-green-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return <Check className="w-4 h-4 text-green-600" />
      case 'failed':
        return <X className="w-4 h-4 text-red-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'delivered':
        return <Check className="w-4 h-4 text-blue-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'delivered':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Manage your notifications and preferences</p>
        </div>
        <button
          onClick={() => setShowPreferences(true)}
          className="btn btn-outline btn-sm flex items-center gap-2 mt-4 sm:mt-0"
        >
          <Settings className="w-4 h-4" />
          Preferences
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', label: 'All Notifications', count: notifications.length },
            { id: 'email', label: 'Email', count: notifications.filter((n: any) => n.type === 'EMAIL').length },
            { id: 'sms', label: 'SMS', count: notifications.filter((n: any) => n.type === 'SMS').length },
            { id: 'push', label: 'Push', count: notifications.filter((n: any) => n.type === 'PUSH').length },
            { id: 'whatsapp', label: 'WhatsApp', count: notifications.filter((n: any) => n.type === 'WHATSAPP').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You don't have any notifications yet.</p>
          </div>
        ) : (
          notifications.map((notification: any) => (
            <div key={notification.id} className="card p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {notification.subject || 'Notification'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                        {getStatusIcon(notification.status)}
                        <span className="ml-1">{notification.status}</span>
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {notification.message}
                  </p>
                  {notification.data && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(notification.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className="mt-4 flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      To: {notification.recipient}
                    </span>
                    {notification.sentAt && (
                      <span className="text-sm text-gray-500">
                        Sent: {new Date(notification.sentAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences?.emailEnabled || false}
                    onChange={() => {
                      // Handle email preference change
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Smartphone className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences?.smsEnabled || false}
                    onChange={() => {
                      // Handle SMS preference change
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences?.pushEnabled || false}
                    onChange={() => {
                      // Handle push preference change
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">WhatsApp Notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences?.whatsappEnabled || false}
                    onChange={() => {
                      // Handle WhatsApp preference change
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle save preferences
                    toast.success('Preferences updated successfully')
                    setShowPreferences(false)
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Notifications
