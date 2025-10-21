import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";
import { authenticateToken, requireHR } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createRoleSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  permissions: Joi.array().items(Joi.string()).optional()
});

const updateRoleSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  permissions: Joi.array().items(Joi.string()).optional()
});

const assignRoleSchema = Joi.object({
  userId: Joi.string().required(),
  roleId: Joi.string().required()
});

// Get all roles
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch roles"
    });
  }
});

// Get role by ID
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Role not found"
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error("Get role error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch role"
    });
  }
});

// Create new role
router.post("/", requireHR, async (req: Request, res: Response) => {
  try {
    const { error, value } = createRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { name, description, permissions } = value;
    const userId = (req as any).user?.id;

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: "Role with this name already exists"
      });
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        name,
        description,
        createdBy: userId
      }
    });

    // Assign permissions if provided
    if (permissions && permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((permissionId: string) => ({
          roleId: role.id,
          permissionId,
          granted: true
        }))
      });
    }

    // Fetch created role with relations
    const createdRole = await prisma.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: createdRole
    });
  } catch (error) {
    console.error("Create role error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create role"
    });
  }
});

// Update role
router.put("/:id", requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value } = updateRoleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        error: "Role not found"
      });
    }

    // Check if it's a system role
    if (existingRole.isSystem) {
      return res.status(400).json({
        success: false,
        error: "Cannot modify system roles"
      });
    }

    // Check if name is being changed and if it already exists
    if (value.name && value.name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name: value.name }
      });

      if (nameExists) {
        return res.status(400).json({
          success: false,
          error: "Role with this name already exists"
        });
      }
    }

    // Update role
    const { permissions, ...updateData } = value;
    const role = await prisma.role.update({
      where: { id },
      data: updateData
    });

    // Update permissions if provided
    if (permissions !== undefined) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // Add new permissions
      if (permissions.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissions.map((permissionId: string) => ({
            roleId: id,
            permissionId,
            granted: true
          }))
        });
      }
    }

    // Fetch updated role with relations
    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole
    });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update role"
    });
  }
});

// Delete role
router.delete("/:id", requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Role not found"
      });
    }

    // Check if it's a system role
    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete system roles"
      });
    }

    // Check if role has users assigned
    if (role._count.users > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete role with assigned users. Please reassign users first."
      });
    }

    await prisma.role.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "Role deleted successfully"
    });
  } catch (error) {
    console.error("Delete role error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete role"
    });
  }
});

// Assign role to user
router.post("/assign", requireHR, async (req: Request, res: Response) => {
  try {
    const { error, value } = assignRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { userId, roleId } = value;
    const assignedBy = (req as any).user?.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Role not found"
      });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.userRoleAssignment.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: "User already has this role assigned"
      });
    }

    // Assign role
    const userRole = await prisma.userRoleAssignment.create({
      data: {
        userId,
        roleId,
        assignedBy
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "Role assigned successfully",
      data: userRole
    });
  } catch (error) {
    console.error("Assign role error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to assign role"
    });
  }
});

// Remove role from user
router.delete("/unassign/:userId/:roleId", requireHR, async (req: Request, res: Response) => {
  try {
    const { userId, roleId } = req.params;

    // Check if assignment exists
    const userRole = await prisma.userRoleAssignment.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    if (!userRole) {
      return res.status(404).json({
        success: false,
        error: "Role assignment not found"
      });
    }

    await prisma.userRoleAssignment.delete({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    res.json({
      success: true,
      message: "Role removed successfully"
    });
  } catch (error) {
    console.error("Remove role error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove role"
    });
  }
});

export default router;

