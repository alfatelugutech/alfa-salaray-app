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
const createLeaveRequestSchema = joi_1.default.object({
    employeeId: joi_1.default.string().required(),
    leaveType: joi_1.default.string().valid("SICK_LEAVE", "VACATION", "PERSONAL_LEAVE", "EMERGENCY_LEAVE", "MATERNITY_LEAVE", "PATERNITY_LEAVE").required(),
    startDate: joi_1.default.date().required(),
    endDate: joi_1.default.date().required(),
    reason: joi_1.default.string().required()
});
const updateLeaveRequestSchema = joi_1.default.object({
    status: joi_1.default.string().valid("PENDING", "APPROVED", "REJECTED", "CANCELLED").required(),
    comments: joi_1.default.string().optional()
});
// Create leave request
router.post("/request", async (req, res) => {
    try {
        const { error, value } = createLeaveRequestSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        const { employeeId, leaveType, startDate, endDate, reason } = value;
        // Calculate number of days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        // Check for overlapping leave requests
        const overlappingRequest = await prisma.leaveRequest.findFirst({
            where: {
                employeeId,
                status: { in: ["PENDING", "APPROVED"] },
                OR: [
                    {
                        startDate: { lte: end },
                        endDate: { gte: start }
                    }
                ]
            }
        });
        if (overlappingRequest) {
            res.status(400).json({
                success: false,
                error: "You already have a leave request for this period",
                code: "OVERLAPPING_LEAVE"
            });
            return;
        }
        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                employeeId,
                leaveType,
                startDate: start,
                endDate: end,
                days,
                reason,
                status: "PENDING"
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
            message: "Leave request submitted successfully",
            data: { leaveRequest }
        });
    }
    catch (error) {
        console.error("Create leave request error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create leave request",
            code: "CREATE_LEAVE_REQUEST_ERROR"
        });
    }
});
// Get leave requests
router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10, employeeId, status = "", leaveType = "", startDate, endDate } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (employeeId) {
            where.employeeId = employeeId;
        }
        if (status) {
            where.status = status;
        }
        if (leaveType) {
            where.leaveType = leaveType;
        }
        if (startDate && endDate) {
            where.OR = [
                {
                    startDate: { gte: new Date(startDate) },
                    endDate: { lte: new Date(endDate) }
                }
            ];
        }
        const [leaveRequests, total] = await Promise.all([
            prisma.leaveRequest.findMany({
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
            prisma.leaveRequest.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                leaveRequests,
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
        console.error("Get leave requests error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch leave requests",
            code: "FETCH_LEAVE_REQUESTS_ERROR"
        });
    }
});
// Get leave request by ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const leaveRequest = await prisma.leaveRequest.findUnique({
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
        if (!leaveRequest) {
            res.status(404).json({
                success: false,
                error: "Leave request not found",
                code: "LEAVE_REQUEST_NOT_FOUND"
            });
            return;
        }
        res.json({
            success: true,
            data: { leaveRequest }
        });
    }
    catch (error) {
        console.error("Get leave request by ID error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch leave request",
            code: "FETCH_LEAVE_REQUEST_ERROR"
        });
    }
});
// Update leave request status (approve/reject)
router.put("/:id/status", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateLeaveRequestSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        const { status, comments } = value;
        const leaveRequest = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status,
                comments,
                approvedAt: status === "APPROVED" || status === "REJECTED" ? new Date() : undefined
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
            message: `Leave request ${status.toLowerCase()} successfully`,
            data: { leaveRequest }
        });
    }
    catch (error) {
        console.error("Update leave request status error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update leave request status",
            code: "UPDATE_LEAVE_REQUEST_ERROR"
        });
    }
});
// Cancel leave request
router.put("/:id/cancel", async (req, res) => {
    try {
        const { id } = req.params;
        const leaveRequest = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status: "CANCELLED"
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
            message: "Leave request cancelled successfully",
            data: { leaveRequest }
        });
    }
    catch (error) {
        console.error("Cancel leave request error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to cancel leave request",
            code: "CANCEL_LEAVE_REQUEST_ERROR"
        });
    }
});
// Delete leave request
router.delete("/:id", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.leaveRequest.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: "Leave request deleted successfully"
        });
    }
    catch (error) {
        console.error("Delete leave request error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete leave request",
            code: "DELETE_LEAVE_REQUEST_ERROR"
        });
    }
});
// Get leave statistics
router.get("/stats/overview", auth_1.requireHR, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate && endDate) {
            where.OR = [
                {
                    startDate: { gte: new Date(startDate) },
                    endDate: { lte: new Date(endDate) }
                }
            ];
        }
        const [totalRequests, pendingRequests, approvedRequests, rejectedRequests] = await Promise.all([
            prisma.leaveRequest.count({ where }),
            prisma.leaveRequest.count({ where: { ...where, status: "PENDING" } }),
            prisma.leaveRequest.count({ where: { ...where, status: "APPROVED" } }),
            prisma.leaveRequest.count({ where: { ...where, status: "REJECTED" } })
        ]);
        res.json({
            success: true,
            data: {
                totalRequests,
                pendingRequests,
                approvedRequests,
                rejectedRequests,
                approvalRate: totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0
            }
        });
    }
    catch (error) {
        console.error("Get leave stats error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch leave statistics",
            code: "FETCH_LEAVE_STATS_ERROR"
        });
    }
});
// Get employee's leave history
router.get("/employee/:employeeId", async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { page = 1, limit = 10, startDate, endDate } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { employeeId };
        if (startDate && endDate) {
            where.OR = [
                {
                    startDate: { gte: new Date(startDate) },
                    endDate: { lte: new Date(endDate) }
                }
            ];
        }
        const [leaveRequests, total] = await Promise.all([
            prisma.leaveRequest.findMany({
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
            prisma.leaveRequest.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                leaveRequests,
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
        console.error("Get employee leave history error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch employee leave history",
            code: "FETCH_EMPLOYEE_LEAVE_ERROR"
        });
    }
});
exports.default = router;
