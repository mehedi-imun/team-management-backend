import { z } from "zod";

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z
      .string({
        message: "Organization name is required",
      })
      .min(1, "Organization name is required")
      .max(100, "Organization name cannot exceed 100 characters"),
    slug: z
      .string({
        message: "Organization slug is required",
      })
      .min(1, "Organization slug is required")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase letters, numbers, and hyphens only"
      )
      .max(50, "Slug cannot exceed 50 characters"),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
    plan: z
      .enum(["free", "professional", "business", "enterprise"])
      .default("free")
      .optional(),
  }),
});

export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Organization name is required")
      .max(100, "Organization name cannot exceed 100 characters")
      .optional(),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
    logo: z.string().url("Invalid logo URL").optional(),
    settings: z
      .object({
        primaryColor: z
          .string()
          .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color hex code")
          .optional(),
        allowedDomains: z.array(z.string()).optional(),
        ssoEnabled: z.boolean().optional(),
        requireMFA: z.boolean().optional(),
        sessionTimeout: z.number().min(1).max(1440).optional(), // 1 min to 24 hours
      })
      .optional(),
  }),
});

export const upgradePlanSchema = z.object({
  body: z.object({
    plan: z
      .enum(["professional", "business", "enterprise"])
      .describe("Plan is required"),
    billingCycle: z.enum(["monthly", "annual"]).default("monthly").optional(),
  }),
});

export const checkSlugSchema = z.object({
  query: z.object({
    slug: z
      .string({
        message: "Slug is required",
      })
      .min(1),
  }),
});
