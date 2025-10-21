import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Employees = lazy(() => import('./pages/Employees'))
const Attendance = lazy(() => import('./pages/Attendance'))
const AttendanceCalendar = lazy(() => import('./pages/AttendanceCalendar'))
const AttendanceReports = lazy(() => import('./pages/AttendanceReports'))
const LeaveRequests = lazy(() => import('./pages/LeaveRequests'))
const MyAttendance = lazy(() => import('./pages/MyAttendance'))
const MyLeave = lazy(() => import('./pages/MyLeave'))
const Profile = lazy(() => import('./pages/Profile'))
const ShiftManagement = lazy(() => import('./pages/ShiftManagement'))
const PayrollManagement = lazy(() => import('./pages/PayrollManagement'))
const PaymentReports = lazy(() => import('./pages/PaymentReports'))
const DepartmentManagement = lazy(() => import('./pages/DepartmentManagement'))
const RoleManagement = lazy(() => import('./pages/RoleManagement'))
const SystemSettings = lazy(() => import('./pages/SystemSettings'))

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  // Check if user is admin/HR
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER'

  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* Admin/HR only routes */}
        {isAdmin ? (
          <>
            <Route path="/employees" element={<Employees />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/attendance-calendar" element={<AttendanceCalendar />} />
            <Route path="/attendance-reports" element={<AttendanceReports />} />
            <Route path="/leave" element={<LeaveRequests />} />
            {/* Phase 2 routes */}
            <Route path="/shifts" element={<ShiftManagement />} />
            <Route path="/payroll" element={<PayrollManagement />} />
            <Route path="/payment-reports" element={<PaymentReports />} />
            <Route path="/departments" element={<DepartmentManagement />} />
            <Route path="/roles" element={<RoleManagement />} />
            <Route path="/settings" element={<SystemSettings />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
