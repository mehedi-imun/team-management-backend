import { Request, Response } from "express";
import AppError from "../../errors/AppError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import organizationService from "./organization.service";

class OrganizationController {
  /**
   * Create new organization
   * POST /api/v1/organizations
   */
  createOrganization = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id as string;
    const organization = await organizationService.createOrganization(
      req.body,
      userId
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Organization created successfully",
      data: organization,
    });
  });

  /**
   * Get all organizations for logged-in user
   * GET /api/v1/organizations
   */
  getMyOrganizations = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id as string;
    const organizations = await organizationService.getUserOrganizations(
      userId
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Organizations retrieved successfully",
      data: organizations,
    });
  });

  /**
   * Get single organization by ID
   * GET /api/v1/organizations/:id
   */
  getOrganizationById = catchAsync(async (req: Request, res: Response) => {
    const organization = await organizationService.getOrganizationById(
      req.params.id
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Organization retrieved successfully",
      data: organization,
    });
  });

  /**
   * Update organization
   * PATCH /api/v1/organizations/:id
   */
  updateOrganization = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id as string;
    const organization = await organizationService.updateOrganization(
      req.params.id,
      userId,
      req.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Organization updated successfully",
      data: organization,
    });
  });

  /**
   * Delete organization
   * DELETE /api/v1/organizations/:id
   */
  deleteOrganization = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id as string;
    await organizationService.deleteOrganization(req.params.id, userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Organization deleted successfully",
      data: null,
    });
  });

  /**
   * Check slug availability
   * GET /api/v1/organizations/check-slug?slug=my-org
   */
  checkSlug = catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.query;
    const isAvailable = await organizationService.checkSlugAvailability(
      slug as string
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: isAvailable ? "Slug is available" : "Slug is already taken",
      data: { isAvailable, slug },
    });
  });

  /**
   * Generate slug from name
   * POST /api/v1/organizations/generate-slug
   */
  generateSlug = catchAsync(async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) {
      throw new AppError(400, "Name is required");
    }

    const slug = await organizationService.generateSlug(name);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Slug generated successfully",
      data: { slug },
    });
  });

  /**
   * Upgrade plan
   * POST /api/v1/organizations/:id/upgrade
   */
  upgradePlan = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id as string;
    const { plan, billingCycle } = req.body;

    const organization = await organizationService.upgradePlan(
      req.params.id,
      userId,
      plan,
      billingCycle || "monthly"
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Plan upgraded successfully",
      data: organization,
    });
  });

  /**
   * Get usage statistics
   * GET /api/v1/organizations/:id/usage
   */
  getUsageStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await organizationService.getUsageStats(req.params.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Usage statistics retrieved successfully",
      data: stats,
    });
  });

  /**
   * Create organization with setup token (platform admin only)
   * POST /api/v1/organizations/create-with-setup
   */
  createOrganizationWithSetup = catchAsync(
    async (req: Request, res: Response) => {
      const { name, slug, ownerEmail, ownerName, plan } = req.body;

      const organization =
        await organizationService.createOrganizationWithSetup({
          name,
          slug,
          ownerEmail,
          ownerName,
          plan,
        });

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Organization created. Setup email sent to designated owner.",
        data: organization,
      });
    }
  );

  /**
   * Get all organizations (platform admin only)
   * GET /api/v1/organizations/all
   */
  getAllOrganizations = catchAsync(async (req: Request, res: Response) => {
    const result = await organizationService.getAllOrganizations(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All organizations retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  });

  /**
   * Update organization status (SuperAdmin/Admin only)
   * PATCH /api/v1/organizations/:id/status
   */
  updateOrganizationStatus = catchAsync(async (req: Request, res: Response) => {
    const { status } = req.body;

    const organization = await organizationService.updateOrganizationStatus(
      req.params.id,
      status
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Organization status updated successfully",
      data: organization,
    });
  });

  /**
   * Delete organization permanently (SuperAdmin only)
   * DELETE /api/v1/organizations/:id/permanent
   */
  deleteOrganizationPermanently = catchAsync(
    async (req: Request, res: Response) => {
      await organizationService.deleteOrganizationPermanently(req.params.id);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Organization permanently deleted",
        data: null,
      });
    }
  );

  /**
   * Create organization for client (SuperAdmin/Admin only)
   * POST /api/v1/organizations/create-for-client
   */
  createOrganizationForClient = catchAsync(
    async (req: Request, res: Response) => {
      const { name, ownerEmail, ownerName, plan } = req.body;

      const result = await organizationService.createOrganizationForClient({
        name,
        ownerEmail,
        ownerName,
        plan,
      });

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message:
          "Organization created successfully. Owner will receive setup instructions via email.",
        data: result,
      });
    }
  );

  /**
   * Get organization members
   * GET /api/v1/organizations/:id/members
   */
  getOrganizationMembers = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id as string;
    const result = await organizationService.getOrganizationMembers(
      req.params.id,
      userId,
      req.query
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Organization members retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  });

  /**
   * Add member to organization
   * POST /api/v1/organizations/:id/members
   */
  addOrganizationMember = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id as string;
    const { email, name, role, isOrganizationAdmin, password } = req.body;

    const member = await organizationService.addOrganizationMember(
      req.params.id,
      userId,
      {
        email,
        name,
        role: role || "Member",
        isOrganizationAdmin: isOrganizationAdmin || false,
        password,
      }
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Member added successfully",
      data: member,
    });
  });

  /**
   * Update organization member
   * PATCH /api/v1/organizations/:id/members/:userId
   */
  updateOrganizationMember = catchAsync(async (req: Request, res: Response) => {
    const currentUserId = req.user?._id as string;
    const { userId } = req.params;

    const member = await organizationService.updateOrganizationMember(
      req.params.id,
      currentUserId,
      userId,
      req.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  });

  /**
   * Remove member from organization
   * DELETE /api/v1/organizations/:id/members/:userId
   */
  removeOrganizationMember = catchAsync(async (req: Request, res: Response) => {
    const currentUserId = req.user?._id as string;
    const { userId } = req.params;

    await organizationService.removeOrganizationMember(
      req.params.id,
      currentUserId,
      userId
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Member removed successfully",
      data: null,
    });
  });

  /**
   * Get organization stats for current user
   * GET /api/v1/organizations/stats
   */
  getOrganizationStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id as string;
    const stats = await organizationService.getOrganizationStats(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Organization stats retrieved successfully",
      data: stats,
    });
  });
}

export default new OrganizationController();
