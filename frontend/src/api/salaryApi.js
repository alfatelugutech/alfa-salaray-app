import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const salaryApi = {
  // Get all salary records
  getSalaryRecords: (params = {}) => api.get('/salary', { params }),
  
  // Get salary records by employee ID
  getEmployeeSalary: (employeeId, month, year) => 
    api.get(`/salary/employee/${employeeId}`, { params: { month, year } }),
  
  // Calculate salary for an employee
  calculateSalary: (employeeId, month, year) => 
    api.post(`/salary/calculate/${employeeId}`, { month, year }),
  
  // Generate payroll for all employees
  generatePayroll: (month, year) => 
    api.post('/salary/generate-payroll', { month, year }),
  
  // Update salary record
  updateSalary: (id, salaryData) => api.put(`/salary/${id}`, salaryData),
  
  // Mark salary as paid
  markAsPaid: (id, paidDate) => api.post(`/salary/${id}/pay`, { paid_date: paidDate }),
  
  // Delete salary record
  deleteSalary: (id) => api.delete(`/salary/${id}`),
};

export default salaryApi;
