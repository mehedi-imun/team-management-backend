// src/modules/team/team.validation.ts
import { z } from "zod";

// Team member schema
export const memberSchema = z.object({
  email: z.string().email("Valid email required").optional(),
  name: z.string().min(1, "Member name required").optional(),
  role: z.enum(["TeamLead", "Member"]).optional(),
});

// Approval and status: "0" | "1" | "-1" (string)
const approvalStatusEnum = z.enum(["0", "1", "-1"]);

// Create team schema
export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Team name required"),
    description: z.string().min(1, "Description required"),
    status: approvalStatusEnum.optional(),
    managerApproved: approvalStatusEnum.optional(),
    directorApproved: approvalStatusEnum.optional(),
    order: z.number().optional(),
    members: z.array(memberSchema).optional(),
  }),
});

// Update team approval status
export const updateStatusSchema = z.object({
  body: z.object({
    field: z.enum(["managerApproved", "directorApproved"]),
    value: approvalStatusEnum,
  }),
});

// Add team member schema
export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    name: z.string().min(1, "Member name required").optional(),
    role: z.enum(["TeamLead", "Member"]).optional(),
  }),
});

// Assign manager schema
export const assignManagerSchema = z.object({
  body: z.object({
    managerId: z.string().min(1, "Manager ID required"),
  }),
});

// Update team order (drag & drop)
export const orderSchema = z.object({
  body: z.object({
    orderList: z.array(
      z.object({
        id: z.string(),
        order: z.number(),
      })
    ),
  }),
});
