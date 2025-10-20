export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'HR_MANAGER' | 'DEPARTMENT_MANAGER' | 'EMPLOYEE'
  employeeId?: string
  lastLoginAt?: string
}

export interface Employee {
  id: string
  userId: string
  employeeId: string
  department?: string
  position?: string
  managerId?: string
  hireDate: string
  salary?: number
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE'
  workLocation?: string
  emergencyContact?: any
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    avatar?: string
    role: string
    isActive: boolean
    lastLoginAt?: string
  }
  manager?: {
    id: string
    user: {
      firstName: string
      lastName: string
    }
  }
  subordinates?: Employee[]
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  checkIn?: string
  checkOut?: string
  totalHours?: number
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'HALF_DAY'
  notes?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
  employee: {
    id: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

export interface LeaveRequest {
  id: string
  employeeId: string
  leaveType: 'SICK_LEAVE' | 'VACATION' | 'PERSONAL_LEAVE' | 'EMERGENCY_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE'
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  approvedBy?: string
  approvedAt?: string
  comments?: string
  createdAt: string
  updatedAt: string
  employee: {
    id: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
}

export interface PaginationData {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    [key: string]: T[]
  } & {
    pagination: PaginationData
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role?: string
}

export interface CreateEmployeeData {
  userId: string
  employeeId: string
  department?: string
  position?: string
  managerId?: string
  hireDate: string
  salary?: number
  workLocation?: string
  emergencyContact?: any
}

// Phase 2 Types
export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  breakDuration: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  employees?: EmployeeShift[]
}

export interface EmployeeShift {
  id: string
  employeeId: string
  shiftId: string
  startDate: string
  endDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  employee?: Employee
  shift?: Shift
}

export interface CreateShiftData {
  name: string
  startTime: string
  endTime: string
  breakDuration?: number
}

export interface AssignShiftData {
  employeeId: string
  shiftId: string
  startDate: string
  endDate?: string
}

export interface Payroll {
  id: string
  employeeId: string
  month: number
  year: number
  basicSalary: number
  overtimePay: number
  allowances: number
  deductions: number
  netSalary: number
  status: 'PENDING' | 'PROCESSED' | 'PAID' | 'CANCELLED'
  paidAt?: string
  
  // Payment details
  paymentMethod?: 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'MOBILE_MONEY' | 'CRYPTOCURRENCY' | 'OTHER'
  paymentReference?: string
  paymentNotes?: string
  processedBy?: string
  processedAt?: string
  
  createdAt: string
  updatedAt: string
  employee?: Employee
}

export interface CreatePayrollData {
  employeeId: string
  month: number
  year: number
  basicSalary: number
  overtimePay?: number
  allowances?: number
  deductions?: number
}

export interface SystemSetting {
  id: string
  key: string
  value: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'
  category?: string
  createdAt: string
  updatedAt: string
}

export interface CreateSettingData {
  key: string
  value: string
  type?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'
  category?: string
}

export interface MarkAttendanceData {
  employeeId: string
  date: string
  checkIn?: string
  checkOut?: string
  status: string
  notes?: string
}

export interface CreateLeaveRequestData {
  employeeId: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
}

export interface UpdateLeaveRequestData {
  status: string
  comments?: string
}

export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  presentToday: number
  pendingLeaves: number
  attendanceRate: number
  leaveApprovalRate: number
}
