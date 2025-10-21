import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireHR } from '../middleware/auth';
import Joi from 'joi';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all backups
router.get('/', requireHR, async (req: Request, res: Response) => {
  try {
    const backups = await prisma.backup.findMany({
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: backups
    });

  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch backups',
      code: 'FETCH_BACKUPS_ERROR'
    });
  }
});

// Create new backup
router.post('/', requireHR, async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const { name, type, includeData = true, includeFiles = true } = req.body;

    const validationSchema = Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('FULL', 'INCREMENTAL', 'DIFFERENTIAL').required(),
      includeData: Joi.boolean().default(true),
      includeFiles: Joi.boolean().default(true)
    });

    const { error } = validationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    // Create backup record
    const backup = await prisma.backup.create({
      data: {
        name,
        type,
        status: 'PENDING',
        createdBy: authUser.id
      }
    });

    // Start backup process (simplified - in production, this would be a background job)
    // For now, we'll just simulate the backup process
    setTimeout(async () => {
      try {
        await prisma.backup.update({
          where: { id: backup.id },
          data: {
            status: 'IN_PROGRESS'
          }
        });

        // Simulate backup completion
        setTimeout(async () => {
          await prisma.backup.update({
            where: { id: backup.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              size: BigInt(1024 * 1024), // 1MB simulated size
              filePath: `/backups/${backup.id}.sql`,
              downloadUrl: `/api/backup/${backup.id}/download`
            }
          });
        }, 5000); // 5 seconds simulation

      } catch (error) {
        console.error('Backup process error:', error);
        await prisma.backup.update({
          where: { id: backup.id },
          data: {
            status: 'FAILED'
          }
        });
      }
    }, 1000);

    res.status(201).json({
      success: true,
      data: backup
    });

  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create backup',
      code: 'CREATE_BACKUP_ERROR'
    });
  }
});

// Download backup
router.get('/:id/download', requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authUser = (req as any).user;

    const backup = await prisma.backup.findFirst({
      where: {
        id,
        createdBy: authUser.id
      }
    });

    if (!backup) {
      return res.status(404).json({
        success: false,
        error: 'Backup not found',
        code: 'BACKUP_NOT_FOUND'
      });
    }

    if (backup.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Backup is not ready for download',
        code: 'BACKUP_NOT_READY'
      });
    }

    // In a real implementation, you would serve the actual backup file
    // For now, we'll return a placeholder response
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${backup.name}.sql"`);
    res.send('-- Backup file content would be here --');

  } catch (error) {
    console.error('Download backup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download backup',
      code: 'DOWNLOAD_BACKUP_ERROR'
    });
  }
});

// Delete backup
router.delete('/:id', requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authUser = (req as any).user;

    const backup = await prisma.backup.findFirst({
      where: {
        id,
        createdBy: authUser.id
      }
    });

    if (!backup) {
      return res.status(404).json({
        success: false,
        error: 'Backup not found',
        code: 'BACKUP_NOT_FOUND'
      });
    }

    await prisma.backup.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Backup deleted successfully'
    });

  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete backup',
      code: 'DELETE_BACKUP_ERROR'
    });
  }
});

// Get backup status
router.get('/:id/status', requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authUser = (req as any).user;

    const backup = await prisma.backup.findFirst({
      where: {
        id,
        createdBy: authUser.id
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!backup) {
      return res.status(404).json({
        success: false,
        error: 'Backup not found',
        code: 'BACKUP_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: backup
    });

  } catch (error) {
    console.error('Get backup status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get backup status',
      code: 'GET_BACKUP_STATUS_ERROR'
    });
  }
});

// Schedule automatic backups
router.post('/schedule', requireHR, async (req: Request, res: Response) => {
  try {
    const { frequency, time, type, retentionDays } = req.body;

    const validationSchema = Joi.object({
      frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY').required(),
      time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      type: Joi.string().valid('FULL', 'INCREMENTAL').required(),
      retentionDays: Joi.number().min(1).max(365).required()
    });

    const { error } = validationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    // In a real implementation, you would save the schedule to a database
    // and set up a cron job or scheduled task
    res.json({
      success: true,
      message: 'Backup schedule created successfully',
      data: {
        frequency,
        time,
        type,
        retentionDays
      }
    });

  } catch (error) {
    console.error('Schedule backup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule backup',
      code: 'SCHEDULE_BACKUP_ERROR'
    });
  }
});

// Get backup schedule
router.get('/schedule', requireHR, async (req: Request, res: Response) => {
  try {
    // In a real implementation, you would fetch the schedule from database
    res.json({
      success: true,
      data: {
        frequency: 'DAILY',
        time: '02:00',
        type: 'FULL',
        retentionDays: 30,
        isActive: true
      }
    });

  } catch (error) {
    console.error('Get backup schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get backup schedule',
      code: 'GET_BACKUP_SCHEDULE_ERROR'
    });
  }
});

export default router;
