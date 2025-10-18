/**
 * Comprehensive Role Management System for SaaS Team Management Platform
 * 
 * Role Hierarchy:
 * 1. SuperAdmin - Platform owner, complete access
 * 2. Admin - Platform administrator, manages organizations
 * 3. OrgOwner - Organization owner, billing, settings
 * 4. OrgAdmin - Organization admin, manages users and teams
 * 5. OrgMember - Regular organization member
 */

// ==================== ROLE DEFINITIONS ====================

export enum UserRole {
  // Platform Roles (no organizationId)
  SUPER_ADMIN = "SuperAdmin",
  ADMIN = "Admin",

  // Organization Roles (has organizationId)
  ORG_OWNER = "OrgOwner",
  ORG_ADMIN = "OrgAdmin",
  ORG_MEMBER = "OrgMember",
}

// ==================== PERMISSION DEFINITIONS ====================

export enum Permission {
  // ========== PLATFORM PERMISSIONS ==========
  // Organizations
  PLATFORM_VIEW_ALL_ORGANIZATIONS = "platform:view_all_organizations",
  PLATFORM_CREATE_ORGANIZATION = "platform:create_organization",
  PLATFORM_UPDATE_ORGANIZATION = "platform:update_organization",
  PLATFORM_DELETE_ORGANIZATION = "platform:delete_organization",
  PLATFORM_SUSPEND_ORGANIZATION = "platform:suspend_organization",

  // Platform Users
  PLATFORM_VIEW_ALL_USERS = "platform:view_all_users",
  PLATFORM_CREATE_ADMIN = "platform:create_admin",
  PLATFORM_UPDATE_USER_ROLE = "platform:update_user_role",
  PLATFORM_DELETE_USER = "platform:delete_user",

  // Platform Analytics
  PLATFORM_VIEW_ANALYTICS = "platform:view_analytics",
  PLATFORM_VIEW_REPORTS = "platform:view_reports",
  PLATFORM_EXPORT_DATA = "platform:export_data",

  // Platform Settings
  PLATFORM_MANAGE_SETTINGS = "platform:manage_settings",
  PLATFORM_MANAGE_BILLING_PLANS = "platform:manage_billing_plans",

  // ========== ORGANIZATION PERMISSIONS ==========
  // Organization Management
  ORG_VIEW_SETTINGS = "org:view_settings",
  ORG_UPDATE_SETTINGS = "org:update_settings",
  ORG_DELETE_ORGANIZATION = "org:delete_organization",

  // Billing & Subscription
  ORG_VIEW_BILLING = "org:view_billing",
  ORG_MANAGE_BILLING = "org:manage_billing",
  ORG_UPGRADE_PLAN = "org:upgrade_plan",
  ORG_CANCEL_SUBSCRIPTION = "org:cancel_subscription",

  // Users & Members
  ORG_VIEW_MEMBERS = "org:view_members",
  ORG_INVITE_MEMBERS = "org:invite_members",
  ORG_UPDATE_MEMBER_ROLE = "org:update_member_role",
  ORG_REMOVE_MEMBERS = "org:remove_members",
  ORG_MANAGE_ADMINS = "org:manage_admins",

  // Teams
  ORG_VIEW_TEAMS = "org:view_teams",
  ORG_CREATE_TEAM = "org:create_team",
  ORG_UPDATE_TEAM = "org:update_team",
  ORG_DELETE_TEAM = "org:delete_team",
  ORG_MANAGE_TEAM_MEMBERS = "org:manage_team_members",

  // Invitations
  ORG_VIEW_INVITATIONS = "org:view_invitations",
  ORG_SEND_INVITATIONS = "org:send_invitations",
  ORG_CANCEL_INVITATIONS = "org:cancel_invitations",

  // Analytics & Reports
  ORG_VIEW_ANALYTICS = "org:view_analytics",
  ORG_VIEW_REPORTS = "org:view_reports",
  ORG_EXPORT_REPORTS = "org:export_reports",

  // ========== TEAM PERMISSIONS ==========
  TEAM_VIEW_OWN = "team:view_own",
  TEAM_UPDATE_OWN = "team:update_own",
  TEAM_VIEW_MEMBERS = "team:view_members",

