import { RequestHandler } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AnalyticsService } from './analytics.service';
import httpStatus from 'http-status';

const getSummary: RequestHandler = catchAsync(async (req, res) => {
  const result = await AnalyticsService.getAnalyticsSummary();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Analytics summary retrieved successfully',
    data: result,
  });
});

const getTeamDistribution: RequestHandler = catchAsync(async (req, res) => {
  const result = await AnalyticsService.getTeamDistribution();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Team distribution retrieved successfully',
    data: result,
  });
});

const getApprovalRates: RequestHandler = catchAsync(async (req, res) => {
  const result = await AnalyticsService.getApprovalRates();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Approval rates retrieved successfully',
    data: result,
  });
});

export const AnalyticsController = {
  getSummary,
  getTeamDistribution,
  getApprovalRates,
};
