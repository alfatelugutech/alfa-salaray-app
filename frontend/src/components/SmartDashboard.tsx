import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  Brain,
  Zap,
  Calendar,
  Award,
  Activity
} from 'lucide-react'
import { smartAnalyticsService } from '../services/smartAnalyticsService'
import { useAuth } from '../hooks/useAuth'

interface SmartDashboardProps {
  employeeId?: string
}

const SmartDashboard: React.FC<SmartDashboardProps> = ({ employeeId }) => {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  
  // Get smart insights
  const { data: insights, isLoading: insightsLoading } = useQuery(
    ['smart-insights', employeeId, selectedPeriod],
    () => smartAnalyticsService.getSmartInsights(
      employeeId || user?.id || '', 
      new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ),
    { enabled: !!employeeId || !!user?.id }
  )

  // Get productivity metrics
  const { data: productivity, isLoading: productivityLoading } = useQuery(
    ['productivity', employeeId, selectedPeriod],
    () => smartAnalyticsService.getProductivityMetrics(
      employeeId || user?.id || '',
      new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ),
    { enabled: !!employeeId || !!user?.id }
  )

  // Get smart predictions
  const { data: predictions, isLoading: predictionsLoading } = useQuery(
    ['predictions', employeeId],
    () => smartAnalyticsService.getSmartPredictions(employeeId || user?.id || ''),
    { enabled: !!employeeId || !!user?.id }
  )

  // Get team analytics
  const { data: teamAnalytics, isLoading: teamLoading } = useQuery(
    ['team-analytics', selectedPeriod],
    () => smartAnalyticsService.getTeamAnalytics(
      new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    )
  )

  // Get smart notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery(
    ['smart-notifications'],
    () => smartAnalyticsService.getSmartNotifications()
  )

  if (insightsLoading || productivityLoading || predictionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Smart Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Smart Analytics Dashboard
            </h2>
            <p className="text-blue-100 mt-1">
              AI-powered insights and predictions for better workforce management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Smart Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Smart Alerts
          </h3>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border-l-4 ${
                  notification.type === 'WARNING' ? 'border-orange-500 bg-orange-50' :
                  notification.type === 'SUCCESS' ? 'border-green-500 bg-green-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    notification.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    notification.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {notification.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Overview */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {insights.insights.attendanceRate.toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${insights.insights.attendanceRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consistency Score</p>
                <p className="text-2xl font-bold text-blue-600">
                  {insights.patterns.consistency}%
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${insights.patterns.consistency}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance Level</p>
                <p className="text-lg font-bold text-purple-600">
                  {insights.performance.level}
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {insights.performance.message}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trend</p>
                <p className="text-lg font-bold text-orange-600">
                  {insights.patterns.trends.trend}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Change: {insights.patterns.trends.change} days
            </p>
          </div>
        </div>
      )}

      {/* Productivity Metrics */}
      {productivity && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Productivity Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Avg Working Hours</p>
              <p className="text-2xl font-bold text-green-600">
                {productivity.averageWorkingHours}h
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Efficiency Score</p>
              <p className="text-2xl font-bold text-blue-600">
                {productivity.efficiencyScore}%
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Work-Life Balance</p>
              <p className="text-2xl font-bold text-purple-600">
                {productivity.workLifeBalance}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Smart Predictions */}
      {predictions && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Predictions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Next Week Forecast</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Expected Attendance:</span>
                  <span className="font-medium">{predictions.nextWeekPrediction.expectedAttendance} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <span className="font-medium">{predictions.nextWeekPrediction.confidence}%</span>
                </div>
                {predictions.nextWeekPrediction.riskFactors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-1">Risk Factors:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {predictions.nextWeekPrediction.riskFactors.map((risk, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Performance Forecast</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Trend:</span>
                  <span className={`font-medium ${
                    predictions.performanceForecast.trend === 'UP' ? 'text-green-600' :
                    predictions.performanceForecast.trend === 'DOWN' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {predictions.performanceForecast.trend}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Projected Score:</span>
                  <span className="font-medium">{predictions.performanceForecast.projectedScore}%</span>
                </div>
                {predictions.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Recommendations:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {predictions.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Analytics */}
      {teamAnalytics && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            Team Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Team Overview</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Attendance:</span>
                  <span className="font-medium">{teamAnalytics.teamPerformance.averageAttendance}%</span>
                </div>
                {teamAnalytics.teamPerformance.topPerformers.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Top Performers:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {teamAnalytics.teamPerformance.topPerformers.map((performer, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{performer.name}</span>
                          <span className="font-medium">{performer.score}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Department Comparison</h4>
              <div className="space-y-2">
                {teamAnalytics.departmentComparison.map((dept, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{dept.department}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{dept.attendanceRate}%</div>
                      <div className="text-xs text-gray-500">Productivity: {dept.productivity}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Recommendations */}
      {insights && insights.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Smart Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                </div>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartDashboard
