export interface IAnalyticsSummary {
  totalTeams: number;
  totalMembers: number;
  pendingApprovals: number;
  approvedTeams: number;
  rejectedTeams: number;
  totalUsers: number;
  activeUsers: number;
}

export interface ITeamDistribution {
  name: string;
  memberCount: number;
  status: string;
}

export interface IApprovalRate {
  managerApprovalRate: number;
  directorApprovalRate: number;
  overallApprovalRate: number;
}
