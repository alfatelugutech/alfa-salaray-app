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
const analyticsQuerySchema = joi_1.default.object({
    startDate: joi_1.default.date().optional(),
    endDate: joi_1.default.date().optional(),
    department: joi_1.default.string().optional(),
    employeeId: joi_1.default.string().optional(),
    groupBy: joi_1.default.string().valid("day", "week", "month", "department", "employee").optional()
});
// Get attendance analytics
router.get("/attendance", auth_1.requireHR, async (req, res) => {
    try {
        const { error, value } = analyticsQuerySchema.validate(req.query);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        const { startDate, endDate, department, employeeId, groupBy = "day" } = value;
        // Build where clause
        const where = {};
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        if (department) {
            where.employee = {
                department: department
            };
        }
        if (employeeId) {
            where.employeeId = employeeId;
        }
        // Get attendance data
        const attendances = await prisma.attendance.findMany({
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
            orderBy: {
                date: 'asc'
            }
        });
        // Calculate analytics
        const totalDays = attendances.length;
        const presentDays = attendances.filter(a => a.status === 'PRESENT').length;
        const absentDays = attendances.filter(a => a.status === 'ABSENT').length;
        const lateDays = attendances.filter(a => a.status === 'LATE').length;
        const halfDays = attendances.filter(a => a.status === 'HALF_DAY').length;
        const totalHours = attendances.reduce((sum, a) => sum + (Number(a.totalHours) || 0), 0);
        const totalRegularHours = attendances.reduce((sum, a) => sum + (Number(a.regularHours) || 0), 0);
        const totalOvertimeHours = attendances.reduce((sum, a) => sum + (Number(a.overtimeHours) || 0), 0);
        const totalBreakHours = attendances.reduce((sum, a) => sum + (Number(a.breakHours) || 0), 0);
        const remoteWorkDays = attendances.filter(a => a.isRemote).length;
        // Group by specified field
        let groupedData = {};
        if (groupBy === "department") {
            groupedData = attendances.reduce((acc, attendance) => {
                const dept = attendance.employee.department || 'Unknown';
                if (!acc[dept]) {
                    acc[dept] = {
                        department: dept,
                        totalDays: 0,
                        presentDays: 0,
                        absentDays: 0,
                        lateDays: 0,
                        halfDays: 0,
                        totalHours: 0,
                        remoteWorkDays: 0
                    };
                }
                acc[dept].totalDays++;
                if (attendance.status === 'PRESENT')
                    acc[dept].presentDays++;
                if (attendance.status === 'ABSENT')
                    acc[dept].absentDays++;
                if (attendance.status === 'LATE')
                    acc[dept].lateDays++;
                if (attendance.status === 'HALF_DAY')
                    acc[dept].halfDays++;
                acc[dept].totalHours += Number(attendance.totalHours) || 0;
                if (attendance.isRemote)
                    acc[dept].remoteWorkDays++;
                return acc;
            }, {});
        }
        else if (groupBy === "employee") {
            groupedData = attendances.reduce((acc, attendance) => {
                const empId = attendance.employeeId;
                if (!acc[empId]) {
                    acc[empId] = {
                        employeeId: empId,
                        employeeName: `${attendance.employee.user.firstName} ${attendance.employee.user.lastName}`,
                        department: attendance.employee.department,
                        totalDays: 0,
                        presentDays: 0,
                        absentDays: 0,
                        lateDays: 0,
                        halfDays: 0,
                        totalHours: 0,
                        remoteWorkDays: 0
                    };
                }
                acc[empId].totalDays++;
                if (attendance.status === 'PRESENT')
                    acc[empId].presentDays++;
                if (attendance.status === 'ABSENT')
                    acc[empId].absentDays++;
                if (attendance.status === 'LATE')
                    acc[empId].lateDays++;
                if (attendance.status === 'HALF_DAY')
                    acc[empId].halfDays++;
                acc[empId].totalHours += Number(attendance.totalHours) || 0;
                if (attendance.isRemote)
                    acc[empId].remoteWorkDays++;
                return acc;
            }, {});
        }
        // Calculate percentages
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
        const absenceRate = totalDays > 0 ? (absentDays / totalDays) * 100 : 0;
        const lateRate = totalDays > 0 ? (lateDays / totalDays) * 100 : 0;
        const remoteWorkRate = totalDays > 0 ? (remoteWorkDays / totalDays) * 100 : 0;
        res.json({
            success: true,
            data: {
                summary: {
                    totalDays,
                    presentDays,
                    absentDays,
                    lateDays,
                    halfDays,
                    totalHours: Number(totalHours.toFixed(2)),
                    totalRegularHours: Number(totalRegularHours.toFixed(2)),
                    totalOvertimeHours: Number(totalOvertimeHours.toFixed(2)),
                    totalBreakHours: Number(totalBreakHours.toFixed(2)),
                    remoteWorkDays,
                    attendanceRate: Number(attendanceRate.toFixed(2)),
                    absenceRate: Number(absenceRate.toFixed(2)),
                    lateRate: Number(lateRate.toFixed(2)),
                    remoteWorkRate: Number(remoteWorkRate.toFixed(2))
                },
                groupedData: Object.values(groupedData),
                rawData: attendances
            }
        });
    }
    catch (error) {
        console.error("Analytics error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch analytics data",
            code: "ANALYTICS_ERROR"
        });
    }
});
// Get department analytics
router.get("/departments", auth_1.requireHR, async (req, res) => {
    try {
        const departments = await prisma.employee.groupBy({
            by: ['department'],
            _count: {
                id: true
            },
            where: {
                status: 'ACTIVE'
            }
        });
        // Get attendance data for each department
        const departmentStats = await Promise.all(departments.map(async (dept) => {
            const attendances = await prisma.attendance.findMany({
                where: {
                    employee: {
                        department: dept.department
                    }
                },
                include: {
                    employee: true
                }
            });
            const totalDays = attendances.length;
            const presentDays = attendances.filter(a => a.status === 'PRESENT').length;
            const totalHours = attendances.reduce((sum, a) => sum + (Number(a.totalHours) || 0), 0);
            return {
                department: dept.department || 'Unknown',
                employeeCount: dept._count.id,
                totalDays,
                presentDays,
                totalHours: Number(totalHours.toFixed(2)),
                attendanceRate: totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(2)) : 0
            };
        }));
        res.json({
            success: true,
            data: departmentStats
        });
    }
    catch (error) {
        console.error("Department analytics error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch department analytics",
            code: "DEPARTMENT_ANALYTICS_ERROR"
        });
    }
});
// Get employee performance analytics
router.get("/performance", auth_1.requireHR, async (req, res) => {
    try {
        const { employeeId } = req.query;
        if (!employeeId) {
            res.status(400).json({
                success: false,
                error: "Employee ID is required",
                code: "MISSING_EMPLOYEE_ID"
            });
            return;
        }
        // Get employee attendance data
        const attendances = await prisma.attendance.findMany({
            where: {
                employeeId: employeeId
            },
            orderBy: {
                date: 'desc'
            },
            take: 30 // Last 30 days
        });
        // Calculate performance metrics
        const totalDays = attendances.length;
        const presentDays = attendances.filter(a => a.status === 'PRESENT').length;
        const lateDays = attendances.filter(a => a.status === 'LATE').length;
        const absentDays = attendances.filter(a => a.status === 'ABSENT').length;
        const halfDays = attendances.filter(a => a.status === 'HALF_DAY').length;
        const totalHours = attendances.reduce((sum, a) => sum + (Number(a.totalHours) || 0), 0);
        const totalOvertimeHours = attendances.reduce((sum, a) => sum + (Number(a.overtimeHours) || 0), 0);
        const remoteWorkDays = attendances.filter(a => a.isRemote).length;
        // Calculate scores
        const attendanceScore = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
        const punctualityScore = totalDays > 0 ? ((presentDays - lateDays) / totalDays) * 100 : 0;
        const overtimeScore = totalOvertimeHours > 0 ? Math.min((totalOvertimeHours / totalDays) * 10, 100) : 0;
        const remoteWorkScore = totalDays > 0 ? (remoteWorkDays / totalDays) * 100 : 0;
        // Overall performance score
        const overallScore = (attendanceScore * 0.4 + punctualityScore * 0.3 + overtimeScore * 0.2 + remoteWorkScore * 0.1);
        res.json({
            success: true,
            data: {
                employeeId,
                period: "Last 30 days",
                metrics: {
                    totalDays,
                    presentDays,
                    lateDays,
                    absentDays,
                    halfDays,
                    totalHours: Number(totalHours.toFixed(2)),
                    totalOvertimeHours: Number(totalOvertimeHours.toFixed(2)),
                    remoteWorkDays
                },
                scores: {
                    attendanceScore: Number(attendanceScore.toFixed(2)),
                    punctualityScore: Number(punctualityScore.toFixed(2)),
                    overtimeScore: Number(overtimeScore.toFixed(2)),
                    remoteWorkScore: Number(remoteWorkScore.toFixed(2)),
                    overallScore: Number(overallScore.toFixed(2))
                }
            }
        });
    }
    catch (error) {
        console.error("Performance analytics error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch performance analytics",
            code: "PERFORMANCE_ANALYTICS_ERROR"
        });
    }
});
exports.default = router;
