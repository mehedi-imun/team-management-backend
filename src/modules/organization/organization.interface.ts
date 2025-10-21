export interface IOrganization {
  _id?: string;
  name: string;
  slug: string; // URL-friendly name (e.g., "acme-tech")
  description?: string;
  logo?: string;

  // Plan & Billing
  plan: "free" | "professional" | "business" | "enterprise";
  billingCycle: "monthly" | "annual";
  subscriptionStatus:
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "incomplete";
  trialEndsAt?: Date;
  currentPeriodEnd?: Date;

  // Stripe Integration
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;

  // Usage Limits (based on plan)
  limits: {
    maxUsers: number;
    maxTeams: number;
    maxStorage: string; // e.g., "10GB"
    features: string[]; // e.g., ["basic", "approvals", "analytics", "api"]
  };

  // Current Usage
  usage: {
    users: number;
    teams: number;
    storage: string; // e.g., "2.5GB"
  };

  // Organization Settings
  settings: {
    primaryColor?: string;
    allowedDomains?: string[]; // For auto-joining by email domain
    ssoEnabled?: boolean;
    requireMFA?: boolean;
    sessionTimeout?: number; // minutes
  };

  // Owner
  ownerId?: string; // User who created the organization (optional if pending setup)
  ownerEmail?: string; // Email of designated owner (for admin-created orgs)
  ownerName?: string; // Name of designated owner (for admin-created orgs)

  // Setup tokens (for admin-created organizations)
  setupToken?: string;
  setupTokenExpires?: Date;
  status: "pending_setup" | "active" | "suspended"; // Organization status

  // Metadata
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // Virtual fields (computed properties)
  isOnTrial?: boolean; // Whether organization is currently on trial
  daysLeftInTrial?: number; // Days remaining in trial period
  usersPercentage?: number; // Percentage of user limit used
  teamsPercentage?: number; // Percentage of team limit used
}

export interface IOrganizationCreate {
  name: string;
  slug: string;
  ownerId: string;
  plan?: "free" | "professional";
}

export interface IOrganizationUpdate {
  name?: string;
  description?: string;
  logo?: string;
  settings?: Partial<IOrganization["settings"]>;
}
