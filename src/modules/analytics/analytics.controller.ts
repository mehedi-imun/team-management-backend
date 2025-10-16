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

export const AnalyticsController = {
  getSummary,
  getTeamDistribution,
  getApprovalRates,
};
