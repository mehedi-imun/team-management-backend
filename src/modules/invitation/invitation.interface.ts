export interface IInvitation {
  _id?: string;
  organizationId: string;
  teamId?: string; // optional - if inviting to specific team
  invitedBy: string; // userId of inviter
  email: string;
  role?: string; // role they'll have in team (e.g., 'Member', 'Manager')
  token: string; // unique token for accepting invite
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInvitationCreate {
  organizationId: string;
  teamId?: string;
  invitedBy: string;
  email: string;
  role?: string;
}

export interface IInvitationAccept {
  token: string;
  name: string;
  password: string;
}
