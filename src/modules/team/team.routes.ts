import express from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { TeamController } from "./team.controller";
import {
  createTeamSchema,
  orderSchema,
  updateStatusSchema,
} from "./team.validation";

const router = express.Router();

// CRUD
router.post("/", validateRequest(createTeamSchema), TeamController.createTeam);
router.get("/", TeamController.getAllTeams);
router.get("/:teamId", TeamController.getTeamById);
router.put(
  "/:teamId",
  validateRequest(updateStatusSchema),
  TeamController.updateTeam
);
router.delete("/:teamId", TeamController.deleteTeam);

// Bulk delete (expecting body { ids: string[] })
router.delete("/", TeamController.bulkDeleteTeams);

// Tri-state approval
router.patch("/:teamId/status", TeamController.updateApprovalStatus);

// Drag & drop order update
router.post(
  "/order",
  TeamController.updateTeamOrder
);

// Team member management
// If you have a member schema, you can validate req.body here too
router.patch("/:teamId/members/:memberId", TeamController.updateMember);
router.delete("/:teamId/members/:memberId", TeamController.deleteMember);

// Export as named export
export const TeamRoutes = router;
