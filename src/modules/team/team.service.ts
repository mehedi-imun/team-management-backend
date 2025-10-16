/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { cacheService } from "../../services/cache.service";
import QueryBuilder from "../../utils/queryBuilder";
import { IMember, ITeam } from "./team.interface";
import { Team } from "./team.model";

// Create a new team
const createTeam = async (data: any, organizationId: string) => {
  if (!data.name || !data.description) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Name and description are required"
    );
  }

  // Get last team order within this organization
  const lastTeam = await Team.findOne({ organizationId }).sort({ order: -1 });
  const order = lastTeam?.order ? lastTeam.order + 1 : 1;

  const newTeam = await Team.create({
    ...data,
    organizationId,
    order,
  });

  // Invalidate teams cache for this organization
  await cacheService.invalidatePattern(`teams:${organizationId}:*`);
  console.log(`🗑️  Cache invalidated: teams:${organizationId}:*`);

  return newTeam;
};

// Get all teams with search, filter, sort, pagination
const getAllTeams = async (query: any, organizationId: string) => {
  // Generate cache key based on query params and organization
  const cacheKey = `teams:${organizationId}:all:${JSON.stringify(query)}`;

  // Try to get from cache
  const cached = await cacheService.get<{ data: ITeam[]; meta: any }>(cacheKey);
  if (cached) {
    console.log(`✅ Cache hit for teams (org: ${organizationId})`);
    return cached;
  }

  console.log(`❌ Cache miss for teams (org: ${organizationId}) - fetching from DB`);
  const searchableFields = ["name", "members.name"];
  
  // Add organization filter to base query
  const baseQuery = Team.find({ organizationId });
  const queryBuilder = new QueryBuilder<ITeam>(baseQuery, query);
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

  const result = { data, meta };

  // Cache the result for 5 minutes
  await cacheService.set(cacheKey, result, 300);

  return result;
};

// Get single team
const getTeamById = async (id: string, organizationId: string) => {
  if (!Types.ObjectId.isValid(id))
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid team ID");

  // Try cache first
  const cacheKey = `team:${organizationId}:${id}`;
  const cached = await cacheService.get<ITeam>(cacheKey);
  if (cached) {
    console.log(`✅ Cache hit for team ${id} (org: ${organizationId})`);
    return cached;
  }

  console.log(`❌ Cache miss for team ${id} (org: ${organizationId})`);
  const team = await Team.findOne({ _id: id, organizationId });

  // Cache for 5 minutes
  if (team) {
    await cacheService.set(cacheKey, team, 300);
  }

  return team;
};

// Update team
const updateTeam = async (
  teamId: string,
  organizationId: string,
  data: any,
  newMembers?: { name: string }[]
) => {
  if (!Types.ObjectId.isValid(teamId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid team ID");
  }

  const updateData: any = { ...data };

  if (newMembers && newMembers.length > 0) {
    updateData.$push = {
      members: { $each: newMembers.map((m) => ({ name: m.name })) },
    };
  }

  const result = await Team.findOneAndUpdate(
    { _id: teamId, organizationId },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  // Invalidate cache
  await cacheService.delete(`team:${organizationId}:${teamId}`);
  await cacheService.invalidatePattern(`teams:${organizationId}:*`);
  console.log(`🗑️  Cache invalidated: team:${organizationId}:${teamId} and teams:${organizationId}:*`);

  return result;
};

// Delete single team
const deleteTeam = async (id: string, organizationId: string) => {
  if (!Types.ObjectId.isValid(id))
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid team ID");

  const result = await Team.findOneAndDelete({ _id: id, organizationId });

  // Invalidate cache
  await cacheService.delete(`team:${organizationId}:${id}`);
  await cacheService.invalidatePattern(`teams:${organizationId}:*`);
  console.log(`🗑️  Cache invalidated after delete: team:${organizationId}:${id}`);

  return result;
};

// Bulk delete teams
const bulkDeleteTeams = async (ids: string[], organizationId: string) => {
  ids.forEach((id) => {
    if (!Types.ObjectId.isValid(id))
      throw new AppError(httpStatus.BAD_REQUEST, `Invalid ID ${id}`);
  });

  const result = await Team.deleteMany({ _id: { $in: ids }, organizationId });

  // Invalidate all cache for this organization
  await cacheService.invalidatePattern(`team:${organizationId}:*`);
  await cacheService.invalidatePattern(`teams:${organizationId}:*`);
  console.log(`🗑️  Cache invalidated after bulk delete (org: ${organizationId})`);

  return result;
};

// Update tri-state approval
const updateApprovalStatus = async (
  teamId: string,
  organizationId: string,
  field: "managerApproved" | "directorApproved",
  value: "0" | "1" | "-1"
) => {
  if (!Types.ObjectId.isValid(teamId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid team ID");
  }

  return Team.findOneAndUpdate(
    { _id: teamId, organizationId },
    { [field]: value },
    { new: true }
  );
};

// Update order for drag & drop
const updateTeamOrder = async (
  orderList: { id: string; order: number }[],
  organizationId: string
) => {
  const ops = orderList.map((o) =>
    Team.findOneAndUpdate({ _id: o.id, organizationId }, { order: o.order })
  );
  await Promise.all(ops);
  
  // Invalidate cache
  await cacheService.invalidatePattern(`teams:${organizationId}:*`);
  
  return true;
};

// Update a team member
const updateMember = async (
  teamId: string,
  organizationId: string,
  memberId: string,
  data: IMember
) => {
  if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(memberId))
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid ID");

  return Team.updateOne(
    { _id: teamId, organizationId, "members._id": memberId },
    { $set: { "members.$": data } }
  );
};

// Delete a team member
const deleteMember = async (
  teamId: string,
  organizationId: string,
  memberId: string
) => {
  if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(memberId))
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid ID");

  return Team.findOneAndUpdate(
    { _id: teamId, organizationId },
    {
      $pull: { members: { _id: memberId } },
    }
  );
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
