export interface Member {
  _id?: string;
  name: string;
  role?: string;
}

export interface ITeam {
  _id?: string;
  name: string;
  description: string;
  managerApproved: 0 | 1 | 2; // 0 = no action, 1 = approved, 2 = not approved
  directorApproved: 0 | 1 | 2;
  order: number; // for drag & drop ordering
  members: Member[];
  createdAt?: Date;
  updatedAt?: Date;
}
