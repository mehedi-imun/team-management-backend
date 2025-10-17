// src/modules/team/team.interface.ts

export interface IMember {
  _id?: string;
  userId?: string; // optional reference to a User
  email: string; // required so invites can work without a user account
  name?: string; // display name
  role?: string; // e.g. 'Member' | 'Manager'
  joinedAt?: Date;
  invitedAt?: Date;
  isActive?: boolean;
}

export interface ITeam {
  _id?: string;
  organizationId: string; // Multi-tenancy: organization this team belongs to
  name: string;
  description: string;
  managerId?: string; // optional user id of the team manager
  isActive?: boolean; // soft-delete toggle for teams
  managerApproved: "0" | "1" | "-1";
  directorApproved: "0" | "1" | "-1";
  order?: number;
  members: IMember[];
  createdAt?: Date;
  updatedAt?: Date;
}
