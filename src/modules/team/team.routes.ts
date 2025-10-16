import express from "express";
import { authenticate } from "../../middleware/authenticate";
import { tenantContext } from "../../middleware/tenantContext";
import { checkTeamLimit } from "../../middleware/usageLimits";
import { validateRequest } from "../../middleware/validateRequest";
import { TeamController } from "./team.controller";
import {
  createTeamSchema,
  orderSchema,
  updateStatusSchema,
} from "./team.validation";

const router = express.Router();

// Apply authentication and tenant context to all routes
router.use(authenticate);
router.use(tenantContext);

// CRUD
router.post(
  "/",
  checkTeamLimit, // Check if organization can add more teams
  validateRequest(createTeamSchema),
  TeamController.createTeam
);
router.get("/", TeamController.getAllTeams);
router.get("/:teamId", TeamController.getTeamById);
router.patch("/:teamId", TeamController.updateTeam);
router.delete("/:teamId", TeamController.deleteTeam);

// Bulk delete (expecting body { ids: string[] })
router.delete("/", TeamController.bulkDeleteTeams);

// Tri-state approval
router.patch("/:teamId/status", TeamController.updateApprovalStatus);

// Drag & drop order update
router.post("/order", TeamController.updateTeamOrder);

// Team member management
router.patch("/:teamId/members/:memberId", TeamController.updateMember);
router.delete("/:teamId/members/:memberId", TeamController.deleteMember);

// Export as named export
export const TeamRoutes = router;
