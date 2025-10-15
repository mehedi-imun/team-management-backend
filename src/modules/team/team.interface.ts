// src/modules/team/team.interface.ts

export interface IMember {
  _id: string;
  name: string;
}

export interface ITeam {
  _id?: string;
  name: string;
  description: string;
  managerApproved: "0" | "1" | "-1";
  directorApproved: "0" | "1" | "-1";
  order?: number;
  members: IMember[];
  createdAt?: Date;
  updatedAt?: Date;
}
