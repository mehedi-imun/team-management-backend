import { z } from "zod";

export const createInvitationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    teamId: z.string().optional(),
    role: z.string().optional().default("Member"),
  }),
});

export const acceptInvitationSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const getInvitationByTokenSchema = z.object({
  query: z.object({
    token: z.string().min(1, "Token is required"),
  }),
});
