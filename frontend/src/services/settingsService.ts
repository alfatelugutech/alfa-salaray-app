import api from './api'
import { SystemSetting, CreateSettingData, PaginatedResponse } from '../types'

export const settingsService = {
  // Get all settings
  async getSettings(params?: {
    page?: number
    limit?: number
    category?: string
    search?: string
  }): Promise<PaginatedResponse<SystemSetting>> {
    const response = await api.get<PaginatedResponse<SystemSetting>>('/settings', { params })
    return response.data
  },

  // Get setting by key
  async getSetting(key: string): Promise<SystemSetting> {
    const response = await api.get<{ success: boolean; data: { setting: SystemSetting } }>(`/settings/${key}`)
    return response.data.data.setting
  },

  // Create setting
  async createSetting(data: CreateSettingData): Promise<SystemSetting> {
    const response = await api.post<{ success: boolean; data: { setting: SystemSetting } }>('/settings', data)
    return response.data.data.setting
  },

  // Update setting
  async updateSetting(key: string, data: Partial<CreateSettingData>): Promise<SystemSetting> {
    const response = await api.put<{ success: boolean; data: { setting: SystemSetting } }>(`/settings/${key}`, data)
    return response.data.data.setting
  },

  // Delete setting
  async deleteSetting(key: string): Promise<void> {
    await api.delete(`/settings/${key}`)
  },

  // Get settings by category
  async getSettingsByCategory(category: string): Promise<SystemSetting[]> {
    const response = await api.get<{ success: boolean; data: { settings: SystemSetting[] } }>(`/settings/category/${category}`)
    return response.data.data.settings
  },

  // Bulk update settings
  async bulkUpdateSettings(settings: Partial<SystemSetting>[]): Promise<SystemSetting[]> {
    const response = await api.put<{ success: boolean; data: { settings: SystemSetting[] } }>('/settings/bulk', { settings })
    return response.data.data.settings
  },

  // Get system configuration
  async getSystemConfig(): Promise<Record<string, any>> {
    const response = await api.get<{ success: boolean; data: { config: Record<string, any> } }>('/settings/config/system')
    return response.data.data.config
  }
}


