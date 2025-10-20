import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import Joi from 'joi'
import { authenticateToken } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Apply authentication to all routes
router.use(authenticateToken)

// Validation schemas
const trackLocationSchema = Joi.object({
  attendanceId: Joi.string().required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  accuracy: Joi.number().optional(),
  address: Joi.string().optional()
})

// Track employee location
router.post("/track", async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    if (!authUser?.id) {
      res.status(401).json({ success: false, error: "Authentication required", code: "AUTH_REQUIRED" });
      return;
    }

    const { error, value } = trackLocationSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const { attendanceId, latitude, longitude, accuracy, address } = value;

    // Find employee by userId
    const employee = await prisma.employee.findUnique({ where: { userId: authUser.id } });
    if (!employee) {
      res.status(404).json({ success: false, error: "Employee profile not found", code: "EMPLOYEE_NOT_FOUND" });
      return;
    }

    // Verify attendance record exists and belongs to employee
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        employeeId: employee.id,
        checkIn: { not: null },
        checkOut: null // Only track if not checked out
      }
    });

    if (!attendance) {
      res.status(400).json({ 
        success: false, 
        error: "No active attendance session found", 
        code: "NO_ACTIVE_SESSION" 
      });
      return;
    }

    // Create location tracking record
    const locationRecord = await prisma.locationTracking.create({
      data: {
        attendanceId,
        employeeId: employee.id,
        latitude,
        longitude,
        accuracy: accuracy || null,
        address: address || null,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: "Location tracked successfully",
      data: { locationRecord }
    });

  } catch (error) {
    console.error("Track location error:", error);
    res.status(500).json({ success: false, error: "Failed to track location", code: "TRACK_LOCATION_ERROR" });
  }
});

// Get location history for an attendance record
router.get("/attendance/:attendanceId", async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    if (!authUser?.id) {
      res.status(401).json({ success: false, error: "Authentication required", code: "AUTH_REQUIRED" });
      return;
    }

    const { attendanceId } = req.params;

    // Find employee by userId
    const employee = await prisma.employee.findUnique({ where: { userId: authUser.id } });
    if (!employee) {
      res.status(404).json({ success: false, error: "Employee profile not found", code: "EMPLOYEE_NOT_FOUND" });
      return;
    }

    // Get location history for the attendance record
    const locationHistory = await prisma.locationTracking.findMany({
      where: {
        attendanceId,
        employeeId: employee.id
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    res.json({
      success: true,
      data: { locationHistory }
    });

  } catch (error) {
    console.error("Get location history error:", error);
    res.status(500).json({ success: false, error: "Failed to get location history", code: "GET_LOCATION_HISTORY_ERROR" });
  }
});

// Get location history for admin (HR/Super Admin)
router.get("/admin/attendance/:attendanceId", async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    if (!authUser?.id) {
      res.status(401).json({ success: false, error: "Authentication required", code: "AUTH_REQUIRED" });
      return;
    }

    // Check if user is admin/HR
    const user = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user || !['SUPER_ADMIN', 'HR_MANAGER'].includes(user.role)) {
      res.status(403).json({ success: false, error: "Access denied", code: "ACCESS_DENIED" });
      return;
    }

    const { attendanceId } = req.params;

    // Get location history for the attendance record
    const locationHistory = await prisma.locationTracking.findMany({
      where: {
        attendanceId
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    res.json({
      success: true,
      data: { locationHistory }
    });

  } catch (error) {
    console.error("Get admin location history error:", error);
    res.status(500).json({ success: false, error: "Failed to get location history", code: "GET_ADMIN_LOCATION_HISTORY_ERROR" });
  }
});

// Stop location tracking (when employee checks out)
router.post("/stop/:attendanceId", async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    if (!authUser?.id) {
      res.status(401).json({ success: false, error: "Authentication required", code: "AUTH_REQUIRED" });
      return;
    }

    const { attendanceId } = req.params;

    // Find employee by userId
    const employee = await prisma.employee.findUnique({ where: { userId: authUser.id } });
    if (!employee) {
      res.status(404).json({ success: false, error: "Employee profile not found", code: "EMPLOYEE_NOT_FOUND" });
      return;
    }

    // Stop all active location tracking for this attendance
    await prisma.locationTracking.updateMany({
      where: {
        attendanceId,
        employeeId: employee.id,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    res.json({
      success: true,
      message: "Location tracking stopped"
    });

  } catch (error) {
    console.error("Stop location tracking error:", error);
    res.status(500).json({ success: false, error: "Failed to stop location tracking", code: "STOP_LOCATION_TRACKING_ERROR" });
  }
});

export default router
