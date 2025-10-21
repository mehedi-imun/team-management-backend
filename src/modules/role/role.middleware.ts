import { NextFunction, Request, Response } from "express";
import AppError from "../../errors/AppError";
import {
  hasAnyPermission,
  hasPermission,
  Permission,
  UserRole,
} from "./role.constants";

/**
 * Middleware to check if user has specific permission
 */
export const requirePermission = (...permissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, "Authentication required");
      }

      const userRole = req.user.role as UserRole;

      // Check if user has ANY of the required permissions
      const hasAccess = hasAnyPermission(userRole, permissions);

      if (!hasAccess) {
        throw new AppError(
          403,
          "You do not have permission to perform this action"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has all specified permissions
 */
export const requireAllPermissions = (...permissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, "Authentication required");
      }

      const userRole = req.user.role as UserRole;

      // Check if user has ALL required permissions
      const hasAccess = permissions.every((permission) =>
        hasPermission(userRole, permission)
      );

      if (!hasAccess) {
        throw new AppError(
          403,
          "You do not have all required permissions for this action"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, "Authentication required");
      }

      const userRole = req.user.role as UserRole;

      if (!roles.includes(userRole)) {
        throw new AppError(
          403,
          `This action requires one of the following roles: ${roles.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is platform admin
 */
export const requirePlatformAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const userRole = req.user.role as UserRole;

    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new AppError(403, "Platform administrator access required");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user belongs to an organization
 */
export const requireOrganization = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    // Platform admins don't need organizationId
    const userRole = req.user.role as UserRole;
    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      return next();
    }

    if (!req.user.organizationId) {
      throw new AppError(403, "Organization membership required");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can access specific organization
 */
export const requireOrganizationAccess = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const userRole = req.user.role as UserRole;
    const targetOrganizationId =
      req.params.organizationId || req.body.organizationId;

    // Platform admins can access any organization
    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      return next();
    }

    // Organization users can only access their own organization
    if (req.user.organizationId !== targetOrganizationId) {
      throw new AppError(403, "You can only access your own organization");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate user is active
 */
export const requireActiveUser = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    // Check if user document has isActive field
    const user = req.user as any;
    if (user.isActive === false) {
      throw new AppError(403, "Your account has been suspended");
    }

    next();
  } catch (error) {
    next(error);
  }
};
