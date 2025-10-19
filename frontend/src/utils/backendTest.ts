// Backend connection test utility
export const testBackendConnection = async () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  
  try {
    console.log('🔍 Testing backend connection...')
    console.log('📍 Backend URL:', API_BASE_URL)
    
    // Test health endpoint
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`)
    console.log('🏥 Health check status:', healthResponse.status)
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('✅ Backend is healthy:', healthData)
      return { success: true, data: healthData }
    } else {
      console.error('❌ Health check failed:', healthResponse.status)
      return { success: false, error: `Health check failed: ${healthResponse.status}` }
    }
  } catch (error) {
    console.error('❌ Backend connection failed:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Test API endpoint
export const testAPIEndpoint = async (endpoint: string) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  
  try {
    console.log(`🔍 Testing API endpoint: ${endpoint}`)
    const response = await fetch(`${API_BASE_URL}${endpoint}`)
    console.log(`📊 Response status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API endpoint working:', data)
      return { success: true, data }
    } else {
      console.error('❌ API endpoint failed:', response.status)
      return { success: false, error: `API failed: ${response.status}` }
    }
  } catch (error) {
    console.error('❌ API endpoint error:', error)
    return { success: false, error: (error as Error).message }
  }
}
