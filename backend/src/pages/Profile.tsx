import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { User, Mail, Calendar, MapPin, Shield } from 'lucide-react'

const Profile: React.FC = () => {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">View and manage your profile information</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center md:items-start">
            <div className="h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-primary-600" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-600 capitalize">
                {user.role.replace('_', ' ').toLowerCase()}
              </p>
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Shield className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Role</p>
                  <p className="text-gray-900 capitalize">
                    {user.role.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Login</p>
                  <p className="text-gray-900">
                    {user.lastLoginAt 
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Employee ID</p>
                  <p className="text-gray-900">{user.employeeId || 'Not assigned'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">Account Status</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">System Access</span>
            <span className="text-sm text-gray-900">Full Access</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">Member Since</span>
            <span className="text-sm text-gray-900">January 2024</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button className="btn btn-outline btn-md">
            <User className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
          <button className="btn btn-outline btn-md">
            <Shield className="h-4 w-4 mr-2" />
            Change Password
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
