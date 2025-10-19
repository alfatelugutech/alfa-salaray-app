import React from 'react'
import { Eye, X, Camera, MapPin, Home, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'

interface AttendanceVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  attendance: any
}

const AttendanceVerificationModal: React.FC<AttendanceVerificationModalProps> = ({
  isOpen,
  onClose,
  attendance
}) => {
  if (!isOpen || !attendance) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Eye className="w-6 h-6 text-green-600" />
            Attendance Verification
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Employee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-blue-700">Employee Name</label>
                <p className="text-blue-900 font-semibold">{attendance.employee?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-700">Employee ID</label>
                <p className="text-blue-900">{attendance.employee?.employeeId || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-700">Department</label>
                <p className="text-blue-900">{attendance.employee?.department || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Attendance Details */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-3">Attendance Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-green-700">Date</label>
                <p className="text-green-900 font-semibold">{new Date(attendance.date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-green-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  attendance.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                  attendance.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                  attendance.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {attendance.status}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-green-700">Check In</label>
                <p className="text-green-900">{attendance.checkIn ? new Date(attendance.checkIn).toLocaleString() : 'Not recorded'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-green-700">Check Out</label>
                <p className="text-green-900">{attendance.checkOut ? new Date(attendance.checkOut).toLocaleString() : 'Not recorded'}</p>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          {attendance.totalHours && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Working Hours Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{attendance.totalHours}h</div>
                  <div className="text-sm text-purple-700">Total Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{(attendance as any).regularHours || 0}h</div>
                  <div className="text-sm text-blue-700">Regular Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{(attendance as any).overtimeHours || 0}h</div>
                  <div className="text-sm text-orange-700">Overtime Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{(attendance as any).breakHours || 0}h</div>
                  <div className="text-sm text-gray-700">Break Hours</div>
                </div>
              </div>
            </div>
          )}

          {/* Selfies Section */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">Employee Selfies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Check-in Selfie */}
              <div>
                <h4 className="text-md font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Check-In Selfie
                </h4>
                {(attendance as any).checkInSelfie ? (
                  <div className="relative">
                    <img 
                      src={(attendance as any).checkInSelfie} 
                      alt="Check-In Selfie" 
                      className="w-full h-64 object-cover rounded-lg border-2 border-green-500 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open((attendance as any).checkInSelfie, '_blank')}
                    />
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                      🌅 Morning Check-In
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      Click to enlarge
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Camera className="w-8 h-8 mx-auto mb-2" />
                      <p>No check-in selfie</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Check-out Selfie */}
              <div>
                <h4 className="text-md font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Check-Out Selfie
                </h4>
                {(attendance as any).checkOutSelfie ? (
                  <div className="relative">
                    <img 
                      src={(attendance as any).checkOutSelfie} 
                      alt="Check-Out Selfie" 
                      className="w-full h-64 object-cover rounded-lg border-2 border-orange-500 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open((attendance as any).checkOutSelfie, '_blank')}
                    />
                    <div className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">
                      🌆 Evening Check-Out
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      Click to enlarge
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Camera className="w-8 h-8 mx-auto mb-2" />
                      <p>No check-out selfie</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-900 mb-3">Location Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Check-in Location */}
              <div>
                <h4 className="text-md font-medium text-indigo-800 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Check-In Location
                </h4>
                {(attendance as any).checkInLocation ? (
                  <div className="p-3 bg-white rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-900 font-medium">
                      {(attendance as any).checkInLocation.address || 'Location captured'}
                    </p>
                    <p className="text-xs text-indigo-700 mt-1">
                      📍 {(attendance as any).checkInLocation.latitude?.toFixed(6)}, {(attendance as any).checkInLocation.longitude?.toFixed(6)}
                    </p>
                    <p className="text-xs text-indigo-700">
                      🎯 Accuracy: ±{(attendance as any).checkInLocation.accuracy?.toFixed(0)}m
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">No check-in location recorded</p>
                  </div>
                )}
              </div>

              {/* Check-out Location */}
              <div>
                <h4 className="text-md font-medium text-indigo-800 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Check-Out Location
                </h4>
                {(attendance as any).checkOutLocation ? (
                  <div className="p-3 bg-white rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-900 font-medium">
                      {(attendance as any).checkOutLocation.address || 'Location captured'}
                    </p>
                    <p className="text-xs text-indigo-700 mt-1">
                      📍 {(attendance as any).checkOutLocation.latitude?.toFixed(6)}, {(attendance as any).checkOutLocation.longitude?.toFixed(6)}
                    </p>
                    <p className="text-xs text-indigo-700">
                      🎯 Accuracy: ±{(attendance as any).checkOutLocation.accuracy?.toFixed(0)}m
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">No check-out location recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Device Information */}
          {(attendance as any).deviceInfo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Device Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Device Type</label>
                  <p className="text-gray-900">{(attendance as any).deviceInfo.deviceType || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Operating System</label>
                  <p className="text-gray-900">{(attendance as any).deviceInfo.os || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Browser</label>
                  <p className="text-gray-900">{(attendance as any).deviceInfo.browser || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">IP Address</label>
                  <p className="text-gray-900">{(attendance as any).ipAddress || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">Additional Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-orange-700">Remote Work</label>
                <p className="text-orange-900">
                  {attendance.isRemote ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      <Home className="w-3 h-3 mr-1" />
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      <Smartphone className="w-3 h-3 mr-1" />
                      No
                    </span>
                  )}
                </p>
              </div>
              {attendance.notes && (
                <div>
                  <label className="text-sm font-medium text-orange-700">Notes</label>
                  <p className="text-orange-900 bg-white p-2 rounded border">{attendance.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              toast.success('Attendance verified successfully!')
              onClose()
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ✅ Mark as Verified
          </button>
        </div>
      </div>
    </div>
  )
}

export default AttendanceVerificationModal
