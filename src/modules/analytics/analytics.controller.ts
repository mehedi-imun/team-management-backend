import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import { AnalyticsService } from "./analytics.service";

const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AnalyticsService.getAnalyticsSummary();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Analytics summary retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getTeamDistribution = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AnalyticsService.getTeamDistribution();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Team distribution retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getApprovalRates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AnalyticsService.getApprovalRates();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Approval rates retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPlatformAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AnalyticsService.getPlatformAnalytics();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Platform analytics retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getOrganizationStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AnalyticsService.getOrganizationStats();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Organization stats retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AnalyticsService.getUserStats();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User stats retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrganizationAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as any;

    if (!user?.organizationId) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "User is not associated with an organization",
        data: null,
      });
    }

    const result = await AnalyticsService.getMyOrganizationAnalytics(
      user.organizationId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Organization analytics retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const AnalyticsController = {
  getSummary,
  getTeamDistribution,
  getApprovalRates,
  getPlatformAnalytics,
  getOrganizationStats,
  getUserStats,
  getMyOrganizationAnalytics,
};
