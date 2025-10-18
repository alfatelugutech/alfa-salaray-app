import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    employeeId?: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user with employee info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        employee: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or inactive user',
        code: 'INVALID_USER'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ 
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const hasRole = roles.includes(req.user.role);
    
    if (!hasRole) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

export const requireSuperAdmin = requireRole(['SUPER_ADMIN']);
export const requireHR = requireRole(['SUPER_ADMIN', 'HR_MANAGER']);
export const requireManager = requireRole(['SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER']);
