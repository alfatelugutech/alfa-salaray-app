import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Edit, Trash2, DollarSign, Calendar, User, CheckCircle, Clock, Calculator, CreditCard, Banknote, Smartphone, FileText, Coins, MoreHorizontal } from 'lucide-react'
import { payrollService } from '../services/payrollService'
import { employeeService } from '../services/employeeService'
import { attendanceService } from '../services/attendanceService'
import { Payroll, CreatePayrollData, Employee } from '../types'
import toast from 'react-hot-toast'

const PayrollManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [workingHoursData, setWorkingHoursData] = useState<any>(null)
  
  // Payment-related state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)
  const [selectedPayrolls, setSelectedPayrolls] = useState<string[]>([])
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: '',
    paymentNotes: ''
  })

  const queryClient = useQueryClient()

  // Calculate working hours for selected employee
  const calculateWorkingHours = async () => {
    if (!selectedEmployee || !monthFilter || !yearFilter) {
      toast.error('Please select employee, month, and year')
      return
    }

    try {
      const response = await attendanceService.getAttendance({
        employeeId: selectedEmployee,
        startDate: `${yearFilter}-${monthFilter.toString().padStart(2, '0')}-01`,
        endDate: `${yearFilter}-${monthFilter.toString().padStart(2, '0')}-31`,
        limit: 100
      })

      if (response.data.attendances) {
        let totalRegularHours = 0
        let totalOvertimeHours = 0
        let totalBreakHours = 0
        let totalWorkingDays = 0

        response.data.attendances.forEach((attendance: any) => {
          if (attendance.regularHours) totalRegularHours += Number(attendance.regularHours)
          if (attendance.overtimeHours) totalOvertimeHours += Number(attendance.overtimeHours)
          if (attendance.breakHours) totalBreakHours += Number(attendance.breakHours)
          if (attendance.status === 'PRESENT' || attendance.status === 'HALF_DAY') totalWorkingDays++
        })

        setWorkingHoursData({
          totalRegularHours,
          totalOvertimeHours,
          totalBreakHours,
          totalWorkingDays,
          totalHours: totalRegularHours + totalOvertimeHours
        })

        toast.success('Working hours calculated successfully!')
      }
    } catch (error) {
      toast.error('Failed to calculate working hours')
    }
  }

  // Fetch payroll records
  const { data: payrollData, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll', searchTerm, statusFilter, monthFilter, yearFilter],
    queryFn: () => payrollService.getPayrolls({
      search: searchTerm,
      status: statusFilter,
      month: monthFilter ? Number(monthFilter) : undefined,
      year: yearFilter ? Number(yearFilter) : undefined,
      limit: 50
    })
  })

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees({ limit: 100 })
  })

  // Fetch payroll statistics
  const { data: statsData } = useQuery({
    queryKey: ['payroll-stats', monthFilter, yearFilter],
    queryFn: () => payrollService.getPayrollStats({
      month: monthFilter ? Number(monthFilter) : undefined,
      year: yearFilter ? Number(yearFilter) : undefined
    })
  })

  // Create payroll mutation
  const createPayrollMutation = useMutation({
    mutationFn: payrollService.createPayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] })
      setShowCreateModal(false)
      toast.success('Payroll record created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create payroll record')
    }
  })

  // Update payroll mutation
  const updatePayrollMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePayrollData> }) =>
      payrollService.updatePayroll(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] })
      setEditingPayroll(null)
      toast.success('Payroll record updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update payroll record')
    }
  })

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: payrollService.markPayrollAsPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] })
      toast.success('Payroll marked as paid successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark payroll as paid')
    }
  })

  // Delete payroll mutation
  const deletePayrollMutation = useMutation({
    mutationFn: payrollService.deletePayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] })
      toast.success('Payroll record deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete payroll record')
    }
  })

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: ({ id, paymentData }: { id: string; paymentData: any }) =>
      payrollService.processPayment(id, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] })
      toast.success('Salary payment processed successfully')
      setShowPaymentModal(false)
      setSelectedPayroll(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to process payment')
    }
  })

  // Bulk payment mutation
  const bulkPaymentMutation = useMutation({
    mutationFn: payrollService.bulkPayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] })
      toast.success(`Bulk payment processed for ${data.updatedCount} employees`)
      setShowBulkPaymentModal(false)
      setSelectedPayrolls([])
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to process bulk payment')
    }
  })

  const handleCreatePayroll = (data: CreatePayrollData) => {
    createPayrollMutation.mutate(data)
  }

  const handleUpdatePayroll = (data: Partial<CreatePayrollData>) => {
    if (editingPayroll) {
      updatePayrollMutation.mutate({ id: editingPayroll.id, data })
    }
  }


  const handleDeletePayroll = (id: string) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      deletePayrollMutation.mutate(id)
    }
  }

  // Payment handlers
  const handleProcessPayment = (payroll: Payroll) => {
    setSelectedPayroll(payroll)
    setShowPaymentModal(true)
  }

  const handleBulkPayment = () => {
    if (selectedPayrolls.length === 0) {
      toast.error('Please select payroll records for bulk payment')
      return
    }
    setShowBulkPaymentModal(true)
  }

  const handlePaymentSubmit = () => {
    if (selectedPayroll) {
      processPaymentMutation.mutate({
        id: selectedPayroll.id,
        paymentData
      })
    }
  }

  const handleBulkPaymentSubmit = () => {
    bulkPaymentMutation.mutate({
      payrollIds: selectedPayrolls,
      ...paymentData
    })
  }

  const handlePayrollSelect = (payrollId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayrolls([...selectedPayrolls, payrollId])
    } else {
      setSelectedPayrolls(selectedPayrolls.filter(id => id !== payrollId))
    }
  }


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSED':
        return 'bg-blue-100 text-blue-800'
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[month - 1]
  }

  if (payrollLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Manage employee salaries and payroll processing</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Payroll
          </button>
          {selectedPayrolls.length > 0 && (
            <button
              onClick={handleBulkPayment}
              className="btn btn-secondary"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Bulk Payment ({selectedPayrolls.length})
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payrolls</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.totalPayrolls}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.pendingPayrolls}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.paidPayrolls}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(statsData.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Working Hours Calculation */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <Calculator className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Working Hours Calculator</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Employee</option>
              {employeesData?.data?.employees?.map((employee: any) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.department}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Year</option>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                )
              })}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={calculateWorkingHours}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              <Clock className="w-4 h-4 mr-2" />
              Calculate Hours
            </button>
          </div>
        </div>

        {/* Working Hours Results */}
        {workingHoursData && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Working Hours Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{workingHoursData.totalWorkingDays}</div>
                <div className="text-sm text-gray-600">Working Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{workingHoursData.totalRegularHours.toFixed(1)}h</div>
                <div className="text-sm text-gray-600">Regular Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{workingHoursData.totalOvertimeHours.toFixed(1)}h</div>
                <div className="text-sm text-gray-600">Overtime Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{workingHoursData.totalBreakHours.toFixed(1)}h</div>
                <div className="text-sm text-gray-600">Break Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{workingHoursData.totalHours.toFixed(1)}h</div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <input
            type="text"
            placeholder="Search payroll..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-full"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSED">Processed</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="input w-full"
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {getMonthName(i + 1)}
            </option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="input w-full"
        >
          <option value="">All Years</option>
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - i
            return (
              <option key={year} value={year}>
                {year}
              </option>
            )
          })}
        </select>
        <button
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('')
            setMonthFilter('')
            setYearFilter('')
          }}
          className="btn btn-outline"
        >
          Clear Filters
        </button>
      </div>

      {/* Payroll Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overtime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrollData?.data.payrolls?.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {payroll.employee?.user.firstName} {payroll.employee?.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payroll.employee?.employeeId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getMonthName(payroll.month)} {payroll.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payroll.basicSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payroll.overtimePay)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payroll.netSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payroll.status)}`}>
                      {payroll.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingPayroll(payroll)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {payroll.status !== 'PAID' && (
                        <button
                          onClick={() => handleProcessPayment(payroll)}
                          className="text-green-600 hover:text-green-900"
                          title="Process Payment"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                      <input
                        type="checkbox"
                        checked={selectedPayrolls.includes(payroll.id)}
                        onChange={(e) => handlePayrollSelect(payroll.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <button
                        onClick={() => handleDeletePayroll(payroll.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Payroll Modal */}
      {showCreateModal && (
        <CreatePayrollModal
          employees={employeesData?.data.employees || []}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePayroll}
          isLoading={createPayrollMutation.isLoading}
        />
      )}

      {/* Edit Payroll Modal */}
      {editingPayroll && (
        <EditPayrollModal
          payroll={editingPayroll}
          onClose={() => setEditingPayroll(null)}
          onSubmit={handleUpdatePayroll}
          isLoading={updatePayrollMutation.isLoading}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPayroll && (
        <PaymentModal
          payroll={selectedPayroll}
          paymentData={paymentData}
          setPaymentData={setPaymentData}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedPayroll(null)
          }}
          onSubmit={handlePaymentSubmit}
          isLoading={processPaymentMutation.isLoading}
        />
      )}

      {/* Bulk Payment Modal */}
      {showBulkPaymentModal && (
        <BulkPaymentModal
          selectedCount={selectedPayrolls.length}
          paymentData={paymentData}
          setPaymentData={setPaymentData}
          onClose={() => {
            setShowBulkPaymentModal(false)
            setSelectedPayrolls([])
          }}
          onSubmit={handleBulkPaymentSubmit}
          isLoading={bulkPaymentMutation.isLoading}
        />
      )}
    </div>
  )
}

