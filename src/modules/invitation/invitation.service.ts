import bcrypt from "bcryptjs";
import crypto from "crypto";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { sendEmail } from "../../services/email.service";
import { getInvitationEmailTemplate } from "../../templates/invitation.template";
import { Organization } from "../organization/organization.model";
import { Team } from "../team/team.model";
import { User } from "../user/user.model";
import { IInvitationAccept, IInvitationCreate } from "./invitation.interface";
import { Invitation } from "./invitation.model";

/**
 * Generate secure temporary password
 */
const generateTempPassword = (): string => {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one of each required type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
  password += "0123456789"[Math.floor(Math.random() * 10)]; // number
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special char

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

// Create and send invitation
const createInvitation = async (data: IInvitationCreate) => {
  const { organizationId, teamId, invitedBy, email, role } = data;

  // Check if organization exists
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new AppError(httpStatus.NOT_FOUND, "Organization not found");
  }

  // Check if user already exists in the organization
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    organizationIds: organizationId,
  });
  if (existingUser) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User already exists in this organization"
    );
  }

  // Check for existing pending invitation
  const existingInvite = await Invitation.findOne({
    email: email.toLowerCase(),
    organizationId,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });

  if (existingInvite) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "An active invitation already exists for this email"
    );
  }

  // Get inviter details
  const inviter = await User.findById(invitedBy);
  if (!inviter) {
    throw new AppError(httpStatus.NOT_FOUND, "Inviter not found");
  }

  // Get team details if inviting to specific team
  let team = null;
  if (teamId) {
    team = await Team.findById(teamId);
    if (!team || team.organizationId !== organizationId) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Team not found in this organization"
      );
    }
  }

  // Generate unique token and temp password
  const token = crypto.randomBytes(32).toString("hex");
  const temporaryPassword = generateTempPassword();

  // Set expiry to 7 days from now
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create invitation
  const invitation = await Invitation.create({
    organizationId,
    teamId,
    invitedBy,
    email: email.toLowerCase(),
    role: role || "OrgMember",
    token,
    status: "pending",
    expiresAt,
  });

  // Check if user account exists globally
  const globalUser = await User.findOne({ email: email.toLowerCase() });

  // If user doesn't exist, create placeholder inactive account
  if (!globalUser) {
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
    await User.create({
      name: email.split("@")[0], // Temporary name
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "OrgMember",
      organizationIds: [], // Will be added on acceptance
      isActive: false, // Inactive until invitation accepted
      mustChangePassword: true,
      invitedBy,
      invitedAt: new Date(),
    });
  }

  // Send invitation email using new template
  const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation/${token}`;

  const emailTemplate = getInvitationEmailTemplate({
    memberName: globalUser?.name || email.split("@")[0],
    inviterName: inviter.name,
    teamName: team?.name || organization.name,
    organizationName: organization.name,
    email: email.toLowerCase(),
    temporaryPassword: globalUser
      ? "Use your existing password"
      : temporaryPassword,
    invitationLink,
    expiresInDays: 7,
  });

  await sendEmail({
    to: email.toLowerCase(),
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
  });

  return invitation;
};

// Accept invitation and create/update user account
const acceptInvitation = async (acceptData: IInvitationAccept) => {
  const { token, name, password } = acceptData;

  // Find valid invitation
  const invitation = await Invitation.findOne({
    token,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });

  if (!invitation) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired invitation");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: invitation.email });

  if (!existingUser) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User account not found. Please contact administrator."
    );
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Update user account
  existingUser.name = name;
  existingUser.password = hashedPassword;
  existingUser.isActive = true;
  existingUser.mustChangePassword = false; // Password already changed during acceptance
  existingUser.firstLogin = new Date();

  // Add organization to user's organizationIds if not already present
  if (!existingUser.organizationIds?.includes(invitation.organizationId)) {
    existingUser.organizationIds = [
      ...(existingUser.organizationIds || []),
      invitation.organizationId,
    ];
  }

  await existingUser.save();

  // If invitation is for a specific team, add user to team
  if (invitation.teamId) {
    const team = await Team.findById(invitation.teamId);
    if (team) {
      const existingMember = team.members.find(
        (m) => m.userId === existingUser._id?.toString()
      );

      if (!existingMember) {
        team.members.push({
          userId: existingUser._id!.toString(),
          name: existingUser.name,
          email: existingUser.email,
          role: "Member", // Team role is always "Member" or "TeamLead", not org role
          joinedAt: new Date(),
          isActive: true,
        } as any); // Type assertion to avoid role mismatch
        await team.save();
      }
    }
  }

  // Mark invitation as accepted
  invitation.status = "accepted";
  invitation.acceptedAt = new Date();
  await invitation.save();

  return {
    user: {
      _id: existingUser._id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      organizationIds: existingUser.organizationIds,
    },
    message: "Invitation accepted successfully",
  };
};

// Revoke invitation
const revokeInvitation = async (
  invitationId: string,
  organizationId: string
) => {
  const invitation = await Invitation.findOne({
    _id: invitationId,
    organizationId,
    status: "pending",
  });

  if (!invitation) {
    throw new AppError(httpStatus.NOT_FOUND, "Invitation not found");
  }

  invitation.status = "revoked";
  await invitation.save();

  return invitation;
};

// Get all invitations for an organization
const getInvitationsByOrganization = async (
  organizationId: string,
  status?: string
) => {
  const query: any = { organizationId };
  if (status) {
    query.status = status;
  }

  return Invitation.find(query).sort({ createdAt: -1 });
};

// Get invitation by token (for validation before accepting)
const getInvitationByToken = async (token: string) => {
  const invitation = await Invitation.findOne({
    token,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });

  if (!invitation) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired invitation");
  }

  return invitation;
};

// Resend invitation email
const resendInvitation = async (
  invitationId: string,
  organizationId: string
) => {
  const invitation = await Invitation.findOne({
    _id: invitationId,
    organizationId,
    status: "pending",
  });

  if (!invitation) {
    throw new AppError(httpStatus.NOT_FOUND, "Invitation not found");
  }

  // Check if expired
  if (invitation.expiresAt < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invitation has expired");
  }

  // Get organization, inviter, and team details
  const [organization, inviter, team] = await Promise.all([
    Organization.findById(organizationId),
    User.findById(invitation.invitedBy),
    invitation.teamId ? Team.findById(invitation.teamId) : null,
  ]);

  if (!organization || !inviter) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Organization or inviter not found"
    );
  }

  // Get invited user
  const invitedUser = await User.findOne({ email: invitation.email });

  // Resend invitation email using template
  const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation/${invitation.token}`;

  const emailTemplate = getInvitationEmailTemplate({
    memberName: invitedUser?.name || invitation.email.split("@")[0],
    inviterName: inviter.name,
    teamName: team?.name || organization.name,
    organizationName: organization.name,
    email: invitation.email,
    temporaryPassword: invitedUser?.isActive
      ? "Use your existing password"
      : "Check your previous invitation email for your temporary password",
    invitationLink,
    expiresInDays: Math.ceil(
      (invitation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ),
  });

  await sendEmail({
    to: invitation.email,
    subject: `[Reminder] ${emailTemplate.subject}`,
    html: emailTemplate.html,
    text: emailTemplate.text,
  });

  return invitation;
};

export const InvitationService = {
  createInvitation,
  acceptInvitation,
  revokeInvitation,
  getInvitationsByOrganization,
  getInvitationByToken,
  resendInvitation,
};
