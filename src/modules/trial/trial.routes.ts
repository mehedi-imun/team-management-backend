// Trial Routes
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requiresOrganization } from "../../middleware/permissions";
import { TrialController } from "./trial.controller";

const router = Router();

// All trial routes require authentication and organization context
router.use(authenticate);
router.use(requiresOrganization);

// Get trial status
router.get("/status", TrialController.getTrialStatus);

// Check feature access
router.get("/can-access-features", TrialController.checkFeatureAccess);

export const TrialRoutes = router;
