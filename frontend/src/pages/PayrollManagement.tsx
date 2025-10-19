import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Edit, Trash2, DollarSign, Calendar, User, CheckCircle } from 'lucide-react'
import { payrollService } from '../services/payrollService'
import { employeeService } from '../services/employeeService'
import { Payroll, CreatePayrollData, Employee } from '../types'
import toast from 'react-hot-toast'

const PayrollManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  const queryClient = useQueryClient()

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

  const handleCreatePayroll = (data: CreatePayrollData) => {
    createPayrollMutation.mutate(data)
  }

  const handleUpdatePayroll = (data: Partial<CreatePayrollData>) => {
    if (editingPayroll) {
      updatePayrollMutation.mutate({ id: editingPayroll.id, data })
    }
  }

  const handleMarkAsPaid = (id: string) => {
    if (window.confirm('Are you sure you want to mark this payroll as paid?')) {
      markPaidMutation.mutate(id)
    }
  }

  const handleDeletePayroll = (id: string) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      deletePayrollMutation.mutate(id)
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
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Payroll
        </button>
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
                          onClick={() => handleMarkAsPaid(payroll.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
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

export default PayrollManagement

