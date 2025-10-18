/**
 * Example Route Implementations with New Role System
 * 
 * This file demonstrates how to use the permission-based
 * authorization system in your routes.
 */

import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  requirePermission,
  requireRole,
  requirePlatformAdmin,
  requireOrganization,
  requireOrganizationAccess,
} from "../modules/role/role.middleware";
import { Permission, UserRole } from "../modules/role/role.constants";

const router = Router();

// ==================== PLATFORM ROUTES ====================

/**
 * GET /api/v1/platform/organizations
 * View all organizations
 * Access: SuperAdmin, Admin
 */
router.get(
  "/platform/organizations",
  authenticate,
  requirePlatformAdmin, // Shorthand for SuperAdmin + Admin
  // OrganizationController.getAllOrganizations
);

/**
 * POST /api/v1/platform/organizations
 * Create new organization
 * Access: SuperAdmin, Admin
 */
router.post(
  "/platform/organizations",
  authenticate,
  requirePermission(Permission.PLATFORM_CREATE_ORGANIZATION),
  // OrganizationController.createOrganization
);

/**
 * PUT /api/v1/platform/organizations/:organizationId/suspend
 * Suspend an organization
 * Access: SuperAdmin, Admin
 */
router.put(
  "/platform/organizations/:organizationId/suspend",
  authenticate,
  requirePermission(Permission.PLATFORM_SUSPEND_ORGANIZATION),
  // OrganizationController.suspendOrganization
);

/**
 * GET /api/v1/platform/analytics
 * View platform-wide analytics
 * Access: SuperAdmin, Admin
 */
router.get(
  "/platform/analytics",
  authenticate,
  requirePermission(Permission.PLATFORM_VIEW_ANALYTICS),
  // AnalyticsController.getPlatformAnalytics
);

/**
 * POST /api/v1/platform/admins
 * Create new platform admin
 * Access: SuperAdmin only
 */
router.post(
  "/platform/admins",
  authenticate,
  requireRole(UserRole.SUPER_ADMIN), // Only SuperAdmin can create admins
  // UserController.createPlatformAdmin
);

/**
 * PUT /api/v1/platform/billing-plans
 * Manage billing plans
 * Access: SuperAdmin only
 */
router.put(
  "/platform/billing-plans",
  authenticate,
  requirePermission(Permission.PLATFORM_MANAGE_BILLING_PLANS),
  // BillingController.updatePlans
);

// ==================== ORGANIZATION ROUTES ====================

/**
 * GET /api/v1/org/settings
 * View organization settings
 * Access: OrgOwner, OrgAdmin
 */
router.get(
  "/org/settings",
  authenticate,
  requireOrganization, // Must belong to an organization
  requirePermission(Permission.ORG_VIEW_SETTINGS),
  // OrganizationController.getSettings
);

/**
 * PUT /api/v1/org/settings
 * Update organization settings
 * Access: OrgOwner only
 */
router.put(
  "/org/settings",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_UPDATE_SETTINGS),
  // OrganizationController.updateSettings
);

/**
 * GET /api/v1/org/billing
 * View billing information
 * Access: OrgOwner only
 */
router.get(
  "/org/billing",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_VIEW_BILLING),
  // BillingController.getBilling
);

/**
 * POST /api/v1/org/billing/upgrade
 * Upgrade subscription plan
 * Access: OrgOwner only
 */
router.post(
  "/org/billing/upgrade",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_UPGRADE_PLAN),
  // BillingController.upgradePlan
);

/**
 * DELETE /api/v1/org
 * Delete organization
 * Access: OrgOwner only
 */
router.delete(
  "/org",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_DELETE_ORGANIZATION),
  // OrganizationController.deleteOrganization
);

// ==================== MEMBER MANAGEMENT ROUTES ====================

/**
 * GET /api/v1/org/members
 * View organization members
 * Access: OrgOwner, OrgAdmin, OrgMember (all org users)
 */
router.get(
  "/org/members",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_VIEW_MEMBERS),
  // MemberController.getMembers
);

/**
 * POST /api/v1/org/members/invite
 * Invite new member
 * Access: OrgOwner, OrgAdmin
 */
router.post(
  "/org/members/invite",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_INVITE_MEMBERS),
  // MemberController.inviteMember
);

/**
 * PUT /api/v1/org/members/:memberId/role
 * Update member role
 * Access: OrgOwner, OrgAdmin
 * Note: OrgAdmin cannot promote to OrgOwner (checked in controller)
 */
router.put(
  "/org/members/:memberId/role",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_UPDATE_MEMBER_ROLE),
  // MemberController.updateMemberRole
);

/**
 * DELETE /api/v1/org/members/:memberId
 * Remove member from organization
 * Access: OrgOwner, OrgAdmin
 */
router.delete(
  "/org/members/:memberId",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_REMOVE_MEMBERS),
  // MemberController.removeMember
);

/**
 * POST /api/v1/org/members/:memberId/make-admin
 * Promote member to OrgAdmin
 * Access: OrgOwner only
 */
router.post(
  "/org/members/:memberId/make-admin",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_MANAGE_ADMINS),
  // MemberController.promoteToAdmin
);

// ==================== TEAM MANAGEMENT ROUTES ====================

/**
 * GET /api/v1/org/teams
 * View all teams in organization
 * Access: OrgOwner, OrgAdmin, OrgMember
 */
router.get(
  "/org/teams",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_VIEW_TEAMS),
  // TeamController.getTeams
);

