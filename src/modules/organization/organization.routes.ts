import { Router } from "express";
import organizationController from "./organization.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  upgradePlanSchema,
  checkSlugSchema,
} from "./organization.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/organizations/check-slug
 * @desc    Check if slug is available
 * @access  Private
 */
router.get(
  "/check-slug",
  validateRequest(checkSlugSchema),
  organizationController.checkSlug
);

/**
 * @route   POST /api/v1/organizations/generate-slug
 * @desc    Generate unique slug from name
 * @access  Private
 */
router.post("/generate-slug", organizationController.generateSlug);

/**
 * @route   GET /api/v1/organizations
 * @desc    Get all organizations for logged-in user
 * @access  Private
 */
router.get("/", organizationController.getMyOrganizations);

/**
 * @route   POST /api/v1/organizations
 * @desc    Create new organization
 * @access  Private
 */
router.post(
  "/",
  validateRequest(createOrganizationSchema),
  organizationController.createOrganization
);

/**
 * @route   GET /api/v1/organizations/:id
 * @desc    Get organization by ID
 * @access  Private
 */
router.get("/:id", organizationController.getOrganizationById);

/**
 * @route   PATCH /api/v1/organizations/:id
 * @desc    Update organization
 * @access  Private (Owner only)
 */
router.patch(
  "/:id",
  validateRequest(updateOrganizationSchema),
  organizationController.updateOrganization
);

/**
 * @route   DELETE /api/v1/organizations/:id
 * @desc    Delete organization
 * @access  Private (Owner only)
 */
router.delete("/:id", organizationController.deleteOrganization);

/**
 * @route   POST /api/v1/organizations/:id/upgrade
 * @desc    Upgrade organization plan
 * @access  Private (Owner only)
 */
router.post(
  "/:id/upgrade",
  validateRequest(upgradePlanSchema),
  organizationController.upgradePlan
);

/**
 * @route   GET /api/v1/organizations/:id/usage
 * @desc    Get organization usage statistics
 * @access  Private
 */
router.get("/:id/usage", organizationController.getUsageStats);

export default router;
