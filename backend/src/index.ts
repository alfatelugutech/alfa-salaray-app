import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import attendanceRoutes from './routes/attendance';
import leaveRoutes from './routes/leave';
import shiftRoutes from './routes/shifts';
import payrollRoutes from './routes/payroll';
import settingsRoutes from './routes/settings';
import locationTrackingRoutes from './routes/locationTracking';
import departmentRoutes from './routes/departments';
import roleRoutes from './routes/roles';
import permissionRoutes from './routes/permissions';
import exportRoutes from './routes/export';
import notificationRoutes from './routes/notifications';
import auditRoutes from './routes/audit';
import backupRoutes from './routes/backup';
import payrollSettingsRoutes from './routes/payrollSettings';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Security middleware
app.use(helmet({
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
const limiter = rateLimit({
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

app.use(cors({
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
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
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
    await prisma.$queryRaw`SELECT 1`;
    
    // Get system statistics
    const [userCount, employeeCount, attendanceCount] = await Promise.all([
      prisma.user.count(),
      prisma.employee.count(),
      prisma.attendance.count()
    ]);
    
    // Calculate system health score
    const healthScore = Math.min(100, Math.max(0, 
      (userCount > 0 ? 25 : 0) +
      (employeeCount > 0 ? 25 : 0) +
      (attendanceCount > 0 ? 25 : 0) +
      (process.env.JWT_SECRET ? 25 : 0)
    ));
    
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
  } catch (error) {
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
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/location-tracking', locationTrackingRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/payroll-settings', payrollSettingsRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection function
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
  } catch (error) {
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
  } catch (error) {
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

export { app };