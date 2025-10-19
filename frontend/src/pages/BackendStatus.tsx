import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react'

const BackendStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkBackendStatus = async () => {
    setStatus('checking')
    setError(null)
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (response.ok) {
        await response.json()
        setStatus('online')
        setLastChecked(new Date())
      } else {
        setStatus('offline')
        setError(`HTTP ${response.status}: ${response.statusText}`)
        setLastChecked(new Date())
      }
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Connection failed')
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    checkBackendStatus()
  }, [])

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      case 'online':
        return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'offline':
        return <XCircle className="w-8 h-8 text-red-500" />
      case 'error':
        return <AlertTriangle className="w-8 h-8 text-orange-500" />
      default:
        return <AlertTriangle className="w-8 h-8 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking backend status...'
      case 'online':
        return 'Backend is online and responding'
      case 'offline':
        return 'Backend is offline or not responding'
      case 'error':
        return 'Error connecting to backend'
      default:
        return 'Unknown status'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'text-blue-600'
      case 'online':
        return 'text-green-600'
      case 'offline':
        return 'text-red-600'
      case 'error':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mb-6">
            {getStatusIcon()}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Backend Status Check
          </h1>
          
          <p className={`text-xl font-semibold mb-4 ${getStatusColor()}`}>
            {getStatusText()}
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Backend Information</h3>
            <div className="text-left space-y-2">
              <div>
                <span className="font-medium text-gray-700">API URL:</span>
                <span className="ml-2 text-gray-600 font-mono">
                  {import.meta.env.VITE_API_URL || 'Not configured'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Checked:</span>
                <span className="ml-2 text-gray-600">
                  {lastChecked ? lastChecked.toLocaleString() : 'Never'}
                </span>
              </div>
              {error && (
                <div>
                  <span className="font-medium text-red-700">Error:</span>
                  <span className="ml-2 text-red-600">{error}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={checkBackendStatus}
              disabled={status === 'checking'}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${status === 'checking' ? 'animate-spin' : ''}`} />
              {status === 'checking' ? 'Checking...' : 'Check Again'}
            </button>
            
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300"
            >
              Go to Login
            </button>
          </div>
          
          {status === 'offline' || status === 'error' ? (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Troubleshooting</h4>
              <ul className="text-sm text-yellow-700 text-left space-y-1">
                <li>• The backend server may not be deployed or running</li>
                <li>• Check if the backend service is started on Render</li>
                <li>• Verify the API URL configuration</li>
                <li>• Contact the system administrator</li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default BackendStatus
