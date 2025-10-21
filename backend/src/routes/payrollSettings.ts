import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, requireHR } from "../middleware/auth";
import Joi from "joi";

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const updatePayrollSettingsSchema = Joi.object({
  defaultMethod: Joi.string().valid("FIXED_SALARY", "HOURLY_RATE", "COMMISSION_BASED", "PROJECT_BASED", "MIXED").optional(),
  overtimeMultiplier: Joi.number().min(1.0).max(3.0).optional(),
  regularHoursPerMonth: Joi.number().min(80).max(200).optional(),
  regularHoursPerDay: Joi.number().min(4).max(12).optional(),
  overtimeThreshold: Joi.number().min(4).max(12).optional(),
  isActive: Joi.boolean().optional()
});

// Get current payroll settings
router.get("/", requireHR, async (req: Request, res: Response) => {
  try {
    const settings = await prisma.payrollSettings.findFirst({
      where: { isActive: true },
      include: {
        updatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!settings) {
      // Create default settings if none exist
      const authUser = (req as any).user;
      const defaultSettings = await prisma.payrollSettings.create({
        data: {
          defaultMethod: "FIXED_SALARY",
          overtimeMultiplier: 1.5,
          regularHoursPerMonth: 160,
          regularHoursPerDay: 8,
          overtimeThreshold: 8,
          isActive: true,
          updatedBy: authUser.id
        },
        include: {
          updatedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: { settings: defaultSettings }
      });
      return;
    }

    res.json({
      success: true,
      data: { settings }
    });

  } catch (error) {
    console.error("Get payroll settings error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payroll settings",
      code: "FETCH_PAYROLL_SETTINGS_ERROR"
    });
  }
});

// Update payroll settings
router.put("/", requireHR, async (req: Request, res: Response) => {
  try {
    const { error, value } = updatePayrollSettingsSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const authUser = (req as any).user;

    // Deactivate current settings
    await prisma.payrollSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Create new settings
    const newSettings = await prisma.payrollSettings.create({
      data: {
        ...value,
        updatedBy: authUser.id,
        isActive: true
      },
      include: {
        updatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { settings: newSettings },
      message: "Payroll settings updated successfully"
    });

  } catch (error) {
    console.error("Update payroll settings error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update payroll settings",
      code: "UPDATE_PAYROLL_SETTINGS_ERROR"
    });
  }
});

// Get payroll calculation methods
router.get("/methods", requireHR, async (req: Request, res: Response) => {
  try {
    const methods = [
      {
        value: "FIXED_SALARY",
        label: "Fixed Salary",
        description: "Employee receives a fixed monthly salary regardless of hours worked",
        icon: "💰",
        calculation: "Monthly salary + overtime (if applicable)"
      },
      {
        value: "HOURLY_RATE",
        label: "Hourly Rate",
        description: "Employee is paid based on actual hours worked",
        icon: "⏰",
        calculation: "Hours worked × hourly rate + overtime"
      },
      {
        value: "COMMISSION_BASED",
        label: "Commission Based",
        description: "Employee is paid based on sales or performance",
        icon: "📈",
        calculation: "Base salary + commission percentage"
      },
      {
        value: "PROJECT_BASED",
        label: "Project Based",
        description: "Employee is paid per project completion",
        icon: "🎯",
        calculation: "Project rate × completed projects"
      },
      {
        value: "MIXED",
        label: "Mixed Method",
        description: "Combination of fixed salary and performance-based pay",
        icon: "🔄",
        calculation: "Base salary + performance bonus + overtime"
      }
    ];

    res.json({
      success: true,
      data: { methods }
    });

  } catch (error) {
    console.error("Get payroll methods error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payroll methods",
      code: "FETCH_PAYROLL_METHODS_ERROR"
    });
  }
});

// Calculate payroll for employee based on their method
router.post("/calculate", requireHR, async (req: Request, res: Response) => {
  try {
    const { employeeId, month, year, workingHours } = req.body;

    if (!employeeId || !month || !year) {
      res.status(400).json({
        success: false,
        error: "Employee ID, month, and year are required",
        code: "MISSING_PARAMETERS"
      });
      return;
    }

    // Get employee details
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!employee) {
      res.status(404).json({
        success: false,
        error: "Employee not found",
        code: "EMPLOYEE_NOT_FOUND"
      });
      return;
    }

    // Get current payroll settings
    const settings = await prisma.payrollSettings.findFirst({
      where: { isActive: true }
    });

    const payrollMethod = employee.payrollMethod || settings?.defaultMethod || "FIXED_SALARY";
    const overtimeMultiplier = Number(settings?.overtimeMultiplier || 1.5);
    const regularHoursPerMonth = settings?.regularHoursPerMonth || 160;

    let calculation = {
      method: payrollMethod,
      basicSalary: 0,
      overtimePay: 0,
      totalPay: 0,
      breakdown: {}
    };

    switch (payrollMethod) {
      case "FIXED_SALARY":
        calculation.basicSalary = Number(employee.salary || 0);
        if (workingHours && workingHours.totalOvertimeHours > 0) {
          const hourlyRate = Number(employee.salary || 0) / regularHoursPerMonth;
          calculation.overtimePay = workingHours.totalOvertimeHours * hourlyRate * overtimeMultiplier;
        }
        calculation.totalPay = calculation.basicSalary + calculation.overtimePay;
        calculation.breakdown = {
          fixedSalary: calculation.basicSalary,
          overtimeHours: workingHours?.totalOvertimeHours || 0,
          overtimePay: calculation.overtimePay
        };
        break;

      case "HOURLY_RATE":
        const hourlyRate = Number(employee.hourlyRate || 0);
        calculation.basicSalary = (workingHours?.totalRegularHours || 0) * hourlyRate;
        calculation.overtimePay = (workingHours?.totalOvertimeHours || 0) * hourlyRate * overtimeMultiplier;
        calculation.totalPay = calculation.basicSalary + calculation.overtimePay;
        calculation.breakdown = {
          regularHours: workingHours?.totalRegularHours || 0,
          overtimeHours: workingHours?.totalOvertimeHours || 0,
          hourlyRate: hourlyRate,
          regularPay: calculation.basicSalary,
          overtimePay: calculation.overtimePay
        };
        break;

      case "COMMISSION_BASED":
        // This would need additional data like sales amount, commission rate, etc.
        calculation.basicSalary = Number(employee.salary || 0);
        calculation.totalPay = calculation.basicSalary;
        calculation.breakdown = {
          baseSalary: calculation.basicSalary,
          commission: 0, // Would be calculated based on performance data
          note: "Commission calculation requires additional performance data"
        };
        break;

      case "PROJECT_BASED":
        // This would need project completion data
        calculation.basicSalary = 0;
        calculation.totalPay = 0;
        calculation.breakdown = {
          projectsCompleted: 0, // Would be calculated based on project data
          projectRate: 0,
          note: "Project-based calculation requires project completion data"
        };
        break;

      case "MIXED":
        calculation.basicSalary = Number(employee.salary || 0);
        if (workingHours && workingHours.totalOvertimeHours > 0) {
          const hourlyRate = Number(employee.salary || 0) / regularHoursPerMonth;
          calculation.overtimePay = workingHours.totalOvertimeHours * hourlyRate * overtimeMultiplier;
        }
        calculation.totalPay = calculation.basicSalary + calculation.overtimePay;
        calculation.breakdown = {
          baseSalary: calculation.basicSalary,
          overtimePay: calculation.overtimePay,
          performanceBonus: 0, // Would be calculated based on performance data
          note: "Mixed method includes base salary + overtime + performance bonus"
        };
        break;

      default:
        calculation.basicSalary = Number(employee.salary || 0);
        calculation.totalPay = calculation.basicSalary;
        calculation.breakdown = {
          fixedSalary: calculation.basicSalary,
          note: "Using default fixed salary calculation"
        };
    }

    res.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: `${employee.user.firstName} ${employee.user.lastName}`,
          employeeId: employee.employeeId,
          method: payrollMethod
        },
        calculation,
        workingHours: workingHours || null
      }
    });

  } catch (error) {
    console.error("Calculate payroll error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate payroll",
      code: "CALCULATE_PAYROLL_ERROR"
    });
  }
});

export default router;
