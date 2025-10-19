import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { BarChart3, TrendingUp, Users, Clock, Download, Filter, PieChart, LineChart } from 'lucide-react'
import { analyticsService } from '../services/analyticsService'
import toast from 'react-hot-toast'

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  })
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedEmployee] = useState('')
  const [groupBy, setGroupBy] = useState('day')

  // Fetch attendance analytics
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery(
    ['attendance-analytics', dateRange, selectedDepartment, selectedEmployee, groupBy],
    () => analyticsService.getAttendanceAnalytics({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      department: selectedDepartment || undefined,
      employeeId: selectedEmployee || undefined,
      groupBy: groupBy as any
    }),
    {
      enabled: true,
      retry: 2
    }
  )

  // Fetch department analytics
  const { data: departmentData, isLoading: departmentLoading } = useQuery(
    'department-analytics',
    () => analyticsService.getDepartmentAnalytics(),
    {
      retry: 2
    }
  )

  const handleExportPDF = () => {
    toast.success('PDF export feature coming soon!')
  }

  const handleExportExcel = () => {
    toast.success('Excel export feature coming soon!')
  }

  if (attendanceLoading || departmentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const analytics = attendanceData?.data
  const departments = departmentData?.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive attendance analytics and insights</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={handleExportPDF}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments?.map((dept: any) => (
                <option key={dept.department} value={dept.department}>
                  {dept.department}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="department">Department</option>
              <option value="employee">Employee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {analytics?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.attendanceRate}%</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalHours}h</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overtime Hours</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalOvertimeHours}h</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Remote Work</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.remoteWorkRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Status Chart */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <PieChart className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Attendance Status</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Present</span>
              </div>
              <span className="text-sm font-medium">{analytics?.summary.presentDays} days</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Absent</span>
              </div>
              <span className="text-sm font-medium">{analytics?.summary.absentDays} days</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Late</span>
              </div>
              <span className="text-sm font-medium">{analytics?.summary.lateDays} days</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Half Day</span>
              </div>
              <span className="text-sm font-medium">{analytics?.summary.halfDays} days</span>
            </div>
          </div>
        </div>

        {/* Working Hours Breakdown */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Working Hours Breakdown</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Regular Hours</span>
                <span>{analytics?.summary.totalRegularHours}h</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(analytics?.summary.totalRegularHours / analytics?.summary.totalHours) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overtime Hours</span>
                <span>{analytics?.summary.totalOvertimeHours}h</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full" 
                  style={{ width: `${(analytics?.summary.totalOvertimeHours / analytics?.summary.totalHours) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Break Hours</span>
                <span>{analytics?.summary.totalBreakHours}h</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full" 
                  style={{ width: `${(analytics?.summary.totalBreakHours / analytics?.summary.totalHours) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Analytics */}
      {departments && departments.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <LineChart className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Department Analytics</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map((dept: any) => (
                  <tr key={dept.department}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dept.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dept.employeeCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dept.totalDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dept.presentDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        dept.attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
                        dept.attendanceRate >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dept.attendanceRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dept.totalHours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics
