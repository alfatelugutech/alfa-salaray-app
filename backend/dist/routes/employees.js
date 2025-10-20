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
const createEmployeeSchema = joi_1.default.object({
    userId: joi_1.default.string().required(),
    employeeId: joi_1.default.string().required(),
    department: joi_1.default.string().optional(),
    position: joi_1.default.string().optional(),
    hireDate: joi_1.default.date().required(),
    salary: joi_1.default.number().optional(),
    workLocation: joi_1.default.string().required()
});
const updateEmployeeSchema = joi_1.default.object({
    // User fields
    firstName: joi_1.default.string().optional(),
    lastName: joi_1.default.string().optional(),
    email: joi_1.default.string().email().optional(),
    phone: joi_1.default.string().optional(),
    // Employee fields
    employeeId: joi_1.default.string().optional(),
    department: joi_1.default.string().optional(),
    position: joi_1.default.string().optional(),
    salary: joi_1.default.number().optional(),
    status: joi_1.default.string().valid("ACTIVE", "INACTIVE", "TERMINATED", "ON_LEAVE").optional(),
    workLocation: joi_1.default.string().optional(),
    hireDate: joi_1.default.date().optional()
});
// Get all employees
router.get("/", auth_1.requireHR, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", department = "", status = "" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            where.OR = [
                { user: { firstName: { contains: search, mode: "insensitive" } } },
                { user: { lastName: { contains: search, mode: "insensitive" } } },
                { employeeId: { contains: search, mode: "insensitive" } }
            ];
        }
        if (department) {
            where.department = department;
        }
        if (status) {
            where.status = status;
        }
        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            avatar: true,
                            role: true,
                            isActive: true,
                            lastLoginAt: true
                        }
                    }
                },
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" }
            }),
            prisma.employee.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                employees,
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
        console.error("Get employees error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch employees",
            code: "FETCH_EMPLOYEES_ERROR"
        });
    }
});
// Get employee by ID
// Get employee statistics (moved above dynamic :id route to avoid shadowing)
router.get("/stats/overview", auth_1.requireHR, async (req, res) => {
    try {
        const [totalEmployees, activeEmployees, inactiveEmployees, onLeaveEmployees] = await Promise.all([
            prisma.employee.count(),
            prisma.employee.count({ where: { status: "ACTIVE" } }),
            prisma.employee.count({ where: { status: "INACTIVE" } }),
            prisma.employee.count({ where: { status: "ON_LEAVE" } })
        ]);
        res.json({
            success: true,
            data: {
                totalEmployees,
                activeEmployees,
                inactiveEmployees,
                onLeaveEmployees
            }
        });
    }
    catch (error) {
        console.error("Get employee stats error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch employee statistics",
            code: "FETCH_STATS_ERROR"
        });
    }
});
// Get employee by ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        avatar: true,
                        role: true,
                        isActive: true,
                        lastLoginAt: true
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
        res.json({
            success: true,
            data: { employee }
        });
    }
    catch (error) {
        console.error("Get employee error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch employee",
            code: "FETCH_EMPLOYEE_ERROR"
        });
    }
});
// Create new employee
router.post("/", auth_1.requireHR, async (req, res) => {
    try {
        const { error, value } = createEmployeeSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        const { userId, employeeId, department, position, hireDate, salary, workLocation } = value;
        // Check if employee ID already exists
        const existingEmployee = await prisma.employee.findUnique({
            where: { employeeId }
        });
        if (existingEmployee) {
            res.status(400).json({
                success: false,
                error: "Employee ID already exists",
                code: "EMPLOYEE_ID_EXISTS"
            });
            return;
        }
        const employee = await prisma.employee.create({
            data: {
                userId,
                employeeId,
                department,
                position,
                hireDate: new Date(hireDate),
                salary,
                workLocation
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        avatar: true,
                        role: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: { employee }
        });
    }
    catch (error) {
        console.error("Create employee error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create employee",
            code: "CREATE_EMPLOYEE_ERROR"
        });
    }
});
// Update employee
router.put("/:id", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateEmployeeSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        // Separate user fields from employee fields
        const { firstName, lastName, email, phone, ...employeeData } = value;
        // Get the employee to find the userId
        const existingEmployee = await prisma.employee.findUnique({
            where: { id },
            include: { user: true }
        });
        if (!existingEmployee) {
            res.status(404).json({
                success: false,
                error: "Employee not found",
                code: "EMPLOYEE_NOT_FOUND"
            });
            return;
        }
        // Check if email is being changed and if it already exists
        if (email && email !== existingEmployee.user.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email }
            });
            if (emailExists) {
                res.status(400).json({
                    success: false,
                    error: "Email already exists",
                    code: "EMAIL_EXISTS"
                });
                return;
            }
        }
        // Check if employeeId is being changed and if it already exists
        if (employeeData.employeeId && employeeData.employeeId !== existingEmployee.employeeId) {
            const employeeIdExists = await prisma.employee.findUnique({
                where: { employeeId: employeeData.employeeId }
            });
            if (employeeIdExists) {
                res.status(400).json({
                    success: false,
                    error: "Employee ID already exists",
                    code: "EMPLOYEE_ID_EXISTS"
                });
                return;
            }
        }
        // Update user information if provided
        const userUpdateData = {};
        if (firstName !== undefined)
            userUpdateData.firstName = firstName;
        if (lastName !== undefined)
            userUpdateData.lastName = lastName;
        if (email !== undefined)
            userUpdateData.email = email;
        if (phone !== undefined)
            userUpdateData.phone = phone;
        if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
                where: { id: existingEmployee.userId },
                data: userUpdateData
            });
        }
        // Update employee information
        const employeeUpdateData = {};
        if (employeeData.employeeId !== undefined)
            employeeUpdateData.employeeId = employeeData.employeeId;
        if (employeeData.department !== undefined)
            employeeUpdateData.department = employeeData.department;
        if (employeeData.position !== undefined)
            employeeUpdateData.position = employeeData.position;
        if (employeeData.salary !== undefined)
            employeeUpdateData.salary = employeeData.salary;
        if (employeeData.status !== undefined)
            employeeUpdateData.status = employeeData.status;
        if (employeeData.workLocation !== undefined)
            employeeUpdateData.workLocation = employeeData.workLocation;
        if (employeeData.hireDate !== undefined)
            employeeUpdateData.hireDate = new Date(employeeData.hireDate);
        const employee = await prisma.employee.update({
            where: { id },
            data: employeeUpdateData,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        avatar: true,
                        role: true
                    }
                }
            }
        });
        res.json({
            success: true,
            message: "Employee updated successfully",
            data: { employee }
        });
    }
    catch (error) {
        console.error("Update employee error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update employee",
            code: "UPDATE_EMPLOYEE_ERROR"
        });
    }
});
// Delete employee
router.delete("/:id", auth_1.requireHR, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.employee.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: "Employee deleted successfully"
        });
    }
    catch (error) {
        console.error("Delete employee error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete employee",
            code: "DELETE_EMPLOYEE_ERROR"
        });
    }
});
// Get employee statistics
router.get("/stats/overview", auth_1.requireHR, async (req, res) => {
    try {
        const [totalEmployees, activeEmployees, inactiveEmployees, onLeaveEmployees] = await Promise.all([
            prisma.employee.count(),
            prisma.employee.count({ where: { status: "ACTIVE" } }),
            prisma.employee.count({ where: { status: "INACTIVE" } }),
            prisma.employee.count({ where: { status: "ON_LEAVE" } })
        ]);
        res.json({
            success: true,
            data: {
                totalEmployees,
                activeEmployees,
                inactiveEmployees,
                onLeaveEmployees
            }
        });
    }
    catch (error) {
        console.error("Get employee stats error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch employee statistics",
            code: "FETCH_STATS_ERROR"
        });
    }
});
exports.default = router;
