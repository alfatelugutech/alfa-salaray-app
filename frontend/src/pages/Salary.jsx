import React, { useState, useEffect } from 'react';
import { salaryApi } from '../api/salaryApi';
import { employeeApi } from '../api/employeeApi';

const Salary = () => {
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    basic_salary: '',
    bonus: '',
    deductions: '',
    overtime_hours: '',
    net_salary: '',
    paid_status: 'pending'
  });

  useEffect(() => {
    fetchSalaryRecords();
    fetchEmployees();
  }, []);

  const fetchSalaryRecords = async () => {
    try {
      setLoading(true);
      const response = await salaryApi.getSalaryRecords();
      setSalaryRecords(response.data);
    } catch (error) {
      console.error('Error fetching salary records:', error);
      alert('Failed to fetch salary records');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeApi.getEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCalculateSalary = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear) {
      alert('Please select employee, month, and year');
      return;
    }

    try {
      await salaryApi.calculateSalary(selectedEmployee, selectedMonth, selectedYear);
      alert('Salary calculated successfully!');
      fetchSalaryRecords();
    } catch (error) {
      console.error('Error calculating salary:', error);
      alert('Failed to calculate salary');
    }
  };

  const handleGeneratePayroll = async () => {
    if (!selectedMonth || !selectedYear) {
      alert('Please select month and year');
      return;
    }

    if (window.confirm(`Generate payroll for ${selectedYear}-${selectedMonth.padStart(2, '0')}?`)) {
      try {
        await salaryApi.generatePayroll(selectedMonth, selectedYear);
        alert('Payroll generated successfully!');
        fetchSalaryRecords();
      } catch (error) {
        console.error('Error generating payroll:', error);
        alert('Failed to generate payroll');
      }
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await salaryApi.markAsPaid(id);
      alert('Salary marked as paid successfully!');
      fetchSalaryRecords();
    } catch (error) {
      console.error('Error marking salary as paid:', error);
      alert('Failed to mark salary as paid');
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      basic_salary: record.basic_salary,
      bonus: record.bonus,
      deductions: record.deductions,
      overtime_hours: record.overtime_hours,
      net_salary: record.net_salary,
      paid_status: record.paid_status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await salaryApi.updateSalary(editingRecord.id, formData);
      alert('Salary updated successfully!');
      setShowModal(false);
      setEditingRecord(null);
      fetchSalaryRecords();
    } catch (error) {
      console.error('Error updating salary:', error);
      alert('Failed to update salary');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      try {
        await salaryApi.deleteSalary(id);
        alert('Salary record deleted successfully!');
        fetchSalaryRecords();
      } catch (error) {
        console.error('Error deleting salary:', error);
        alert('Failed to delete salary record');
      }
    }
  };

  const openModal = () => {
    setEditingRecord(null);
    setFormData({
      basic_salary: '',
      bonus: '',
      deductions: '',
      overtime_hours: '',
      net_salary: '',
      paid_status: 'pending'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRecord(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Salary Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowPayrollModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Generate Payroll
          </button>
          <button
            onClick={openModal}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add Salary Record
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select Month</option>
              {Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                return (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <div className="mt-4 flex space-x-4">
          <button
            onClick={handleCalculateSalary}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Calculate Salary
          </button>
          <button
            onClick={handleGeneratePayroll}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Generate Payroll
          </button>
        </div>
      </div>

      {/* Salary Records Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Month
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Basic Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bonus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deductions
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
            {salaryRecords.map((record) => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.employee_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.month}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(record.basic_salary)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(record.bonus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(record.deductions)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.overtime_hours}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(record.net_salary)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.paid_status)}`}>
                    {record.paid_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(record)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    {record.paid_status === 'pending' && (
                      <button
                        onClick={() => handleMarkAsPaid(record.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Salary Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRecord ? 'Edit Salary Record' : 'Add Salary Record'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Basic Salary</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bonus</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deductions</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Overtime Hours</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.overtime_hours}
                    onChange={(e) => setFormData({ ...formData, overtime_hours: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Net Salary</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.net_salary}
                    onChange={(e) => setFormData({ ...formData, net_salary: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.paid_status}
                    onChange={(e) => setFormData({ ...formData, paid_status: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  >
                    {editingRecord ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Generate Payroll Modal */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Payroll</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Month</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      return (
                        <option key={month} value={month}>
                          {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPayrollModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGeneratePayroll}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600"
                  >
                    Generate Payroll
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;
