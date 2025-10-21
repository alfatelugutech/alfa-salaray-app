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
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
        version: '2.0.0 - Phase 2'
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
