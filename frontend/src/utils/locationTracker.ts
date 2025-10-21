import { locationTrackingService, LocationTrackingRequest } from '../services/locationTrackingService'
import { getCompleteLocation } from './geolocation'

export class LocationTracker {
  private intervalId: number | null = null
  private attendanceId: string | null = null
  private isTracking: boolean = false
  private trackingInterval: number = 30000 // 30 seconds default

  constructor(intervalMs: number = 30000) {
    this.trackingInterval = intervalMs
  }

  // Start continuous location tracking
  async startTracking(attendanceId: string): Promise<void> {
    if (this.isTracking) {
      console.log('Location tracking already active')
      return
    }

    this.attendanceId = attendanceId
    this.isTracking = true

    console.log('🚀 Starting location tracking for attendance:', attendanceId)

    // Track location immediately
    await this.trackCurrentLocation()

    // Set up interval for continuous tracking
    this.intervalId = setInterval(async () => {
      if (this.isTracking && this.attendanceId) {
        await this.trackCurrentLocation()
      }
    }, this.trackingInterval)
  }

  // Stop location tracking
  async stopTracking(): Promise<void> {
    if (!this.isTracking || !this.attendanceId) {
      console.log('No active tracking to stop')
      return
    }

    console.log('🛑 Stopping location tracking for attendance:', this.attendanceId)

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    // Stop tracking on server
    try {
      await locationTrackingService.stopTracking(this.attendanceId)
      console.log('✅ Location tracking stopped successfully')
    } catch (error) {
      console.error('❌ Error stopping location tracking:', error)
    }

    // Reset state
    this.isTracking = false
    this.attendanceId = null
  }

  // Track current location
  private async trackCurrentLocation(): Promise<void> {
    if (!this.attendanceId) return

    try {
      // Get current location
      const location = await getCompleteLocation()
      
      const trackingData: LocationTrackingRequest = {
        attendanceId: this.attendanceId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address
      }

      // Send to server
      await locationTrackingService.trackLocation(trackingData)
      console.log('📍 Location tracked:', {
        lat: location.latitude,
        lng: location.longitude,
        address: location.address,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('❌ Error tracking location:', error)
    }
  }

  // Get tracking status
  getStatus(): { isTracking: boolean; attendanceId: string | null } {
    return {
      isTracking: this.isTracking,
      attendanceId: this.attendanceId
    }
  }

  // Update tracking interval
  setInterval(intervalMs: number): void {
    this.trackingInterval = intervalMs
    
    // If currently tracking, restart with new interval
    if (this.isTracking && this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = setInterval(async () => {
        if (this.isTracking && this.attendanceId) {
          await this.trackCurrentLocation()
        }
      }, this.trackingInterval)
    }
  }
}

// Create a singleton instance
export const locationTracker = new LocationTracker()
