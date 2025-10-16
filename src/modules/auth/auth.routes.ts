import express from "express";
import { authenticate } from "../../middleware/authenticate";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "./auth.validation";

const router = express.Router();

// Public routes
router.post("/login", validateRequest(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/refresh-token", AuthController.refreshToken);
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  AuthController.forgotPassword
);
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  AuthController.resetPassword
);

// Protected routes
router.get("/me", authenticate, AuthController.getMe);

export const AuthRoutes = router;
