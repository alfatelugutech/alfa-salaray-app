import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Download,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  Coins,
  MoreHorizontal,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react'
import { payrollService } from '../services/payrollService'
import { employeeService } from '../services/employeeService'
import toast from 'react-hot-toast'

const PaymentReports: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all')
  const [reportType, setReportType] = useState('summary')

  // Fetch payment statistics
  const { data: paymentStats } = useQuery(
    ['payment-stats', selectedYear, selectedMonth],
    () => payrollService.getPaymentStats({
      year: selectedYear,
      month: selectedMonth ? Number(selectedMonth) : undefined
    })
  )

  // Fetch employees for filtering
  const { data: employeesData } = useQuery(
    'employees',
    () => employeeService.getEmployees({ page: 1, limit: 1000 })
  )

  // Fetch detailed payment data
  const { data: paymentData, isLoading: dataLoading } = useQuery(
    ['payment-data', selectedYear, selectedMonth, selectedEmployee, selectedPaymentMethod],
    () => payrollService.getPayrolls({
      year: selectedYear,
      month: selectedMonth ? Number(selectedMonth) : undefined,
      status: 'PAID',
      limit: 1000
    })
  )

  // Generate monthly payment data for charts
  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const data: Array<{ month: string; amount: number; count: number }> = []
    
    for (let i = 0; i < 12; i++) {
      const monthData = paymentData?.data?.payrolls?.filter((payroll: any) => {
        const payrollDate = new Date(payroll.paidAt || payroll.createdAt)
        return payrollDate.getMonth() === i && payrollDate.getFullYear() === selectedYear
      }) || []
      
      data.push({
        month: months[i],
        amount: monthData.reduce((sum: number, payroll: any) => sum + Number(payroll.netSalary), 0),
        count: monthData.length
      })
    }
    
    return data
  }

  // Generate payment method data
  const generatePaymentMethodData = () => {
    const methods = ['BANK_TRANSFER', 'CASH', 'CHECK', 'MOBILE_MONEY', 'CRYPTOCURRENCY', 'OTHER']
    const data: Array<{ method: string; amount: number; count: number; percentage: number }> = []
    
    methods.forEach(method => {
      const methodData = paymentData?.data?.payrolls?.filter((payroll: any) => 
        payroll.paymentMethod === method
      ) || []
      
      data.push({
        method: method.replace('_', ' '),
        amount: methodData.reduce((sum: number, payroll: any) => sum + Number(payroll.netSalary), 0),
        count: methodData.length,
        percentage: paymentData?.data?.payrolls?.length ? 
          (methodData.length / paymentData.data.payrolls.length) * 100 : 0
      })
    })
    
    return data.filter(item => item.count > 0)
  }

  // Generate department payment data
  const generateDepartmentData = () => {
    const departments = [...new Set(paymentData?.data?.payrolls?.map((payroll: any) => 
      payroll.employee?.department || 'Unknown'
    ) || [])]
    
    return departments.map(dept => {
      const deptData = paymentData?.data?.payrolls?.filter((payroll: any) => 
        (payroll.employee?.department || 'Unknown') === dept
      ) || []
      
      return {
        department: dept,
        amount: deptData.reduce((sum: number, payroll: any) => sum + Number(payroll.netSalary), 0),
        count: deptData.length,
        average: deptData.length > 0 ? 
          deptData.reduce((sum: number, payroll: any) => sum + Number(payroll.netSalary), 0) / deptData.length : 0
      }
    }).sort((a, b) => b.amount - a.amount)
  }

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'BANK_TRANSFER': return <CreditCard className="w-4 h-4" />
      case 'CASH': return <Banknote className="w-4 h-4" />
      case 'CHECK': return <FileText className="w-4 h-4" />
      case 'MOBILE_MONEY': return <Smartphone className="w-4 h-4" />
      case 'CRYPTOCURRENCY': return <Coins className="w-4 h-4" />
      default: return <MoreHorizontal className="w-4 h-4" />
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  // Export data to CSV
  const exportToCSV = () => {
    if (!paymentData?.data?.payrolls) {
      toast.error('No data to export')
      return
    }

    const csvData = paymentData.data.payrolls.map((payroll: any) => ({
      'Employee Name': `${payroll.employee?.user?.firstName} ${payroll.employee?.user?.lastName}`,
      'Employee ID': payroll.employee?.employeeId,
      'Department': payroll.employee?.department || 'N/A',
      'Month': payroll.month,
      'Year': payroll.year,
      'Basic Salary': payroll.basicSalary,
      'Overtime Pay': payroll.overtimePay,
      'Allowances': payroll.allowances,
      'Deductions': payroll.deductions,
      'Net Salary': payroll.netSalary,
      'Payment Method': payroll.paymentMethod || 'N/A',
      'Payment Reference': payroll.paymentReference || 'N/A',
      'Paid Date': payroll.paidAt ? new Date(payroll.paidAt).toLocaleDateString() : 'N/A',
      'Status': payroll.status
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payment-report-${selectedYear}${selectedMonth ? `-${selectedMonth}` : ''}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success('Payment report exported successfully!')
  }

  const monthlyData = generateMonthlyData()
  const paymentMethodData = generatePaymentMethodData()
  const departmentData = generateDepartmentData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Payment Reports</h1>
            <p className="text-green-100 mt-2">Comprehensive salary payment analytics and insights</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center gap-2"
            >
              <Download className="h-5 w-5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="label">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="label">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Employee</label>
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

          <div>
            <label className="label">Payment Method</label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="input"
            >
              <option value="all">All Methods</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CRYPTOCURRENCY">Cryptocurrency</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input"
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
              <option value="analytics">Analytics</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Statistics Cards */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-blue-600">{paymentStats.totalPayrolls}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(Number(paymentStats.totalAmountPaid))}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(Number(paymentStats.totalAmountPending))}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {paymentStats.paymentRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Payment Trends */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Monthly Payment Trends
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount Chart */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-4">Payment Amounts by Month</h4>
              <div className="space-y-3">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{data.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${Math.max(5, (data.amount / Math.max(...monthlyData.map(d => d.amount))) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-20 text-right">
                        {formatCurrency(data.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Count Chart */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-4">Payment Counts by Month</h4>
              <div className="space-y-3">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{data.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ 
                            width: `${Math.max(5, (data.count / Math.max(...monthlyData.map(d => d.count))) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {data.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Analysis */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Payment Method Analysis
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethodData.map((data, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(data.method.replace(' ', '_'))}
                    <span className="font-medium text-gray-900">{data.method}</span>
                  </div>
                  <span className="text-sm text-gray-500">{data.count} payments</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(data.amount)}
                </div>
                <div className="text-sm text-gray-600">
                  {data.percentage.toFixed(1)}% of total payments
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Analysis */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Department Payment Analysis
          </h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Payment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departmentData.map((dept, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dept.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(dept.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dept.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(dept.average)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Payment List */}
      {reportType === 'detailed' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Detailed Payment Records
            </h3>
          </div>
          <div className="p-6">
            {dataLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading payment data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentData?.data?.payrolls?.map((payroll: any) => (
                      <tr key={payroll.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payroll.employee?.user?.firstName} {payroll.employee?.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payroll.employee?.employeeId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(Number(payroll.netSalary))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(payroll.paymentMethod)}
                            <span className="text-sm text-gray-900">
                              {payroll.paymentMethod?.replace('_', ' ') || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payroll.paymentReference || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payroll.paidAt ? new Date(payroll.paidAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentReports
