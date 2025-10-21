import api from './api'

export interface Backup {
  id: string
  name: string
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  size: number
  createdAt: string
  completedAt?: string
  downloadUrl?: string
}

export const backupService = {
  // Get all backups
  async getBackups(): Promise<Backup[]> {
    const response = await api.get('/backup')
    return response.data.data
  },

  // Create new backup
  async createBackup(data: {
    name: string
    type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL'
    includeData?: boolean
    includeFiles?: boolean
  }): Promise<Backup> {
    const response = await api.post('/backup', data)
    return response.data.data
  },

  // Download backup
  async downloadBackup(backupId: string): Promise<Blob> {
    const response = await api.get(`/backup/${backupId}/download`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Delete backup
  async deleteBackup(backupId: string): Promise<void> {
    await api.delete(`/backup/${backupId}`)
  },

  // Restore from backup
  async restoreBackup(backupId: string): Promise<void> {
    await api.post(`/backup/${backupId}/restore`)
  },

  // Get backup status
  async getBackupStatus(backupId: string): Promise<Backup> {
    const response = await api.get(`/backup/${backupId}/status`)
    return response.data.data
  },

  // Schedule automatic backups
  async scheduleBackup(data: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
    time: string
    type: 'FULL' | 'INCREMENTAL'
    retentionDays: number
  }): Promise<void> {
    await api.post('/backup/schedule', data)
  },

  // Get backup schedule
  async getBackupSchedule(): Promise<any> {
    const response = await api.get('/backup/schedule')
    return response.data.data
  }
}
