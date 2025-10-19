import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'
import LeaveRequests from './pages/LeaveRequests'
import MyAttendance from './pages/MyAttendance'
import MyLeave from './pages/MyLeave'
import Profile from './pages/Profile'
// Phase 2 imports
import ShiftManagement from './pages/ShiftManagement'
import PayrollManagement from './pages/PayrollManagement'
import SystemSettings from './pages/SystemSettings'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Check if user is admin/HR
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER'

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Admin/HR only routes */}
        {isAdmin && (
          <>
            <Route path="/employees" element={<Employees />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leave" element={<LeaveRequests />} />
            {/* Phase 2 routes */}
            <Route path="/shifts" element={<ShiftManagement />} />
            <Route path="/payroll" element={<PayrollManagement />} />
            <Route path="/settings" element={<SystemSettings />} />
          </>
        )}
        
        {/* Employee routes */}
        <Route path="/attendance" element={isAdmin ? <Attendance /> : <MyAttendance />} />
        <Route path="/leave" element={isAdmin ? <LeaveRequests /> : <MyLeave />} />
        <Route path="/profile" element={<Profile />} />
        
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
