import { NextFunction, Request, Response } from "express";
import { ZodError, ZodObject, ZodRawShape } from "zod";

/**
 * Middleware to validate request body with Zod schema
 * @param zodSchema Zod schema to validate against
 */
export const validateRequest =
  (zodSchema: ZodObject<ZodRawShape>) =>
  async (req: Request, _res: Response, next: NextFunction) => {
  
    try {
      // If body.data exists (sent as JSON string), parse it
      if (req.body?.data) {
        try {
          req.body = JSON.parse(req.body.data);
        } catch {
          return next(
            new ZodError([
              {
                path: ["data"],
                message: "Invalid JSON string",
                code: "custom" as any,
              },
            ])
          );
        }
      }

      // Validate asynchronously
      req.body = await zodSchema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
