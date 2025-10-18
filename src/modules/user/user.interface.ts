export interface IUser {
  _id?: string;
  organizationId?: string; // Optional for Platform Admins (SuperAdmin/Admin)
  email: string;
  password: string;
  name: string;

  // NEW: Simplified Single Role Field
  // 5 clear roles that cover all use cases
  role: "SuperAdmin" | "Admin" | "OrgOwner" | "OrgAdmin" | "OrgMember";

  // Team Management (for managers)
  managedTeamIds?: string[]; // Array of team IDs this user manages

  // Status
  isActive: boolean;
  status?: "active" | "suspended" | "inactive"; // Virtual field based on isActive

  // Password Reset
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date; // Track last login time
}

export type IUserWithoutPassword = Omit<IUser, "password">;

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IUserCreate {
  email: string;
  password: string;
  name: string;
  role: "SuperAdmin" | "Admin" | "OrgOwner" | "OrgAdmin" | "OrgMember";
  organizationId?: string; // Optional for Platform Admins
}

export interface IUserUpdate {
  name?: string;
  role?: "SuperAdmin" | "Admin" | "OrgOwner" | "OrgAdmin" | "OrgMember";
  isActive?: boolean;
  managedTeamIds?: string[];
}