// Create Payroll Modal Component
const CreatePayrollModal: React.FC<{
  employees: Employee[]
  onClose: () => void
  onSubmit: (data: CreatePayrollData) => void
  isLoading: boolean
}> = ({ employees, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CreatePayrollData>({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    overtimePay: 0,
    allowances: 0,
    deductions: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[month - 1]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create Payroll Record</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Employee</label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.user.firstName} {employee.user.lastName} - {employee.employeeId}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Month</label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                className="input"
                required
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="input"
                required
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Basic Salary</label>
            <input
              type="number"
              value={formData.basicSalary}
              onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
              className="input"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="label">Overtime Pay</label>
            <input
              type="number"
              value={formData.overtimePay}
              onChange={(e) => setFormData({ ...formData, overtimePay: Number(e.target.value) })}
              className="input"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="label">Allowances</label>
            <input
              type="number"
              value={formData.allowances}
              onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
              className="input"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="label">Deductions</label>
            <input
              type="number"
              value={formData.deductions}
              onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
              className="input"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Payroll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Payroll Modal Component
const EditPayrollModal: React.FC<{
  payroll: Payroll
  onClose: () => void
  onSubmit: (data: Partial<CreatePayrollData>) => void
  isLoading: boolean
}> = ({ payroll, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<Partial<CreatePayrollData>>({
    basicSalary: payroll.basicSalary,
    overtimePay: payroll.overtimePay,
    allowances: payroll.allowances,
    deductions: payroll.deductions
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Payroll Record</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Basic Salary</label>
            <input
              type="number"
              value={formData.basicSalary}
              onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
              className="input"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="label">Overtime Pay</label>
            <input
              type="number"
              value={formData.overtimePay}
              onChange={(e) => setFormData({ ...formData, overtimePay: Number(e.target.value) })}
              className="input"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="label">Allowances</label>
            <input
              type="number"
              value={formData.allowances}
              onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
              className="input"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="label">Deductions</label>
            <input
              type="number"
              value={formData.deductions}
              onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
              className="input"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Payroll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Payment Processing Modal
const PaymentModal: React.FC<{
  payroll: Payroll
  paymentData: any
  setPaymentData: (data: any) => void
  onClose: () => void
  onSubmit: () => void
  isLoading: boolean
}> = ({ payroll, paymentData, setPaymentData, onClose, onSubmit, isLoading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Process Salary Payment</h2>
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Employee: {payroll.employee?.user?.firstName} {payroll.employee?.user?.lastName}</div>
          <div className="text-sm text-gray-600">Amount: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payroll.netSalary)}</div>
          <div className="text-sm text-gray-600">Month: {payroll.month}/{payroll.year}</div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Payment Method</label>
            <select
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
              className="input"
              required
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CRYPTOCURRENCY">Cryptocurrency</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Payment Reference</label>
            <input
              type="text"
              value={paymentData.paymentReference}
              onChange={(e) => setPaymentData({...paymentData, paymentReference: e.target.value})}
              className="input"
              placeholder="Transaction ID, check number, etc."
            />
          </div>

          <div>
            <label className="label">Payment Notes</label>
            <textarea
              value={paymentData.paymentNotes}
              onChange={(e) => setPaymentData({...paymentData, paymentNotes: e.target.value})}
              className="input"
              rows={3}
              placeholder="Additional payment notes..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Process Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Bulk Payment Modal
const BulkPaymentModal: React.FC<{
  selectedCount: number
  paymentData: any
  setPaymentData: (data: any) => void
  onClose: () => void
  onSubmit: () => void
  isLoading: boolean
}> = ({ selectedCount, paymentData, setPaymentData, onClose, onSubmit, isLoading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Bulk Salary Payment</h2>
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-600">Processing payment for {selectedCount} employees</div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Payment Method</label>
            <select
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
              className="input"
              required
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CRYPTOCURRENCY">Cryptocurrency</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Payment Reference</label>
            <input
              type="text"
              value={paymentData.paymentReference}
              onChange={(e) => setPaymentData({...paymentData, paymentReference: e.target.value})}
              className="input"
              placeholder="Batch reference, transaction ID, etc."
            />
          </div>

          <div>
            <label className="label">Payment Notes</label>
            <textarea
              value={paymentData.paymentNotes}
              onChange={(e) => setPaymentData({...paymentData, paymentNotes: e.target.value})}
              className="input"
              rows={3}
              placeholder="Notes for all payments..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `Process ${selectedCount} Payments`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PayrollManagement

