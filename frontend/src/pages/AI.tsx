import React, { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import { Bot, TrendingUp, AlertTriangle, Calendar, MessageSquare, Zap, BarChart3 } from 'lucide-react'
import { aiService } from '../services/aiService'
import toast from 'react-hot-toast'

const AI: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chatbot')
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [smartScheduleData, setSmartScheduleData] = useState({
    department: '',
    startDate: '',
    endDate: ''
  })

  // Fetch predictive analytics
  const { data: predictionsData, isLoading: predictionsLoading } = useQuery(
    'predictive-analytics',
    () => aiService.getPredictiveAnalytics(),
    {
      retry: 2
    }
  )

  // Smart scheduling mutation
  const smartScheduleMutation = useMutation(
    (data: any) => aiService.generateSmartSchedule(data),
    {
      onSuccess: () => {
        toast.success('Smart schedule generated successfully!')
        setSmartScheduleData({ department: '', startDate: '', endDate: '' })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to generate smart schedule')
      }
    }
  )

  // Anomaly detection mutation
  const anomalyDetectionMutation = useMutation(
    (data: any) => aiService.detectAnomalies(data),
    {
      onSuccess: () => {
        toast.success('Anomaly detection completed!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to detect anomalies')
      }
    }
  )

  // Chatbot mutation
  const chatbotMutation = useMutation(
    (message: string) => aiService.sendChatbotMessage(message),
    {
      onSuccess: (response) => {
        const newMessage = {
          id: Date.now(),
          type: 'user',
          message: chatMessage,
          timestamp: new Date()
        }
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          message: response.data.response,
          intent: response.data.intent,
          confidence: response.data.confidence,
          suggestions: response.data.suggestions,
          timestamp: new Date()
        }
        setChatHistory(prev => [...prev, newMessage, botResponse])
        setChatMessage('')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to send message')
      }
    }
  )

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (chatMessage.trim()) {
      chatbotMutation.mutate(chatMessage)
    }
  }

  const handleSmartSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    smartScheduleMutation.mutate(smartScheduleData)
  }

  const handleAnomalyDetection = () => {
    anomalyDetectionMutation.mutate({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    })
  }

  const predictions = predictionsData?.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI & Automation</h1>
          <p className="text-gray-600">Smart features powered by artificial intelligence</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'chatbot', label: 'AI Chatbot', icon: Bot },
            { id: 'smart-schedule', label: 'Smart Scheduling', icon: Calendar },
            { id: 'anomaly', label: 'Anomaly Detection', icon: AlertTriangle },
            { id: 'predictions', label: 'Predictive Analytics', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Chatbot Tab */}
      {activeTab === 'chatbot' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <Bot className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              </div>
              
              <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <Bot className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Start a conversation with our AI assistant!</p>
                    <p className="text-sm">Ask about attendance, leave requests, payroll, or any system features.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatHistory.map((message) => (
                      <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white border border-gray-200'
                        }`}>
                          <p className="text-sm">{message.message}</p>
                          {message.type === 'bot' && (
                            <div className="mt-2 text-xs text-gray-500">
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100">
                                {message.intent} ({Math.round(message.confidence * 100)}%)
                              </span>
                            </div>
                          )}
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.suggestions.map((suggestion: string, index: number) => (
                                <button
                                  key={index}
                                  onClick={() => setChatMessage(suggestion)}
                                  className="block w-full text-left text-xs text-blue-600 hover:text-blue-800"
                                >
                                  💡 {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask me anything about the system..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={chatbotMutation.isLoading}
                />
                <button
                  type="submit"
                  disabled={chatbotMutation.isLoading || !chatMessage.trim()}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send
                </button>
              </form>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="card p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setChatMessage("How do I mark my attendance?")}
                  className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
                >
                  📅 Mark Attendance
                </button>
                <button
                  onClick={() => setChatMessage("How do I request leave?")}
                  className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
                >
                  🏖️ Request Leave
                </button>
                <button
                  onClick={() => setChatMessage("How do I check my payroll?")}
                  className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
                >
                  💰 Check Payroll
                </button>
                <button
                  onClick={() => setChatMessage("What system features are available?")}
                  className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
                >
                  🔧 System Features
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Scheduling Tab */}
      {activeTab === 'smart-schedule' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Smart Scheduling</h3>
            </div>
            
            <form onSubmit={handleSmartSchedule} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={smartScheduleData.department}
                  onChange={(e) => setSmartScheduleData({ ...smartScheduleData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={smartScheduleData.startDate}
                  onChange={(e) => setSmartScheduleData({ ...smartScheduleData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={smartScheduleData.endDate}
                  onChange={(e) => setSmartScheduleData({ ...smartScheduleData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={smartScheduleMutation.isLoading}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Generate Smart Schedule
                </button>
              </div>
            </form>
          </div>
          
          {smartScheduleMutation.data && (
            <div className="card p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Generated Schedule</h4>
              <div className="space-y-2">
                {smartScheduleMutation.data.data.schedule.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{item.employeeName}</span>
                      <span className="text-sm text-gray-500 ml-2">{item.date}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.shiftName} ({item.startTime} - {item.endTime})
                    </div>
                    <div className="text-sm text-blue-600">
                      {Math.round(item.confidence * 100)}% confidence
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Anomaly Detection Tab */}
      {activeTab === 'anomaly' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Anomaly Detection</h3>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">Detect unusual patterns in attendance data</p>
              <button
                onClick={handleAnomalyDetection}
                disabled={anomalyDetectionMutation.isLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Detect Anomalies
              </button>
            </div>
            
            {anomalyDetectionMutation.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {anomalyDetectionMutation.data.data.summary.anomaliesDetected}
                    </div>
                    <div className="text-sm text-red-600">Anomalies Detected</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {anomalyDetectionMutation.data.data.summary.anomalyRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-yellow-600">Anomaly Rate</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {anomalyDetectionMutation.data.data.summary.riskLevel.toUpperCase()}
                    </div>
                    <div className="text-sm text-blue-600">Risk Level</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {anomalyDetectionMutation.data.data.anomalies.map((anomaly: any, index: number) => (
                    <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-red-900">{anomaly.employeeName}</span>
                          <span className="text-sm text-red-600 ml-2">{anomaly.date}</span>
                        </div>
                        <span className="text-sm text-red-600">
                          {Math.round(anomaly.score * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">{anomaly.description}</p>
                      <p className="text-xs text-red-600 mt-1">Recommendation: {anomaly.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Predictive Analytics Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {predictionsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card p-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Attendance Predictions</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expected Rate</span>
                    <span className="font-semibold">{predictions?.predictions?.nextWeekAttendance?.expectedAttendance}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Confidence</span>
                    <span className="font-semibold">{Math.round(predictions?.confidence?.attendance * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Trend</span>
                    <span className={`font-semibold ${
                      predictions?.trends?.attendanceTrend === 'increasing' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {predictions?.trends?.attendanceTrend}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center mb-4">
                  <BarChart3 className="w-5 h-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Overtime Forecast</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expected Hours</span>
                    <span className="font-semibold">{predictions?.predictions?.overtimeForecast?.expectedOvertime}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Confidence</span>
                    <span className="font-semibold">{Math.round(predictions?.confidence?.overtime * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Trend</span>
                    <span className={`font-semibold ${
                      predictions?.trends?.overtimeTrend === 'stable' ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {predictions?.trends?.overtimeTrend}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Leave Forecast</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expected Requests</span>
                    <span className="font-semibold">{predictions?.predictions?.leaveForecast?.expectedLeaveRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Confidence</span>
                    <span className="font-semibold">{Math.round(predictions?.confidence?.leave * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Trend</span>
                    <span className={`font-semibold ${
                      predictions?.trends?.leaveTrend === 'decreasing' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {predictions?.trends?.leaveTrend}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AI
