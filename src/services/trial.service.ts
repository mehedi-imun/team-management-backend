// Trial Management Service
// Handles trial expiry checks, warnings, and feature blocking

import { Organization } from "../modules/organization/organization.model";
import { User } from "../modules/user/user.model";
import {
  getTrialExpiredTemplate,
  getTrialExpiryWarningTemplate,
} from "../templates/trial-expiry.template";
import { sendEmail } from "./email.service";

/**
 * Check all organizations for trial expiry and send warnings
 * Called daily by cron job
 */
export const checkTrialExpiry = async (): Promise<void> => {
  console.log("🔍 Checking trial expiry for all organizations...");

  const now = new Date();

  // Find all organizations on trial
  const trialingOrgs = await Organization.find({
    subscriptionStatus: "trialing",
    trialEndsAt: { $exists: true, $ne: null },
    isActive: true,
  }).lean();

  console.log(`📊 Found ${trialingOrgs.length} organizations on trial`);

  for (const org of trialingOrgs) {
    if (!org.trialEndsAt) continue;

    const daysLeft = Math.ceil(
      (org.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(
      `  - ${
        org.name
      }: ${daysLeft} days left (ends: ${org.trialEndsAt.toISOString()})`
    );

    // Trial expired - block features
    if (daysLeft <= 0) {
      await handleTrialExpired(org._id!.toString());
      continue;
    }

    // Send warnings at 7, 3, and 1 days before expiry
    if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
      await sendTrialExpiryWarning(org._id!.toString(), daysLeft);
    }
  }

  console.log("✅ Trial expiry check completed");
};

/**
 * Send trial expiry warning email to organization owner
 */
const sendTrialExpiryWarning = async (
  organizationId: string,
  daysRemaining: number
): Promise<void> => {
  try {
    const org = await Organization.findById(organizationId);
    if (!org) return;

    // Get organization owner
    const owner = await User.findById(org.ownerId);
    if (!owner) {
      console.warn(`⚠️  No owner found for organization: ${org.name}`);
      return;
    }

    const upgradeUrl = `${process.env.FRONTEND_URL}/dashboard/organization/billing?upgrade=true`;
    const trialEndDate = org.trialEndsAt
      ? org.trialEndsAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Unknown";

    const emailTemplate = getTrialExpiryWarningTemplate({
      ownerName: owner.name,
      organizationName: org.name,
      daysRemaining,
      trialEndDate,
      upgradeUrl,
    });

    await sendEmail({
      to: owner.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    console.log(
      `  ✅ Sent ${daysRemaining}-day warning to ${owner.email} (${org.name})`
    );
  } catch (error) {
    console.error(
      `  ❌ Error sending warning for org ${organizationId}:`,
      error
    );
  }
};

/**
 * Handle trial expiration - block features and send notification
 */
const handleTrialExpired = async (organizationId: string): Promise<void> => {
  try {
    const org = await Organization.findById(organizationId);
    if (!org) return;

    // Update subscription status to past_due (features blocked)
    if (org.subscriptionStatus === "trialing") {
      org.subscriptionStatus = "past_due";
      await org.save();

      console.log(`  🔒 Trial expired - features blocked for: ${org.name}`);
    }

    // Get organization owner
    const owner = await User.findById(org.ownerId);
    if (!owner) {
      console.warn(`⚠️  No owner found for organization: ${org.name}`);
      return;
    }

    const upgradeUrl = `${process.env.FRONTEND_URL}/dashboard/organization/billing?upgrade=true`;
    const trialEndDate = org.trialEndsAt
      ? org.trialEndsAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Unknown";

    const emailTemplate = getTrialExpiredTemplate({
      ownerName: owner.name,
      organizationName: org.name,
      trialEndDate,
      upgradeUrl,
      featuresBlocked: [
        "Creating new teams",
        "Inviting new members",
        "Editing team information",
        "Accessing analytics and reports",
        "Managing member roles",
      ],
    });

    await sendEmail({
      to: owner.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    console.log(
      `  ✅ Sent expiry notification to ${owner.email} (${org.name})`
    );

    // TODO: Emit Socket.io event for real-time notification
    // socketService.emitToOrganization(organizationId, 'trial:expired', { ... });
  } catch (error) {
    console.error(
      `  ❌ Error handling expired trial for org ${organizationId}:`,
      error
    );
  }
};

/**
 * Check if organization has active trial or subscription
 * Used for feature blocking
 */
export const canAccessFeatures = async (
  organizationId: string
): Promise<boolean> => {
  const org = await Organization.findById(organizationId);
  if (!org) return false;

  // Active subscription = full access
  if (org.subscriptionStatus === "active") return true;

  // Trial in progress = full access
  if (
    org.subscriptionStatus === "trialing" &&
    org.trialEndsAt &&
    org.trialEndsAt > new Date()
  ) {
    return true;
  }

  // Past due, canceled, incomplete = blocked
  return false;
};

/**
 * Check if organization can create teams
 */
export const canCreateTeam = async (
  organizationId: string
): Promise<boolean> => {
  const hasAccess = await canAccessFeatures(organizationId);
  if (!hasAccess) return false;

  const org = await Organization.findById(organizationId);
  if (!org) return false;

  return org.canAddTeam(); // Check against plan limits
};

/**
 * Check if organization can invite members
 */
export const canInviteMembers = async (
  organizationId: string
): Promise<boolean> => {
  const hasAccess = await canAccessFeatures(organizationId);
  if (!hasAccess) return false;

  const org = await Organization.findById(organizationId);
  if (!org) return false;

  return org.canAddUser(); // Check against plan limits
};

/**
 * Get trial status for organization
 */
export const getTrialStatus = async (organizationId: string) => {
  const org = await Organization.findById(organizationId);
  if (!org) {
    throw new Error("Organization not found");
  }

  const now = new Date();
  const isOnTrial = org.subscriptionStatus === "trialing";
  const daysLeft = org.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (org.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return {
    isOnTrial,
    daysLeft,
    trialEndsAt: org.trialEndsAt,
    hasExpired: isOnTrial && daysLeft === 0,
    canAccessFeatures: await canAccessFeatures(organizationId),
    subscriptionStatus: org.subscriptionStatus,
  };
};

export const TrialService = {
  checkTrialExpiry,
  canAccessFeatures,
  canCreateTeam,
  canInviteMembers,
  getTrialStatus,
};
