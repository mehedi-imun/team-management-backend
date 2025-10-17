import { cacheService } from "../../services/cache.service";
import { Organization } from "../organization/organization.model";
import { Team } from "../team/team.model";
import { User } from "../user/user.model";
import {
  IAnalyticsSummary,
  IApprovalRate,
  ITeamDistribution,
} from "./analytics.interface";

const getAnalyticsSummary = async (): Promise<IAnalyticsSummary> => {
  // Try cache first
  const cached = await cacheService.get<IAnalyticsSummary>("analytics:summary");
  if (cached) {
    console.log("✅ Cache hit for analytics summary");
    return cached;
  }

  console.log("❌ Cache miss for analytics - calculating...");

  // Get total teams
  const totalTeams = await Team.countDocuments();

  // Get total members across all teams
  const teamsWithMembers = await Team.find().select("members");
  const totalMembers = teamsWithMembers.reduce(
    (sum, team) => sum + (team.members?.length || 0),
    0
  );

  // Get approval stats
  const pendingApprovals = await Team.countDocuments({
    $or: [{ managerApproved: "0" }, { directorApproved: "0" }],
  });

  const approvedTeams = await Team.countDocuments({
    managerApproved: "1",
    directorApproved: "1",
  });

  const rejectedTeams = await Team.countDocuments({
    $or: [{ managerApproved: "-1" }, { directorApproved: "-1" }],
  });

  // Get user stats
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });

  const summary = {
    totalTeams,
    totalMembers,
    pendingApprovals,
    approvedTeams,
    rejectedTeams,
    totalUsers,
    activeUsers,
  };

  // Cache for 5 minutes
  await cacheService.set("analytics:summary", summary, 300);

  return summary;
};

const getTeamDistribution = async (): Promise<ITeamDistribution[]> => {
  // Try cache
  const cached = await cacheService.get<ITeamDistribution[]>(
    "analytics:teamDistribution"
  );
  if (cached) {
    console.log("✅ Cache hit for team distribution");
    return cached;
  }

  const teams = await Team.find().select(
    "name members managerApproved directorApproved"
  );

  const distribution = teams.map((team) => {
    let status = "Pending";
    if (team.managerApproved === "1" && team.directorApproved === "1") {
      status = "Approved";
    } else if (
      team.managerApproved === "-1" ||
      team.directorApproved === "-1"
    ) {
      status = "Rejected";
    }

    return {
      name: team.name,
      memberCount: team.members?.length || 0,
      status,
    };
  });

  // Cache for 5 minutes
  await cacheService.set("analytics:teamDistribution", distribution, 300);

  return distribution;
};

const getApprovalRates = async (): Promise<IApprovalRate> => {
  // Try cache
  const cached = await cacheService.get<IApprovalRate>(
    "analytics:approvalRates"
  );
  if (cached) {
    console.log("✅ Cache hit for approval rates");
    return cached;
  }

  const totalTeams = await Team.countDocuments();

  if (totalTeams === 0) {
    return {
      managerApprovalRate: 0,
      directorApprovalRate: 0,
      overallApprovalRate: 0,
    };
  }

  const managerApproved = await Team.countDocuments({ managerApproved: "1" });
  const directorApproved = await Team.countDocuments({ directorApproved: "1" });
  const fullyApproved = await Team.countDocuments({
    managerApproved: "1",
    directorApproved: "1",
  });

  const rates = {
    managerApprovalRate: (managerApproved / totalTeams) * 100,
    directorApprovalRate: (directorApproved / totalTeams) * 100,
    overallApprovalRate: (fullyApproved / totalTeams) * 100,
  };

  // Cache for 5 minutes
  await cacheService.set("analytics:approvalRates", rates, 300);

  return rates;
};

