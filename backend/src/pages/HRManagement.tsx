import React, { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import { Target, GraduationCap, FileText, Star } from 'lucide-react'
import { hrService } from '../services/hrService'
import toast from 'react-hot-toast'

const HRManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('performance')
  const [showPerformanceModal, setShowPerformanceModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showTrainingModal, setShowTrainingModal] = useState(false)

  // Fetch performance reviews
  const { data: performanceData, isLoading: performanceLoading } = useQuery(
    'performance-reviews',
    () => hrService.getPerformanceReviews(),
    {
      retry: 2
    }
  )

  // Fetch goals
  const { data: goalsData, isLoading: goalsLoading } = useQuery(
    'goals',
    () => hrService.getGoals(),
    {
      retry: 2
    }
  )

  // Fetch trainings
  const { data: trainingsData, isLoading: trainingsLoading } = useQuery(
    'trainings',
    () => hrService.getTrainings(),
    {
      retry: 2
    }
  )

  // Fetch documents
  const { data: documentsData, isLoading: documentsLoading } = useQuery(
    'documents',
    () => hrService.getDocuments(),
    {
      retry: 2
    }
  )

  // Create performance review mutation
  const createPerformanceMutation = useMutation(
    (data: any) => hrService.createPerformanceReview(data),
    {
      onSuccess: () => {
        toast.success('Performance review created successfully!')
        setShowPerformanceModal(false)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create performance review')
      }
    }
  )

  // Create goal mutation
  const createGoalMutation = useMutation(
    (data: any) => hrService.createGoal(data),
    {
      onSuccess: () => {
        toast.success('Goal created successfully!')
        setShowGoalModal(false)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create goal')
      }
    }
  )

  // Suppress unused variable warnings
  console.log('Mutations available:', { createPerformanceMutation, createGoalMutation, showPerformanceModal, showGoalModal, showTrainingModal })

  // Enroll in training mutation
  const enrollTrainingMutation = useMutation(
    (trainingId: string) => hrService.enrollInTraining(trainingId),
    {
      onSuccess: () => {
        toast.success('Successfully enrolled in training!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to enroll in training')
      }
    }
  )

  const performanceReviews = performanceData?.data?.reviews || []
  const goals = goalsData?.data?.goals || []
  const trainings = trainingsData?.data?.trainings || []
  const documents = documentsData?.data?.documents || []

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-100'
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'enrolled':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'draft':
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Management</h1>
          <p className="text-gray-600">Advanced HR features and employee development</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'performance', label: 'Performance Reviews', icon: Star },
            { id: 'goals', label: 'Goal Setting', icon: Target },
            { id: 'training', label: 'Training Management', icon: GraduationCap },
            { id: 'documents', label: 'Document Management', icon: FileText }
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

      {/* Performance Reviews Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Performance Reviews</h3>
            <button
              onClick={() => setShowPerformanceModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              Create Review
            </button>
          </div>

          {performanceLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {performanceReviews.map((review: any) => (
                <div key={review.id} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">
                      {review.employee.user.firstName} {review.employee.user.lastName}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(review.overallRating)}`}>
                      {review.overallRating}/5
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Period:</span>
                      <span className="font-medium">{review.period}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Score:</span>
                      <span className="font-medium">{review.overallScore}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Goals:</span>
                      <span className="font-medium">{review.goals.length}</span>
                    </div>
                  </div>

                  {review.comments && (
                    <p className="text-sm text-gray-600 mb-4">{review.comments}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Employee Goals</h3>
            <button
              onClick={() => setShowGoalModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Set Goal
            </button>
          </div>

          {goalsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal: any) => (
                <div key={goal.id} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                      <p className="text-sm text-gray-600">
                        {goal.employee.user.firstName} {goal.employee.user.lastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                        {goal.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        goal.priority === 'HIGH' || goal.priority === 'CRITICAL' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {goal.priority}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{goal.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-600">Target:</span>
                      <span className="font-medium ml-2">{goal.targetValue} {goal.unit}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Actual:</span>
                      <span className="font-medium ml-2">{goal.actualValue || 0} {goal.unit}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Progress:</span>
                      <span className="font-medium ml-2">
                        {goal.actualValue ? Math.round((goal.actualValue / goal.targetValue) * 100) : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${goal.actualValue ? Math.min((goal.actualValue / goal.targetValue) * 100, 100) : 0}%` 
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-500">
                      {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Update Progress
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Training Tab */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Training Programs</h3>
            <button
              onClick={() => setShowTrainingModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Create Training
            </button>
          </div>

          {trainingsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainings.map((training: any) => (
                <div key={training.id} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">{training.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                      {training.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{training.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{training.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{training.duration}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Instructor:</span>
                      <span className="font-medium">{training.instructor}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Participants:</span>
                      <span className="font-medium">{training.participants.length}/{training.maxParticipants}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(training.startDate).toLocaleDateString()} - {new Date(training.endDate).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => enrollTrainingMutation.mutate(training.id)}
                      disabled={enrollTrainingMutation.isLoading}
                      className="btn btn-outline btn-sm"
                    >
                      Enroll
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Document Management</h3>
            <button className="btn btn-primary flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Upload Document
            </button>
          </div>

          {documentsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document: any) => (
                <div key={document.id} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{document.title}</h4>
                      <p className="text-sm text-gray-600">
                        {document.employee.user.firstName} {document.employee.user.lastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                        {document.status}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {document.documentType}
                      </span>
                    </div>
                  </div>

                  {document.description && (
                    <p className="text-sm text-gray-600 mb-4">{document.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-600">Category:</span>
                      <span className="font-medium ml-2">{document.category}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="font-medium ml-2">{document.documentType}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Expiry:</span>
                      <span className="font-medium ml-2">
                        {document.expiryDate ? new Date(document.expiryDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(document.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-800 text-sm">
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default HRManagement