  // ========== GENERAL PERMISSIONS ==========
  VIEW_DASHBOARD = "view_dashboard",
  VIEW_PROFILE = "view_profile",
  UPDATE_PROFILE = "update_profile",
}

// ==================== ROLE-PERMISSION MAPPING ====================

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // SuperAdmin - Complete platform access
  [UserRole.SUPER_ADMIN]: [
    // Platform - All permissions
    Permission.PLATFORM_VIEW_ALL_ORGANIZATIONS,
    Permission.PLATFORM_CREATE_ORGANIZATION,
    Permission.PLATFORM_UPDATE_ORGANIZATION,
    Permission.PLATFORM_DELETE_ORGANIZATION,
    Permission.PLATFORM_SUSPEND_ORGANIZATION,
    Permission.PLATFORM_VIEW_ALL_USERS,
    Permission.PLATFORM_CREATE_ADMIN,
    Permission.PLATFORM_UPDATE_USER_ROLE,
    Permission.PLATFORM_DELETE_USER,
    Permission.PLATFORM_VIEW_ANALYTICS,
    Permission.PLATFORM_VIEW_REPORTS,
    Permission.PLATFORM_EXPORT_DATA,
    Permission.PLATFORM_MANAGE_SETTINGS,
    Permission.PLATFORM_MANAGE_BILLING_PLANS,

    // Organization - View/manage any organization
    Permission.ORG_VIEW_SETTINGS,
    Permission.ORG_UPDATE_SETTINGS,
    Permission.ORG_DELETE_ORGANIZATION,
    Permission.ORG_VIEW_BILLING,
    Permission.ORG_MANAGE_BILLING,
    Permission.ORG_VIEW_MEMBERS,
    Permission.ORG_INVITE_MEMBERS,
    Permission.ORG_UPDATE_MEMBER_ROLE,
    Permission.ORG_REMOVE_MEMBERS,
    Permission.ORG_VIEW_TEAMS,
    Permission.ORG_CREATE_TEAM,
    Permission.ORG_UPDATE_TEAM,
    Permission.ORG_DELETE_TEAM,
    Permission.ORG_VIEW_ANALYTICS,
    Permission.ORG_VIEW_REPORTS,

    // General
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PROFILE,
    Permission.UPDATE_PROFILE,
  ],

  // Admin - Platform management (no billing plans)
  [UserRole.ADMIN]: [
    // Platform
    Permission.PLATFORM_VIEW_ALL_ORGANIZATIONS,
    Permission.PLATFORM_CREATE_ORGANIZATION,
    Permission.PLATFORM_UPDATE_ORGANIZATION,
    Permission.PLATFORM_SUSPEND_ORGANIZATION,
    Permission.PLATFORM_VIEW_ALL_USERS,
    Permission.PLATFORM_VIEW_ANALYTICS,
    Permission.PLATFORM_VIEW_REPORTS,
    Permission.PLATFORM_EXPORT_DATA,

    // General
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PROFILE,
    Permission.UPDATE_PROFILE,
  ],

  // OrgOwner - Full organization control including billing
  [UserRole.ORG_OWNER]: [
    // Organization - Full access
    Permission.ORG_VIEW_SETTINGS,
    Permission.ORG_UPDATE_SETTINGS,
    Permission.ORG_DELETE_ORGANIZATION,
    Permission.ORG_VIEW_BILLING,
    Permission.ORG_MANAGE_BILLING,
    Permission.ORG_UPGRADE_PLAN,
    Permission.ORG_CANCEL_SUBSCRIPTION,
    Permission.ORG_VIEW_MEMBERS,
    Permission.ORG_INVITE_MEMBERS,
    Permission.ORG_UPDATE_MEMBER_ROLE,
    Permission.ORG_REMOVE_MEMBERS,
    Permission.ORG_MANAGE_ADMINS,
    Permission.ORG_VIEW_TEAMS,
    Permission.ORG_CREATE_TEAM,
    Permission.ORG_UPDATE_TEAM,
    Permission.ORG_DELETE_TEAM,
    Permission.ORG_MANAGE_TEAM_MEMBERS,
    Permission.ORG_VIEW_INVITATIONS,
    Permission.ORG_SEND_INVITATIONS,
    Permission.ORG_CANCEL_INVITATIONS,
    Permission.ORG_VIEW_ANALYTICS,
    Permission.ORG_VIEW_REPORTS,
    Permission.ORG_EXPORT_REPORTS,

    // Team
    Permission.TEAM_VIEW_OWN,
    Permission.TEAM_UPDATE_OWN,
    Permission.TEAM_VIEW_MEMBERS,

    // General
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PROFILE,
    Permission.UPDATE_PROFILE,
  ],

  // OrgAdmin - Organization management (no billing)
  [UserRole.ORG_ADMIN]: [
    // Organization - No billing access
    Permission.ORG_VIEW_SETTINGS,
    Permission.ORG_VIEW_MEMBERS,
    Permission.ORG_INVITE_MEMBERS,
    Permission.ORG_UPDATE_MEMBER_ROLE,
    Permission.ORG_REMOVE_MEMBERS,
    Permission.ORG_VIEW_TEAMS,
    Permission.ORG_CREATE_TEAM,
    Permission.ORG_UPDATE_TEAM,
    Permission.ORG_DELETE_TEAM,
    Permission.ORG_MANAGE_TEAM_MEMBERS,
    Permission.ORG_VIEW_INVITATIONS,
    Permission.ORG_SEND_INVITATIONS,
    Permission.ORG_CANCEL_INVITATIONS,
    Permission.ORG_VIEW_ANALYTICS,
    Permission.ORG_VIEW_REPORTS,

    // Team
    Permission.TEAM_VIEW_OWN,
    Permission.TEAM_UPDATE_OWN,
    Permission.TEAM_VIEW_MEMBERS,

    // General
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PROFILE,
    Permission.UPDATE_PROFILE,
  ],

  // OrgMember - Basic organization member
  [UserRole.ORG_MEMBER]: [
    // Organization - View only
    Permission.ORG_VIEW_MEMBERS,
    Permission.ORG_VIEW_TEAMS,

    // Team - Own team access
    Permission.TEAM_VIEW_OWN,
    Permission.TEAM_VIEW_MEMBERS,

    // General
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PROFILE,
    Permission.UPDATE_PROFILE,
  ],
};

