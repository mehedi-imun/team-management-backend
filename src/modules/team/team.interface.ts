// src/modules/team/team.interface.ts

export interface IMember {
  _id: string;
  userId?: string; // Reference to User model
  name: string;
  email?: string;
  role: "TeamLead" | "Member"; // Team-specific role
  joinedAt?: Date;
  invitedAt?: Date; // When they were invited
  isActive?: boolean; // Whether member is active
}

export interface ITeam {
  _id?: string;
  organizationId: string; // Which organization owns this team
  name: string;
  description: string;
  managerId?: string; // Manager who oversees this team
  managerApproved: "0" | "1" | "-1";
  directorApproved: "0" | "1" | "-1";
  order?: number;
  members: IMember[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
