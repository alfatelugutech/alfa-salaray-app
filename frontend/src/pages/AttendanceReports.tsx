import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Home, BarChart3 } from 'lucide-react'
import { attendanceService } from '../services/attendanceService'
import { employeeService } from '../services/employeeService'

const AttendanceReports: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [smartInsights, setSmartInsights] = useState<any>(null)

  // Fetch employees
  const { data: employeesData } = useQuery(
    'employees',
    () => employeeService.getEmployees({ page: 1, limit: 1000 })
  )

  // Fetch attendance data for the month
  const { data: attendanceData, isLoading } = useQuery(
    ['attendance-reports', selectedMonth, selectedEmployee],
    () => {
      const startDate = new Date(selectedMonth + '-01')
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
      
      return attendanceService.getAttendance({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        employeeId: selectedEmployee !== 'all' ? selectedEmployee : undefined
      })
    },
    {
      onSuccess: (data) => {
        console.log('📊 Attendance Reports Data:', {
          selectedMonth,
          selectedEmployee,
          data: data,
          attendances: data?.data?.attendances
        })
      }
    }
  )

  // Smart insights calculation
  const calculateSmartInsights = (data: any) => {
    if (!data?.data?.attendances) return null
    
    const attendances = data.data.attendances
    const totalDays = attendances.length
    const presentDays = attendances.filter((att: any) => att.status === 'PRESENT').length
    const lateDays = attendances.filter((att: any) => att.status === 'LATE').length
    const absentDays = attendances.filter((att: any) => att.status === 'ABSENT').length
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    
    return {
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      attendanceRate,
      insights: [
        attendanceRate >= 95 ? '🌟 Excellent attendance record!' : 
        attendanceRate >= 85 ? '👍 Good attendance performance' :
        attendanceRate >= 70 ? '⚠️ Attendance needs improvement' : '🚨 Poor attendance record',
        lateDays > 0 ? `⏰ ${lateDays} late arrival${lateDays > 1 ? 's' : ''} this month` : '✅ No late arrivals',
        absentDays > 0 ? `❌ ${absentDays} absent day${absentDays > 1 ? 's' : ''} this month` : '✅ Perfect attendance'
      ]
    }
  }

  // Generate calendar data
  const generateCalendarData = () => {
    const year = parseInt(selectedMonth.split('-')[0])
    const month = parseInt(selectedMonth.split('-')[1]) - 1
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)
    
    const calendar = []
    const currentDate = new Date(startDate)
    
    // Add empty cells for days before month starts
    const startDay = startDate.getDay()
    for (let i = 0; i < startDay; i++) {
      calendar.push({ date: null, attendance: null })
    }
    
    // Add days of the month
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const attendance = attendanceData?.data?.attendances?.find(
        (att: any) => {
          // Handle different date formats
          const attDate = new Date(att.date).toISOString().split('T')[0]
          return attDate === dateStr
        }
      )
      
      console.log('📅 Calendar day:', {
        date: dateStr,
        hasAttendance: !!attendance,
        attendance: attendance,
        allAttendances: attendanceData?.data?.attendances
      })
      
      calendar.push({
        date: new Date(currentDate),
        attendance: attendance
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return calendar
  }

  // Get status color for calendar
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-500'
      case 'LATE': return 'bg-yellow-500'
      case 'ABSENT': return 'bg-red-500'
      case 'HALF_DAY': return 'bg-blue-500'
      case 'EARLY_LEAVE': return 'bg-orange-500'
      default: return 'bg-gray-300'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return <CheckCircle className="w-4 h-4 text-white" />
      case 'LATE': return <Clock className="w-4 h-4 text-white" />
      case 'ABSENT': return <XCircle className="w-4 h-4 text-white" />
      case 'HALF_DAY': return <AlertCircle className="w-4 h-4 text-white" />
      case 'EARLY_LEAVE': return <Home className="w-4 h-4 text-white" />
      default: return <div className="w-4 h-4" />
    }
  }

  // Calculate statistics
  const calculateStats = () => {
    if (!attendanceData?.data?.attendances) return null
    
    const attendances = attendanceData.data.attendances
    const totalDays = attendances.length
    const presentCount = attendances.filter((att: any) => att.status === 'PRESENT').length
    const lateCount = attendances.filter((att: any) => att.status === 'LATE').length
    const absentCount = attendances.filter((att: any) => att.status === 'ABSENT').length
    const halfDayCount = attendances.filter((att: any) => att.status === 'HALF_DAY').length
    const earlyLeaveCount = attendances.filter((att: any) => att.status === 'EARLY_LEAVE').length
    
    const attendanceRate = totalDays > 0 ? ((presentCount + lateCount) / totalDays) * 100 : 0
    
    return {
      totalDays,
      presentCount,
      lateCount,
      absentCount,
      halfDayCount,
      earlyLeaveCount,
      attendanceRate
    }
  }

  const stats = calculateStats()
  const calendarData = generateCalendarData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-gray-600">Visual attendance tracking and analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Select Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Select Employee</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="input"
          >
            <option value="all">All Employees</option>
            {employeesData?.data?.employees?.map((employee: any) => (
              <option key={employee.id} value={employee.id}>
                {employee.user.firstName} {employee.user.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Days</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDays}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.presentCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lateCount}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absentCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Rate */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Attendance Rate</h3>
            <div className="text-3xl font-bold text-blue-600">
              {stats.attendanceRate.toFixed(1)}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${stats.attendanceRate}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Monthly Calendar View
          </h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading attendance data...</p>
            </div>
          ) : !attendanceData?.data?.attendances?.length ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance data found for this month</p>
              <p className="text-sm text-gray-500 mt-2">
                Try selecting a different month or employee
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarData.map((day, index) => (
                <div
                  key={index}
                  className={`p-2 min-h-[60px] border rounded-lg flex flex-col items-center justify-center relative ${
                    day.date ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                  }`}
                >
                  {day.date && (
                    <>
                      <div className="text-sm font-medium text-gray-900">
                        {day.date.getDate()}
                      </div>
                      {day.attendance ? (
                        <div className="mt-1 flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${getStatusColor(day.attendance.status)} shadow-sm`}></div>
                          <div className="text-xs text-gray-600 mt-1">
                            {day.attendance.status}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Half Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Early Leave</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendanceReports
