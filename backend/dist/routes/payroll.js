"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Apply authentication to all routes
router.use(auth_1.authenticateToken);
// Validation schemas
const createPayrollSchema = joi_1.default.object({
    employeeId: joi_1.default.string().required(),
    month: joi_1.default.number().min(1).max(12).required(),
    year: joi_1.default.number().min(2020).max(2030).required(),
    basicSalary: joi_1.default.number().min(0).required(),
    overtimePay: joi_1.default.number().min(0).default(0),
    allowances: joi_1.default.number().min(0).default(0),
    deductions: joi_1.default.number().min(0).default(0)
});
const updatePayrollSchema = joi_1.default.object({
    basicSalary: joi_1.default.number().min(0).optional(),
    overtimePay: joi_1.default.number().min(0).optional(),
    allowances: joi_1.default.number().min(0).optional(),
    deductions: joi_1.default.number().min(0).optional(),
    status: joi_1.default.string().valid("PENDING", "PROCESSED", "PAID", "CANCELLED").optional()
});
// Get all payroll records
router.get("/", auth_1.requireHR, async (req, res) => {
    try {
        const { page = 1, limit = 10, employeeId, month, year, status = "" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (employeeId) {
            where.employeeId = employeeId;
        }
        if (month) {
            where.month = Number(month);
        }
        if (year) {
            where.year = Number(year);
        }
        if (status) {
            where.status = status;
        }
        const [payrolls, total] = await Promise.all([
            prisma.payroll.findMany({
                where,
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
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" }
            }),
            prisma.payroll.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                payrolls,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        console.error("Get payrolls error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch payroll records",
            code: "FETCH_PAYROLLS_ERROR"
        });
    }
});
// Get payroll by ID
router.get("/:id", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        const payroll = await prisma.payroll.findUnique({
            where: { id },
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
            }
        });
        if (!payroll) {
            res.status(404).json({
                success: false,
                error: "Payroll record not found",
                code: "PAYROLL_NOT_FOUND"
            });
            return;
        }
        res.json({
            success: true,
            data: { payroll }
        });
    }
    catch (error) {
        console.error("Get payroll error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch payroll record",
            code: "FETCH_PAYROLL_ERROR"
        });
    }
});
// Create payroll record
router.post("/", auth_1.requireHR, async (req, res) => {
    try {
        const { error, value } = createPayrollSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        const { employeeId, month, year, basicSalary, overtimePay, allowances, deductions } = value;
        // Check if payroll already exists for this employee and period
        const existingPayroll = await prisma.payroll.findUnique({
            where: {
                employeeId_month_year: {
                    employeeId,
                    month,
                    year
                }
            }
        });
        if (existingPayroll) {
            res.status(400).json({
                success: false,
                error: "Payroll record already exists for this employee and period",
                code: "PAYROLL_EXISTS"
            });
            return;
        }
        // Calculate net salary
        const netSalary = basicSalary + overtimePay + allowances - deductions;
        const payroll = await prisma.payroll.create({
            data: {
                employeeId,
                month,
                year,
                basicSalary: new client_1.Prisma.Decimal(basicSalary),
                overtimePay: new client_1.Prisma.Decimal(overtimePay),
                allowances: new client_1.Prisma.Decimal(allowances),
                deductions: new client_1.Prisma.Decimal(deductions),
                netSalary: new client_1.Prisma.Decimal(netSalary)
            },
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
            }
        });
        res.status(201).json({
            success: true,
            message: "Payroll record created successfully",
            data: { payroll }
        });
    }
    catch (error) {
        console.error("Create payroll error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create payroll record",
            code: "CREATE_PAYROLL_ERROR"
        });
    }
});
// Update payroll record
router.put("/:id", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updatePayrollSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        // Get current payroll record
        const currentPayroll = await prisma.payroll.findUnique({
            where: { id }
        });
        if (!currentPayroll) {
            res.status(404).json({
                success: false,
                error: "Payroll record not found",
                code: "PAYROLL_NOT_FOUND"
            });
            return;
        }
        // Calculate new net salary if financial fields are updated
        let netSalary = currentPayroll.netSalary;
        const updateData = {};
        if (value.basicSalary !== undefined) {
            updateData.basicSalary = new client_1.Prisma.Decimal(value.basicSalary);
        }
        if (value.overtimePay !== undefined) {
            updateData.overtimePay = new client_1.Prisma.Decimal(value.overtimePay);
        }
        if (value.allowances !== undefined) {
            updateData.allowances = new client_1.Prisma.Decimal(value.allowances);
        }
        if (value.deductions !== undefined) {
            updateData.deductions = new client_1.Prisma.Decimal(value.deductions);
        }
        if (value.status !== undefined) {
            updateData.status = value.status;
        }
        if (value.basicSalary !== undefined || value.overtimePay !== undefined ||
            value.allowances !== undefined || value.deductions !== undefined) {
            const basicSalary = value.basicSalary ?? Number(currentPayroll.basicSalary);
            const overtimePay = value.overtimePay ?? Number(currentPayroll.overtimePay);
            const allowances = value.allowances ?? Number(currentPayroll.allowances);
            const deductions = value.deductions ?? Number(currentPayroll.deductions);
            netSalary = new client_1.Prisma.Decimal(basicSalary + overtimePay + allowances - deductions);
            updateData.netSalary = netSalary;
        }
        const payroll = await prisma.payroll.update({
            where: { id },
            data: updateData,
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
            }
        });
        res.json({
            success: true,
            message: "Payroll record updated successfully",
            data: { payroll }
        });
    }
    catch (error) {
        console.error("Update payroll error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update payroll record",
            code: "UPDATE_PAYROLL_ERROR"
        });
    }
});
// Mark payroll as paid
router.put("/:id/mark-paid", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        const payroll = await prisma.payroll.update({
            where: { id },
            data: {
                status: "PAID",
                paidAt: new Date()
            },
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
            }
        });
        res.json({
            success: true,
            message: "Payroll marked as paid successfully",
            data: { payroll }
        });
    }
    catch (error) {
        console.error("Mark payroll as paid error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to mark payroll as paid",
            code: "MARK_PAYROLL_PAID_ERROR"
        });
    }
});
// Delete payroll record
router.delete("/:id", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.payroll.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: "Payroll record deleted successfully"
        });
    }
    catch (error) {
        console.error("Delete payroll error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete payroll record",
            code: "DELETE_PAYROLL_ERROR"
        });
    }
});
// Get payroll statistics
router.get("/stats/overview", auth_1.requireHR, async (req, res) => {
    try {
        const { month, year } = req.query;
        const where = {};
        if (month && year) {
            where.month = Number(month);
            where.year = Number(year);
        }
        const [totalPayrolls, pendingPayrolls, processedPayrolls, paidPayrolls] = await Promise.all([
            prisma.payroll.count({ where }),
            prisma.payroll.count({ where: { ...where, status: "PENDING" } }),
            prisma.payroll.count({ where: { ...where, status: "PROCESSED" } }),
            prisma.payroll.count({ where: { ...where, status: "PAID" } })
        ]);
        // Calculate total amounts
        const totalAmount = await prisma.payroll.aggregate({
            where,
            _sum: {
                netSalary: true
            }
        });
        res.json({
            success: true,
            data: {
                totalPayrolls,
                pendingPayrolls,
                processedPayrolls,
                paidPayrolls,
                totalAmount: totalAmount._sum.netSalary || 0
            }
        });
    }
    catch (error) {
        console.error("Get payroll stats error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch payroll statistics",
            code: "FETCH_PAYROLL_STATS_ERROR"
        });
    }
});
// Get employee's payroll history
router.get("/employee/:employeeId", async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { page = 1, limit = 10, year } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { employeeId };
        if (year) {
            where.year = Number(year);
        }
        const [payrolls, total] = await Promise.all([
            prisma.payroll.findMany({
                where,
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
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" }
            }),
            prisma.payroll.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                payrolls,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        console.error("Get employee payroll history error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch employee payroll history",
            code: "FETCH_EMPLOYEE_PAYROLL_ERROR"
        });
    }
});
exports.default = router;
