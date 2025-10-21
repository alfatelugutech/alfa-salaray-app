import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, requireHR } from "../middleware/auth";
import Joi from "joi";

const router = express.Router();
const prisma = new PrismaClient();

// Test route without authentication
router.get("/test", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Attendance service is working",
    timestamp: new Date().toISOString()
  });
});

// Get current attendance status for user
router.get("/self/status", async (req: Request, res: Response) => {
  console.log('📊 Getting attendance status for user');
  
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID required",
        code: "USER_ID_REQUIRED"
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId as string }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid user or user not active",
        code: "INVALID_USER"
      });
    }

    // Find employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee record not found",
        code: "EMPLOYEE_NOT_FOUND"
      });
    }

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Determine status
    const canCheckIn = !attendance || (!attendance.checkIn && !attendance.checkOut);
    const canCheckOut = attendance && attendance.checkIn && !attendance.checkOut;
    const isCompleted = attendance && attendance.checkIn && attendance.checkOut;

    console.log('📊 Attendance status debug:', {
      hasAttendance: !!attendance,
      checkIn: attendance?.checkIn,
      checkOut: attendance?.checkOut,
      canCheckIn,
      canCheckOut,
      isCompleted
    });

    res.json({
      success: true,
      data: {
        status: {
          canCheckIn,
          canCheckOut,
          isCompleted,
          currentTime: new Date().toISOString(),
          today: today.toISOString().split('T')[0]
        },
        attendance: attendance || null
      }
    });

  } catch (error: any) {
    console.error('❌ Get attendance status error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get attendance status",
      code: "STATUS_ERROR"
    });
  }
});

// Self check-in endpoint (for employees to mark their own attendance)
router.post("/self/check-in", async (req: Request, res: Response) => {
  console.log('📝 Self check-in request received:', {
    body: req.body,
    headers: req.headers,
    authorization: req.headers.authorization
  });
  
  try {
    const { isRemote, notes, checkInSelfie, checkInLocation, deviceInfo, shiftId, userId } = req.body;
    
    console.log('📝 Check-in data received:', {
      hasSelfie: !!checkInSelfie,
      selfieLength: checkInSelfie?.length || 0,
      hasLocation: !!checkInLocation,
      locationData: checkInLocation,
      userId: userId
    });
    
    // Simple authentication - check if userId is provided
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID required",
        code: "USER_ID_REQUIRED"
      });
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid user or user not active",
        code: "INVALID_USER"
      });
    }

    // Find employee record for this user
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee record not found",
        code: "EMPLOYEE_NOT_FOUND"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if attendance already exists for today
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        error: "Attendance already marked for today",
        code: "ATTENDANCE_EXISTS"
      });
    }

    // Enhanced validation for check-in requirements
    if (!checkInSelfie) {
      return res.status(400).json({
        success: false,
        error: "Check-in requires a selfie",
        code: "SELFIE_REQUIRED"
      });
    }

    if (!checkInLocation) {
      return res.status(400).json({
        success: false,
        error: "Check-in requires location data",
        code: "LOCATION_REQUIRED"
      });
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: today,
        checkIn: new Date(),
        status: 'PRESENT',
        isRemote: isRemote || false,
        notes: notes || null,
        checkInSelfie: checkInSelfie || null,
        checkInLocation: checkInLocation || null,
        deviceInfo: deviceInfo || null,
        shiftId: shiftId || null,
        location: checkInLocation || null
      }
    });

    console.log('✅ Check-in successful:', {
      attendanceId: attendance.id,
      employeeId: attendance.employeeId,
      checkInTime: attendance.checkIn,
      hasSelfie: !!attendance.checkInSelfie,
      hasLocation: !!attendance.checkInLocation
    });

    res.json({
      success: true,
      message: "Check-in successful - Attendance recorded with selfie and location",
      data: { 
        attendance,
        checkInTime: attendance.checkIn,
        requirements: {
          selfie: !!attendance.checkInSelfie,
          location: !!attendance.checkInLocation
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Self check-in error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to mark attendance",
      code: "ATTENDANCE_ERROR"
    });
  }
});

