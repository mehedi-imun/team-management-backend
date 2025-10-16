import express from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validateRequest } from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import {
  changePasswordSchema,
  createUserSchema,
  updateUserSchema,
} from "./user.validation";

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Get all users (Admin only)
router.get("/", authorize("Admin"), UserController.getAllUsers);

// Get single user
router.get("/:userId", UserController.getUserById);

// Create user (Admin only)
router.post(
  "/",
  authorize("Admin"),
  validateRequest(createUserSchema),
  UserController.createUser
);

// Update user (Admin only)
router.patch(
  "/:userId",
  authorize("Admin"),
  validateRequest(updateUserSchema),
  UserController.updateUser
);

// Delete user (Admin only)
router.delete("/:userId", authorize("Admin"), UserController.deleteUser);

// Toggle user status (Admin only)
router.patch(
  "/:userId/toggle-status",
  authorize("Admin"),
  UserController.toggleUserStatus
);

// Change own password (any authenticated user)
router.patch(
  "/me/change-password",
  validateRequest(changePasswordSchema),
  UserController.changePassword
);

export const UserRoutes = router;
