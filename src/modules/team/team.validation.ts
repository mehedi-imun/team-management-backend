const { z } = require("zod");

const memberSchema = z.object({
  name: z.string().min(1, "Member name required"),
  role: z.string().optional(),
});

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name required"),
  description: z.string().min(1, "Description required"),
  managerApproved: z.number().optional(),
  directorApproved: z.number().optional(),
  order: z.number().optional(),
  members: z.array(memberSchema).optional(),
});

const updateStatusSchema = z.object({
  teamId: z.string(),
  field: z.enum(["managerApproved", "directorApproved"]),
  value: z.number().int().min(0).max(2),
});

const orderSchema = z.object({
  order: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
});

module.exports = {
  memberSchema,
  createTeamSchema,
  updateStatusSchema,
  orderSchema,
};