// Self check-out endpoint (for employees to mark their own check-out)
router.post("/self/check-out", async (req: Request, res: Response) => {
  console.log('📝 Self check-out request received:', {
    body: req.body,
    headers: req.headers,
    authorization: req.headers.authorization
  });
  
  try {
    const { notes, checkOutSelfie, checkOutLocation, userId } = req.body;
    
    console.log('📝 Check-out data received:', {
      hasSelfie: !!checkOutSelfie,
      selfieLength: checkOutSelfie?.length || 0,
      hasLocation: !!checkOutLocation,
      locationData: checkOutLocation,
      userId: userId
    });
    
    // Simple authentication - check if userId is provided
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID required",
        code: "USER_ID_REQUIRED"
      });
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid user or user not active",
        code: "INVALID_USER"
      });
    }

    // Find employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee record not found",
        code: "EMPLOYEE_NOT_FOUND"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: "No check-in found for today",
        code: "NO_CHECK_IN"
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        error: "Already checked out for today",
        code: "ALREADY_CHECKED_OUT"
      });
    }

    // Enhanced validation for check-out requirements
    if (!checkOutSelfie) {
      return res.status(400).json({
        success: false,
        error: "Check-out requires a selfie",
        code: "SELFIE_REQUIRED"
      });
    }

    if (!checkOutLocation) {
      return res.status(400).json({
        success: false,
        error: "Check-out requires location data",
        code: "LOCATION_REQUIRED"
      });
    }

    // Update attendance with check-out
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: new Date(),
        checkOutSelfie: checkOutSelfie || null,
        checkOutLocation: checkOutLocation || null,
        notes: notes || attendance.notes
      }
    });

    console.log('✅ Check-out successful:', {
      attendanceId: updatedAttendance.id,
      employeeId: updatedAttendance.employeeId,
      checkOutTime: updatedAttendance.checkOut,
      hasSelfie: !!updatedAttendance.checkOutSelfie,
      hasLocation: !!updatedAttendance.checkOutLocation
    });

    res.json({
      success: true,
      message: "Check-out successful - Attendance recorded with selfie and location",
      data: { 
        attendance: updatedAttendance,
        checkOutTime: updatedAttendance.checkOut,
        requirements: {
          selfie: !!updatedAttendance.checkOutSelfie,
          location: !!updatedAttendance.checkOutLocation
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Self check-out error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to mark check-out",
      code: "CHECKOUT_ERROR"
    });
  }
});

// Apply authentication to all other routes
router.use(authenticateToken);

// Validation schemas
const markAttendanceSchema = Joi.object({
  employeeId: Joi.string().required(),
  date: Joi.date().required(),
  checkIn: Joi.date().optional(),
  checkOut: Joi.date().optional(),
  status: Joi.string().valid("PRESENT", "ABSENT", "LATE", "EARLY_LEAVE", "HALF_DAY").required(),
  notes: Joi.string().optional(),
  // Phase 2 fields
  shiftId: Joi.string().optional(),
  location: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    accuracy: Joi.number().optional()
  }).optional(),
  deviceInfo: Joi.object({
    deviceType: Joi.string().optional(),
    os: Joi.string().optional(),
    browser: Joi.string().optional(),
    userAgent: Joi.string().optional()
  }).optional(),
  isRemote: Joi.boolean().optional(),
  overtimeHours: Joi.number().optional(),
  checkInSelfie: Joi.string().allow('').optional(), // Morning check-in selfie
  checkOutSelfie: Joi.string().allow('').optional(), // Evening check-out selfie
  checkInLocation: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    accuracy: Joi.number().optional()
  }).optional(),
  checkOutLocation: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    accuracy: Joi.number().optional()
  }).optional()
});

