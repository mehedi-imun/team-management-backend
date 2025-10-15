/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Types } from "mongoose";
import { Team } from "./team.model";
import { ITeam, IMember } from "./team.interface";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../utils/queryBuilder";


// Create a new team
const createTeam = async (data: any) => {
  if (!data.name || !data.description) {
    throw new AppError(httpStatus.BAD_REQUEST, "Name and description are required");
  }

  const lastTeam = await Team.findOne().sort({ order: -1 });
  const order = lastTeam?.order ? lastTeam.order + 1 : 1;

  const newTeam = await Team.create({
    ...data,
    order,
  });

  return newTeam;
};

// Get all teams with search, filter, sort, pagination
const getAllTeams = async (query: any) => {
  const searchableFields = ["name", "members.name"];
  const queryBuilder = new QueryBuilder<ITeam>(Team.find(), query);

  const teamQuery = queryBuilder
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    teamQuery.build().exec(),
    queryBuilder.countTotal(),
  ]);

  return { data, meta };
};

// Get single team
const getTeamById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw new AppError(httpStatus.BAD_REQUEST, "Invalid team ID");
  return Team.findById(id);
};

// Update team
const updateTeam = async (id: string, data: any) => {
  if (!Types.ObjectId.isValid(id)) throw new AppError(httpStatus.BAD_REQUEST, "Invalid team ID");
  return Team.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

// Delete single team
const deleteTeam = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw new AppError(httpStatus.BAD_REQUEST, "Invalid team ID");
  return Team.findByIdAndDelete(id);
};

// Bulk delete teams
const bulkDeleteTeams = async (ids: string[]) => {
  ids.forEach((id) => {
    if (!Types.ObjectId.isValid(id)) throw new AppError(httpStatus.BAD_REQUEST, `Invalid ID ${id}`);
  });
  return Team.deleteMany({ _id: { $in: ids } });
};

// Update tri-state approval
const updateApprovalStatus = async (
  teamId: string,
  field: "managerApproved" | "directorApproved",
  value: 0 | 1 | 2
) => {
  if (!Types.ObjectId.isValid(teamId)) throw new AppError(httpStatus.BAD_REQUEST, "Invalid team ID");
  return Team.findByIdAndUpdate(teamId, { [field]: value }, { new: true });
};

// Update order for drag & drop
const updateTeamOrder = async (orderList: { id: string; order: number }[]) => {
  const ops = orderList.map((o) => Team.findByIdAndUpdate(o.id, { order: o.order }));
  await Promise.all(ops);
  return true;
};

// Update a team member
const updateMember = async (teamId: string, memberId: string, data: IMember) => {
  if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(memberId))
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid ID");

  return Team.updateOne({ _id: teamId, "members._id": memberId }, { $set: { "members.$": data } });
};

// Delete a team member
const deleteMember = async (teamId: string, memberId: string) => {
  if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(memberId))
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid ID");

  return Team.findByIdAndUpdate(teamId, { $pull: { members: { _id: memberId } } });
};

export const TeamService = {
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
