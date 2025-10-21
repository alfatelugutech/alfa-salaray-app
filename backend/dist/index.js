"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const employees_1 = __importDefault(require("./routes/employees"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const leave_1 = __importDefault(require("./routes/leave"));
const shifts_1 = __importDefault(require("./routes/shifts"));
const payroll_1 = __importDefault(require("./routes/payroll"));
const settings_1 = __importDefault(require("./routes/settings"));
const locationTracking_1 = __importDefault(require("./routes/locationTracking"));
const departments_1 = __importDefault(require("./routes/departments"));
const roles_1 = __importDefault(require("./routes/roles"));
const permissions_1 = __importDefault(require("./routes/permissions"));
const export_1 = __importDefault(require("./routes/export"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const audit_1 = __importDefault(require("./routes/audit"));
const backup_1 = __importDefault(require("./routes/backup"));
// Import middleware
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
// Load environment variables
dotenv_1.default.config();
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
exports.app = app;
const PORT = parseInt(process.env.PORT || '5000', 10);
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// Rate limiting - More lenient for free Render plan
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // Much higher limit
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks and CORS preflight
        return req.path === '/health' || req.path === '/api/test' || req.path === '/api/cors-test';
    }
});
app.use(limiter);
// CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "https://alfa-salaray-app.vercel.app",
    "https://alfa-salaray-app.vercel.app/",
    "http://localhost:3000",
    "http://localhost:5173", // Vite dev server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        console.log('🌐 CORS request from origin:', origin);
        // Allow requests with no origin (mobile apps, Postman, file://, etc.)
        if (!origin || origin === 'null') {
            console.log('✅ Allowing request with no origin');
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            console.log('✅ Allowing origin:', origin);
            return callback(null, true);
        }
        // In development, allow localhost and 127.0.0.1
        if (process.env.NODE_ENV !== 'production' &&
            (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            console.log('✅ Allowing localhost origin in development:', origin);
            return callback(null, true);
        }
        console.log('🚫 CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Body parsing middleware
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Logging
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0 - Phase 2',
        cors: {
            allowedOrigins: allowedOrigins,
            frontendUrl: process.env.FRONTEND_URL
        }
    });
});
// Smart system health endpoint
app.get('/smart-health', async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw `SELECT 1`;
        // Get system statistics
        const [userCount, employeeCount, attendanceCount] = await Promise.all([
            prisma.user.count(),
            prisma.employee.count(),
            prisma.attendance.count()
        ]);
        // Calculate system health score
        const healthScore = Math.min(100, Math.max(0, (userCount > 0 ? 25 : 0) +
            (employeeCount > 0 ? 25 : 0) +
            (attendanceCount > 0 ? 25 : 0) +
            (process.env.JWT_SECRET ? 25 : 0)));
        const healthStatus = healthScore >= 90 ? 'EXCELLENT' :
            healthScore >= 75 ? 'GOOD' :
                healthScore >= 50 ? 'FAIR' : 'POOR';
        res.json({
            success: true,
            message: 'Smart system health check',
            timestamp: new Date().toISOString(),
            health: {
                score: healthScore,
                status: healthStatus,
                database: 'Connected',
                environment: process.env.NODE_ENV || 'development'
            },
            statistics: {
                users: userCount,
                employees: employeeCount,
                attendances: attendanceCount
            },
            smartFeatures: {
                analytics: 'Available',
                insights: 'Active',
                recommendations: 'Enabled'
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'System health check failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
// Debug endpoint for CORS testing
app.get('/api/debug', (req, res) => {
    res.status(200).json({
        message: 'Backend is working!',
        timestamp: new Date().toISOString(),
        origin: req.get('origin'),
        userAgent: req.get('user-agent'),
        ip: req.ip
    });
});
// Simple test endpoint
app.get('/api/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is working',
        timestamp: new Date().toISOString(),
        origin: req.get('origin'),
        userAgent: req.get('user-agent')
    });
});
// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CORS is working',
        timestamp: new Date().toISOString(),
        origin: req.get('origin'),
        headers: {
            origin: req.get('origin'),
            referer: req.get('referer'),
            userAgent: req.get('user-agent')
        }
    });
});
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/employees', employees_1.default);
app.use('/api/attendance', attendance_1.default);
app.use('/api/leave', leave_1.default);
app.use('/api/shifts', shifts_1.default);
app.use('/api/payroll', payroll_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/location-tracking', locationTracking_1.default);
app.use('/api/departments', departments_1.default);
app.use('/api/roles', roles_1.default);
app.use('/api/permissions', permissions_1.default);
app.use('/api/export', export_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/audit', audit_1.default);
app.use('/api/backup', backup_1.default);
// Error handling middleware
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
// Database connection function
async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully!');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}
// Start server
async function startServer() {
    try {
        // Connect to database
        await connectDatabase();
        // Start the server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Employee Attendance System - Phase 1`);
            console.log(`📊 Server running on port ${PORT}`);
            console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
            console.log(`📱 Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    }
}
// Start the server
startServer();
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});
