import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { settingsService } from '../services/settingsService'
import { SystemSetting, CreateSettingData } from '../types'
import toast from 'react-hot-toast'

const SystemSettings: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkSettings, setBulkSettings] = useState<Record<string, string>>({})

  const queryClient = useQueryClient()

  // Fetch settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings', searchTerm, categoryFilter],
    queryFn: () => settingsService.getSettings({
      search: searchTerm,
      category: categoryFilter,
      limit: 100
    })
  })

  // Fetch system configuration
  const { data: systemConfig } = useQuery({
    queryKey: ['system-config'],
    queryFn: settingsService.getSystemConfig
  })

  // Create setting mutation
  const createSettingMutation = useMutation({
    mutationFn: settingsService.createSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      setShowCreateModal(false)
      toast.success('Setting created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create setting')
    }
  })

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: ({ key, data }: { key: string; data: Partial<CreateSettingData> }) =>
      settingsService.updateSetting(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      setEditingSetting(null)
      toast.success('Setting updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update setting')
    }
  })

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: settingsService.bulkUpdateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      setBulkEditMode(false)
      setBulkSettings({})
      toast.success('Settings updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update settings')
    }
  })

  // Delete setting mutation
  const deleteSettingMutation = useMutation({
    mutationFn: settingsService.deleteSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      toast.success('Setting deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete setting')
    }
  })

  const handleCreateSetting = (data: CreateSettingData) => {
    createSettingMutation.mutate(data)
  }

  const handleUpdateSetting = (key: string, data: Partial<CreateSettingData>) => {
    updateSettingMutation.mutate({ key, data })
  }

  const handleBulkUpdate = () => {
    const settings = Object.entries(bulkSettings).map(([key, value]) => ({
      key,
      value
    }))
    bulkUpdateMutation.mutate(settings)
  }

  const handleDeleteSetting = (key: string) => {
    if (window.confirm('Are you sure you want to delete this setting?')) {
      deleteSettingMutation.mutate(key)
    }
  }

  const handleBulkEditChange = (key: string, value: string) => {
    setBulkSettings(prev => ({ ...prev, [key]: value }))
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STRING':
        return 'bg-blue-100 text-blue-800'
      case 'NUMBER':
        return 'bg-green-100 text-green-800'
      case 'BOOLEAN':
        return 'bg-purple-100 text-purple-800'
      case 'JSON':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatValue = (value: string, type: string) => {
    if (type === 'BOOLEAN') {
      return value === 'true' ? 'Yes' : 'No'
    }
    if (type === 'JSON') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2)
      } catch {
        return value
      }
    }
    return value
  }

  if (settingsLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Manage system configuration and parameters</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className={`btn ${bulkEditMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Edit className="w-4 h-4 mr-2" />
            {bulkEditMode ? 'Exit Bulk Edit' : 'Bulk Edit'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Setting
          </button>
        </div>
      </div>

      {/* System Configuration Overview */}
      {systemConfig && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">System Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(systemConfig).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{key}</div>
                <div className="text-sm text-gray-600">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search settings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">All Categories</option>
          <option value="SYSTEM">System</option>
          <option value="GENERAL">General</option>
          <option value="SECURITY">Security</option>
          <option value="NOTIFICATIONS">Notifications</option>
          <option value="PAYROLL">Payroll</option>
          <option value="ATTENDANCE">Attendance</option>
        </select>
      </div>

      {/* Bulk Edit Actions */}
      {bulkEditMode && (
        <div className="card p-4 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Bulk Edit Mode</h3>
              <p className="text-sm text-blue-700">Edit multiple settings at once</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setBulkEditMode(false)
                  setBulkSettings({})
                }}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                className="btn btn-primary btn-sm"
                disabled={bulkUpdateMutation.isLoading}
              >
                {bulkUpdateMutation.isLoading ? 'Saving...' : 'Save All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settingsData?.data.settings?.map((setting) => (
                <tr key={setting.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{setting.key}</div>
                  </td>
                  <td className="px-6 py-4">
                    {bulkEditMode ? (
                      <input
                        type="text"
                        value={bulkSettings[setting.key] || setting.value}
                        onChange={(e) => handleBulkEditChange(setting.key, e.target.value)}
                        className="input w-full"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {formatValue(setting.value, setting.type)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(setting.type)}`}>
                      {setting.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {setting.category || 'General'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!bulkEditMode && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingSetting(setting)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSetting(setting.key)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Setting Modal */}
      {showCreateModal && (
        <CreateSettingModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSetting}
          isLoading={createSettingMutation.isLoading}
        />
      )}

      {/* Edit Setting Modal */}
      {editingSetting && (
        <EditSettingModal
          setting={editingSetting}
          onClose={() => setEditingSetting(null)}
          onSubmit={(data) => handleUpdateSetting(editingSetting.key, data)}
          isLoading={updateSettingMutation.isLoading}
        />
      )}
    </div>
  )
}

// Create Setting Modal Component
const CreateSettingModal: React.FC<{
  onClose: () => void
  onSubmit: (data: CreateSettingData) => void
  isLoading: boolean
}> = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CreateSettingData>({
    key: '',
    value: '',
    type: 'STRING',
    category: 'GENERAL'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Setting</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Key</label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Value</label>
            <textarea
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="input"
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="input"
                required
              >
                <option value="STRING">String</option>
                <option value="NUMBER">Number</option>
                <option value="BOOLEAN">Boolean</option>
                <option value="JSON">JSON</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
              >
                <option value="GENERAL">General</option>
                <option value="SYSTEM">System</option>
                <option value="SECURITY">Security</option>
                <option value="NOTIFICATIONS">Notifications</option>
                <option value="PAYROLL">Payroll</option>
                <option value="ATTENDANCE">Attendance</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Setting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Setting Modal Component
const EditSettingModal: React.FC<{
  setting: SystemSetting
  onClose: () => void
  onSubmit: (data: Partial<CreateSettingData>) => void
  isLoading: boolean
}> = ({ setting, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<Partial<CreateSettingData>>({
    value: setting.value,
    type: setting.type,
    category: setting.category
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Setting</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Key</label>
            <input
              type="text"
              value={setting.key}
              className="input"
              disabled
            />
          </div>
          <div>
            <label className="label">Value</label>
            <textarea
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="input"
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="input"
                required
              >
                <option value="STRING">String</option>
                <option value="NUMBER">Number</option>
                <option value="BOOLEAN">Boolean</option>
                <option value="JSON">JSON</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
              >
                <option value="GENERAL">General</option>
                <option value="SYSTEM">System</option>
                <option value="SECURITY">Security</option>
                <option value="NOTIFICATIONS">Notifications</option>
                <option value="PAYROLL">Payroll</option>
                <option value="ATTENDANCE">Attendance</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Setting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SystemSettings

