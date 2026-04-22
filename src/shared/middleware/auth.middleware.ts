import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { UnauthorizedError } from "../errors/app-error";

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