const updateAttendanceSchema = Joi.object({
  checkIn: Joi.date().optional(),
  checkOut: Joi.date().optional(),
  status: Joi.string().valid("PRESENT", "ABSENT", "LATE", "EARLY_LEAVE", "HALF_DAY").optional(),
  notes: Joi.string().optional(),
  // Phase 2 fields
  shiftId: Joi.string().optional(),
  location: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    accuracy: Joi.number().optional()
  }).optional(),
  deviceInfo: Joi.object({
    deviceType: Joi.string().optional(),
    os: Joi.string().optional(),
    browser: Joi.string().optional(),
    userAgent: Joi.string().optional()
  }).optional(),
  isRemote: Joi.boolean().optional(),
  overtimeHours: Joi.number().optional(),
  checkInSelfie: Joi.string().allow('').optional(),
  checkOutSelfie: Joi.string().allow('').optional(),
  checkInLocation: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    accuracy: Joi.number().optional()
  }).optional(),
  checkOutLocation: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    accuracy: Joi.number().optional()
  }).optional()
});

// Mark attendance (for employees and admins)
router.post("/mark", async (req: Request, res: Response) => {
  console.log('📝 Attendance mark request received:', {
    body: req.body,
    headers: req.headers,
    user: (req as any).user
  });
  try {
    const { error, value } = markAttendanceSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const { employeeId, date, checkIn, checkOut, status, notes, shiftId, location, deviceInfo, isRemote, checkInSelfie, checkOutSelfie, checkInLocation, checkOutLocation } = value;

    // Check if attendance already exists for this date
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: new Date(date)
        }
      }
    });

    if (existingAttendance) {
      res.status(400).json({
        success: false,
        error: "Attendance already marked for this date",
        code: "ATTENDANCE_EXISTS"
      });
      return;
    }

    // Calculate working hours for salary calculation
    let totalHours: number | null = null;
    let regularHours: number = 0;
    let overtimeHours: number = 0;
    let breakHours: number = 0;
    
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      
      // Calculate total time worked
      const totalTimeMs = checkOutTime.getTime() - checkInTime.getTime();
      totalHours = totalTimeMs / (1000 * 60 * 60); // Convert to hours
      
      // Standard working day is 8 hours
      const standardWorkingHours = 8;
      
      // Calculate break time (1 hour lunch break if working more than 6 hours)
      if (totalHours > 6) {
        breakHours = 1; // 1 hour lunch break
      }
      
      // Calculate actual working hours (excluding break)
      const actualWorkingHours = totalHours - breakHours;
      
      // Calculate regular hours (up to 8 hours)
      regularHours = Math.min(actualWorkingHours, standardWorkingHours);
      
      // Calculate overtime hours (anything over 8 hours)
      if (actualWorkingHours > standardWorkingHours) {
        overtimeHours = actualWorkingHours - standardWorkingHours;
      }
      
      // If manual overtime hours provided in request, use that instead
      const manualOvertimeHours = (value as any).overtimeHours;
      if (manualOvertimeHours && manualOvertimeHours > 0) {
        regularHours = Math.min(actualWorkingHours - manualOvertimeHours, standardWorkingHours);
        overtimeHours = manualOvertimeHours;
      }
    }

    // Auto-detect HALF_DAY if check-in is after 11:59 AM
    let finalStatus = status;
    if (checkIn) {
      const checkInTime = new Date(checkIn);
      const hours = checkInTime.getHours();
      const minutes = checkInTime.getMinutes();
      
      // If check-in after 11:59 AM, mark as HALF_DAY
      if (hours >= 12 || (hours === 11 && minutes >= 59)) {
        finalStatus = "HALF_DAY";
      }
    }

    // Get IP address from request
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

    // Get user ID from token for createdBy
    const createdBy = (req as any).user?.userId || null;

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        totalHours,
        regularHours: regularHours > 0 ? regularHours : null,
        overtimeHours: overtimeHours > 0 ? overtimeHours : null,
        breakHours: breakHours > 0 ? breakHours : null,
        status: finalStatus, // Auto-detected status
        notes,
        // Phase 2 fields
        shiftId: shiftId || null,
        location: location || null, // Legacy support
        deviceInfo: deviceInfo || null,
        ipAddress: ipAddress as string || null,
        isRemote: isRemote || false,
        createdBy: createdBy,
        checkInSelfie: checkInSelfie || null,
        checkOutSelfie: checkOutSelfie || null,
        checkInLocation: checkInLocation || null,
        checkOutLocation: checkOutLocation || null
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
      }
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: { attendance }
    });

  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark attendance",
      code: "MARK_ATTENDANCE_ERROR"
    });
  }
});

