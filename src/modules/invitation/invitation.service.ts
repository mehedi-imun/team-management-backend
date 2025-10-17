import crypto from "crypto";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { emailService } from "../../services/email.service";
import { Team } from "../team/team.model";
import { User } from "../user/user.model";
import { IInvitationAccept, IInvitationCreate } from "./invitation.interface";
import { Invitation } from "./invitation.model";

// Create and send invitation
const createInvitation = async (data: IInvitationCreate) => {
  const { organizationId, teamId, invitedBy, email, role } = data;

  // Check if user already exists in the organization
  const existingUser = await User.findOne({ email, organizationId });
  if (existingUser) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User already exists in this organization"
    );
  }

  // Check for existing pending invitation
  const existingInvite = await Invitation.findOne({
    email,
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

  // Generate unique token
  const token = crypto.randomBytes(32).toString("hex");

  // Set expiry to 7 days from now
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create invitation
  const invitation = await Invitation.create({
    organizationId,
    teamId,
    invitedBy,
    email,
    role: role || "Member",
    token,
    status: "pending",
    expiresAt,
  });

  // Get inviter details for email
  const inviter = await User.findById(invitedBy);
  const inviterName = inviter?.name || "Team Admin";

  // Get team name if inviting to specific team
  let teamName = "";
  if (teamId) {
    const team = await Team.findById(teamId);
    teamName = team?.name || "";
  }

  // Send invitation email
  await emailService.sendInvitationEmail(
    email,
    token,
    inviterName,
    teamName,
    organizationId
  );

  return invitation;
};

// Accept invitation and create user account
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
  if (existingUser) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User already exists with this email"
    );
  }

  // Create user account
  const newUser = await User.create({
    email: invitation.email,
    name,
    password,
    organizationId: invitation.organizationId,
    role: "Member", // Default role
    isOrganizationOwner: false,
    isOrganizationAdmin: false,
    isActive: true,
  });

  // If invitation is for a specific team, add user to team
  if (invitation.teamId) {
    await Team.findByIdAndUpdate(invitation.teamId, {
      $push: {
        members: {
          userId: newUser._id?.toString(),
          email: newUser.email,
          name: newUser.name,
          role: invitation.role || "Member",
          joinedAt: new Date(),
          isActive: true,
        },
      },
    });
  }

  // Mark invitation as accepted
  invitation.status = "accepted";
  invitation.acceptedAt = new Date();
  await invitation.save();

  return {
    user: newUser,
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

  // Get inviter details
  const inviter = await User.findById(invitation.invitedBy);
  const inviterName = inviter?.name || "Team Admin";

  // Get team name if applicable
  let teamName = "";
  if (invitation.teamId) {
    const team = await Team.findById(invitation.teamId);
    teamName = team?.name || "";
  }

  // Resend email
  await emailService.sendInvitationEmail(
    invitation.email,
    invitation.token,
    inviterName,
    teamName,
    organizationId
  );

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
