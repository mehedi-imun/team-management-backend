import Stripe from "stripe";
import envConfig from "../config/env";
import AppError from "../errors/AppError";
import { Organization } from "../modules/organization/organization.model";

// Initialize Stripe
const stripe = new Stripe(envConfig.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-09-30.clover",
});

// Price mapping for each plan and billing cycle
const PRICE_IDS = {
  professional: {
    monthly: envConfig.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
    annual: envConfig.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID,
  },
  business: {
    monthly: envConfig.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
    annual: envConfig.STRIPE_BUSINESS_ANNUAL_PRICE_ID,
  },
  enterprise: {
    monthly: envConfig.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    annual: envConfig.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID,
  },
};

class StripeService {
  /**
   * Create Stripe Checkout Session for plan upgrade
   */
  async createCheckoutSession(data: {
    organizationId: string;
    plan: "professional" | "business" | "enterprise";
    billingCycle: "monthly" | "annual";
    successUrl: string;
    cancelUrl: string;
  }) {
    const { organizationId, plan, billingCycle, successUrl, cancelUrl } = data;

    // Get organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    // Get or create Stripe customer
    let customerId = organization.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: organization.ownerEmail || "",
        name: organization.name,
        metadata: {
          organizationId: organizationId,
        },
      });
      customerId = customer.id;

      // Save customer ID
      organization.stripeCustomerId = customerId;
      await organization.save();
    }

    // Get price ID
    const priceId = PRICE_IDS[plan]?.[billingCycle];
    if (!priceId) {
      throw new AppError(400, "Invalid plan or billing cycle");
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        organizationId: organizationId,
        plan: plan,
        billingCycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          organizationId: organizationId,
          plan: plan,
        },
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Verify Checkout Session and upgrade organization
   */
  async verifyCheckoutSession(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.payment_status !== "paid") {
      throw new AppError(400, "Payment not completed");
    }

    const organizationId = session.metadata?.organizationId;
    if (!organizationId) {
      throw new AppError(400, "Invalid session metadata");
    }

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    // Update organization with subscription details
    const subscription = session.subscription as Stripe.Subscription;
    organization.stripeSubscriptionId = subscription.id;
    organization.stripePriceId = subscription.items.data[0].price.id;
    organization.plan = session.metadata?.plan as any;
    organization.billingCycle = session.metadata?.billingCycle as any;
    organization.subscriptionStatus = "active";
    organization.currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
    organization.trialEndsAt = undefined; // Clear trial

    await organization.save();

    return organization;
  }

  /**
   * Create Stripe Customer Portal Session (for managing subscription)
   */
  async createPortalSession(organizationId: string, returnUrl: string) {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    if (!organization.stripeCustomerId) {
      throw new AppError(400, "No Stripe customer found for this organization");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(organizationId: string) {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    if (!organization.stripeSubscriptionId) {
      throw new AppError(400, "No active subscription found");
    }

    // Cancel at period end (don't immediately cancel)
    await stripe.subscriptions.update(organization.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    organization.subscriptionStatus = "canceled";
    await organization.save();

    return organization;
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(organizationId: string) {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    if (!organization.stripeSubscriptionId) {
      throw new AppError(400, "No subscription found");
    }

    // Remove cancel_at_period_end
    const subscription = await stripe.subscriptions.update(
      organization.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    organization.subscriptionStatus = "active";
    await organization.save();

    return organization;
  }

  /**
   * Handle Stripe Webhooks
   */
  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const organizationId = session.metadata?.organizationId;
    if (!organizationId) return;

    const organization = await Organization.findById(organizationId);
    if (!organization) return;

    // Update organization status
    organization.subscriptionStatus = "active";
    await organization.save();

    console.log(`✅ Checkout completed for org: ${organizationId}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) return;

    const organization = await Organization.findById(organizationId);
    if (!organization) return;

    // Update subscription details
    organization.subscriptionStatus = subscription.status as any;
    organization.currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
    await organization.save();

    console.log(`✅ Subscription updated for org: ${organizationId}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) return;

    const organization = await Organization.findById(organizationId);
    if (!organization) return;

    // Downgrade to free plan
    organization.plan = "free";
    organization.subscriptionStatus = "canceled";
    organization.stripeSubscriptionId = undefined;
    organization.stripePriceId = undefined;
    await organization.save();

    console.log(`✅ Subscription deleted for org: ${organizationId} - downgraded to FREE`);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) return;

    const organization = await Organization.findById(organizationId);
    if (!organization) return;

    organization.subscriptionStatus = "active";
    await organization.save();

    console.log(`✅ Payment succeeded for org: ${organizationId}`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) return;

    const organization = await Organization.findById(organizationId);
    if (!organization) return;

    organization.subscriptionStatus = "past_due";
    await organization.save();

    console.log(`❌ Payment failed for org: ${organizationId}`);
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(organizationId: string) {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    if (!organization.stripeSubscriptionId) {
      return {
        plan: organization.plan,
        status: organization.subscriptionStatus,
        hasSubscription: false,
      };
    }

    const subscription = await stripe.subscriptions.retrieve(
      organization.stripeSubscriptionId
    );

    return {
      plan: organization.plan,
      status: organization.subscriptionStatus,
      hasSubscription: true,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      subscription: subscription,
    };
  }
}

export const stripeService = new StripeService();
export default stripeService;
