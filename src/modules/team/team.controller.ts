import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import sendResponse from "../../utils/sendResponse";
import { TeamService } from "./team.service";

// Create a new team
const createTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.organizationId as string;
    const userId = req.user?._id;
    const isOrgOwner = req.user?.isOrganizationOwner || false;
    const newTeam = await TeamService.createTeam(req.body, organizationId, userId, isOrgOwner);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Team created successfully",
      data: newTeam,
    });
  } catch (error) {
    next(error);
  }
};

// Get all teams
const getAllTeams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.organizationId as string;
    const result = await TeamService.getAllTeams(req.query, organizationId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

// Get single team
const getTeamById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.organizationId as string;
    const team = await TeamService.getTeamById(
      req.params.teamId,
      organizationId
    );
    if (!team) throw new AppError(httpStatus.NOT_FOUND, "Team not found");
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

// Update team
const updateTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.organizationId as string;
    const updatedTeam = await TeamService.updateTeam(
      req.params.teamId,
      organizationId,
      req.body
    );

    if (!updatedTeam)
      throw new AppError(httpStatus.NOT_FOUND, "Team not found");
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Team updated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

// Delete single team
const deleteTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.organizationId as string;
    const deletedTeam = await TeamService.deleteTeam(
      req.params.teamId,
      organizationId
    );
    if (!deletedTeam)
      throw new AppError(httpStatus.NOT_FOUND, "Team not found");
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Team deleted successfully",
      data: deletedTeam,
    });
  } catch (error) {
    next(error);
  }
};

// Bulk delete teams
const bulkDeleteTeams = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.organizationId as string;
    await TeamService.bulkDeleteTeams(req.body.ids, organizationId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Teams deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Update tri-state approval status
const updateApprovalStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.organizationId as string;
    const { field, value } = req.body;
    const updated = await TeamService.updateApprovalStatus(
      req.params.teamId,
      organizationId,
      field,
      value
    );
    if (!updated) throw new AppError(httpStatus.NOT_FOUND, "Team not found");
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Team status saved",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Update team order (drag & drop)
const updateTeamOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.organizationId as string;
    await TeamService.updateTeamOrder(req.body.orderList, organizationId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Team order updated",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Update a team member
const updateMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.organizationId as string;
    await TeamService.updateMember(
      req.params.teamId,
      organizationId,
      req.params.memberId,
      req.body
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Member updated",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a team member
const deleteMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.organizationId as string;
    await TeamService.deleteMember(
      req.params.teamId,
      organizationId,
      req.params.memberId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Member deleted",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Add a new team member
const addMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.organizationId as string;
    const result = await TeamService.addMember(
      req.params.teamId,
      organizationId,
      req.body
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Member added to team",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Assign manager to team
const assignManager = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.organizationId as string;
    const { managerId } = req.body;
    const result = await TeamService.assignManager(
      req.params.teamId,
      organizationId,
      managerId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Manager assigned to team",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get teams managed by current user
const getMyManagedTeams = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.organizationId as string;
    const managerId = req.user?._id as string;

    if (!managerId) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const teams = await TeamService.getTeamsByManager(
      managerId,
      organizationId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Teams retrieved successfully",
      data: teams,
    });
  } catch (error) {
    next(error);
  }
};

export const TeamController = {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  bulkDeleteTeams,
  updateApprovalStatus,
  updateTeamOrder,
  updateMember,
  deleteMember,
  addMember,
  assignManager,
  getMyManagedTeams,
};
