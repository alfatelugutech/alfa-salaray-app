import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireHR } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Get audit logs
router.get('/logs', requireHR, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, userId, action, resource, startDate, endDate } = req.query;
    
    const whereClause: any = {};
    if (userId) whereClause.userId = userId;
    if (action) whereClause.action = { contains: action as string, mode: 'insensitive' };
    if (resource) whereClause.resource = { contains: resource as string, mode: 'insensitive' };
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        auditLogs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
      code: 'FETCH_AUDIT_LOGS_ERROR'
    });
  }
});

// Get user activity
router.get('/user/:userId', requireHR, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;
    
    const whereClause: any = { userId };
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: Number(limit)
    });

    res.json({
      success: true,
      data: auditLogs
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity',
      code: 'FETCH_USER_ACTIVITY_ERROR'
    });
  }
});

// Get system activity
router.get('/system', requireHR, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: Number(limit)
    });

    res.json({
      success: true,
      data: auditLogs
    });

  } catch (error) {
    console.error('Get system activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system activity',
      code: 'FETCH_SYSTEM_ACTIVITY_ERROR'
    });
  }
});

// Export audit logs
router.get('/export', requireHR, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;
    
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    if (format === 'csv') {
      const csvData = generateAuditLogCSV(auditLogs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
      res.send(csvData);
    } else {
      res.status(501).json({
        success: false,
        error: 'Only CSV format is currently supported',
        code: 'NOT_IMPLEMENTED'
      });
    }

  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs',
      code: 'EXPORT_AUDIT_LOGS_ERROR'
    });
  }
});

// Helper function for CSV generation
function generateAuditLogCSV(auditLogs: any[]): string {
  const headers = [
    'Timestamp',
    'User',
    'Email',
    'Action',
    'Resource',
    'Resource ID',
    'IP Address',
    'User Agent'
  ];

  const rows = auditLogs.map(log => [
    log.timestamp,
    `${log.user.firstName} ${log.user.lastName}`,
    log.user.email,
    log.action,
    log.resource,
    log.resourceId,
    log.ipAddress || '',
    log.userAgent || ''
  ]);

  return [headers, ...rows].map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');
}

export default router;
