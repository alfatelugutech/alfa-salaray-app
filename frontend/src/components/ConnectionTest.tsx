import React, { useState, useEffect } from 'react'
import { checkBackendHealth } from '../services/api'
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react'

const ConnectionTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await checkBackendHealth()
      setIsConnected(result.isHealthy)
      setLastCheck(new Date())
      
      if (!result.isHealthy) {
        setError(result.error)
      }
    } catch (err: any) {
      setIsConnected(false)
      setError(err.message)
      setLastCheck(new Date())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Test connection on component mount
    testConnection()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Backend Connection</h3>
        <button
          onClick={testConnection}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Again'}
        </button>
      </div>

      <div className="flex items-center space-x-3">
        {isConnected === null ? (
          <AlertCircle className="w-5 h-5 text-gray-400" />
        ) : isConnected ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <WifiOff className="w-5 h-5 text-red-500" />
        )}
        
        <div className="flex-1">
          {isConnected === null && (
            <p className="text-gray-600">Testing connection...</p>
          )}
          {isConnected === true && (
            <div>
              <p className="text-green-600 font-medium">✅ Backend is running</p>
              {lastCheck && (
                <p className="text-xs text-gray-500">
                  Last checked: {lastCheck.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
          {isConnected === false && (
            <div>
              <p className="text-red-600 font-medium">❌ Cannot connect to backend</p>
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
              {lastCheck && (
                <p className="text-xs text-gray-500">
                  Last checked: {lastCheck.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {isConnected === false && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="text-sm font-medium text-red-800 mb-2">Troubleshooting:</h4>
          <ul className="text-xs text-red-700 space-y-1">
            <li>• Check if the backend server is running</li>
            <li>• Verify your internet connection</li>
            <li>• Try refreshing the page</li>
            <li>• Contact support if the issue persists</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default ConnectionTest
