import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireHR } from '../middleware/auth';
import Joi from 'joi';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Export attendance data
router.get('/attendance', requireHR, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, employeeId, format = 'csv' } = req.query;
    
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    if (format === 'csv') {
      const csvData = generateAttendanceCSV(attendances);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
      res.send(csvData);
    } else if (format === 'excel') {
      // For Excel export, you would use a library like xlsx
      res.status(501).json({
        success: false,
        error: 'Excel export not implemented yet',
        code: 'NOT_IMPLEMENTED'
      });
    } else if (format === 'pdf') {
      // For PDF export, you would use a library like puppeteer or jsPDF
      res.status(501).json({
        success: false,
        error: 'PDF export not implemented yet',
        code: 'NOT_IMPLEMENTED'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid format. Supported formats: csv, excel, pdf',
        code: 'INVALID_FORMAT'
      });
    }

  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export attendance data',
      code: 'EXPORT_ERROR'
    });
  }
});

// Export employee data
router.get('/employees', requireHR, async (req: Request, res: Response) => {
  try {
    const { departmentId, format = 'csv' } = req.query;
    
    const whereClause: any = {};
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        department: {
          select: {
            name: true
          }
        }
      }
    });

    if (format === 'csv') {
      const csvData = generateEmployeeCSV(employees);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
      res.send(csvData);
    } else {
      res.status(501).json({
        success: false,
        error: 'Only CSV format is currently supported',
        code: 'NOT_IMPLEMENTED'
      });
    }

  } catch (error) {
    console.error('Export employees error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export employee data',
      code: 'EXPORT_ERROR'
    });
  }
});

// Export payroll data
router.get('/payroll', requireHR, async (req: Request, res: Response) => {
  try {
    const { month, year, format = 'csv' } = req.query;
    
    const whereClause: any = {};
    if (month && year) {
      whereClause.month = parseInt(month as string);
      whereClause.year = parseInt(year as string);
    }

    const payrolls = await prisma.payroll.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      const csvData = generatePayrollCSV(payrolls);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=payroll.csv');
      res.send(csvData);
    } else {
      res.status(501).json({
        success: false,
        error: 'Only CSV format is currently supported',
        code: 'NOT_IMPLEMENTED'
      });
    }

  } catch (error) {
    console.error('Export payroll error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export payroll data',
      code: 'EXPORT_ERROR'
    });
  }
});

// Export leave data
router.get('/leave', requireHR, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;
    
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.startDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      const csvData = generateLeaveCSV(leaveRequests);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leave_requests.csv');
      res.send(csvData);
    } else {
      res.status(501).json({
        success: false,
        error: 'Only CSV format is currently supported',
        code: 'NOT_IMPLEMENTED'
      });
    }

  } catch (error) {
    console.error('Export leave error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export leave data',
      code: 'EXPORT_ERROR'
    });
  }
});

// Helper functions for CSV generation
function generateAttendanceCSV(attendances: any[]): string {
  const headers = [
    'Date',
    'Employee Name',
    'Employee Email',
    'Check In',
    'Check Out',
    'Total Hours',
    'Regular Hours',
    'Overtime Hours',
    'Break Hours',
    'Status',
    'Notes'
  ];

  const rows = attendances.map(att => [
    att.date,
    `${att.employee.user.firstName} ${att.employee.user.lastName}`,
    att.employee.user.email,
    att.checkIn || '',
    att.checkOut || '',
    att.totalHours || 0,
    att.regularHours || 0,
    att.overtimeHours || 0,
    att.breakHours || 0,
    att.status,
    att.notes || ''
  ]);

  return [headers, ...rows].map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');
}

function generateEmployeeCSV(employees: any[]): string {
  const headers = [
    'Employee ID',
    'Name',
    'Email',
    'Phone',
    'Department',
    'Position',
    'Hire Date',
    'Status'
  ];

  const rows = employees.map(emp => [
    emp.employeeId,
    `${emp.user.firstName} ${emp.user.lastName}`,
    emp.user.email,
    emp.user.phone || '',
    emp.department?.name || '',
    emp.position || '',
    emp.hireDate,
    emp.status
  ]);

  return [headers, ...rows].map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');
}

function generatePayrollCSV(payrolls: any[]): string {
  const headers = [
    'Employee Name',
    'Employee Email',
    'Month',
    'Year',
    'Basic Salary',
    'Overtime Pay',
    'Allowances',
    'Deductions',
    'Net Salary',
    'Status',
    'Paid At'
  ];

  const rows = payrolls.map(payroll => [
    `${payroll.employee.user.firstName} ${payroll.employee.user.lastName}`,
    payroll.employee.user.email,
    payroll.month,
    payroll.year,
    payroll.basicSalary,
    payroll.overtimePay,
    payroll.allowances,
    payroll.deductions,
    payroll.netSalary,
    payroll.status,
    payroll.paidAt || ''
  ]);

  return [headers, ...rows].map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');
}

function generateLeaveCSV(leaveRequests: any[]): string {
  const headers = [
    'Employee Name',
    'Employee Email',
    'Leave Type',
    'Start Date',
    'End Date',
    'Days',
    'Reason',
    'Status',
    'Applied At'
  ];

  const rows = leaveRequests.map(leave => [
    `${leave.employee.user.firstName} ${leave.employee.user.lastName}`,
    leave.employee.user.email,
    leave.leaveType,
    leave.startDate,
    leave.endDate,
    leave.days,
    leave.reason,
    leave.status,
    leave.createdAt
  ]);

  return [headers, ...rows].map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');
}

export default router;
