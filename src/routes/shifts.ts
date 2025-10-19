import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, requireHR } from "../middleware/auth";
import Joi from "joi";

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createShiftSchema = Joi.object({
  name: Joi.string().required(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  breakDuration: Joi.number().min(0).max(480).default(60) // Max 8 hours break
});

const updateShiftSchema = Joi.object({
  name: Joi.string().optional(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  breakDuration: Joi.number().min(0).max(480).optional(),
  isActive: Joi.boolean().optional()
});

const assignShiftSchema = Joi.object({
  employeeId: Joi.string().required(),
  shiftId: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().optional()
});

// Get all shifts
router.get("/", requireHR, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = "", isActive = "" } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (search) {
      where.name = { contains: search as string, mode: "insensitive" };
    }
    
    if (isActive !== "") {
      where.isActive = isActive === "true";
    }

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where,
        include: {
          employees: {
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
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" }
      }),
      prisma.shift.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        shifts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error("Get shifts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch shifts",
      code: "FETCH_SHIFTS_ERROR"
    });
  }
});

// Get shift by ID
router.get("/:id", requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        employees: {
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
        }
      }
    });

    if (!shift) {
      res.status(404).json({
        success: false,
        error: "Shift not found",
        code: "SHIFT_NOT_FOUND"
      });
      return;
    }

    res.json({
      success: true,
      data: { shift }
    });

  } catch (error) {
    console.error("Get shift error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch shift",
      code: "FETCH_SHIFT_ERROR"
    });
  }
});

// Create new shift
router.post("/", requireHR, async (req: Request, res: Response) => {
  try {
    const { error, value } = createShiftSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const { name, startTime, endTime, breakDuration } = value;

    // Validate time logic
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    if (end <= start) {
      res.status(400).json({
        success: false,
        error: "End time must be after start time",
        code: "INVALID_TIME_RANGE"
      });
      return;
    }

    const shift = await prisma.shift.create({
      data: {
        name,
        startTime,
        endTime,
        breakDuration
      }
    });

    res.status(201).json({
      success: true,
      message: "Shift created successfully",
      data: { shift }
    });

  } catch (error) {
    console.error("Create shift error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create shift",
      code: "CREATE_SHIFT_ERROR"
    });
  }
});

// Update shift
router.put("/:id", requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value } = updateShiftSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    // Validate time logic if times are provided
    if (value.startTime && value.endTime) {
      const start = new Date(`2000-01-01T${value.startTime}:00`);
      const end = new Date(`2000-01-01T${value.endTime}:00`);
      
      if (end <= start) {
        res.status(400).json({
          success: false,
          error: "End time must be after start time",
          code: "INVALID_TIME_RANGE"
        });
        return;
      }
    }

    const shift = await prisma.shift.update({
      where: { id },
      data: value
    });

    res.json({
      success: true,
      message: "Shift updated successfully",
      data: { shift }
    });

  } catch (error) {
    console.error("Update shift error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update shift",
      code: "UPDATE_SHIFT_ERROR"
    });
  }
});

// Delete shift
router.delete("/:id", requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if shift has active assignments
    const activeAssignments = await prisma.employeeShift.count({
      where: {
        shiftId: id,
        isActive: true
      }
    });

    if (activeAssignments > 0) {
      res.status(400).json({
        success: false,
        error: "Cannot delete shift with active employee assignments",
        code: "SHIFT_HAS_ACTIVE_ASSIGNMENTS"
      });
      return;
    }

    await prisma.shift.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "Shift deleted successfully"
    });

  } catch (error) {
    console.error("Delete shift error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete shift",
      code: "DELETE_SHIFT_ERROR"
    });
  }
});

// Assign shift to employee
router.post("/assign", requireHR, async (req: Request, res: Response) => {
  try {
    const { error, value } = assignShiftSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const { employeeId, shiftId, startDate, endDate } = value;

    // Check for overlapping assignments
    const overlappingAssignment = await prisma.employeeShift.findFirst({
      where: {
        employeeId,
        isActive: true,
        OR: [
          {
            startDate: { lte: endDate || new Date() },
            endDate: { gte: startDate }
          },
          {
            startDate: { lte: endDate || new Date() },
            endDate: null
          }
        ]
      }
    });

    if (overlappingAssignment) {
      res.status(400).json({
        success: false,
        error: "Employee already has an active shift assignment for this period",
        code: "OVERLAPPING_SHIFT_ASSIGNMENT"
      });
      return;
    }

    const assignment = await prisma.employeeShift.create({
      data: {
        employeeId,
        shiftId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null
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
        },
        shift: true
      }
    });

    res.status(201).json({
      success: true,
      message: "Shift assigned successfully",
      data: { assignment }
    });

  } catch (error) {
    console.error("Assign shift error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to assign shift",
      code: "ASSIGN_SHIFT_ERROR"
    });
  }
});

// Get employee's current shift
router.get("/employee/:employeeId/current", async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    
    const currentShift = await prisma.employeeShift.findFirst({
      where: {
        employeeId,
        isActive: true,
        startDate: { lte: new Date() },
        OR: [
          { endDate: { gte: new Date() } },
          { endDate: null }
        ]
      },
      include: {
        shift: true,
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
      data: { currentShift }
    });

  } catch (error) {
    console.error("Get current shift error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch current shift",
      code: "FETCH_CURRENT_SHIFT_ERROR"
    });
  }
});

export default router;



