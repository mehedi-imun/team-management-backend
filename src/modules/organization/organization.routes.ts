import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validateRequest } from "../../middleware/validateRequest";
import organizationController from "./organization.controller";
import {
  checkSlugSchema,
  createOrganizationForClientSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  upgradePlanSchema,
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
 * @route   GET /api/v1/organizations/all
 * @desc    Get ALL organizations (SuperAdmin/Admin only)
 * @access  Private (SuperAdmin/Admin)
 */
router.get(
  "/all",
  authorize("SuperAdmin", "Admin"),
  organizationController.getAllOrganizations
);

/**
 * @route   POST /api/v1/organizations/create-with-setup
 * @desc    Create organization with setup token (Platform admin only)
 * @access  Private (SuperAdmin/Admin)
 */
router.post(
  "/create-with-setup",
  authorize("SuperAdmin", "Admin"),
  organizationController.createOrganizationWithSetup
);

/**
 * @route   POST /api/v1/organizations/create-for-client
 * @desc    Create organization for client (SuperAdmin/Admin only)
 * @access  Private (SuperAdmin/Admin)
 */
router.post(
  "/create-for-client",
  authorize("SuperAdmin", "Admin"),
  validateRequest(createOrganizationForClientSchema),
  organizationController.createOrganizationForClient
);

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
 * @route   PATCH /api/v1/organizations/:id/status
 * @desc    Update organization status (SuperAdmin/Admin only)
 * @access  Private (SuperAdmin/Admin)
 */
router.patch(
  "/:id/status",
  authorize("SuperAdmin", "Admin"),
  organizationController.updateOrganizationStatus
);

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
 * @route   DELETE /api/v1/organizations/:id/permanent
 * @desc    Permanently delete organization (SuperAdmin only)
 * @access  Private (SuperAdmin)
 */
router.delete(
  "/:id/permanent",
  authorize("SuperAdmin"),
  organizationController.deleteOrganizationPermanently
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

/**
 * @route   GET /api/v1/organizations/:id/members
 * @desc    Get all members of an organization
 * @access  Private (Owner/Admin)
 */
router.get("/:id/members", organizationController.getOrganizationMembers);

/**
 * @route   POST /api/v1/organizations/:id/members
 * @desc    Add member to organization
 * @access  Private (Owner/Admin)
 */
router.post("/:id/members", organizationController.addOrganizationMember);

/**
 * @route   PATCH /api/v1/organizations/:id/members/:userId
 * @desc    Update member role/permissions
 * @access  Private (Owner/Admin)
 */
router.patch(
  "/:id/members/:userId",
  organizationController.updateOrganizationMember
);

/**
 * @route   DELETE /api/v1/organizations/:id/members/:userId
 * @desc    Remove member from organization
 * @access  Private (Owner/Admin)
 */
router.delete(
  "/:id/members/:userId",
  organizationController.removeOrganizationMember
);

export default router;
