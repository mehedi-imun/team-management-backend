import { Schema, model } from "mongoose";
import { IMember, ITeam } from "./team.interface";

const memberSchema = new Schema<IMember>(
  {
    name: { type: String, required: true },
  },
);

const statusEnum = ["0", "1", "-1"] as const;

const teamSchema = new Schema<ITeam>(
  {
    organizationId: {
      type: String,
      required: [true, "Organization ID is required"],
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    managerApproved: { type: String, enum: statusEnum, default: "0" },
    directorApproved: { type: String, enum: statusEnum, default: "0" },
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
teamSchema.index({ organizationId: 1, managerApproved: 1 });
teamSchema.index({ organizationId: 1, directorApproved: 1 });

export const Team = model<ITeam>("Team", teamSchema);
