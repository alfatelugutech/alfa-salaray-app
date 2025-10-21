import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Settings, Save, RefreshCw, Calculator, DollarSign, Clock, TrendingUp, Target, RotateCcw } from 'lucide-react'
import { payrollSettingsService, type PayrollSettings, type PayrollMethod } from '../services/payrollSettingsService'
import toast from 'react-hot-toast'

const PayrollSettings: React.FC = () => {
  const [settings, setSettings] = useState<Partial<PayrollSettings>>({})
  const [methods, setMethods] = useState<PayrollMethod[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  // Fetch current settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery(
    'payroll-settings',
    payrollSettingsService.getSettings
  )

  // Fetch available methods
  const { data: methodsData, isLoading: methodsLoading } = useQuery(
    'payroll-methods',
    payrollSettingsService.getMethods
  )

  // Update settings mutation
  const updateSettingsMutation = useMutation(payrollSettingsService.updateSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('payroll-settings')
      setIsEditing(false)
      toast.success('Payroll settings updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update settings')
    }
  })

  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData)
    }
  }, [settingsData])

  useEffect(() => {
    if (methodsData) {
      setMethods(methodsData)
    }
  }, [methodsData])

  const handleSave = () => {
    updateSettingsMutation.mutate(settings)
  }

  const handleReset = () => {
    if (settingsData) {
      setSettings(settingsData)
      setIsEditing(false)
    }
  }

  const getMethodIcon = (method: string) => {
    const methodData = methods.find(m => m.value === method)
    return methodData?.icon || '💰'
  }

  const getMethodLabel = (method: string) => {
    const methodData = methods.find(m => m.value === method)
    return methodData?.label || method
  }

  if (settingsLoading || methodsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Payroll Settings
          </h2>
          <p className="text-gray-600 mt-1">
            Configure payroll calculation methods and system-wide settings
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleReset}
                className="btn btn-secondary flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={updateSettingsMutation.isLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Edit Settings
            </button>
          )}
        </div>
      </div>

      {/* Current Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Default Method */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Default Calculation Method
            </h3>
          </div>
          <div className="card-body">
            {isEditing ? (
              <select
                value={settings.defaultMethod || 'FIXED_SALARY'}
                onChange={(e) => setSettings({ ...settings, defaultMethod: e.target.value as any })}
                className="input w-full"
              >
                {methods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.icon} {method.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getMethodIcon(settings.defaultMethod || 'FIXED_SALARY')}</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {getMethodLabel(settings.defaultMethod || 'FIXED_SALARY')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {methods.find(m => m.value === settings.defaultMethod)?.description}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overtime Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Overtime Configuration
            </h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">Overtime Multiplier</label>
              {isEditing ? (
                <input
                  type="number"
                  value={settings.overtimeMultiplier || 1.5}
                  onChange={(e) => setSettings({ ...settings, overtimeMultiplier: Number(e.target.value) })}
                  className="input"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                />
              ) : (
                <div className="text-lg font-semibold text-blue-600">
                  {settings.overtimeMultiplier || 1.5}x
                </div>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Multiplier for overtime hours (e.g., 1.5x means 50% extra pay)
              </p>
            </div>

            <div>
              <label className="label">Overtime Threshold (hours per day)</label>
              {isEditing ? (
                <input
                  type="number"
                  value={settings.overtimeThreshold || 8}
                  onChange={(e) => setSettings({ ...settings, overtimeThreshold: Number(e.target.value) })}
                  className="input"
                  min="4"
                  max="12"
                />
              ) : (
                <div className="text-lg font-semibold text-orange-600">
                  {settings.overtimeThreshold || 8} hours
                </div>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Hours after which overtime rate applies
              </p>
            </div>
          </div>
        </div>

        {/* Regular Hours */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Regular Hours Configuration
            </h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">Regular Hours Per Month</label>
              {isEditing ? (
                <input
                  type="number"
                  value={settings.regularHoursPerMonth || 160}
                  onChange={(e) => setSettings({ ...settings, regularHoursPerMonth: Number(e.target.value) })}
                  className="input"
                  min="80"
                  max="200"
                />
              ) : (
                <div className="text-lg font-semibold text-green-600">
                  {settings.regularHoursPerMonth || 160} hours
                </div>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Standard working hours per month (40 hours/week × 4 weeks)
              </p>
            </div>

            <div>
              <label className="label">Regular Hours Per Day</label>
              {isEditing ? (
                <input
                  type="number"
                  value={settings.regularHoursPerDay || 8}
                  onChange={(e) => setSettings({ ...settings, regularHoursPerDay: Number(e.target.value) })}
                  className="input"
                  min="4"
                  max="12"
                />
              ) : (
                <div className="text-lg font-semibold text-purple-600">
                  {settings.regularHoursPerDay || 8} hours
                </div>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Standard working hours per day
              </p>
            </div>
          </div>
        </div>

        {/* Available Methods */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Available Calculation Methods
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {methods.map((method) => (
                <div
                  key={method.value}
                  className={`p-3 rounded-lg border ${
                    settings.defaultMethod === method.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{method.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{method.label}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <strong>Calculation:</strong> {method.calculation}
                      </div>
                    </div>
                    {settings.defaultMethod === method.value && (
                      <div className="text-blue-600 font-medium text-sm">Current</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settings History */}
      {settingsData && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Settings Information</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Last Updated:</span>
                <div className="font-medium">
                  {new Date(settingsData.updatedAt).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Updated By:</span>
                <div className="font-medium">
                  {settingsData.updatedByUser.firstName} {settingsData.updatedByUser.lastName}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PayrollSettings
