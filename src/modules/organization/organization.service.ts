import { nanoid } from "nanoid";
import AppError from "../../errors/AppError";
import { cacheService } from "../../services/cache.service";
import QueryBuilder from "../../utils/queryBuilder";
import { User } from "../user/user.model";
import {
  IOrganization,
  IOrganizationCreate,
  IOrganizationUpdate,
} from "./organization.interface";
import { Organization } from "./organization.model";

class OrganizationService {
  /**
   * Create a new organization
   */
  async createOrganization(
    data: IOrganizationCreate,
    userId: string
  ): Promise<IOrganization> {
    // Check if slug already exists
    const existingSlug = await Organization.findOne({ slug: data.slug });
    if (existingSlug) {
      throw new AppError(409, "Organization slug already exists");
    }

    // Create organization with owner as first user
    const organization = await Organization.create({
      ...data,
      ownerId: userId,
      usage: {
        users: 1, // Owner counts as first user
        teams: 0,
        storage: "0MB",
      },
    });

    // Invalidate cache
    await cacheService.delete(`organizations:user:${userId}`);

    return organization;
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(organizationId: string): Promise<IOrganization> {
    // Try cache first
    const cacheKey = `organization:${organizationId}`;
    const cached = await cacheService.get<IOrganization>(cacheKey);
    if (cached) return cached;

    const organization = await Organization.findOne({
      _id: organizationId,
      isActive: true,
    });

    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    // Cache for 10 minutes
    await cacheService.set(cacheKey, organization, 600);

    return organization;
  }

  /**
   * Get all organizations for a user
   */
  async getUserOrganizations(userId: string): Promise<IOrganization[]> {
    // Try cache first
    const cacheKey = `organizations:user:${userId}`;
    const cached = await cacheService.get<IOrganization[]>(cacheKey);
    if (cached) return cached;

    const organizations = await Organization.find({
      ownerId: userId,
      isActive: true,
    }).sort({ createdAt: -1 });

    // Cache for 5 minutes
    await cacheService.set(cacheKey, organizations, 300);

    return organizations;
  }

  /**
   * Update organization
   */
  async updateOrganization(
    organizationId: string,
    userId: string,
    data: IOrganizationUpdate
  ): Promise<IOrganization> {
    const organization = await Organization.findOne({
      _id: organizationId,
      isActive: true,
    });

    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    // Check if user is owner
    if (organization.ownerId?.toString() !== userId) {
      throw new AppError(403, "Only organization owner can update settings");
    }

    // Update fields
    if (data.name) organization.name = data.name;
    if (data.description !== undefined)
      organization.description = data.description;
    if (data.logo !== undefined) organization.logo = data.logo;
    if (data.settings) {
      organization.settings = { ...organization.settings, ...data.settings };
    }

    await organization.save();

    // Invalidate cache
    await Promise.all([
      cacheService.delete(`organization:${organizationId}`),
      cacheService.delete(`organizations:user:${userId}`),
    ]);

    return organization;
  }

  /**
   * Delete organization (soft delete)
   */
  async deleteOrganization(
    organizationId: string,
    userId: string
  ): Promise<void> {
    const organization = await Organization.findOne({
      _id: organizationId,
      isActive: true,
    });

    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    // Check if user is owner
    if (organization.ownerId?.toString() !== userId) {
      throw new AppError(
        403,
        "Only organization owner can delete organization"
      );
    }

    // Soft delete
    organization.isActive = false;
    await organization.save();

    // Invalidate cache
    await Promise.all([
      cacheService.delete(`organization:${organizationId}`),
      cacheService.delete(`organizations:user:${userId}`),
    ]);
  }

  /**
   * Check if slug is available
   */
  async checkSlugAvailability(slug: string): Promise<boolean> {
    const existing = await Organization.findOne({ slug });
    return !existing;
  }

  /**
   * Generate unique slug from organization name
   */
  async generateSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 40);

    let slug = baseSlug;
    let isAvailable = await this.checkSlugAvailability(slug);

    // If slug exists, append random string
    while (!isAvailable) {
      slug = `${baseSlug}-${nanoid(6).toLowerCase()}`;
      isAvailable = await this.checkSlugAvailability(slug);
    }

