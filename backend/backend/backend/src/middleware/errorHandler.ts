import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent")
  });

  // Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    const message = "Database operation failed";
    error = { name: "DatabaseError", message, statusCode: 400, code: "DATABASE_ERROR" };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = { name: "AuthError", message, statusCode: 401, code: "INVALID_TOKEN" };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = { name: "AuthError", message, statusCode: 401, code: "TOKEN_EXPIRED" };
  }

  // Validation errors
  if (err.name === "ValidationError") {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(", ");
    error = { name: "ValidationError", message, statusCode: 400, code: "VALIDATION_ERROR" };
  }

  // Duplicate key error
  if (err.name === "MongoError" && (err as any).code === 11000) {
    const message = "Duplicate field value entered";
    error = { name: "DuplicateError", message, statusCode: 400, code: "DUPLICATE_ERROR" };
  }

  // Cast error
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { name: "NotFoundError", message, statusCode: 404, code: "NOT_FOUND" };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
    code: error.code || "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};
