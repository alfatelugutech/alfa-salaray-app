// Geolocation utility for Phase 2 attendance features

export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  address?: string
}

export interface DeviceInfo {
  deviceType: string
  os: string
  browser: string
  userAgent: string
}

/**
 * Get current GPS location from browser
 */
export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        reject(new Error(errorMessage))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

/**
 * Get address from coordinates using reverse geocoding
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Employee Attendance System'
        }
      }
    )
    const data = await response.json()
    return data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
  } catch (error) {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
  }
}

/**
 * Get complete location with address
 */
export const getCompleteLocation = async (): Promise<LocationData> => {
  const location = await getCurrentLocation()
  const address = await getAddressFromCoordinates(location.latitude, location.longitude)
  return {
    ...location,
    address
  }
}

/**
 * Detect device information
 */
export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent
  
  // Detect device type
  let deviceType = 'desktop'
  if (/mobile/i.test(userAgent)) {
    deviceType = 'mobile'
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = 'tablet'
  }

  // Detect OS
  let os = 'Unknown'
  if (/windows/i.test(userAgent)) {
    os = 'Windows'
  } else if (/mac/i.test(userAgent)) {
    os = 'macOS'
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux'
  } else if (/android/i.test(userAgent)) {
    os = 'Android'
  } else if (/ios|iphone|ipad/i.test(userAgent)) {
    os = 'iOS'
  }

  // Detect browser
  let browser = 'Unknown'
  if (/edg/i.test(userAgent)) {
    browser = 'Edge'
  } else if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
    browser = 'Chrome'
  } else if (/firefox/i.test(userAgent)) {
    browser = 'Firefox'
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = 'Safari'
  }

  return {
    deviceType,
    os,
    browser,
    userAgent
  }
}

/**
 * Check if geolocation is available
 */
export const isGeolocationAvailable = (): boolean => {
  return 'geolocation' in navigator
}

/**
 * Format coordinates for display
 */
export const formatCoordinates = (latitude: number, longitude: number): string => {
  return `${latitude.toFixed(6)}°, ${longitude.toFixed(6)}°`
}

/**
 * Generate Google Maps URL
 */
export const getGoogleMapsUrl = (latitude: number, longitude: number): string => {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}


