// Trial-based access control middleware
import { Response, NextFunction } from "express";
import { AuthRequest } from "./authenticate";
import AppError from "../errors/AppError";
import { TrialService } from "../services/trial.service";

/**
 * Middleware to check if organization can access features
 * Blocks access if trial has expired
 */
export const requiresActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  // Platform admins bypass trial checks
  if (req.user.role === "SuperAdmin" || req.user.role === "Admin") {
    return next();
  }

  const organizationId = req.user.organizationId;
  if (!organizationId) {
    throw new AppError(400, "Organization context required");
  }

  const canAccess = await TrialService.canAccessFeatures(organizationId);

  if (!canAccess) {
    throw new AppError(
      403,
      "Your trial has expired. Please upgrade your subscription to continue using this feature."
    );
  }

  next();
};

/**
 * Middleware to check if organization can create teams
 */
export const canCreateTeam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  // Platform admins bypass checks
  if (req.user.role === "SuperAdmin" || req.user.role === "Admin") {
    return next();
  }

  const organizationId = req.user.organizationId;
  if (!organizationId) {
    throw new AppError(400, "Organization context required");
  }

  const canCreate = await TrialService.canCreateTeam(organizationId);

  if (!canCreate) {
    // Check if it's trial expired or plan limit
    const canAccessFeatures = await TrialService.canAccessFeatures(organizationId);
    
    if (!canAccessFeatures) {
      throw new AppError(
        403,
        "Your trial has expired. Please upgrade to create new teams."
      );
    } else {
      throw new AppError(
        403,
        "You've reached your plan's team limit. Please upgrade to create more teams."
      );
    }
  }

  next();
};

/**
 * Middleware to check if organization can invite members
 */
export const canInviteMembers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  // Platform admins bypass checks
  if (req.user.role === "SuperAdmin" || req.user.role === "Admin") {
    return next();
  }

  const organizationId = req.user.organizationId;
  if (!organizationId) {
    throw new AppError(400, "Organization context required");
  }

  const canInvite = await TrialService.canInviteMembers(organizationId);

  if (!canInvite) {
    // Check if it's trial expired or plan limit
    const canAccessFeatures = await TrialService.canAccessFeatures(organizationId);
    
    if (!canAccessFeatures) {
      throw new AppError(
        403,
        "Your trial has expired. Please upgrade to invite new members."
      );
    } else {
      throw new AppError(
        403,
        "You've reached your plan's user limit. Please upgrade to invite more members."
      );
    }
  }

  next();
};
