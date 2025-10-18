import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireHR } from '../middleware/auth';
import Joi from 'joi';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createEmployeeSchema = Joi.object({
  userId: Joi.string().required(),
  employeeId: Joi.string().required(),
  department: Joi.string().optional(),
  position: Joi.string().optional(),
  hireDate: Joi.date().required(),
  salary: Joi.number().optional(),
  workLocation: Joi.string().optional()
});

const updateEmployeeSchema = Joi.object({
  department: Joi.string().optional(),
  position: Joi.string().optional(),
  salary: Joi.number().optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE').optional(),
  workLocation: Joi.string().optional()
});

// Get all employees
router.get('/', requireHR, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', status = '' } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { employeeId: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (department) {
      where.department = department;
    }
    
    if (status) {
      where.status = status;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
              role: true,
              isActive: true,
              lastLoginAt: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        employees,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employees',
      code: 'FETCH_EMPLOYEES_ERROR'
    });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            role: true,
            isActive: true,
            lastLoginAt: true
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { employee }
    });

  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employee',
      code: 'FETCH_EMPLOYEE_ERROR'
    });
  }
});

// Create new employee
router.post('/', requireHR, async (req, res) => {
  try {
    const { error, value } = createEmployeeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { userId, employeeId, department, position, hireDate, salary, workLocation } = value;

    // Check if employee ID already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId }
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID already exists',
        code: 'EMPLOYEE_ID_EXISTS'
      });
    }

    const employee = await prisma.employee.create({
      data: {
        userId,
        employeeId,
        department,
        position,
        hireDate: new Date(hireDate),
        salary,
        workLocation
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { employee }
    });

  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create employee',
      code: 'CREATE_EMPLOYEE_ERROR'
    });
  }
});

// Update employee
router.put('/:id', requireHR, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateEmployeeSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: value,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            role: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee }
    });

  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update employee',
      code: 'UPDATE_EMPLOYEE_ERROR'
    });
  }
});

// Delete employee
router.delete('/:id', requireHR, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.employee.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });

  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete employee',
      code: 'DELETE_EMPLOYEE_ERROR'
    });
  }
});

// Get employee statistics
router.get('/stats/overview', requireHR, async (req, res) => {
  try {
    const [totalEmployees, activeEmployees, inactiveEmployees, onLeaveEmployees] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { status: 'INACTIVE' } }),
      prisma.employee.count({ where: { status: 'ON_LEAVE' } })
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        onLeaveEmployees
      }
    });

  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employee statistics',
      code: 'FETCH_STATS_ERROR'
    });
  }
});

export default router;