// Platform Analytics for SuperAdmin/Admin
const getPlatformAnalytics = async () => {
  // Try cache
  const cached = await cacheService.get("analytics:platform");
  if (cached) {
    console.log("✅ Cache hit for platform analytics");
    return cached;
  }

  // Organization stats
  const totalOrganizations = await Organization.countDocuments();
  const trialOrganizations = await Organization.countDocuments({
    status: "trial",
  });
  const activeSubscriptions = await Organization.countDocuments({
    status: "active",
  });
  const suspendedOrganizations = await Organization.countDocuments({
    status: "suspended",
  });
  const cancelledOrganizations = await Organization.countDocuments({
    status: "cancelled",
  });

  // Calculate revenue (mock data for now - will be real when Stripe webhooks implemented)
  const monthlyRevenue = 0; // TODO: Calculate from Stripe
  const totalRevenue = 0; // TODO: Calculate from Stripe

  // User stats
  const totalUsers = await User.countDocuments();
  const superAdmins = await User.countDocuments({ role: "SuperAdmin" });
  const admins = await User.countDocuments({ role: "Admin" });
  const members = await User.countDocuments({ role: "Member" });
  const organizationOwners = await User.countDocuments({
    isOrganizationOwner: true,
  });
  const organizationAdmins = await User.countDocuments({
    isOrganizationAdmin: true,
  });
  const activeUsers = await User.countDocuments({ status: "active" });
  const inactiveUsers = await User.countDocuments({ status: "inactive" });

  const analytics = {
    organizations: {
      totalOrganizations,
      activeSubscriptions,
      trialOrganizations,
      suspendedOrganizations,
      cancelledOrganizations,
      monthlyRevenue,
      totalRevenue,
    },
    users: {
      totalUsers,
      superAdmins,
      admins,
      organizationOwners,
      organizationAdmins,
      members,
      activeUsers,
      inactiveUsers,
    },
    revenue: {
      monthly: monthlyRevenue,
      yearly: totalRevenue,
      growth: 0, // TODO: Calculate growth
    },
  };

  // Cache for 5 minutes
  await cacheService.set("analytics:platform", analytics, 300);

  return analytics;
};

const getOrganizationStats = async () => {
  // Try cache
  const cached = await cacheService.get("analytics:organizations");
  if (cached) {
    console.log("✅ Cache hit for organization stats");
    return cached;
  }

  const totalOrganizations = await Organization.countDocuments();
  const trialOrganizations = await Organization.countDocuments({
    status: "trial",
  });
  const activeSubscriptions = await Organization.countDocuments({
    status: "active",
  });
  const suspendedOrganizations = await Organization.countDocuments({
    status: "suspended",
  });
  const cancelledOrganizations = await Organization.countDocuments({
    status: "cancelled",
  });

  const stats = {
    totalOrganizations,
    activeSubscriptions,
    trialOrganizations,
    suspendedOrganizations,
    cancelledOrganizations,
    monthlyRevenue: 0,
    totalRevenue: 0,
  };

  // Cache for 5 minutes
  await cacheService.set("analytics:organizations", stats, 300);

  return stats;
};

const getUserStats = async () => {
  // Try cache
  const cached = await cacheService.get("analytics:users");
  if (cached) {
    console.log("✅ Cache hit for user stats");
    return cached;
  }

  const totalUsers = await User.countDocuments();
  const superAdmins = await User.countDocuments({ role: "SuperAdmin" });
  const admins = await User.countDocuments({ role: "Admin" });
  const members = await User.countDocuments({ role: "Member" });
  const organizationOwners = await User.countDocuments({
    isOrganizationOwner: true,
  });
  const organizationAdmins = await User.countDocuments({
    isOrganizationAdmin: true,
  });
  const activeUsers = await User.countDocuments({ status: "active" });
  const inactiveUsers = await User.countDocuments({ status: "inactive" });

  const stats = {
    totalUsers,
    superAdmins,
    admins,
    organizationOwners,
    organizationAdmins,
    members,
    activeUsers,
    inactiveUsers,
  };

  // Cache for 5 minutes
  await cacheService.set("analytics:users", stats, 300);

  return stats;
};

export const AnalyticsService = {
  getAnalyticsSummary,
  getTeamDistribution,
  getApprovalRates,
  getPlatformAnalytics,
  getOrganizationStats,
  getUserStats,
};
