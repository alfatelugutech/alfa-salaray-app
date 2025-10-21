"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const joi_1 = __importDefault(require("joi"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Validation schemas
const registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    phone: joi_1.default.string().optional(),
    role: joi_1.default.string().valid("SUPER_ADMIN", "HR_MANAGER", "DEPARTMENT_MANAGER", "EMPLOYEE").default("EMPLOYEE")
});
const loginSchema = joi_1.default.object({
    login: joi_1.default.string().required(), // Can be email or mobile number
    password: joi_1.default.string().required()
});
// Register new user
router.post("/register", async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        const { email, password, firstName, lastName, phone, role } = value;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                error: "User already exists",
                code: "USER_EXISTS"
            });
            return;
        }
        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                role
            }
        });
        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-secret");
        if (!jwtSecret) {
            res.status(500).json({
                success: false,
                error: "Server configuration error: JWT secret not set",
                code: "CONFIG_ERROR"
            });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                },
                token
            }
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            error: "Registration failed",
            code: "REGISTRATION_ERROR"
        });
    }
});
// Login user
router.post("/login", async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
                code: "VALIDATION_ERROR"
            });
            return;
        }
        const { login, password } = value;
        // Find user by email or mobile number
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: login },
                    { mobileNumber: login }
                ]
            },
            include: {
                employee: true
            }
        });
        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
                code: "INVALID_CREDENTIALS"
            });
            return;
        }
        // Check password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
                code: "INVALID_CREDENTIALS"
            });
            return;
        }
        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-secret");
        if (!jwtSecret) {
            res.status(500).json({
                success: false,
                error: "Server configuration error: JWT secret not set",
                code: "CONFIG_ERROR"
            });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
        res.json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    employeeId: user.employee?.id
                },
                token
            }
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            error: "Login failed",
            code: "LOGIN_ERROR"
        });
    }
});
// Get current user
router.get("/me", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            res.status(401).json({
                success: false,
                error: "Access token required",
                code: "MISSING_TOKEN"
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-secret");
        if (!jwtSecret) {
            res.status(500).json({
                success: false,
                error: "Server configuration error: JWT secret not set",
                code: "CONFIG_ERROR"
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                employee: true
            }
        });
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User not found",
                code: "USER_NOT_FOUND"
            });
            return;
        }
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    employeeId: user.employee?.id,
                    lastLoginAt: user.lastLoginAt
                }
            }
        });
    }
    catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get user information",
            code: "GET_USER_ERROR"
        });
    }
});
exports.default = router;
