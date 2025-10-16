import { Team } from '../team/team.model';
import { User } from '../user/user.model';
import { cacheService } from '../../services/cache.service';
import {
  IAnalyticsSummary,
  ITeamDistribution,
  IApprovalRate,
} from './analytics.interface';

const getAnalyticsSummary = async (): Promise<IAnalyticsSummary> => {
  // Try cache first
  const cached = await cacheService.get<IAnalyticsSummary>('analytics:summary');
  if (cached) {
    console.log('✅ Cache hit for analytics summary');
    return cached;
  }

  console.log('❌ Cache miss for analytics - calculating...');

  // Get total teams
  const totalTeams = await Team.countDocuments();

  // Get total members across all teams
  const teamsWithMembers = await Team.find().select('members');
  const totalMembers = teamsWithMembers.reduce(
    (sum, team) => sum + (team.members?.length || 0),
    0
  );

  // Get approval stats
  const pendingApprovals = await Team.countDocuments({
    $or: [{ managerApproved: '0' }, { directorApproved: '0' }],
  });

  const approvedTeams = await Team.countDocuments({
    managerApproved: '1',
    directorApproved: '1',
  });

  const rejectedTeams = await Team.countDocuments({
    $or: [{ managerApproved: '-1' }, { directorApproved: '-1' }],
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
  await cacheService.set('analytics:summary', summary, 300);

  return summary;
};

const getTeamDistribution = async (): Promise<ITeamDistribution[]> => {
  // Try cache
  const cached = await cacheService.get<ITeamDistribution[]>(
    'analytics:teamDistribution'
  );
  if (cached) {
    console.log('✅ Cache hit for team distribution');
    return cached;
  }

  const teams = await Team.find().select('name members managerApproved directorApproved');

  const distribution = teams.map((team) => {
    let status = 'Pending';
    if (team.managerApproved === '1' && team.directorApproved === '1') {
      status = 'Approved';
    } else if (team.managerApproved === '-1' || team.directorApproved === '-1') {
      status = 'Rejected';
    }

    return {
      name: team.name,
      memberCount: team.members?.length || 0,
      status,
    };
  });

  // Cache for 5 minutes
  await cacheService.set('analytics:teamDistribution', distribution, 300);

  return distribution;
};

const getApprovalRates = async (): Promise<IApprovalRate> => {
  // Try cache
  const cached = await cacheService.get<IApprovalRate>('analytics:approvalRates');
  if (cached) {
    console.log('✅ Cache hit for approval rates');
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

  const managerApproved = await Team.countDocuments({ managerApproved: '1' });
  const directorApproved = await Team.countDocuments({ directorApproved: '1' });
  const fullyApproved = await Team.countDocuments({
    managerApproved: '1',
    directorApproved: '1',
  });

  const rates = {
    managerApprovalRate: (managerApproved / totalTeams) * 100,
    directorApprovalRate: (directorApproved / totalTeams) * 100,
    overallApprovalRate: (fullyApproved / totalTeams) * 100,
  };

  // Cache for 5 minutes
  await cacheService.set('analytics:approvalRates', rates, 300);

  return rates;
};

export const AnalyticsService = {
  getAnalyticsSummary,
  getTeamDistribution,
  getApprovalRates,
};
