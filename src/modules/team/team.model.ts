import { Schema, model } from "mongoose";
import { IMember, ITeam } from "./team.interface";

const memberSchema = new Schema<IMember>(
  {
    name: { type: String, required: true },
  },
  { _id: true }
);

const statusEnum = ["0", "1", "-1"] as const;

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: statusEnum, default: "0" },
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

export const Team = model<ITeam>("Team", teamSchema);
