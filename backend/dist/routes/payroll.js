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
// Smart payroll analytics endpoint
router.get('/analytics/smart-insights', auth_1.requireHR, async (req, res) => {
    try {
        const { year, month, department } = req.query;
        const where = {};
        if (year)
            where.year = parseInt(year);
        if (month)
            where.month = parseInt(month);
        // Get payroll data with employee information
        const payrolls = await prisma.payroll.findMany({
            where,
            include: {
                employee: {
                    include: {
                        user: true,
                        department: true
                    }
                }
            }
        });
        // Filter by department if specified
        const filteredPayrolls = department ?
            payrolls.filter(p => p.employee.department?.id === department) :
            payrolls;
        // Calculate smart insights
        const totalPayroll = filteredPayrolls.reduce((sum, p) => sum + Number(p.netSalary), 0);
        const averageSalary = filteredPayrolls.length > 0 ? totalPayroll / filteredPayrolls.length : 0;
        const salaryDistribution = {
            high: filteredPayrolls.filter(p => Number(p.netSalary) > averageSalary * 1.5).length,
            medium: filteredPayrolls.filter(p => Number(p.netSalary) >= averageSalary * 0.8 && Number(p.netSalary) <= averageSalary * 1.5).length,
            low: filteredPayrolls.filter(p => Number(p.netSalary) < averageSalary * 0.8).length
        };
        // Department analysis
        const departmentAnalysis = filteredPayrolls.reduce((acc, payroll) => {
            const dept = payroll.employee.department?.name || 'N/A';
            if (!acc[dept]) {
                acc[dept] = { total: 0, sum: 0, count: 0 };
            }
            acc[dept].total++;
            acc[dept].sum += Number(payroll.netSalary);
            acc[dept].count++;
            return acc;
        }, {});
        // Calculate department averages
        Object.keys(departmentAnalysis).forEach(dept => {
            departmentAnalysis[dept].average = departmentAnalysis[dept].sum / departmentAnalysis[dept].count;
        });
        // Generate smart recommendations
        const recommendations = generatePayrollRecommendations(filteredPayrolls, departmentAnalysis, averageSalary);
        res.json({
            success: true,
            data: {
                summary: {
                    totalPayrolls: filteredPayrolls.length,
                    totalAmount: totalPayroll,
                    averageSalary: Math.round(averageSalary * 100) / 100,
                    salaryDistribution
                },
                departmentAnalysis,
                recommendations,
                insights: {
                    highestPaid: filteredPayrolls.length > 0 ?
                        filteredPayrolls.reduce((max, p) => Number(p.netSalary) > Number(max.netSalary) ? p : max) : null,
                    lowestPaid: filteredPayrolls.length > 0 ?
                        filteredPayrolls.reduce((min, p) => Number(p.netSalary) < Number(min.netSalary) ? p : min) : null,
                    salaryRange: {
                        min: filteredPayrolls.length > 0 ? Math.min(...filteredPayrolls.map(p => Number(p.netSalary))) : 0,
                        max: filteredPayrolls.length > 0 ? Math.max(...filteredPayrolls.map(p => Number(p.netSalary))) : 0
                    }
                }
            }
        });
    }
    catch (error) {
        console.error('Smart payroll analytics error:', error);
        res.status(500).json({
            success: false,
            error: "Failed to generate smart payroll insights",
            code: "PAYROLL_ANALYTICS_ERROR"
        });
    }
});
// Helper function for payroll recommendations
function generatePayrollRecommendations(payrolls, departmentAnalysis, averageSalary) {
    const recommendations = [];
    // Salary equity analysis
    const highSalaries = payrolls.filter(p => Number(p.netSalary) > averageSalary * 1.5);
    const lowSalaries = payrolls.filter(p => Number(p.netSalary) < averageSalary * 0.8);
    if (highSalaries.length > payrolls.length * 0.2) {
        recommendations.push('💰 High number of high-salary employees - review compensation structure');
    }
    if (lowSalaries.length > payrolls.length * 0.3) {
        recommendations.push('📊 Many employees below average salary - consider salary reviews');
    }
    // Department equity analysis
    const departmentAverages = Object.values(departmentAnalysis).map((dept) => dept.average);
    const maxDeptAvg = Math.max(...departmentAverages);
    const minDeptAvg = Math.min(...departmentAverages);
    if (maxDeptAvg > minDeptAvg * 2) {
        recommendations.push('⚖️ Significant salary disparity between departments - review equity');
    }
    // Overtime analysis
    const highOvertime = payrolls.filter(p => Number(p.overtimePay) > Number(p.basicSalary) * 0.2);
    if (highOvertime.length > 0) {
        recommendations.push('⏰ Some employees have high overtime - consider workload distribution');
    }
    // Deductions analysis
    const highDeductions = payrolls.filter(p => Number(p.deductions) > Number(p.basicSalary) * 0.1);
    if (highDeductions.length > 0) {
        recommendations.push('📋 Some employees have high deductions - review policies');
    }
    return recommendations;
}
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
// Process salary payment with payment details
router.put("/:id/process-payment", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod, paymentReference, paymentNotes } = req.body;
        const authUser = req.user;
        // Validate payment method
        const validPaymentMethods = ["BANK_TRANSFER", "CASH", "CHECK", "MOBILE_MONEY", "CRYPTOCURRENCY", "OTHER"];
        if (!validPaymentMethods.includes(paymentMethod)) {
            res.status(400).json({
                success: false,
                error: "Invalid payment method",
                code: "INVALID_PAYMENT_METHOD"
            });
            return;
        }
        const payroll = await prisma.payroll.update({
            where: { id },
            data: {
                status: "PAID",
                paidAt: new Date(),
                paymentMethod,
                paymentReference: paymentReference || null,
                paymentNotes: paymentNotes || null,
                processedBy: authUser.id,
                processedAt: new Date()
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
            message: "Salary payment processed successfully",
            data: { payroll }
        });
    }
    catch (error) {
        console.error("Process salary payment error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to process salary payment",
            code: "PROCESS_PAYMENT_ERROR"
        });
    }
});
// Bulk salary payment for multiple employees
router.post("/bulk-payment", auth_1.requireHR, async (req, res) => {
    try {
        const { payrollIds, paymentMethod, paymentReference, paymentNotes } = req.body;
        const authUser = req.user;
        if (!Array.isArray(payrollIds) || payrollIds.length === 0) {
            res.status(400).json({
                success: false,
                error: "Payroll IDs array is required",
                code: "INVALID_PAYROLL_IDS"
            });
            return;
        }
        // Validate payment method
        const validPaymentMethods = ["BANK_TRANSFER", "CASH", "CHECK", "MOBILE_MONEY", "CRYPTOCURRENCY", "OTHER"];
        if (!validPaymentMethods.includes(paymentMethod)) {
            res.status(400).json({
                success: false,
                error: "Invalid payment method",
                code: "INVALID_PAYMENT_METHOD"
            });
            return;
        }
        // Process bulk payment
        const updateData = {
            status: "PAID",
            paidAt: new Date(),
            paymentMethod,
            paymentReference: paymentReference || null,
            paymentNotes: paymentNotes || null,
            processedBy: authUser.id,
            processedAt: new Date()
        };
        const result = await prisma.payroll.updateMany({
            where: {
                id: { in: payrollIds },
                status: { not: "PAID" } // Only update unpaid payrolls
            },
            data: updateData
        });
        // Get updated payroll records
        const updatedPayrolls = await prisma.payroll.findMany({
            where: { id: { in: payrollIds } },
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
            message: `Bulk salary payment processed for ${result.count} employees`,
            data: {
                updatedCount: result.count,
                payrolls: updatedPayrolls
            }
        });
    }
    catch (error) {
        console.error("Bulk salary payment error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to process bulk salary payment",
            code: "BULK_PAYMENT_ERROR"
        });
    }
});
// Get payment history for an employee
router.get("/employee/:employeeId/payment-history", auth_1.requireHR, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { page = 1, limit = 10, year } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
            employeeId,
            status: "PAID"
        };
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
                orderBy: [{ year: "desc" }, { month: "desc" }]
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
        console.error("Get payment history error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch payment history",
            code: "FETCH_PAYMENT_HISTORY_ERROR"
        });
    }
});
// Get payment statistics
router.get("/payment-stats", auth_1.requireHR, async (req, res) => {
    try {
        const { year, month } = req.query;
        const where = {};
        if (year)
            where.year = Number(year);
        if (month)
            where.month = Number(month);
        const [totalPayrolls, paidPayrolls, pendingPayrolls, totalAmountPaid, totalAmountPending] = await Promise.all([
            prisma.payroll.count({ where }),
            prisma.payroll.count({ where: { ...where, status: "PAID" } }),
            prisma.payroll.count({ where: { ...where, status: "PENDING" } }),
            prisma.payroll.aggregate({
                where: { ...where, status: "PAID" },
                _sum: { netSalary: true }
            }),
            prisma.payroll.aggregate({
                where: { ...where, status: "PENDING" },
                _sum: { netSalary: true }
            })
        ]);
        res.json({
            success: true,
            data: {
                totalPayrolls,
                paidPayrolls,
                pendingPayrolls,
                totalAmountPaid: totalAmountPaid._sum.netSalary || 0,
                totalAmountPending: totalAmountPending._sum.netSalary || 0,
                paymentRate: totalPayrolls > 0 ? (paidPayrolls / totalPayrolls) * 100 : 0
            }
        });
    }
    catch (error) {
        console.error("Get payment statistics error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch payment statistics",
            code: "FETCH_PAYMENT_STATS_ERROR"
        });
    }
});
exports.default = router;
