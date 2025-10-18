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
const markAttendanceSchema = joi_1.default.object({
    employeeId: joi_1.default.string().required(),
    date: joi_1.default.date().required(),
    checkIn: joi_1.default.date().optional(),
    checkOut: joi_1.default.date().optional(),
    status: joi_1.default.string().valid("PRESENT", "ABSENT", "LATE", "EARLY_LEAVE", "HALF_DAY").required(),
    notes: joi_1.default.string().optional()
});
const updateAttendanceSchema = joi_1.default.object({
    checkIn: joi_1.default.date().optional(),
    checkOut: joi_1.default.date().optional(),
    status: joi_1.default.string().valid("PRESENT", "ABSENT", "LATE", "EARLY_LEAVE", "HALF_DAY").optional(),
    notes: joi_1.default.string().optional()
});
// Mark attendance (for employees and admins)
router.post("/mark", async (req, res) => {
    try {
        const { error, value } = markAttendanceSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        const { employeeId, date, checkIn, checkOut, status, notes } = value;
        // Check if attendance already exists for this date
        const existingAttendance = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId,
                    date: new Date(date)
                }
            }
        });
        if (existingAttendance) {
            res.status(400).json({
                success: false,
                error: "Attendance already marked for this date",
                code: "ATTENDANCE_EXISTS"
            });
            return;
        }
        // Calculate total hours if both check-in and check-out are provided
        let totalHours = null;
        if (checkIn && checkOut) {
            const checkInTime = new Date(checkIn);
            const checkOutTime = new Date(checkOut);
            totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60); // Convert to hours
        }
        const attendance = await prisma.attendance.create({
            data: {
                employeeId,
                date: new Date(date),
                checkIn: checkIn ? new Date(checkIn) : null,
                checkOut: checkOut ? new Date(checkOut) : null,
                totalHours,
                status,
                notes
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
            message: "Attendance marked successfully",
            data: { attendance }
        });
    }
    catch (error) {
        console.error("Mark attendance error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to mark attendance",
            code: "MARK_ATTENDANCE_ERROR"
        });
    }
});
// Get attendance records
router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10, employeeId, startDate, endDate, status = "" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (employeeId) {
            where.employeeId = employeeId;
        }
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        if (status) {
            where.status = status;
        }
        const [attendances, total] = await Promise.all([
            prisma.attendance.findMany({
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
                orderBy: { date: "desc" }
            }),
            prisma.attendance.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                attendances,
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
        console.error("Get attendance error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch attendance records",
            code: "FETCH_ATTENDANCE_ERROR"
        });
    }
});
// Get attendance by ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await prisma.attendance.findUnique({
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
        if (!attendance) {
            res.status(404).json({
                success: false,
                error: "Attendance record not found",
                code: "ATTENDANCE_NOT_FOUND"
            });
            return;
        }
        res.json({
            success: true,
            data: { attendance }
        });
    }
    catch (error) {
        console.error("Get attendance by ID error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch attendance record",
            code: "FETCH_ATTENDANCE_ERROR"
        });
    }
});
// Update attendance
router.put("/:id", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateAttendanceSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        const { checkIn, checkOut, status, notes } = value;
        // Calculate total hours if both check-in and check-out are provided
        let totalHours = null;
        if (checkIn && checkOut) {
            const checkInTime = new Date(checkIn);
            const checkOutTime = new Date(checkOut);
            totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        }
        const attendance = await prisma.attendance.update({
            where: { id },
            data: {
                checkIn: checkIn ? new Date(checkIn) : undefined,
                checkOut: checkOut ? new Date(checkOut) : undefined,
                totalHours,
                status,
                notes
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
            message: "Attendance updated successfully",
            data: { attendance }
        });
    }
    catch (error) {
        console.error("Update attendance error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update attendance",
            code: "UPDATE_ATTENDANCE_ERROR"
        });
    }
});
// Delete attendance
router.delete("/:id", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.attendance.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: "Attendance record deleted successfully"
        });
    }
    catch (error) {
        console.error("Delete attendance error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete attendance record",
            code: "DELETE_ATTENDANCE_ERROR"
        });
    }
});
// Get attendance statistics
router.get("/stats/overview", auth_1.requireHR, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        const [totalRecords, presentCount, absentCount, lateCount] = await Promise.all([
            prisma.attendance.count({ where }),
            prisma.attendance.count({ where: { ...where, status: "PRESENT" } }),
            prisma.attendance.count({ where: { ...where, status: "ABSENT" } }),
            prisma.attendance.count({ where: { ...where, status: "LATE" } })
        ]);
        res.json({
            success: true,
            data: {
                totalRecords,
                presentCount,
                absentCount,
                lateCount,
                attendanceRate: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0
            }
        });
    }
    catch (error) {
        console.error("Get attendance stats error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch attendance statistics",
            code: "FETCH_STATS_ERROR"
        });
    }
});
// Get employee's attendance history
router.get("/employee/:employeeId", async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { page = 1, limit = 10, startDate, endDate } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { employeeId };
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        const [attendances, total] = await Promise.all([
            prisma.attendance.findMany({
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
                orderBy: { date: "desc" }
            }),
            prisma.attendance.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                attendances,
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
        console.error("Get employee attendance error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch employee attendance",
            code: "FETCH_EMPLOYEE_ATTENDANCE_ERROR"
        });
    }
});
exports.default = router;
//# sourceMappingURL=attendance.js.map