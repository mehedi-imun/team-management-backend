import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { InvitationService } from "./invitation.service";

// Create invitation
const createInvitation = catchAsync(async (req, res) => {
  const { email, teamId, role } = req.body;
  const organizationId = req.user!.organizationId!;
  const invitedBy = req.user!._id!.toString();

  const invitation = await InvitationService.createInvitation({
    organizationId,
    teamId,
    invitedBy,
    email,
    role,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Invitation sent successfully",
    data: invitation,
  });
});

// Accept invitation
const acceptInvitation = catchAsync(async (req, res) => {
  const { token, name, password } = req.body;

  const result = await InvitationService.acceptInvitation({
    token,
    name,
    password,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.user,
  });
});

// Get invitations for organization
const getInvitations = catchAsync(async (req, res) => {
  const organizationId = req.user!.organizationId!;
  const { status } = req.query;

  const invitations = await InvitationService.getInvitationsByOrganization(
    organizationId,
    status as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invitations retrieved successfully",
    data: invitations,
  });
});

// Get invitation by token (public endpoint for validation)
const getInvitationByToken = catchAsync(async (req, res) => {
  const { token } = req.query;

  const invitation = await InvitationService.getInvitationByToken(
    token as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invitation found",
    data: invitation,
  });
});

// Revoke invitation
const revokeInvitation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId!;

  const invitation = await InvitationService.revokeInvitation(
    id,
    organizationId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invitation revoked successfully",
    data: invitation,
  });
});

// Resend invitation
const resendInvitation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId!;

  const invitation = await InvitationService.resendInvitation(
    id,
    organizationId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invitation resent successfully",
    data: invitation,
  });
});

export const InvitationController = {
  createInvitation,
  acceptInvitation,
  getInvitations,
  getInvitationByToken,
  revokeInvitation,
  resendInvitation,
};