// Get attendance records
router.get("/", async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      employeeId, 
      startDate, 
      endDate, 
      status = "" 
    } = req.query;

    console.log('📊 Attendance GET request:', {
      page, limit, employeeId, startDate, endDate, status
    });

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (employeeId) {
      where.employeeId = employeeId;
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    if (status) {
      where.status = status;
    }

    console.log('📊 Attendance query where clause:', where);

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
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
        skip,
        take: Number(limit),
        orderBy: { date: "desc" }
      }),
      prisma.attendance.count({ where })
    ]);

    console.log('📊 Attendance query results:', {
      total,
      attendancesCount: attendances.length,
      attendances: attendances.map(att => ({
        id: att.id,
        date: att.date,
        status: att.status,
        employeeId: att.employeeId
      }))
    });

    res.json({
      success: true,
      data: {
        attendances,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch attendance records",
      code: "FETCH_ATTENDANCE_ERROR"
    });
  }
});

// Get attendance by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const attendance = await prisma.attendance.findUnique({
      where: { id },
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
      }
    });

    if (!attendance) {
      res.status(404).json({
        success: false,
        error: "Attendance record not found",
        code: "ATTENDANCE_NOT_FOUND"
      });
      return;
    }

    res.json({
      success: true,
      data: { attendance }
    });

  } catch (error) {
    console.error("Get attendance by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch attendance record",
      code: "FETCH_ATTENDANCE_ERROR"
    });
  }
});

// Update attendance
router.put("/:id", requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value } = updateAttendanceSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const { checkIn, checkOut, status, notes } = value;

    // Calculate total hours if both check-in and check-out are provided
    let totalHours: number | null = null;
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        checkIn: checkIn ? new Date(checkIn) : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
        totalHours,
        status,
        notes
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
      }
    });

    res.json({
      success: true,
      message: "Attendance updated successfully",
      data: { attendance }
    });

  } catch (error) {
    console.error("Update attendance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update attendance",
      code: "UPDATE_ATTENDANCE_ERROR"
    });
  }
});

// Delete attendance
router.delete("/:id", requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.attendance.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "Attendance record deleted successfully"
    });

  } catch (error) {
    console.error("Delete attendance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete attendance record",
      code: "DELETE_ATTENDANCE_ERROR"
    });
  }
});

// Get attendance statistics
router.get("/stats/overview", requireHR, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const [totalRecords, presentCount, absentCount, lateCount] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.count({ where: { ...where, status: "PRESENT" } }),
      prisma.attendance.count({ where: { ...where, status: "ABSENT" } }),
      prisma.attendance.count({ where: { ...where, status: "LATE" } })
    ]);

    res.json({
      success: true,
      data: {
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0
      }
    });

  } catch (error) {
    console.error("Get attendance stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch attendance statistics",
      code: "FETCH_STATS_ERROR"
    });
  }
});

// Get employee's attendance history
router.get("/employee/:employeeId", async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = { employeeId };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
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
        skip,
        take: Number(limit),
        orderBy: { date: "desc" }
      }),
      prisma.attendance.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        attendances,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error("Get employee attendance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch employee attendance",
      code: "FETCH_EMPLOYEE_ATTENDANCE_ERROR"
    });
  }
});

export default router;
