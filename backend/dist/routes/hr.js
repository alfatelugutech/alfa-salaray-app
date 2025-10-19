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
const performanceReviewSchema = joi_1.default.object({
    employeeId: joi_1.default.string().required(),
    period: joi_1.default.string().required(),
    goals: joi_1.default.array().items(joi_1.default.object({
        title: joi_1.default.string().required(),
        description: joi_1.default.string().required(),
        targetValue: joi_1.default.number().required(),
        actualValue: joi_1.default.number().required(),
        weight: joi_1.default.number().min(0).max(1).required()
    })).required(),
    competencies: joi_1.default.array().items(joi_1.default.object({
        name: joi_1.default.string().required(),
        rating: joi_1.default.number().min(1).max(5).required(),
        comments: joi_1.default.string().optional()
    })).required(),
    overallRating: joi_1.default.number().min(1).max(5).required(),
    comments: joi_1.default.string().optional(),
    strengths: joi_1.default.array().items(joi_1.default.string()).optional(),
    areasForImprovement: joi_1.default.array().items(joi_1.default.string()).optional()
});
const goalSettingSchema = joi_1.default.object({
    employeeId: joi_1.default.string().required(),
    title: joi_1.default.string().required(),
    description: joi_1.default.string().required(),
    category: joi_1.default.string().valid('PERFORMANCE', 'DEVELOPMENT', 'BEHAVIORAL', 'QUANTITATIVE').required(),
    targetValue: joi_1.default.number().required(),
    unit: joi_1.default.string().required(),
    startDate: joi_1.default.date().required(),
    endDate: joi_1.default.date().required(),
    priority: joi_1.default.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').required(),
    status: joi_1.default.string().valid('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED').default('DRAFT')
});
// Performance Management
router.post("/performance-reviews", auth_1.requireHR, async (req, res) => {
    try {
        const { error, value } = performanceReviewSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        const { employeeId, period, goals, competencies, overallRating, comments, strengths, areasForImprovement } = value;
        // Calculate performance score
        const goalScore = goals.reduce((sum, goal) => {
            const achievement = (goal.actualValue / goal.targetValue) * 100;
            return sum + (achievement * goal.weight);
        }, 0);
        const competencyScore = competencies.reduce((sum, comp) => sum + comp.rating, 0) / competencies.length;
        const overallScore = (goalScore * 0.6) + (competencyScore * 0.4);
        // Create performance review
        const performanceReview = await prisma.performanceReview.create({
            data: {
                employeeId,
                period,
                overallRating,
                overallScore: Math.round(overallScore),
                comments,
                strengths: strengths || [],
                areasForImprovement: areasForImprovement || [],
                goals: {
                    create: goals.map(goal => ({
                        title: goal.title,
                        description: goal.description,
                        targetValue: goal.targetValue,
                        actualValue: goal.actualValue,
                        weight: goal.weight,
                        achievement: Math.round((goal.actualValue / goal.targetValue) * 100)
                    }))
                },
                competencies: {
                    create: competencies.map(comp => ({
                        name: comp.name,
                        rating: comp.rating,
                        comments: comp.comments || ''
                    }))
                }
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
                },
                goals: true,
                competencies: true
            }
        });
        res.json({
            success: true,
            data: performanceReview
        });
    }
    catch (error) {
        console.error("Performance review error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create performance review",
            code: "PERFORMANCE_REVIEW_ERROR"
        });
    }
});
// Get performance reviews
router.get("/performance-reviews", auth_1.requireHR, async (req, res) => {
    try {
        const { employeeId, period, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (employeeId)
            where.employeeId = employeeId;
        if (period)
            where.period = period;
        const [reviews, total] = await Promise.all([
            prisma.performanceReview.findMany({
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
                    },
                    goals: true,
                    competencies: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.performanceReview.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                reviews,
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
        console.error("Get performance reviews error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch performance reviews",
            code: "GET_PERFORMANCE_REVIEWS_ERROR"
        });
    }
});
// Goal Setting
router.post("/goals", async (req, res) => {
    try {
        const { error, value } = goalSettingSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        const goal = await prisma.goal.create({
            data: value,
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
            data: goal
        });
    }
    catch (error) {
        console.error("Create goal error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create goal",
            code: "CREATE_GOAL_ERROR"
        });
    }
});
// Get goals
router.get("/goals", async (req, res) => {
    try {
        const { employeeId, status, category, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (employeeId)
            where.employeeId = employeeId;
        if (status)
            where.status = status;
        if (category)
            where.category = category;
        const [goals, total] = await Promise.all([
            prisma.goal.findMany({
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.goal.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                goals,
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
        console.error("Get goals error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch goals",
            code: "GET_GOALS_ERROR"
        });
    }
});
// Update goal progress
router.patch("/goals/:id/progress", async (req, res) => {
    try {
        const { id } = req.params;
        const { actualValue, status, comments } = req.body;
        const goal = await prisma.goal.update({
            where: { id },
            data: {
                actualValue,
                status,
                comments,
                updatedAt: new Date()
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
            data: goal
        });
    }
    catch (error) {
        console.error("Update goal progress error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update goal progress",
            code: "UPDATE_GOAL_PROGRESS_ERROR"
        });
    }
});
// Training Management
router.post("/trainings", auth_1.requireHR, async (req, res) => {
    try {
        const { title, description, category, duration, instructor, startDate, endDate, maxParticipants, requirements } = req.body;
        const training = await prisma.training.create({
            data: {
                title,
                description,
                category,
                duration,
                instructor,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                maxParticipants,
                requirements: requirements || [],
                status: 'SCHEDULED'
            }
        });
        res.json({
            success: true,
            data: training
        });
    }
    catch (error) {
        console.error("Create training error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create training",
            code: "CREATE_TRAINING_ERROR"
        });
    }
});
// Get trainings
router.get("/trainings", async (req, res) => {
    try {
        const { status, category, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status)
            where.status = status;
        if (category)
            where.category = category;
        const [trainings, total] = await Promise.all([
            prisma.training.findMany({
                where,
                include: {
                    participants: {
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
                    }
                },
                orderBy: { startDate: 'asc' },
                skip,
                take: Number(limit)
            }),
            prisma.training.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                trainings,
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
        console.error("Get trainings error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch trainings",
            code: "GET_TRAININGS_ERROR"
        });
    }
});
// Enroll in training
router.post("/trainings/:id/enroll", async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        // Get employee ID
        const employee = await prisma.employee.findFirst({
            where: { userId }
        });
        if (!employee) {
            res.status(404).json({
                success: false,
                error: "Employee not found",
                code: "EMPLOYEE_NOT_FOUND"
            });
            return;
        }
        // Check if already enrolled
        const existingEnrollment = await prisma.trainingEnrollment.findFirst({
            where: {
                trainingId: id,
                employeeId: employee.id
            }
        });
        if (existingEnrollment) {
            res.status(400).json({
                success: false,
                error: "Already enrolled in this training",
                code: "ALREADY_ENROLLED"
            });
            return;
        }
        const enrollment = await prisma.trainingEnrollment.create({
            data: {
                trainingId: id,
                employeeId: employee.id,
                status: 'ENROLLED'
            },
            include: {
                training: true,
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
            data: enrollment
        });
    }
    catch (error) {
        console.error("Enroll in training error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to enroll in training",
            code: "ENROLL_TRAINING_ERROR"
        });
    }
});
// Document Management
router.post("/documents", auth_1.requireHR, async (req, res) => {
    try {
        const { employeeId, title, description, category, documentType, fileUrl, expiryDate } = req.body;
        const document = await prisma.document.create({
            data: {
                employeeId,
                title,
                description,
                category,
                documentType,
                fileUrl,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                status: 'ACTIVE'
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
            data: document
        });
    }
    catch (error) {
        console.error("Create document error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create document",
            code: "CREATE_DOCUMENT_ERROR"
        });
    }
});
// Get documents
router.get("/documents", async (req, res) => {
    try {
        const { employeeId, category, documentType, status, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (employeeId)
            where.employeeId = employeeId;
        if (category)
            where.category = category;
        if (documentType)
            where.documentType = documentType;
        if (status)
            where.status = status;
        const [documents, total] = await Promise.all([
            prisma.document.findMany({
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.document.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                documents,
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
        console.error("Get documents error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch documents",
            code: "GET_DOCUMENTS_ERROR"
        });
    }
});
exports.default = router;
