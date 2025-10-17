import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { authorizeOrganizationOwner } from "../../middleware/authorizeOrganizationOwner";
import { AnalyticsController } from "./analytics.controller";

const router = Router();

// Platform-level analytics (SuperAdmin/Admin only)
router.get(
  "/platform",
  authenticate,
  authorize("SuperAdmin", "Admin"),
  AnalyticsController.getPlatformAnalytics
);

router.get(
  "/organizations",
  authenticate,
  authorize("SuperAdmin", "Admin"),
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
