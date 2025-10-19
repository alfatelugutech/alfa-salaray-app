// Camera utility for selfie attendance feature

/**
 * Check if camera is available
 */
export const isCameraAvailable = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
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

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera (selfie mode)
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })

      // Create video element
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      await video.play()

      // Wait for video to be ready
      await new Promise(resolve => setTimeout(resolve, 500))

      // Create canvas for capture
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d')
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
      }

      // Stop camera
      stream.getTracks().forEach(track => track.stop())

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      resolve(imageData)
    } catch (error: any) {
      let errorMessage = 'Failed to capture photo'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.'
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
 * Compress image to reduce file size
 */
export const compressImage = async (dataUrl: string, maxWidth: number = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
      }

      // Convert to base64 with compression
      const compressed = canvas.toDataURL('image/jpeg', 0.7)
      resolve(compressed)
    }

    img.src = dataUrl
  })
}

/**
 * Get thumbnail from image
 */
export const getImageThumbnail = async (dataUrl: string): Promise<string> => {
  return compressImage(dataUrl, 200)
}

