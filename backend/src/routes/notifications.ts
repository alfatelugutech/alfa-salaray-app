import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import Joi from 'joi';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Get notifications for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const { page = 1, limit = 50, unreadOnly = false } = req.query;
    
    const whereClause: any = {
      userId: authUser.id
    };
    
    if (unreadOnly === 'true') {
      whereClause.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.notification.count({ where: whereClause });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      code: 'FETCH_NOTIFICATIONS_ERROR'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authUser = (req as any).user;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: authUser.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() }
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      code: 'MARK_READ_ERROR'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;

    await prisma.notification.updateMany({
      where: {
        userId: authUser.id,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
      code: 'MARK_ALL_READ_ERROR'
    });
  }
});

// Delete notification
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authUser = (req as any).user;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: authUser.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      code: 'DELETE_NOTIFICATION_ERROR'
    });
  }
});

// Get notification preferences
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;

    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: authUser.id }
    });

    res.json({
      success: true,
      data: preferences || {
        userId: authUser.id,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        attendanceReminders: true,
        leaveNotifications: true,
        payrollNotifications: true,
        systemNotifications: true
      }
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences',
      code: 'FETCH_PREFERENCES_ERROR'
    });
  }
});

// Update notification preferences
router.patch('/preferences', async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const preferences = req.body;

    const validationSchema = Joi.object({
      emailNotifications: Joi.boolean(),
      pushNotifications: Joi.boolean(),
      smsNotifications: Joi.boolean(),
      attendanceReminders: Joi.boolean(),
      leaveNotifications: Joi.boolean(),
      payrollNotifications: Joi.boolean(),
      systemNotifications: Joi.boolean()
    });

    const { error } = validationSchema.validate(preferences);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const updatedPreferences = await prisma.notificationPreference.upsert({
      where: { userId: authUser.id },
      update: preferences,
      create: {
        userId: authUser.id,
        ...preferences
      }
    });

    res.json({
      success: true,
      data: updatedPreferences
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
      code: 'UPDATE_PREFERENCES_ERROR'
    });
  }
});

// Send notification to specific user (Admin only)
router.post('/send', async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    
    // Check if user is admin
    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'HR_MANAGER') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.',
        code: 'ACCESS_DENIED'
      });
    }

    const { userId, type, title, message, priority = 'MEDIUM' } = req.body;

    const validationSchema = Joi.object({
      userId: Joi.string().required(),
      type: Joi.string().valid('INFO', 'WARNING', 'ERROR', 'SUCCESS').required(),
      title: Joi.string().required(),
      message: Joi.string().required(),
      priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').default('MEDIUM')
    });

    const { error } = validationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        priority,
        read: false
      }
    });

    res.status(201).json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      code: 'SEND_NOTIFICATION_ERROR'
    });
  }
});

export default router;
