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

export const attendanceApi = {
  // Get all attendance records
  getAttendance: (params = {}) => api.get('/attendance', { params }),
  
  // Get attendance by employee ID
  getEmployeeAttendance: (employeeId, month) => 
    api.get(`/attendance/employee/${employeeId}`, { params: { month } }),
  
  // Mark attendance
  markAttendance: (attendanceData) => api.post('/attendance', attendanceData),
  
  // Update attendance
  updateAttendance: (id, attendanceData) => api.put(`/attendance/${id}`, attendanceData),
  
  // Delete attendance
  deleteAttendance: (id) => api.delete(`/attendance/${id}`),
};

export default attendanceApi;
