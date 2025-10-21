import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";

/**
 * Tenant Context Middleware
 *
 * Injects organizationId into request object from authenticated user.
 * This ensures all subsequent queries are automatically scoped to the user's organization.
 *
 * Usage: Apply after authenticate middleware on protected routes
 */
export const tenantContext = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // User must be authenticated before this middleware
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    // Inject organizationId from user into request
    req.organizationId = req.user.organizationId;

    if (!req.organizationId) {
      throw new AppError(400, "User does not belong to any organization");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Tenant Context
 *
 * Same as tenantContext but doesn't fail if user is not authenticated.
 * Useful for routes that can be accessed with or without authentication.
 */
export const optionalTenantContext = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (req.user && req.user.organizationId) {
      req.organizationId = req.user.organizationId;
    }
    next();
  } catch (error) {
    next(error);
  }
};
