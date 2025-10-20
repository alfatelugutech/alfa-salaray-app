// Camera utility for selfie attendance feature

/**
 * Check if camera is available
 */
export const isCameraAvailable = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

/**
 * Check camera permissions and provide user guidance
 */
export const checkCameraPermissions = async (): Promise<{ hasPermission: boolean; message: string }> => {
  try {
    if (!isCameraAvailable()) {
      return {
        hasPermission: false,
        message: 'Camera is not available on this device. Please use a device with a camera.'
      }
    }

    // Try to get camera access to check permissions
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    
    // Stop the stream immediately as we were just checking permissions
    stream.getTracks().forEach(track => track.stop())
    
    return {
      hasPermission: true,
      message: 'Camera access granted successfully!'
    }
  } catch (error: any) {
    console.error('❌ Camera permission check failed:', error)
    
    let message = 'Camera access failed'
    
    if (error.name === 'NotAllowedError') {
      message = 'Camera permission denied. Please click "Allow" when prompted for camera access.'
    } else if (error.name === 'NotFoundError') {
      message = 'No camera found. Please check if your device has a camera.'
    } else if (error.name === 'NotReadableError') {
      message = 'Camera is being used by another app. Please close other camera applications.'
    } else {
      message = `Camera error: ${error.message || 'Unknown error'}`
    }
    
    return {
      hasPermission: false,
      message
    }
  }
}

/**
 * Capture photo from camera
 */
export const captureSelfie = async (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    if (!isCameraAvailable()) {
      reject(new Error('Camera is not available on this device'))
      return
    }

    let stream: MediaStream | null = null
    
    try {
      // Try with strict constraints first
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user', // Front camera (selfie mode)
            width: { ideal: 600, min: 300 },
            height: { ideal: 600, min: 300 }
          }
        })
      } catch (strictError) {
        console.log('⚠️ Strict constraints failed, trying relaxed constraints:', strictError)
        
        // Fallback to relaxed constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user'
            }
          })
        } catch (relaxedError) {
          console.log('⚠️ Relaxed constraints failed, trying basic video:', relaxedError)
          
          // Final fallback to basic video
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          })
        }
      }

      // Create video element
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      await video.play()

      // Wait for video to be ready
      await new Promise(resolve => setTimeout(resolve, 500))

      // Create canvas for capture with passport size (600x600)
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 600
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d')
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
      }

      // Stop camera
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      resolve(imageData)
    } catch (error: any) {
      // Clean up stream if it exists
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      
      console.error('❌ Camera capture error:', error)
      
      let errorMessage = 'Failed to capture photo'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device. Please check your camera connection.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application. Please close other camera apps and try again.'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported. Please try again.'
      } else if (error.name === 'AbortError') {
        errorMessage = 'Camera access was interrupted. Please try again.'
      } else {
        errorMessage = `Camera error: ${error.message || 'Unknown error'}`
      }
      
      reject(new Error(errorMessage))
    }
  })
}

/**
 * Select and read image from file input
 */
export const selectImageFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file'))
      return
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      reject(new Error('Image size must be less than 5MB'))
      return
    }

    const reader = new FileReader()
    
    reader.onload = (e) => {
      const result = e.target?.result as string
      resolve(result)
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Compress image to passport size (600x600) with optimal quality
 */
export const compressImage = async (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      
      // Set canvas to passport size (600x600)
      canvas.width = 600
      canvas.height = 600

      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Draw image centered and scaled to fit passport size
        ctx.drawImage(img, 0, 0, 600, 600)
      }

      // Compress with high quality for passport size
      const compressed = canvas.toDataURL('image/jpeg', 0.9)
      resolve(compressed)
    }

    img.src = dataUrl
  })
}

/**
 * Get thumbnail from image
 */
export const getImageThumbnail = async (dataUrl: string): Promise<string> => {
  return compressImage(dataUrl)
}

