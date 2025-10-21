import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";
import organizationService from "../modules/organization/organization.service";

/**
 * Check if organization can add a new user
 * Use this middleware on user creation endpoints
 */
export const checkUserLimit = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.organizationId;

    if (!organizationId) {
      throw new AppError(400, "Organization context is required");
    }

    const canAdd = await organizationService.canAddUser(organizationId);

    if (!canAdd) {
      const org = await organizationService.getOrganizationById(organizationId);
      throw new AppError(
        403,
        `User limit reached. Your ${org.plan} plan allows ${org.limits.maxUsers} users. Please upgrade your plan to add more users.`
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if organization can add a new team
 * Use this middleware on team creation endpoints
 */
export const checkTeamLimit = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.organizationId;

    if (!organizationId) {
      throw new AppError(400, "Organization context is required");
    }

    const canAdd = await organizationService.canAddTeam(organizationId);

    if (!canAdd) {
      const org = await organizationService.getOrganizationById(organizationId);
      throw new AppError(
        403,
        `Team limit reached. Your ${org.plan} plan allows ${org.limits.maxTeams} teams. Please upgrade your plan to add more teams.`
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if organization has access to a specific feature
 * Usage: checkFeatureAccess('api'), checkFeatureAccess('sso')
 */
export const checkFeatureAccess = (feature: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organizationId;

      if (!organizationId) {
        throw new AppError(400, "Organization context is required");
      }

      const org = await organizationService.getOrganizationById(organizationId);

      if (!org.limits.features.includes(feature)) {
        throw new AppError(
          403,
          `This feature is not available in your ${org.plan} plan. Please upgrade to access ${feature}.`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if organization subscription is active
 * Blocks access if subscription is past_due or canceled
 */
export const checkSubscriptionStatus = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.organizationId;

    if (!organizationId) {
      throw new AppError(400, "Organization context is required");
    }

    const org = await organizationService.getOrganizationById(organizationId);

    // Allow trialing and active subscriptions
    if (
      org.subscriptionStatus === "trialing" ||
      org.subscriptionStatus === "active"
    ) {
      return next();
    }

    // Block if subscription is past due or canceled
    if (org.subscriptionStatus === "past_due") {
      throw new AppError(
        402,
        "Your subscription payment is past due. Please update your payment method to continue using the service."
      );
    }

    if (org.subscriptionStatus === "canceled") {
      throw new AppError(
        403,
        "Your subscription has been canceled. Please reactivate your subscription to continue."
      );
    }

    // Incomplete subscriptions
    throw new AppError(
      402,
      "Your subscription setup is incomplete. Please complete the payment process."
    );
  } catch (error) {
    next(error);
  }
};
