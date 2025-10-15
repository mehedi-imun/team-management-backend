import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { TeamService } from "./team.service";
import AppError from "../../errors/AppError";
import sendResponse from "../../utils/sendResponse";

// Create a new team
const createTeam = async (req: Request, res: Response, next: NextFunction) => {

  try {
    const newTeam = await TeamService.createTeam(req.body);
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
    const result = await TeamService.getAllTeams(req.query);
   
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
    const team = await TeamService.getTeamById(req.params.teamId);
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
    const updatedTeam = await TeamService.updateTeam(req.params.teamId, req.body);
    if (!updatedTeam) throw new AppError(httpStatus.NOT_FOUND, "Team not found");
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
    const deletedTeam = await TeamService.deleteTeam(req.params.teamId);
    if (!deletedTeam) throw new AppError(httpStatus.NOT_FOUND, "Team not found");
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
const bulkDeleteTeams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await TeamService.bulkDeleteTeams(req.body.ids);
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
const updateApprovalStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { field, value } = req.body;
    const updated = await TeamService.updateApprovalStatus(req.params.teamId, field, value);
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
const updateTeamOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await TeamService.updateTeamOrder(req.body.orderList);
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
const updateMember = async (req: Request, res: Response, next: NextFunction) => {

  try {
    await TeamService.updateMember(req.params.teamId, req.params.memberId, req.body);
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
const deleteMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await TeamService.deleteMember(req.params.teamId, req.params.memberId);
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
};
