import { Schema, model } from "mongoose";
import { IMember, ITeam } from "./team.interface";

const memberSchema = new Schema<IMember>(
  {
    userId: { type: String, required: false, index: true },
    email: { type: String, required: true, index: true },
    name: { type: String, required: false },
    role: { type: String, required: false, default: "Member" },
    joinedAt: { type: Date, required: false },
    invitedAt: { type: Date, required: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const teamSchema = new Schema<ITeam>(
  {
    organizationId: {
      type: String,
      required: [true, "Organization ID is required"],
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
    members: { type: [memberSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Add indexes for multi-tenancy queries
teamSchema.index({ organizationId: 1, name: 1 });
teamSchema.index({ organizationId: 1, order: 1 });

export const Team = model<ITeam>("Team", teamSchema);
