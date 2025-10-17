import { NextFunction, Response } from "express";
import AppError from "../errors/AppError";
import { AuthRequest } from "./authenticate";

/**
 * Middleware to authorize Organization Owners
 * Allows users with isOrganizationOwner = true
 */
export const authorizeOrganizationOwner = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  if (!req.user.isOrganizationOwner) {
    throw new AppError(
      403,
      "Forbidden - Requires Organization Owner privileges"
    );
  }

  next();
};
