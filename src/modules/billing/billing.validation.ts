import { z } from "zod";

export const createCheckoutSchema = z.object({
  body: z.object({
    plan: z.enum(["professional", "business", "enterprise"]),
    billingCycle: z.enum(["monthly", "annual"]),
  }),
});