    return slug;
  }

  /**
   * Upgrade organization plan
   */
  async upgradePlan(
    organizationId: string,
    userId: string,
    plan: IOrganization["plan"],
    billingCycle: IOrganization["billingCycle"]
  ): Promise<IOrganization> {
    const organization = await Organization.findOne({
      _id: organizationId,
      isActive: true,
    });

    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    // Check if user is owner
    if (organization.ownerId?.toString() !== userId) {
      throw new AppError(403, "Only organization owner can upgrade plan");
    }

    // Update plan and billing cycle
    organization.plan = plan;
    organization.billingCycle = billingCycle;

    // Update subscription status (will be set to 'active' after Stripe payment)
    if (plan === "free") {
      organization.subscriptionStatus = "active";
    }

    // Limits are automatically set by pre-save hook in model
    await organization.save();

    // Invalidate cache
    await Promise.all([
      cacheService.delete(`organization:${organizationId}`),
      cacheService.delete(`organizations:user:${userId}`),
    ]);

    return organization;
  }

  /**
   * Get organization usage statistics
   */
  async getUsageStats(organizationId: string): Promise<{
    usage: IOrganization["usage"];
    limits: IOrganization["limits"];
    percentages: {
      users: number;
      teams: number;
    };
  }> {
    const organization = await this.getOrganizationById(organizationId);

    return {
      usage: organization.usage,
      limits: organization.limits,
      percentages: {
        users: Math.round(
          (organization.usage.users / organization.limits.maxUsers) * 100
        ),
        teams: Math.round(
          (organization.usage.teams / organization.limits.maxTeams) * 100
        ),
      },
    };
  }

  /**
   * Check if organization can add a user
   */
  async canAddUser(organizationId: string): Promise<boolean> {
    const organization = await this.getOrganizationById(organizationId);
    return organization.usage.users < organization.limits.maxUsers;
  }

  /**
   * Check if organization can add a team
   */
  async canAddTeam(organizationId: string): Promise<boolean> {
    const organization = await this.getOrganizationById(organizationId);
    return organization.usage.teams < organization.limits.maxTeams;
  }

  /**
   * Increment usage (when adding users or teams)
   */
  async incrementUsage(
    organizationId: string,
    type: "users" | "teams",
    count: number = 1
  ): Promise<void> {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    organization.usage[type] += count;
    await organization.save();

    // Invalidate cache
    await cacheService.delete(`organization:${organizationId}`);
  }

  /**
   * Decrement usage (when removing users or teams)
   */
  async decrementUsage(
    organizationId: string,
    type: "users" | "teams",
    count: number = 1
  ): Promise<void> {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    organization.usage[type] = Math.max(0, organization.usage[type] - count);
    await organization.save();

    // Invalidate cache
    await cacheService.delete(`organization:${organizationId}`);
  }

  /**
   * Create organization with setup token (for platform admins)
   * The designated owner will receive an email to complete setup
   */
  async createOrganizationWithSetup(data: {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerName: string;
    plan?: "free" | "professional" | "business" | "enterprise";
  }): Promise<IOrganization> {
    const crypto = await import("crypto");
    const bcrypt = await import("bcryptjs");
    const { sendEmail } = await import("../../services/email.service");
    const { getOrgOwnerCreatedEmailTemplate } = await import(
      "../../templates/org-owner-created.template"
    );

    // Check if slug already exists
    const existingSlug = await Organization.findOne({ slug: data.slug });
    if (existingSlug) {
      throw new AppError(409, "Organization slug already exists");
    }

    // Generate temporary password for owner
    const generateTempPassword = (): string => {
      const length = 12;
      const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let password = "";

      // Ensure at least one of each required type
      password +=
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
      password +=
        "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
      password += "0123456789"[Math.floor(Math.random() * 10)];
      password += "!@#$%^&*"[Math.floor(Math.random() * 8)];

      // Fill the rest randomly
      for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }

      // Shuffle the password
      return password.split("").sort(() => Math.random() - 0.5).join("");
    };

    const temporaryPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.ownerEmail });
    if (existingUser) {
      throw new AppError(
        409,
        "User with this email already exists. Please use a different email or assign an existing user as owner."
      );
    }

    // Create organization with active subscription (no trial for admin-created orgs)
    const organization = await Organization.create({
      name: data.name,
      slug: data.slug,
      ownerEmail: data.ownerEmail,
      ownerName: data.ownerName,
      plan: data.plan || "professional", // Admin-created orgs default to professional
      subscriptionStatus: "active", // No trial for admin-created orgs
      billingCycle: "monthly",
      status: "active", // Active immediately (not pending_setup)
      usage: {
        users: 1, // Will include owner
        teams: 0,
        storage: "0MB",
      },
      isActive: true,
    });

    // Create owner user account
    const ownerUser = await User.create({
      name: data.ownerName,
      email: data.ownerEmail,
      password: hashedPassword,
      role: "OrgOwner",
      organizationIds: [organization._id!.toString()],
      isActive: true,
      mustChangePassword: true, // Force password change on first login
    });

    // Update organization with owner ID
    organization.ownerId = ownerUser._id!.toString();
    await organization.save();

    // Send email with credentials using new template
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const trialDays = 0; // No trial for admin-created orgs

    const emailTemplate = getOrgOwnerCreatedEmailTemplate({
      ownerName: data.ownerName,
      organizationName: data.name,
      email: data.ownerEmail,
      temporaryPassword,
      loginUrl,
      trialDays,
      createdBy: "Platform Administrator",
    });

    await sendEmail({
      to: data.ownerEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return organization;
  }

  /**
   * Get all organizations (platform admin only)
   */
  async getAllOrganizations(
    query: any
  ): Promise<{ data: IOrganization[]; meta: any }> {
    const searchableFields = ["name", "slug", "ownerEmail"];

    // Map 'search' to 'searchTerm' for QueryBuilder compatibility
    const mappedQuery = { ...query };
    if (mappedQuery.search) {
      mappedQuery.searchTerm = mappedQuery.search;
      delete mappedQuery.search;
    }

    const queryBuilder = new QueryBuilder<IOrganization>(
      Organization.find(),
      mappedQuery
    );

    const orgQuery = queryBuilder
      .search(searchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const [data, meta] = await Promise.all([
      orgQuery.build().exec(),
      queryBuilder.countTotal(),
    ]);

    return { data, meta };
  }

  /**
   * Update organization status (SuperAdmin/Admin only)
   */
  async updateOrganizationStatus(
    organizationId: string,
    status: "active" | "pending_setup" | "suspended"
  ): Promise<IOrganization> {
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    organization.status = status;
    await organization.save();

    // Invalidate cache
    await cacheService.delete(`organization:${organizationId}`);

    return organization;
  }

  /**
   * Delete organization permanently (SuperAdmin only)
   */
  async deleteOrganizationPermanently(organizationId: string): Promise<void> {
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    // Delete permanently
    await Organization.findByIdAndDelete(organizationId);

    // Invalidate cache
    await cacheService.delete(`organization:${organizationId}`);
  }

  /**
   * Create organization for client (SuperAdmin/Admin only)
   */
  async createOrganizationForClient(data: {
    name: string;
    ownerEmail: string;
    ownerName: string;
    plan: "free" | "professional" | "business" | "enterprise";
  }): Promise<{ organization: IOrganization; temporaryPassword: string }> {
    const User = require("../user/user.model").User;
    const bcrypt = require("bcryptjs");

    // Check if organization name already exists
    const existingOrg = await Organization.findOne({ name: data.name });
    if (existingOrg) {
      throw new AppError(409, "Organization with this name already exists");
    }

    // Check if user already exists
    let user = await User.findOne({ email: data.ownerEmail });

    let temporaryPassword = "";
    let isNewUser = false;

    if (!user) {
      // Create new user with temporary password
      temporaryPassword = nanoid(12);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      user = await User.create({
        email: data.ownerEmail,
        name: data.ownerName,
        password: hashedPassword,
        role: "OrgMember", // Will be upgraded to OrgOwner below
        managedTeamIds: [],
        status: "active",
      });

      isNewUser = true;
    }

    // Generate slug from organization name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug already exists
    let finalSlug = slug;
    let counter = 1;
    while (await Organization.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Create organization (limits will be set automatically by pre-save hook based on plan)
    const organization = await Organization.create({
      name: data.name,
      slug: finalSlug,
      ownerId: user._id,
      ownerEmail: data.ownerEmail,
      ownerName: data.ownerName,
      plan: data.plan,
      status: "active", // Organization status: active, pending_setup, or suspended
      subscriptionStatus: "trialing", // Subscription status for billing
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      // Usage and limits are set automatically by the model based on plan
      usage: {
        users: 1, // Owner counts as first user
        teams: 0,
        storage: "0MB",
      },
    });

    // Update user to be organization owner
    user.organizationId = organization._id;
    user.role = "OrgOwner";
    await user.save();

    // Invalidate cache
    await cacheService.delete("organizations:all");

    return {
      organization,
      temporaryPassword: isNewUser ? temporaryPassword : "",
    };
  }

  /**
   * Get organization members with pagination and filtering
   */
  async getOrganizationMembers(
    organizationId: string,
    currentUserId: string,
    query: any
  ): Promise<{ data: any[]; meta: any }> {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    // Check if user has permission (owner or admin)
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new AppError(401, "User not found");
    }

    // Allow access if:
    // 1. User belongs to the organization
    // 2. User is SuperAdmin or Admin (can view any organization)
    const belongsToOrg = currentUser.organizationId === organizationId;
    const isPlatformAdmin = ["SuperAdmin", "Admin"].includes(currentUser.role);

    if (!belongsToOrg && !isPlatformAdmin) {
      throw new AppError(403, "You don't have permission to view members");
    }

    // Build query
    const queryBuilder = new QueryBuilder(
      User.find({ organizationId }).select("-password") as any,
      query
    )
      .search(["name", "email"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const data = await queryBuilder.build();
    const meta = await queryBuilder.countTotal();

    return { data, meta };
  }

  /**
   * Add member to organization
   */
  async addOrganizationMember(
    organizationId: string,
    currentUserId: string,
    memberData: {
      email: string;
      name: string;
      role?: "OrgOwner" | "OrgAdmin" | "OrgMember";
      password?: string;
    }
  ): Promise<any> {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    // Check if user has permission (owner or admin)
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new AppError(401, "User not found");
    }

    // Allow access if:
    // 1. User belongs to org AND is owner/admin
    // 2. User is platform SuperAdmin/Admin
    const belongsToOrg = currentUser.organizationId === organizationId;
    const isPlatformAdmin = ["SuperAdmin", "Admin"].includes(currentUser.role);
    const isOrgAdmin =
      currentUser.role === "OrgOwner" || currentUser.role === "OrgAdmin";

    if (!isPlatformAdmin && (!belongsToOrg || !isOrgAdmin)) {
      throw new AppError(403, "You don't have permission to add members");
    }

    // Check if organization can add more users
    if (!organization.canAddUser()) {
      throw new AppError(
        403,
        `Organization has reached the maximum user limit (${organization.limits.maxUsers})`
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: memberData.email });
    if (existingUser) {
      // If user exists but in different organization
      if (
        existingUser.organizationId &&
        existingUser.organizationId !== organizationId
      ) {
        throw new AppError(409, "User already belongs to another organization");
      }
      // If user exists and already in this organization
      if (existingUser.organizationId === organizationId) {
        throw new AppError(
          409,
          "User is already a member of this organization"
        );
      }
    }

    // Create new user or update existing
    let user;
    if (existingUser) {
      // Update existing user
      existingUser.organizationId = organizationId;
      existingUser.role = memberData.role || "OrgMember";
      await existingUser.save();
      user = existingUser;
    } else {
      // Create new user
      const password = memberData.password || nanoid(12);
      user = await User.create({
        email: memberData.email,
        name: memberData.name,
        password,
        role: memberData.role || "OrgMember",
        organizationId,
      });
    }

    // Increment organization user count
    await organization.incrementUsage("users");

    // Invalidate cache
    await cacheService.delete(`organization:${organizationId}`);
    await cacheService.delete(`organizations:user:${currentUserId}`);

    return user;
  }

  /**
   * Update organization member
   */
  async updateOrganizationMember(
    organizationId: string,
    currentUserId: string,
    targetUserId: string,
    updateData: {
      role?: "OrgOwner" | "OrgAdmin" | "OrgMember";
      isActive?: boolean;
    }
  ): Promise<any> {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    // Check if user has permission (owner or admin)
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new AppError(401, "User not found");
    }

    // Allow access if:
    // 1. User belongs to org AND is owner/admin
    // 2. User is platform SuperAdmin/Admin
    const belongsToOrg = currentUser.organizationId === organizationId;
    const isPlatformAdmin = ["SuperAdmin", "Admin"].includes(currentUser.role);
    const isOrgAdmin =
      currentUser.role === "OrgOwner" || currentUser.role === "OrgAdmin";

    if (!isPlatformAdmin && (!belongsToOrg || !isOrgAdmin)) {
      throw new AppError(403, "You don't have permission to update members");
    }

    // Find target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser || targetUser.organizationId !== organizationId) {
      throw new AppError(404, "Member not found in this organization");
    }

    // Prevent modifying owner
    if (targetUser.role === "OrgOwner") {
      throw new AppError(403, "Cannot modify organization owner");
    }

    // Prevent self-modification
    if (targetUserId === currentUserId) {
      throw new AppError(403, "Cannot modify your own permissions");
    }

    // Update user
    if (updateData.role !== undefined) {
      targetUser.role = updateData.role;
    }
    if (updateData.isActive !== undefined) {
      targetUser.isActive = updateData.isActive;
    }

    await targetUser.save();

    // Invalidate cache
    await cacheService.delete(`organization:${organizationId}`);
    await cacheService.delete(`organizations:user:${currentUserId}`);

    return targetUser;
  }

  /**
   * Remove member from organization
   */
  async removeOrganizationMember(
    organizationId: string,
    currentUserId: string,
    targetUserId: string
  ): Promise<void> {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    // Check if user has permission (owner or admin)
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new AppError(401, "User not found");
    }

    // Allow access if:
    // 1. User belongs to org AND is owner/admin
    // 2. User is platform SuperAdmin/Admin
    const belongsToOrg = currentUser.organizationId === organizationId;
    const isPlatformAdmin = ["SuperAdmin", "Admin"].includes(currentUser.role);
    const isOrgAdmin =
      currentUser.role === "OrgOwner" || currentUser.role === "OrgAdmin";

    if (!isPlatformAdmin && (!belongsToOrg || !isOrgAdmin)) {
      throw new AppError(403, "You don't have permission to remove members");
    }

    // Find target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser || targetUser.organizationId !== organizationId) {
      throw new AppError(404, "Member not found in this organization");
    }

    // Prevent removing owner
    if (targetUser.role === "OrgOwner") {
      throw new AppError(403, "Cannot remove organization owner");
    }

    // Prevent self-removal
    if (targetUserId === currentUserId) {
      throw new AppError(403, "Cannot remove yourself from the organization");
    }

    // Remove user from organization
    targetUser.organizationId = undefined;
    targetUser.role = "OrgMember"; // Reset to default role
    await targetUser.save();

    // Decrement organization user count
    await organization.decrementUsage("users");

    // Invalidate cache
    await cacheService.delete(`organization:${organizationId}`);
    await cacheService.delete(`organizations:user:${currentUserId}`);
  }

  /**
   * Get organization statistics for current user
   */
  async getOrganizationStats(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user || !user.organizationId) {
      throw new AppError(404, "User not in any organization");
    }

    const organizationId = user.organizationId;

    // Get total members count
    const totalMembers = await User.countDocuments({ organizationId });

    // Get active members count
    const activeMembers = await User.countDocuments({
      organizationId,
      isActive: true,
    });

    // Get pending/inactive members
    const pendingMembers = await User.countDocuments({
      organizationId,
      isActive: false,
    });

    // Get total teams count (if team model exists)
    let totalTeams = 0;
    try {
      const Team = require("../team/team.model").default;
      totalTeams = await Team.countDocuments({ organizationId });
    } catch (error) {
      // Team model might not exist, ignore
    }

    // Get organization to check trial period
    const organization = await Organization.findById(organizationId);
    let daysLeftInTrial: number | undefined;

    if (
      organization &&
      organization.subscriptionStatus === "trialing" &&
      organization.currentPeriodEnd
    ) {
      const now = new Date();
      const trialEnd = new Date(organization.currentPeriodEnd);
      const diffTime = trialEnd.getTime() - now.getTime();
      daysLeftInTrial = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      totalMembers,
      activeMembers,
      pendingMembers,
      inactiveMembers: totalMembers - activeMembers,
      totalTeams,
      daysLeftInTrial,
    };
  }
}

export default new OrganizationService();
