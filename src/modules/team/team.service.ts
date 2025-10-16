/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../utils/queryBuilder";
import { IMember, ITeam } from "./team.interface";
import { Team } from "./team.model";
import { cacheService } from "../../services/cache.service";

// Create a new team
const createTeam = async (data: any) => {
  if (!data.name || !data.description) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Name and description are required"
    );
  }

  const lastTeam = await Team.findOne().sort({ order: -1 });
  const order = lastTeam?.order ? lastTeam.order + 1 : 1;

  const newTeam = await Team.create({
    ...data,
    order,
  });

  // Invalidate teams cache
  await cacheService.invalidatePattern('teams:*');
  console.log('🗑️  Cache invalidated: teams:*');

  return newTeam;
};

// Get all teams with search, filter, sort, pagination
const getAllTeams = async (query: any) => {
  // Generate cache key based on query params
  const cacheKey = `teams:all:${JSON.stringify(query)}`;
  
  // Try to get from cache
  const cached = await cacheService.get<{ data: ITeam[]; meta: any }>(cacheKey);
  if (cached) {
    console.log('✅ Cache hit for teams');
    return cached;
  }

  console.log('❌ Cache miss for teams - fetching from DB');
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

  const result = { data, meta };
  
  // Cache the result for 5 minutes
  await cacheService.set(cacheKey, result, 300);
  
  return result;
};

// Get single team
const getTeamById = async (id: string) => {
  if (!Types.ObjectId.isValid(id))
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid team ID");
  
  // Try cache first
  const cacheKey = `team:${id}`;
  const cached = await cacheService.get<ITeam>(cacheKey);
  if (cached) {
    console.log(`✅ Cache hit for team ${id}`);
    return cached;
  }

  console.log(`❌ Cache miss for team ${id}`);
  const team = await Team.findById(id);
  
  // Cache for 5 minutes
  if (team) {
    await cacheService.set(cacheKey, team, 300);
  }
  
  return team;
};

// Update team

const updateTeam = async (teamId: string, data: any, newMembers?: { name: string }[]) => {

  // console.log("Updating team:", data)
  if (!Types.ObjectId.isValid(teamId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid team ID");
  }

  const updateData: any = { ...data };

  if (newMembers && newMembers.length > 0) {
    updateData.$push = {
      members: { $each: newMembers.map(m => ({ name: m.name })) },
    };
  }

  const result = await Team.findByIdAndUpdate(teamId, updateData, {
    new: true,
    runValidators: true,
  });

  // Invalidate cache
  await cacheService.delete(`team:${teamId}`);
  await cacheService.invalidatePattern('teams:*');
  console.log(`🗑️  Cache invalidated: team:${teamId} and teams:*`);

  return result;
};


// Delete single team
const deleteTeam = async (id: string) => {
  if (!Types.ObjectId.isValid(id))
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid team ID");
  
  const result = await Team.findByIdAndDelete(id);
  
  // Invalidate cache
  await cacheService.delete(`team:${id}`);
  await cacheService.invalidatePattern('teams:*');
  console.log(`🗑️  Cache invalidated after delete: team:${id}`);
  
  return result;
};

// Bulk delete teams
const bulkDeleteTeams = async (ids: string[]) => {
  ids.forEach((id) => {
    if (!Types.ObjectId.isValid(id))
      throw new AppError(httpStatus.BAD_REQUEST, `Invalid ID ${id}`);
  });
  
  const result = await Team.deleteMany({ _id: { $in: ids } });
  
  // Invalidate all cache
  await cacheService.invalidatePattern('team:*');
  await cacheService.invalidatePattern('teams:*');
  console.log('🗑️  Cache invalidated after bulk delete');
  
  return result;
};

// Update tri-state approval
const updateApprovalStatus = async (
  teamId: string,
  field: "managerApproved" | "directorApproved",
  value: "0" | "1" | "-1"
) => {
  if (!Types.ObjectId.isValid(teamId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid team ID");
  }

  return Team.findByIdAndUpdate(teamId, { [field]: value }, { new: true });
};

// Update order for drag & drop
const updateTeamOrder = async (orderList: { id: string; order: number }[]) => {
  const ops = orderList.map((o) =>
    Team.findByIdAndUpdate(o.id, { order: o.order })
  );
  await Promise.all(ops);
  return true;
};

// Update a team member
const updateMember = async (
  teamId: string,
  memberId: string,
  data: IMember
) => {
  if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(memberId))
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid ID");

  return Team.updateOne(
    { _id: teamId, "members._id": memberId },
    { $set: { "members.$": data } }
  );
};

// Delete a team member
const deleteMember = async (teamId: string, memberId: string) => {
  if (!Types.ObjectId.isValid(teamId) || !Types.ObjectId.isValid(memberId))
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid ID");

  return Team.findByIdAndUpdate(teamId, {
    $pull: { members: { _id: memberId } },
  });
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
