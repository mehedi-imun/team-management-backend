export interface IUser {
  _id?: string;
  organizationId?: string; // Optional for Platform Admins (SuperAdmin/Admin)
  email: string;
  password: string;
  name: string;

  // Simplified Role System: Only 3 platform roles
  role: "SuperAdmin" | "Admin" | "Member";

  // Organization Permissions (for customers)
  isOrganizationOwner: boolean; // True if user owns their organization
  isOrganizationAdmin: boolean; // True if user is org admin (helper to owner)

  // Team Management (for managers)
  managedTeamIds?: string[]; // Array of team IDs this user manages

  // Status
  isActive: boolean;

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
  role: "SuperAdmin" | "Admin" | "Member";
  organizationId?: string; // Optional for Platform Admins
  isOrganizationOwner?: boolean;
  isOrganizationAdmin?: boolean;
}

export interface IUserUpdate {
  name?: string;
  role?: "SuperAdmin" | "Admin" | "Member";
  isActive?: boolean;
  isOrganizationOwner?: boolean;
  isOrganizationAdmin?: boolean;
  managedTeamIds?: string[];
}
