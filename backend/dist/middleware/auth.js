"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireHR = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        console.log('🔐 Auth middleware - Header:', authHeader);
        console.log('🔐 Auth middleware - Token:', token ? 'Present' : 'Missing');
        if (!token) {
            console.log('❌ No token provided');
            res.status(401).json({
                success: false,
                error: "Access token required",
                code: "MISSING_TOKEN"
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-secret");
        console.log('🔐 JWT Secret configured:', !!jwtSecret);
        if (!jwtSecret) {
            console.log('❌ JWT Secret not configured');
            res.status(500).json({
                success: false,
                error: "Server configuration error: JWT secret not set",
                code: "CONFIG_ERROR"
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        console.log('🔐 Decoded token:', { userId: decoded.userId, email: decoded.email });
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });
        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                error: "Invalid token",
                code: "INVALID_TOKEN"
            });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: "Invalid token",
            code: "INVALID_TOKEN"
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireHR = (req, res, next) => {
    const authReq = req;
    if (!authReq.user) {
        res.status(401).json({
            success: false,
            error: "Authentication required",
            code: "AUTH_REQUIRED"
        });
        return;
    }
    if (!["SUPER_ADMIN", "HR_MANAGER"].includes(authReq.user.role)) {
        res.status(403).json({
            success: false,
            error: "HR access required",
            code: "HR_ACCESS_REQUIRED"
        });
        return;
    }
    next();
};
exports.requireHR = requireHR;
