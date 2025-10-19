import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import SimpleLayout from './components/SimpleLayout'
import Login from './pages/Login'
import SimpleDashboard from './pages/SimpleDashboard'
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
// Phase 3 imports
import Analytics from './pages/Analytics'
import Notifications from './pages/Notifications'
import AI from './pages/AI'
import HRManagement from './pages/HRManagement'
import BackendTest from './pages/BackendTest'
import LoadingSpinner from './components/LoadingSpinner'
import { Toaster } from 'react-hot-toast'

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
    <>
      <SimpleLayout>
        <Routes>
        <Route path="/" element={<SimpleDashboard />} />
        <Route path="/dashboard" element={<SimpleDashboard />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Admin/HR only routes */}
          {isAdmin ? (
            <>
              <Route path="/employees" element={<Employees />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leave" element={<LeaveRequests />} />
              {/* Phase 2 routes */}
              <Route path="/shifts" element={<ShiftManagement />} />
              <Route path="/payroll" element={<PayrollManagement />} />
              <Route path="/settings" element={<SystemSettings />} />
              {/* Phase 3 routes */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/hr" element={<HRManagement />} />
            </>
          ) : (
            <>
              {/* Employee routes */}
              <Route path="/my-attendance" element={<MyAttendance />} />
              <Route path="/my-leave" element={<MyLeave />} />
              <Route path="/attendance" element={<Navigate to="/my-attendance" replace />} />
              <Route path="/leave" element={<Navigate to="/my-leave" replace />} />
            </>
          )}
          
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/backend-test" element={<BackendTest />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SimpleLayout>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  )
}

export default App
