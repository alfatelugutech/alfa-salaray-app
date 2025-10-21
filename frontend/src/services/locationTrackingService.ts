import api from './api'

export interface LocationTrackingData {
  id: string
  attendanceId: string
  employeeId: string
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
  timestamp: string
  isActive: boolean
}

export interface LocationTrackingRequest {
  attendanceId: string
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
}

export const locationTrackingService = {
  // Track employee location
  async trackLocation(data: LocationTrackingRequest): Promise<{ success: boolean; data: { locationRecord: LocationTrackingData } }> {
    const response = await api.post<{ success: boolean; data: { locationRecord: LocationTrackingData } }>('/location-tracking/track', data)
    return response.data
  },

  // Get location history for an attendance record (employee view)
  async getLocationHistory(attendanceId: string): Promise<{ success: boolean; data: { locationHistory: LocationTrackingData[] } }> {
    const response = await api.get<{ success: boolean; data: { locationHistory: LocationTrackingData[] } }>(`/location-tracking/attendance/${attendanceId}`)
    return response.data
  },

  // Get location history for admin view
  async getAdminLocationHistory(attendanceId: string): Promise<{ success: boolean; data: { locationHistory: LocationTrackingData[] } }> {
    const response = await api.get<{ success: boolean; data: { locationHistory: LocationTrackingData[] } }>(`/location-tracking/admin/attendance/${attendanceId}`)
    return response.data
  },

  // Stop location tracking
  async stopTracking(attendanceId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(`/location-tracking/stop/${attendanceId}`)
    return response.data
  }
}
