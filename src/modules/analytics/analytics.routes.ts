import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { authorizeOrganizationOwner } from "../../middleware/authorizeOrganizationOwner";
import { AnalyticsController } from "./analytics.controller";
import AppError from "../../errors/AppError";

const router = Router();

// Custom middleware: Allow SuperAdmin/Admin OR Organization Owners
const authorizeAdminOrOrgOwner = (req: any, res: any, next: any) => {
  const user = req.user;
  const isSuperAdminOrAdmin = ["SuperAdmin", "Admin"].includes(user?.role);
  const isOrgOwner = user?.isOrganizationOwner === true;
  
  if (isSuperAdminOrAdmin || isOrgOwner) {
    return next();
  }
  
  throw new AppError(403, "Forbidden - Requires SuperAdmin, Admin, or Organization Owner");
};

// Platform-level analytics (SuperAdmin/Admin only)
router.get(
  "/platform",
  authenticate,
  authorize("SuperAdmin", "Admin"),
  AnalyticsController.getPlatformAnalytics
);

// Organization stats - SuperAdmin/Admin get all orgs, Organization Owners get their own
router.get(
  "/organizations",
  authenticate,
  authorizeAdminOrOrgOwner,
  AnalyticsController.getOrganizationStats
);

router.get(
  "/users",
  authenticate,
  authorize("SuperAdmin", "Admin"),
  AnalyticsController.getUserStats
);

// Organization Owner analytics (for their own organization)
router.get(
  "/my-organization",
  authenticate,
  authorizeOrganizationOwner,
  AnalyticsController.getMyOrganizationAnalytics
);

// Organization-level analytics (Admin/Director)
router.get(
  "/summary",
  authenticate,
  authorize("Admin", "Director"),
  AnalyticsController.getSummary
);

router.get(
  "/teams",
  authenticate,
  authorize("Admin", "Director"),
  AnalyticsController.getTeamDistribution
);

router.get(
  "/approvals",
  authenticate,
  authorize("Admin", "Director"),
  AnalyticsController.getApprovalRates
);

export const AnalyticsRoutes = router;
