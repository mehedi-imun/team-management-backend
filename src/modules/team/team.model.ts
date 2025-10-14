import { Schema, model } from "mongoose";
import { ITeam, Member } from "./team.interface";

// Member sub-schema
const memberSchema = new Schema<Member>(
  {
    name: { type: String, required: true },
    role: { type: String },
  },
  { _id: true }
);

// Team schema
const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    managerApproved: { type: Number, enum: [0, 1, 2], default: 0 },
    directorApproved: { type: Number, enum: [0, 1, 2], default: 0 },
    order: { type: Number, default: 0 },
    members: { type: [memberSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false, 
  }
);

export const Team = model<ITeam>("Team", teamSchema);