// ==================== ROLE HIERARCHY ====================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 5,
  [UserRole.ADMIN]: 4,
  [UserRole.ORG_OWNER]: 3,
  [UserRole.ORG_ADMIN]: 2,
  [UserRole.ORG_MEMBER]: 1,
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (
  role: UserRole,
  permission: Permission
): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Check if a role has ANY of the specified permissions
 */
export const hasAnyPermission = (
  role: UserRole,
  permissions: Permission[]
): boolean => {
  return permissions.some((permission) => hasPermission(role, permission));
};

/**
 * Check if a role has ALL of the specified permissions
 */
export const hasAllPermissions = (
  role: UserRole,
  permissions: Permission[]
): boolean => {
  return permissions.every((permission) => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 */
export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if roleA has higher hierarchy than roleB
 */
export const hasHigherRole = (roleA: UserRole, roleB: UserRole): boolean => {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
};

/**
 * Check if roleA can manage roleB
 */
export const canManageRole = (managerRole: UserRole, targetRole: UserRole): boolean => {
  // SuperAdmin can manage everyone
  if (managerRole === UserRole.SUPER_ADMIN) return true;

  // Admin can manage organization roles
  if (managerRole === UserRole.ADMIN) {
    return [UserRole.ORG_OWNER, UserRole.ORG_ADMIN, UserRole.ORG_MEMBER].includes(targetRole);
  }

  // OrgOwner can manage OrgAdmin and OrgMember
  if (managerRole === UserRole.ORG_OWNER) {
    return [UserRole.ORG_ADMIN, UserRole.ORG_MEMBER].includes(targetRole);
  }

  // OrgAdmin can manage OrgMember only
  if (managerRole === UserRole.ORG_ADMIN) {
    return targetRole === UserRole.ORG_MEMBER;
  }

  return false;
};

/**
 * Check if a user is a platform admin
 */
export const isPlatformAdmin = (role: UserRole): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(role);
};

/**
 * Check if a user is an organization role
 */
export const isOrganizationRole = (role: UserRole): boolean => {
  return [UserRole.ORG_OWNER, UserRole.ORG_ADMIN, UserRole.ORG_MEMBER].includes(role);
};
