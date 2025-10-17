import { NextFunction, Response } from "express";
import AppError from "../errors/AppError";
import { Team } from "../modules/team/team.model";
import { AuthRequest } from "./authenticate";

/**
 * Permission Middleware for Multi-tenant RBAC
 * Checks platform roles, organization ownership, and team management permissions
 */

// Check if user is a SuperAdmin (platform-level admin)
export const isSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  if (req.user.role !== "SuperAdmin") {
    throw new AppError(403, "Forbidden - Requires SuperAdmin role");
  }

  next();
};

// Check if user is any platform admin (SuperAdmin or Admin without org)
export const isPlatformAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  const isPlatform =
    req.user.role === "SuperAdmin" ||
    (req.user.role === "Admin" && !req.user.organizationId);

  if (!isPlatform) {
    throw new AppError(403, "Forbidden - Requires platform admin privileges");
  }

  next();
};

// Check if user is the owner of their organization
export const isOrganizationOwner = (
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
      "Forbidden - Requires organization owner privileges"
    );
  }

  next();
};

// Check if user is an organization admin (owner or admin flag)
export const isOrganizationAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  if (!req.user.isOrganizationOwner && !req.user.isOrganizationAdmin) {
    throw new AppError(
      403,
      "Forbidden - Requires organization admin privileges"
    );
  }

  next();
};

// Check if user can manage a specific team (is manager, org admin, or platform admin)
export const canManageTeam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  const teamId = req.params.teamId || req.params.id;
  if (!teamId) {
    throw new AppError(400, "Team ID required");
  }

  // Platform admins can manage any team
  if (
    req.user.role === "SuperAdmin" ||
    (req.user.role === "Admin" && !req.user.organizationId)
  ) {
    return next();
  }

  // Organization admins can manage teams in their org
  if (req.user.isOrganizationOwner || req.user.isOrganizationAdmin) {
    return next();
  }

  // Check if user is the team manager
  const team = await Team.findById(teamId);
  if (!team) {
    throw new AppError(404, "Team not found");
  }

  // Verify team belongs to user's organization
  if (team.organizationId !== req.user.organizationId) {
    throw new AppError(403, "Cannot access teams from other organizations");
  }

  // Check if user is the team manager
  if (team.managerId === req.user._id?.toString()) {
    return next();
  }

  // Check if user is in managedTeamIds
  if (req.user.managedTeamIds && req.user.managedTeamIds.includes(teamId)) {
    return next();
  }

  throw new AppError(403, "Forbidden - Cannot manage this team");
};

// Check if user can view a team (member, manager, or admin)
export const canViewTeam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  const teamId = req.params.teamId || req.params.id;
  if (!teamId) {
    throw new AppError(400, "Team ID required");
  }

  // Platform admins can view any team
  if (
    req.user.role === "SuperAdmin" ||
    (req.user.role === "Admin" && !req.user.organizationId)
  ) {
    return next();
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw new AppError(404, "Team not found");
  }

  // Verify team belongs to user's organization
  if (team.organizationId !== req.user.organizationId) {
    throw new AppError(403, "Cannot access teams from other organizations");
  }

  // Organization admins can view all teams in their org
  if (req.user.isOrganizationOwner || req.user.isOrganizationAdmin) {
    return next();
  }

  // Check if user is a team member
  const isMember = team.members.some(
    (m) => m.userId === req.user!._id?.toString()
  );

  if (isMember) {
    return next();
  }

  throw new AppError(403, "Forbidden - Cannot view this team");
};

// Check if user can invite members to teams
export const canInviteMembers = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  // Platform admins, org owners, and org admins can invite
  if (
    req.user.role === "SuperAdmin" ||
    (req.user.role === "Admin" && !req.user.organizationId) ||
    req.user.isOrganizationOwner ||
    req.user.isOrganizationAdmin
  ) {
    return next();
  }

  throw new AppError(
    403,
    "Forbidden - Requires admin privileges to invite members"
  );
};

// Check if user belongs to an organization (has organizationId)
export const requiresOrganization = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  if (!req.user.organizationId) {
    throw new AppError(
      403,
      "Forbidden - This action requires an organization context"
    );
  }

  next();
};

// Combine permission checks (OR logic)
export const anyOf = (...middlewares: any[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    let lastError: any = null;

    for (const middleware of middlewares) {
      try {
        await new Promise<void>((resolve, reject) => {
          middleware(req, res, (err?: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
        return next(); // If any middleware passes, continue
      } catch (err) {
        lastError = err;
      }
    }

    // If none passed, throw the last error
    next(lastError || new AppError(403, "Forbidden"));
  };
};
