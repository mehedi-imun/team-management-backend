import { model, Model, Schema } from "mongoose";
import { IOrganization } from "./organization.interface";

// Extended interface for instance methods
interface IOrganizationMethods {
  hasFeature(feature: string): boolean;
  canAddUser(): boolean;
  canAddTeam(): boolean;
  incrementUsage(type: "users" | "teams", count?: number): Promise<void>;
  decrementUsage(type: "users" | "teams", count?: number): Promise<void>;
}

// Extended interface for static methods
interface IOrganizationModel
  extends Model<IOrganization, {}, IOrganizationMethods> {
  checkSlugAvailability(slug: string): Promise<boolean>;
  getPlanLimits(plan: string): IOrganization["limits"];
}

const organizationSchema = new Schema<
  IOrganization,
  IOrganizationModel,
  IOrganizationMethods
>(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      maxlength: [100, "Organization name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: [true, "Organization slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase letters, numbers, and hyphens only",
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    logo: {
      type: String,
      trim: true,
    },

    // Plan & Billing
    plan: {
      type: String,
      enum: {
        values: ["free", "professional", "business", "enterprise"],
        message: "{VALUE} is not a valid plan",
      },
      default: "free",
      required: true,
    },
    billingCycle: {
      type: String,
      enum: {
        values: ["monthly", "annual"],
        message: "{VALUE} is not a valid billing cycle",
      },
      default: "monthly",
    },
    subscriptionStatus: {
      type: String,
      enum: {
        values: ["active", "trialing", "past_due", "canceled", "incomplete"],
        message: "{VALUE} is not a valid subscription status",
      },
      default: "trialing",
      required: true,
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
    currentPeriodEnd: {
      type: Date,
    },

    // Stripe Integration
    stripeCustomerId: {
      type: String,
      trim: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      trim: true,
      index: true,
    },
    stripePriceId: {
      type: String,
      trim: true,
    },

    // Usage Limits
    limits: {
      maxUsers: {
        type: Number,
        default: 5, // Free plan default
        required: true,
      },
      maxTeams: {
        type: Number,
        default: 3, // Free plan default
        required: true,
      },
      maxStorage: {
        type: String,
        default: "1GB",
        required: true,
      },
      features: {
        type: [String],
        default: ["basic"], // Free plan features
      },
    },

    // Current Usage
    usage: {
      users: {
        type: Number,
        default: 1, // Owner counts as first user
        min: 0,
      },
      teams: {
        type: Number,
        default: 0,
        min: 0,
      },
      storage: {
        type: String,
        default: "0MB",
      },
    },

    // Settings
    settings: {
      primaryColor: {
        type: String,
        default: "#3b82f6", // blue-500
      },
      allowedDomains: {
        type: [String],
        default: [],
      },
      ssoEnabled: {
        type: Boolean,
        default: false,
      },
      requireMFA: {
        type: Boolean,
        default: false,
      },
      sessionTimeout: {
        type: Number,
        default: 480, // 8 hours in minutes
      },
    },

    // Owner
    ownerId: {
      type: String,
      required: [true, "Organization owner is required"],
      index: true,
    },

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ stripeCustomerId: 1 });
organizationSchema.index({ subscriptionStatus: 1 });
organizationSchema.index({ plan: 1 });
organizationSchema.index({ isActive: 1 });

// Virtual fields
organizationSchema.virtual("isOnTrial").get(function (this: IOrganization) {
  return (
    this.subscriptionStatus === "trialing" &&
    this.trialEndsAt &&
    this.trialEndsAt > new Date()
  );
});

organizationSchema
  .virtual("daysLeftInTrial")
  .get(function (this: IOrganization) {
    if (!this.trialEndsAt || this.subscriptionStatus !== "trialing") return 0;
    const diff = this.trialEndsAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

organizationSchema
  .virtual("usersPercentage")
  .get(function (this: IOrganization) {
    if (this.limits.maxUsers === 0) return 0;
    return Math.round((this.usage.users / this.limits.maxUsers) * 100);
  });

organizationSchema
  .virtual("teamsPercentage")
  .get(function (this: IOrganization) {
    if (this.limits.maxTeams === 0) return 0;
    return Math.round((this.usage.teams / this.limits.maxTeams) * 100);
  });

// Pre-save middleware
organizationSchema.pre("save", function (next) {
  // Set limits based on plan (if plan changed)
  // @ts-ignore - isModified is available on document instance
  if (this.isModified("plan")) {
    switch (this.plan) {
      case "free":
        this.limits.maxUsers = 5;
        this.limits.maxTeams = 3;
        this.limits.maxStorage = "1GB";
        this.limits.features = ["basic", "approvals"];
        break;
      case "professional":
        this.limits.maxUsers = 50;
        this.limits.maxTeams = 20;
        this.limits.maxStorage = "50GB";
        this.limits.features = [
          "basic",
          "approvals",
          "analytics",
          "export",
          "email_support",
        ];
        break;
      case "business":
        this.limits.maxUsers = 200;
        this.limits.maxTeams = 100;
        this.limits.maxStorage = "500GB";
        this.limits.features = [
          "basic",
          "approvals",
          "analytics",
          "export",
          "api",
          "advanced_permissions",
          "priority_support",
          "sso",
        ];
        break;
      case "enterprise":
        this.limits.maxUsers = 999999;
        this.limits.maxTeams = 999999;
        this.limits.maxStorage = "Unlimited";
        this.limits.features = [
          "basic",
          "approvals",
          "analytics",
          "export",
          "api",
          "advanced_permissions",
          "dedicated_support",
          "sso",
          "custom_integrations",
          "audit_logs",
          "mfa",
        ];
        break;
    }
  }

  next();
});

// Static methods
organizationSchema.statics.checkSlugAvailability = async function (
  slug: string
): Promise<boolean> {
  const existing = await this.findOne({ slug });
  return !existing;
};

organizationSchema.statics.getPlanLimits = function (
  plan: string
): IOrganization["limits"] {
  const limitsMap = {
    free: {
      maxUsers: 5,
      maxTeams: 3,
      maxStorage: "1GB",
      features: ["basic", "approvals"],
    },
    professional: {
      maxUsers: 50,
      maxTeams: 20,
      maxStorage: "50GB",
      features: ["basic", "approvals", "analytics", "export", "email_support"],
    },
    business: {
      maxUsers: 200,
      maxTeams: 100,
      maxStorage: "500GB",
      features: [
        "basic",
        "approvals",
        "analytics",
        "export",
        "api",
        "advanced_permissions",
        "priority_support",
        "sso",
      ],
    },
    enterprise: {
      maxUsers: 999999,
      maxTeams: 999999,
      maxStorage: "Unlimited",
      features: [
        "basic",
        "approvals",
        "analytics",
        "export",
        "api",
        "advanced_permissions",
        "dedicated_support",
        "sso",
        "custom_integrations",
        "audit_logs",
        "mfa",
      ],
    },
  };
  return limitsMap[plan as keyof typeof limitsMap] || limitsMap.free;
};

// Instance methods
organizationSchema.methods.hasFeature = function (feature: string): boolean {
  return this.limits.features.includes(feature);
};

organizationSchema.methods.canAddUser = function (): boolean {
  return this.usage.users < this.limits.maxUsers;
};

organizationSchema.methods.canAddTeam = function (): boolean {
  return this.usage.teams < this.limits.maxTeams;
};

organizationSchema.methods.incrementUsage = async function (
  type: "users" | "teams",
  count: number = 1
) {
  this.usage[type] += count;
  await this.save();
};

organizationSchema.methods.decrementUsage = async function (
  type: "users" | "teams",
  count: number = 1
) {
  this.usage[type] = Math.max(0, this.usage[type] - count);
  await this.save();
};

export const Organization = model<IOrganization>(
  "Organization",
  organizationSchema
);
