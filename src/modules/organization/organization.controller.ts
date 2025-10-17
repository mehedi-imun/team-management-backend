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
        message:
          "Organization created. Setup email sent to designated owner.",
        data: organization,
      });
    }
  );

  /**
   * Get all organizations (platform admin only)
   * GET /api/v1/organizations/all
   */
  getAllOrganizations = catchAsync(async (req: Request, res: Response) => {
    const { status, plan, search } = req.query;

    const organizations = await organizationService.getAllOrganizations({
      status: status as string,
      plan: plan as string,
      search: search as string,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All organizations retrieved successfully",
      data: organizations,
    });
  });
}

export default new OrganizationController();
