import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import {
  canInviteMembers,
  requiresOrganization,
} from "../../middleware/permissions";
import { validateRequest } from "../../middleware/validateRequest";
import { InvitationController } from "./invitation.controller";
import {
  acceptInvitationSchema,
  createInvitationSchema,
  getInvitationByTokenSchema,
} from "./invitation.validation";

const router = Router();

// Public routes (no auth required)
router.get(
  "/validate",
  validateRequest(getInvitationByTokenSchema),
  InvitationController.getInvitationByToken
);

router.post(
  "/accept",
  validateRequest(acceptInvitationSchema),
  InvitationController.acceptInvitation
);

// Protected routes (require auth + organization)
router.use(authenticate);
router.use(requiresOrganization);

router.post(
  "/",
  canInviteMembers,
  validateRequest(createInvitationSchema),
  InvitationController.createInvitation
);

router.get("/", InvitationController.getInvitations);

router.patch(
  "/:id/revoke",
  canInviteMembers,
  InvitationController.revokeInvitation
);

router.post(
  "/:id/resend",
  canInviteMembers,
  InvitationController.resendInvitation
);

export const InvitationRoutes = router;
