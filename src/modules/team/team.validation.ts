// src/modules/team/team.validation.ts
import { z } from "zod";

// Team member schema
export const memberSchema = z.object({
  name: z.string().min(1, "Member name required"),
  role: z.string().optional(),
});

// Approval and status: "0" | "1" | "-1" (string)
const approvalStatusEnum = z.enum(["0", "1", "-1"]);

// Create team schema
export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name required"),
  description: z.string().min(1, "Description required"),
  status: approvalStatusEnum.optional(),
  managerApproved: approvalStatusEnum.optional(),
  directorApproved: approvalStatusEnum.optional(),
  order: z.number().optional(),
  members: z.array(memberSchema).optional(),
});

// Update team approval status
export const updateStatusSchema = z.object({
  field: z.enum(["managerApproved", "directorApproved"]),
  value: approvalStatusEnum,
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
