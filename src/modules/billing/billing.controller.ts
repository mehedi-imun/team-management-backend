import { Request, Response } from "express";
import envConfig from "../../config/env";
import stripeService from "../../services/stripe.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

class BillingController {
  /**
   * Create Stripe Checkout Session
   * POST /api/v1/billing/create-checkout
   */
  createCheckout = catchAsync(async (req: Request, res: Response) => {
    const { plan, billingCycle } = req.body;
    const organizationId = req.user!.organizationId!;

    const successUrl = `${envConfig.FRONTEND_URL}/dashboard/billing/success`;
    const cancelUrl = `${envConfig.FRONTEND_URL}/dashboard/billing`;

    const session = await stripeService.createCheckoutSession({
      organizationId,
      plan,
      billingCycle,
      successUrl,
      cancelUrl,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Checkout session created",
      data: session,
    });
  });

  /**
   * Verify Checkout Session
   * GET /api/v1/billing/verify-checkout
   */
  verifyCheckout = catchAsync(async (req: Request, res: Response) => {
    const { session_id } = req.query;

    const organization = await stripeService.verifyCheckoutSession(
      session_id as string
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Payment verified and plan upgraded successfully",
      data: organization,
    });
  });

  /**
   * Create Customer Portal Session
   * POST /api/v1/billing/create-portal
   */
  createPortal = catchAsync(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId!;
    const returnUrl = `${envConfig.FRONTEND_URL}/dashboard/billing`;

    const session = await stripeService.createPortalSession(
      organizationId,
      returnUrl
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Portal session created",
      data: session,
    });
  });

  /**
   * Cancel Subscription
   * POST /api/v1/billing/cancel
   */
  cancelSubscription = catchAsync(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId!;

    const organization = await stripeService.cancelSubscription(organizationId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Subscription will be canceled at period end",
      data: organization,
    });
  });

  /**
   * Reactivate Subscription
   * POST /api/v1/billing/reactivate
   */
  reactivateSubscription = catchAsync(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId!;

    const organization = await stripeService.reactivateSubscription(
      organizationId
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Subscription reactivated successfully",
      data: organization,
    });
  });

  /**
   * Get Subscription Details
   * GET /api/v1/billing/subscription
   */
  getSubscription = catchAsync(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId!;

    const subscription = await stripeService.getSubscriptionDetails(
      organizationId
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Subscription details retrieved",
      data: subscription,
    });
  });

  /**
   * Stripe Webhook Handler
   * POST /api/v1/billing/webhook
   */
  handleWebhook = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const stripe = require("stripe")(envConfig.STRIPE_SECRET_KEY);

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        envConfig.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error("⚠️  Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    await stripeService.handleWebhook(event);

    res.json({ received: true });
  });
}

export default new BillingController();
