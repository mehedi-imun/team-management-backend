// src/modules/team/team.interface.ts

export interface IMember {
  _id: string;
  userId?: string; // Reference to User model
  name: string;
  email?: string;
  role: "TeamLead" | "Member"; // Team-specific role
  status?: "pending" | "active" | "inactive"; // Member invitation/activation status
  joinedAt?: Date;
  invitedAt?: Date; // When they were invited
  isActive?: boolean; // Whether member is active (deprecated, use status instead)
}

export interface ITeam {
  _id?: string;
  organizationId: string; // Which organization owns this team
  name: string;
  description: string;
  order?: number;
  members: IMember[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
