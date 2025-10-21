import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";
import { authenticateToken, requireHR } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createPermissionSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  category: Joi.string().required(),
  action: Joi.string().required(),
  resource: Joi.string().required()
});

const updatePermissionSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  category: Joi.string().optional(),
  action: Joi.string().optional(),
  resource: Joi.string().optional(),
  isActive: Joi.boolean().optional()
});

// Get all permissions
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, any[]>);

    res.json({
      success: true,
      data: permissions,
      grouped: groupedPermissions
    });
  } catch (error) {
    console.error("Get permissions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch permissions"
    });
  }
});

// Get permissions by category
router.get("/category/:category", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { category } = req.params;

    const permissions = await prisma.permission.findMany({
      where: { category },
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error("Get permissions by category error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch permissions"
    });
  }
});

// Get permission by ID
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        error: "Permission not found"
      });
    }

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error("Get permission error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch permission"
    });
  }
});

// Create new permission
router.post("/", requireHR, async (req: Request, res: Response) => {
  try {
    const { error, value } = createPermissionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { name, description, category, action, resource } = value;

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name }
    });

    if (existingPermission) {
      return res.status(400).json({
        success: false,
        error: "Permission with this name already exists"
      });
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        description,
        category,
        action,
        resource
      }
    });

    res.status(201).json({
      success: true,
      message: "Permission created successfully",
      data: permission
    });
  } catch (error) {
    console.error("Create permission error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create permission"
    });
  }
});

// Update permission
router.put("/:id", requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value } = updatePermissionSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id }
    });

    if (!existingPermission) {
      return res.status(404).json({
        success: false,
        error: "Permission not found"
      });
    }

    // Check if name is being changed and if it already exists
    if (value.name && value.name !== existingPermission.name) {
      const nameExists = await prisma.permission.findUnique({
        where: { name: value.name }
      });

      if (nameExists) {
        return res.status(400).json({
          success: false,
          error: "Permission with this name already exists"
        });
      }
    }

    const permission = await prisma.permission.update({
      where: { id },
      data: value
    });

    res.json({
      success: true,
      message: "Permission updated successfully",
      data: permission
    });
  } catch (error) {
    console.error("Update permission error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update permission"
    });
  }
});

// Delete permission
router.delete("/:id", requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rolePermissions: true
          }
        }
      }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        error: "Permission not found"
      });
    }

    // Check if permission is being used by roles
    if (permission._count.rolePermissions > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete permission that is assigned to roles. Please remove from roles first."
      });
    }

    await prisma.permission.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "Permission deleted successfully"
    });
  } catch (error) {
    console.error("Delete permission error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete permission"
    });
  }
});

// Initialize default permissions
router.post("/initialize", requireHR, async (req: Request, res: Response) => {
  try {
    const defaultPermissions = [
      // Employee Management
      { name: "employees.create", description: "Create employees", category: "employees", action: "create", resource: "employee" },
      { name: "employees.read", description: "View employees", category: "employees", action: "read", resource: "employee" },
      { name: "employees.update", description: "Update employees", category: "employees", action: "update", resource: "employee" },
      { name: "employees.delete", description: "Delete employees", category: "employees", action: "delete", resource: "employee" },
      
      // Attendance Management
      { name: "attendance.create", description: "Mark attendance", category: "attendance", action: "create", resource: "attendance" },
      { name: "attendance.read", description: "View attendance", category: "attendance", action: "read", resource: "attendance" },
      { name: "attendance.update", description: "Update attendance", category: "attendance", action: "update", resource: "attendance" },
      { name: "attendance.delete", description: "Delete attendance", category: "attendance", action: "delete", resource: "attendance" },
      
      // Payroll Management
      { name: "payroll.create", description: "Create payroll", category: "payroll", action: "create", resource: "payroll" },
      { name: "payroll.read", description: "View payroll", category: "payroll", action: "read", resource: "payroll" },
      { name: "payroll.update", description: "Update payroll", category: "payroll", action: "update", resource: "payroll" },
      { name: "payroll.delete", description: "Delete payroll", category: "payroll", action: "delete", resource: "payroll" },
      { name: "payroll.process", description: "Process payments", category: "payroll", action: "process", resource: "payroll" },
      
      // Leave Management
      { name: "leave.create", description: "Create leave requests", category: "leave", action: "create", resource: "leave" },
      { name: "leave.read", description: "View leave requests", category: "leave", action: "read", resource: "leave" },
      { name: "leave.update", description: "Update leave requests", category: "leave", action: "update", resource: "leave" },
      { name: "leave.approve", description: "Approve leave requests", category: "leave", action: "approve", resource: "leave" },
      
      // Department Management
      { name: "departments.create", description: "Create departments", category: "departments", action: "create", resource: "department" },
      { name: "departments.read", description: "View departments", category: "departments", action: "read", resource: "department" },
      { name: "departments.update", description: "Update departments", category: "departments", action: "update", resource: "department" },
      { name: "departments.delete", description: "Delete departments", category: "departments", action: "delete", resource: "department" },
      
      // Role Management
      { name: "roles.create", description: "Create roles", category: "roles", action: "create", resource: "role" },
      { name: "roles.read", description: "View roles", category: "roles", action: "read", resource: "role" },
      { name: "roles.update", description: "Update roles", category: "roles", action: "update", resource: "role" },
      { name: "roles.delete", description: "Delete roles", category: "roles", action: "delete", resource: "role" },
      { name: "roles.assign", description: "Assign roles to users", category: "roles", action: "assign", resource: "role" },
      
      // System Settings
      { name: "settings.read", description: "View system settings", category: "settings", action: "read", resource: "settings" },
      { name: "settings.update", description: "Update system settings", category: "settings", action: "update", resource: "settings" },
      
      // Reports
      { name: "reports.attendance", description: "View attendance reports", category: "reports", action: "read", resource: "attendance_report" },
      { name: "reports.payroll", description: "View payroll reports", category: "reports", action: "read", resource: "payroll_report" },
      { name: "reports.leave", description: "View leave reports", category: "reports", action: "read", resource: "leave_report" }
    ];

    // Create permissions (skip if already exist)
    const createdPermissions: any[] = [];
    for (const permission of defaultPermissions) {
      const existing = await prisma.permission.findUnique({
        where: { name: permission.name }
      });

      if (!existing) {
        const created = await prisma.permission.create({
          data: permission
        });
        createdPermissions.push(created);
      }
    }

    res.json({
      success: true,
      message: "Default permissions initialized",
      data: {
        created: createdPermissions.length,
        total: defaultPermissions.length
      }
    });
  } catch (error) {
    console.error("Initialize permissions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize permissions"
    });
  }
});

export default router;

