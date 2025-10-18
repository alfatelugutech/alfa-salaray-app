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

export const employeeApi = {
  // Get all employees
  getEmployees: () => api.get('/employees'),
  
  // Get employee by ID
  getEmployee: (id) => api.get(`/employees/${id}`),
  
  // Create employee
  createEmployee: (employeeData) => api.post('/employees', employeeData),
  
  // Update employee
  updateEmployee: (id, employeeData) => api.put(`/employees/${id}`, employeeData),
  
  // Delete employee
  deleteEmployee: (id) => api.delete(`/employees/${id}`),
};

export default employeeApi;
