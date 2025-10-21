// Trial Status Controller
import { Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middleware/authenticate";
import { TrialService } from "../../services/trial.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

/**
 * Get trial status for current organization
 * GET /api/v1/trial/status
 */
const getTrialStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Organization context required",
      data: null,
    });
    return;
  }

  const status = await TrialService.getTrialStatus(organizationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trial status retrieved successfully",
    data: status,
  });
});

/**
 * Check if organization can access features
 * GET /api/v1/trial/can-access-features
 */
const checkFeatureAccess = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const organizationId = req.user!.organizationId;

    if (!organizationId) {
      sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Organization context required",
        data: { canAccess: false },
      });
      return;
    }

    const canAccess = await TrialService.canAccessFeatures(organizationId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: canAccess ? "Features accessible" : "Features blocked",
      data: { canAccess },
    });
  }
);

export const TrialController = {
  getTrialStatus,
  checkFeatureAccess,
};
