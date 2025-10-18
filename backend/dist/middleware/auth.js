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
        if (!token) {
            res.status(401).json({
                success: false,
                error: "Access token required",
                code: "MISSING_TOKEN"
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "default-secret");
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
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: "Authentication required",
            code: "AUTH_REQUIRED"
        });
        return;
    }
    if (!["SUPER_ADMIN", "HR_MANAGER"].includes(req.user.role)) {
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
//# sourceMappingURL=auth.js.map