import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error";
import { logger } from "../utils/logger.util";
import { ZodError } from "zod";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  // Operational errors (expected)
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack });
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unknown / programming errors
  logger.error("Unexpected error", { message: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
