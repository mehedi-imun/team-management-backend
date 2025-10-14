// src/modules/team/team.validation.ts
import { z } from "zod";

// Team member schema
export const memberSchema = z.object({
  name: z.string().min(1, "Member name required"),
  role: z.string().optional(),
});

// Create team schema
export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name required"),
  description: z.string().min(1, "Description required"),
  managerApproved: z.number().optional(),
  directorApproved: z.number().optional(),
  order: z.number().optional(),
  members: z.array(memberSchema).optional(),
});

// Update team approval status (tri-state)
export const updateStatusSchema = z.object({
  field: z.enum(["managerApproved", "directorApproved"]),
  value: z.number().int().min(0).max(2),
});

// Update team order (drag & drop)
export const orderSchema = z.object({
  orderList: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
});
