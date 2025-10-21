"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const joi_1 = __importDefault(require("joi"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Validation schemas
const createDepartmentSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    description: joi_1.default.string().optional(),
    managerId: joi_1.default.string().optional()
});
const updateDepartmentSchema = joi_1.default.object({
    name: joi_1.default.string().optional(),
    description: joi_1.default.string().optional(),
    managerId: joi_1.default.string().optional(),
    isActive: joi_1.default.boolean().optional()
});
// Get all departments
router.get("/", auth_1.authenticateToken, async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        employees: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.json({
            success: true,
            data: departments
        });
    }
    catch (error) {
        console.error("Get departments error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch departments"
        });
    }
});
// Get department by ID
router.get("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                employees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                mobileNumber: true
                            }
                        }
                    }
                }
            }
        });
        if (!department) {
            return res.status(404).json({
                success: false,
                error: "Department not found"
            });
        }
        res.json({
            success: true,
            data: department
        });
    }
    catch (error) {
        console.error("Get department error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch department"
        });
    }
});
// Create new department
router.post("/", auth_1.requireHR, async (req, res) => {
    try {
        const { error, value } = createDepartmentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }
        const { name, description, managerId } = value;
        // Check if department name already exists
        const existingDepartment = await prisma.department.findUnique({
            where: { name }
        });
        if (existingDepartment) {
            return res.status(400).json({
                success: false,
                error: "Department with this name already exists"
            });
        }
        const department = await prisma.department.create({
            data: {
                name,
                description,
                managerId
            },
            include: {
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            message: "Department created successfully",
            data: department
        });
    }
    catch (error) {
        console.error("Create department error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create department"
        });
    }
});
// Update department
router.put("/:id", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateDepartmentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }
        // Check if department exists
        const existingDepartment = await prisma.department.findUnique({
            where: { id }
        });
        if (!existingDepartment) {
            return res.status(404).json({
                success: false,
                error: "Department not found"
            });
        }
        // Check if name is being changed and if it already exists
        if (value.name && value.name !== existingDepartment.name) {
            const nameExists = await prisma.department.findUnique({
                where: { name: value.name }
            });
            if (nameExists) {
                return res.status(400).json({
                    success: false,
                    error: "Department with this name already exists"
                });
            }
        }
        const department = await prisma.department.update({
            where: { id },
            data: value,
            include: {
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        res.json({
            success: true,
            message: "Department updated successfully",
            data: department
        });
    }
    catch (error) {
        console.error("Update department error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update department"
        });
    }
});
// Delete department
router.delete("/:id", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        // Check if department exists
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        employees: true
                    }
                }
            }
        });
        if (!department) {
            return res.status(404).json({
                success: false,
                error: "Department not found"
            });
        }
        // Check if department has employees
        if (department._count.employees > 0) {
            return res.status(400).json({
                success: false,
                error: "Cannot delete department with employees. Please reassign employees first."
            });
        }
        await prisma.department.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: "Department deleted successfully"
        });
    }
    catch (error) {
        console.error("Delete department error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete department"
        });
    }
});
exports.default = router;
