import { Router } from "express";
import express from "express";
import { authenticate } from "../../middleware/authenticate";
import { requiresOrganization, isOrganizationOwner } from "../../middleware/permissions";
import { validateRequest } from "../../middleware/validateRequest";
import billingController from "./billing.controller";
import { createCheckoutSchema } from "./billing.validation";

const router = Router();

/**
 * Webhook endpoint (no auth, raw body needed)
 * Must be registered BEFORE express.json() middleware
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  billingController.handleWebhook
);

// Protected routes (require auth + organization)
router.use(authenticate);
router.use(requiresOrganization);

/**
 * @route   POST /api/v1/billing/create-checkout
 * @desc    Create Stripe Checkout Session for plan upgrade
 * @access  Private (Organization Owner)
 */
router.post(
  "/create-checkout",
  isOrganizationOwner,
  validateRequest(createCheckoutSchema),
  billingController.createCheckout
);

/**
 * @route   GET /api/v1/billing/verify-checkout
 * @desc    Verify checkout session and complete upgrade
 * @access  Private (Organization Owner)
 */
router.get(
  "/verify-checkout",
  isOrganizationOwner,
  billingController.verifyCheckout
);

/**
 * @route   POST /api/v1/billing/create-portal
 * @desc    Create Customer Portal session for subscription management
 * @access  Private (Organization Owner)
 */
router.post(
  "/create-portal",
  isOrganizationOwner,
  billingController.createPortal
);

/**
 * @route   POST /api/v1/billing/cancel
 * @desc    Cancel subscription (at period end)
 * @access  Private (Organization Owner)
 */
router.post(
  "/cancel",
  isOrganizationOwner,
  billingController.cancelSubscription
);

/**
 * @route   POST /api/v1/billing/reactivate
 * @desc    Reactivate canceled subscription
 * @access  Private (Organization Owner)
 */
router.post(
  "/reactivate",
  isOrganizationOwner,
  billingController.reactivateSubscription
);

/**
 * @route   GET /api/v1/billing/subscription
 * @desc    Get subscription details
 * @access  Private
 */
router.get("/subscription", billingController.getSubscription);

export const BillingRoutes = router;