/**
 * POST /api/v1/org/teams
 * Create new team
 * Access: OrgOwner, OrgAdmin
 */
router.post(
  "/org/teams",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_CREATE_TEAM),
  // TeamController.createTeam
);

/**
 * PUT /api/v1/org/teams/:teamId
 * Update team
 * Access: OrgOwner, OrgAdmin
 */
router.put(
  "/org/teams/:teamId",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_UPDATE_TEAM),
  // TeamController.updateTeam
);

/**
 * DELETE /api/v1/org/teams/:teamId
 * Delete team
 * Access: OrgOwner, OrgAdmin
 */
router.delete(
  "/org/teams/:teamId",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_DELETE_TEAM),
  // TeamController.deleteTeam
);

/**
 * POST /api/v1/org/teams/:teamId/members
 * Add member to team
 * Access: OrgOwner, OrgAdmin
 */
router.post(
  "/org/teams/:teamId/members",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_MANAGE_TEAM_MEMBERS),
  // TeamController.addMember
);

/**
 * DELETE /api/v1/org/teams/:teamId/members/:memberId
 * Remove member from team
 * Access: OrgOwner, OrgAdmin
 */
router.delete(
  "/org/teams/:teamId/members/:memberId",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_MANAGE_TEAM_MEMBERS),
  // TeamController.removeMember
);

// ==================== ANALYTICS ROUTES ====================

/**
 * GET /api/v1/org/analytics
 * View organization analytics
 * Access: OrgOwner, OrgAdmin
 */
router.get(
  "/org/analytics",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_VIEW_ANALYTICS),
  // AnalyticsController.getOrgAnalytics
);

/**
 * GET /api/v1/org/reports
 * View organization reports
 * Access: OrgOwner, OrgAdmin
 */
router.get(
  "/org/reports",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_VIEW_REPORTS),
  // ReportController.getReports
);

/**
 * POST /api/v1/org/reports/export
 * Export reports
 * Access: OrgOwner, OrgAdmin
 */
router.post(
  "/org/reports/export",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_EXPORT_REPORTS),
  // ReportController.exportReports
);

// ==================== INVITATION ROUTES ====================

/**
 * GET /api/v1/org/invitations
 * View pending invitations
 * Access: OrgOwner, OrgAdmin
 */
router.get(
  "/org/invitations",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_VIEW_INVITATIONS),
  // InvitationController.getInvitations
);

/**
 * POST /api/v1/org/invitations
 * Send invitation
 * Access: OrgOwner, OrgAdmin
 */
router.post(
  "/org/invitations",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_SEND_INVITATIONS),
  // InvitationController.sendInvitation
);

/**
 * DELETE /api/v1/org/invitations/:invitationId
 * Cancel invitation
 * Access: OrgOwner, OrgAdmin
 */
router.delete(
  "/org/invitations/:invitationId",
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_CANCEL_INVITATIONS),
  // InvitationController.cancelInvitation
);

// ==================== USER PROFILE ROUTES ====================

/**
 * GET /api/v1/profile
 * View own profile
 * Access: All authenticated users
 */
router.get(
  "/profile",
  authenticate,
  requirePermission(Permission.VIEW_PROFILE),
  // UserController.getProfile
);

/**
 * PUT /api/v1/profile
 * Update own profile
 * Access: All authenticated users
 */
router.put(
  "/profile",
  authenticate,
  requirePermission(Permission.UPDATE_PROFILE),
  // UserController.updateProfile
);

// ==================== DASHBOARD ROUTES ====================

/**
 * GET /api/v1/dashboard
 * View dashboard
 * Access: All authenticated users
 */
router.get(
  "/dashboard",
  authenticate,
  requirePermission(Permission.VIEW_DASHBOARD),
  // DashboardController.getDashboard
);

// ==================== ADVANCED EXAMPLES ====================

/**
 * Example: Multiple permissions (user needs ANY ONE)
 * User can view teams if they have EITHER permission
 */
router.get(
  "/teams/view",
  authenticate,
  requirePermission(
    Permission.ORG_VIEW_TEAMS,
    Permission.TEAM_VIEW_OWN
  ),
  // TeamController.viewTeams
);

/**
 * Example: Specific organization access
 * Ensures user can only access their own organization
 */
router.get(
  "/organizations/:organizationId/data",
  authenticate,
  requireOrganizationAccess, // Checks params.organizationId matches user.organizationId
  requirePermission(Permission.ORG_VIEW_SETTINGS),
  // OrganizationController.getData
);

/**
 * Example: Multiple role check
 * User must be one of these roles
 */
router.get(
  "/admin-dashboard",
  authenticate,
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ORG_OWNER
  ),
  // DashboardController.getAdminDashboard
);

// ==================== CONTROLLER EXAMPLE ====================

/**
 * Example: Permission check in controller
 * For more complex logic that can't be done in middleware
 */
/*
import { hasPermission, canManageRole, UserRole } from "../modules/role/role.constants";

export const updateMemberRole = async (req: Request, res: Response) => {
  const currentUserRole = req.user.role as UserRole;
  const targetRole = req.body.role as UserRole;

  // Check if current user can manage target role
  if (!canManageRole(currentUserRole, targetRole)) {
    throw new AppError(403, `You cannot assign users to ${targetRole} role`);
  }

  // Check if user has permission
  if (!hasPermission(currentUserRole, Permission.ORG_UPDATE_MEMBER_ROLE)) {
    throw new AppError(403, "You don't have permission to update member roles");
  }

  // Your logic here...
};
*/

export default router;
