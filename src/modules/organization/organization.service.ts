import { nanoid } from "nanoid";
import AppError from "../../errors/AppError";
import { cacheService } from "../../services/cache.service";
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
    const cached = await getCachedData<IOrganization[]>(cacheKey);
    if (cached) return cached;

    const organizations = await Organization.find({
      ownerId: userId,
      isActive: true,
    }).sort({ createdAt: -1 });

    // Cache for 5 minutes
    await setCachedData(cacheKey, organizations, 300);

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
    if (organization.ownerId.toString() !== userId) {
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
      deleteCachedData(`organization:${organizationId}`),
      deleteCachedData(`organizations:user:${userId}`),
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
    if (organization.ownerId.toString() !== userId) {
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
      deleteCachedData(`organization:${organizationId}`),
      deleteCachedData(`organizations:user:${userId}`),
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
    if (organization.ownerId.toString() !== userId) {
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
      deleteCachedData(`organization:${organizationId}`),
      deleteCachedData(`organizations:user:${userId}`),
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
    await deleteCachedData(`organization:${organizationId}`);
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
    await deleteCachedData(`organization:${organizationId}`);
  }
}

export default new OrganizationService();
