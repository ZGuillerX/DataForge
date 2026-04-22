import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.util";

export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
        ip: req.ip,
      },
    );
  });
  next();
}
