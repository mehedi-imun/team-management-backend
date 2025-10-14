import express from "express";
import { TeamController } from "./team.controller";

const router = express.Router();

// CRUD
router.post("/", TeamController.createTeam);
router.get("/", TeamController.getAllTeams);
router.get("/:teamId", TeamController.getTeamById);
router.put("/:teamId", TeamController.updateTeam);
router.delete("/:teamId", TeamController.deleteTeam);

// Bulk delete
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
