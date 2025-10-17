import { Schema, model } from "mongoose";
import { IInvitation } from "./invitation.interface";

const invitationSchema = new Schema<IInvitation>(
  {
    organizationId: {
      type: String,
      required: true,
    },
    teamId: {
      type: String,
      required: false,
    },
    invitedBy: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      default: "Member",
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked", "expired"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for queries
invitationSchema.index({ organizationId: 1, status: 1 });
invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ token: 1, status: 1 });

// Index for expiry cleanup
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Invitation = model<IInvitation>("Invitation", invitationSchema);
