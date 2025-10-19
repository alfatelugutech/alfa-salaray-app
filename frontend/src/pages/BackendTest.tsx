import React, { useState, useEffect } from 'react'
import { testBackendConnection, testAPIEndpoint } from '../utils/backendTest'
import toast from 'react-hot-toast'

const BackendTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  const runTests = async () => {
    setIsLoading(true)
    const results: any = {}

    try {
      // Test backend health
      console.log('🔍 Testing backend health...')
      const healthResult = await testBackendConnection()
      results.health = healthResult
      console.log('Health test result:', healthResult)

      // Test API endpoints
      console.log('🔍 Testing API endpoints...')
      const notificationsResult = await testAPIEndpoint('/notifications')
      results.notifications = notificationsResult
      console.log('Notifications API result:', notificationsResult)

      const hrResult = await testAPIEndpoint('/hr')
      results.hr = hrResult
      console.log('HR API result:', hrResult)

      const authResult = await testAPIEndpoint('/auth')
      results.auth = authResult
      console.log('Auth API result:', authResult)

    } catch (error) {
      console.error('Test error:', error)
      results.error = error
    }

    setTestResults(results)
    setIsLoading(false)
    toast.success('Backend tests completed!')
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Backend Connection Test</h1>
        <button
          onClick={runTests}
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Testing...' : 'Run Tests Again'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health Test */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Backend Health</h3>
          {testResults.health ? (
            <div className={`p-4 rounded-lg ${
              testResults.health.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                <span className={`text-2xl mr-2 ${testResults.health.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.health.success ? '✅' : '❌'}
                </span>
                <div>
                  <p className="font-medium">
                    {testResults.health.success ? 'Backend is healthy' : 'Backend connection failed'}
                  </p>
                  {testResults.health.data && (
                    <p className="text-sm text-gray-600 mt-1">
                      Version: {testResults.health.data.version}
                    </p>
                  )}
                  {testResults.health.error && (
                    <p className="text-sm text-red-600 mt-1">
                      Error: {testResults.health.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Not tested yet</div>
          )}
        </div>

        {/* Notifications API Test */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Notifications API</h3>
          {testResults.notifications ? (
            <div className={`p-4 rounded-lg ${
              testResults.notifications.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                <span className={`text-2xl mr-2 ${testResults.notifications.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.notifications.success ? '✅' : '❌'}
                </span>
                <div>
                  <p className="font-medium">
                    {testResults.notifications.success ? 'Notifications API working' : 'Notifications API failed'}
                  </p>
                  {testResults.notifications.error && (
                    <p className="text-sm text-red-600 mt-1">
                      Error: {testResults.notifications.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Not tested yet</div>
          )}
        </div>

        {/* HR API Test */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">HR Management API</h3>
          {testResults.hr ? (
            <div className={`p-4 rounded-lg ${
              testResults.hr.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                <span className={`text-2xl mr-2 ${testResults.hr.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.hr.success ? '✅' : '❌'}
                </span>
                <div>
                  <p className="font-medium">
                    {testResults.hr.success ? 'HR API working' : 'HR API failed'}
                  </p>
                  {testResults.hr.error && (
                    <p className="text-sm text-red-600 mt-1">
                      Error: {testResults.hr.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Not tested yet</div>
          )}
        </div>

        {/* Auth API Test */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Authentication API</h3>
          {testResults.auth ? (
            <div className={`p-4 rounded-lg ${
              testResults.auth.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                <span className={`text-2xl mr-2 ${testResults.auth.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.auth.success ? '✅' : '❌'}
                </span>
                <div>
                  <p className="font-medium">
                    {testResults.auth.success ? 'Auth API working' : 'Auth API failed'}
                  </p>
                  {testResults.auth.error && (
                    <p className="text-sm text-red-600 mt-1">
                      Error: {testResults.auth.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Not tested yet</div>
          )}
        </div>
      </div>

      {/* Console Logs */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Console Logs</h3>
        <p className="text-sm text-gray-600 mb-2">
          Open your browser's Developer Tools (F12) and check the Console tab for detailed logs.
        </p>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm font-mono">
            Look for logs starting with: 🔍 Testing backend connection...
          </p>
        </div>
      </div>
    </div>
  )
}

export default BackendTest
