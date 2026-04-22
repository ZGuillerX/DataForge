import { Request } from "express";
import { JwtPayload } from "../middleware/auth.middleware";

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
