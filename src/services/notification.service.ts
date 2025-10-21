import { Organization } from "../modules/organization/organization.model";
import { User } from "../modules/user/user.model";
import { sendEmail } from "./email.service";

/**
 * Check for organizations nearing trial expiry and send notifications
 * Run this as a cron job (e.g., daily)
 */
export const checkTrialExpiryAndNotify = async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find organizations in trial that expire within 3 days
    const expiringOrgs = await Organization.find({
      subscriptionStatus: "trialing",
      trialEndsAt: { $lte: threeDaysFromNow, $gt: now },
      isActive: true,
    });

    console.log(
      `Found ${expiringOrgs.length} organizations with expiring trials`
    );

    for (const org of expiringOrgs) {
      const daysLeft = org.daysLeftInTrial;

      // Get organization owner
      const owner = await User.findById(org.ownerId);
      if (!owner) continue;

      // Calculate days left manually
      const trialDaysLeft = org.trialEndsAt
        ? Math.max(
            0,
            Math.ceil(
              (org.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          )
        : 0;

      // Send reminder email
      await sendEmail({
        to: owner.email,
        subject: `Your ${org.name} trial expires in ${trialDaysLeft} day${
          trialDaysLeft > 1 ? "s" : ""
        }`,
        html: generateTrialExpiryEmail(org.name, trialDaysLeft, org.plan),
      });

      console.log(
        `Sent trial expiry notification to ${owner.email} for ${org.name}`
      );
    }

    return { success: true, notificationsSent: expiringOrgs.length };
  } catch (error) {
    console.error("Error checking trial expiry:", error);
    throw error;
  }
};

/**
 * Check for expired trials and suspend organizations
 * Run this as a cron job (e.g., daily)
 */
export const checkExpiredTrialsAndSuspend = async () => {
  try {
    const now = new Date();

    // Find organizations with expired trials
    const expiredOrgs = await Organization.find({
      subscriptionStatus: "trialing",
      trialEndsAt: { $lte: now },
      status: "active",
      isActive: true,
    });

    console.log(
      `Found ${expiredOrgs.length} organizations with expired trials`
    );

    for (const org of expiredOrgs) {
      // Update subscription status
      org.subscriptionStatus = "past_due";
      org.status = "suspended";
      await org.save();

      // Get organization owner
      const owner = await User.findById(org.ownerId);
      if (!owner) continue;

      // Send suspension notification
      await sendEmail({
        to: owner.email,
        subject: `Your ${org.name} trial has expired`,
        html: generateTrialExpiredEmail(org.name, org.plan),
      });

      console.log(`Suspended ${org.name} and notified ${owner.email}`);
    }

    return { success: true, organizationsSuspended: expiredOrgs.length };
  } catch (error) {
    console.error("Error checking expired trials:", error);
    throw error;
  }
};

/**
 * Send notification when user is added to a team
 */
export const sendTeamMemberAddedNotification = async (
  userEmail: string,
  userName: string,
  teamName: string,
  organizationName: string,
  addedByName: string
) => {
  try {
    await sendEmail({
      to: userEmail,
      subject: `You've been added to ${teamName}`,
      html: generateTeamMemberAddedEmail(
        userName,
        teamName,
        organizationName,
        addedByName
      ),
    });
  } catch (error) {
    console.error("Error sending team member notification:", error);
  }
};

/**
 * Send notification when team manager is assigned
 */
export const sendTeamManagerAssignedNotification = async (
  managerEmail: string,
  managerName: string,
  teamName: string,
  organizationName: string
) => {
  try {
    await sendEmail({
      to: managerEmail,
      subject: `You've been assigned as manager of ${teamName}`,
      html: generateTeamManagerAssignedEmail(
        managerName,
        teamName,
        organizationName
      ),
    });
  } catch (error) {
    console.error("Error sending manager notification:", error);
  }
};

// Email templates
function generateTrialExpiryEmail(
  orgName: string,
  daysLeft: number,
  currentPlan: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Trial Ending Soon</h1>
        </div>
        <div class="content">
          <h2>Hi there!</h2>
          <p>Your free trial for <strong>${orgName}</strong> is ending soon!</p>
          
          <div class="warning">
            <strong>⚠️ ${daysLeft} day${
    daysLeft > 1 ? "s" : ""
  } remaining</strong>
            <p style="margin: 10px 0 0 0;">After your trial expires, your organization will be suspended until you upgrade to a paid plan.</p>
          </div>

          <h3>What happens when trial expires?</h3>
          <ul>
            <li>❌ Team members won't be able to access the platform</li>
            <li>❌ All teams and data will be frozen</li>
            <li>✅ Your data will be safely stored for 30 days</li>
          </ul>

          <h3>Upgrade now to continue:</h3>
          <p>Choose from our flexible plans starting at just $10/month</p>
          
          <a href="${
            process.env.FRONTEND_URL
          }/dashboard/billing" class="button">
            🚀 Upgrade Now
          </a>

          <p>Need help choosing a plan? <a href="mailto:support@teammanagement.com">Contact our team</a></p>
        </div>
        <div class="footer">
          <p>Team Management System | © ${new Date().getFullYear()}</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTrialExpiredEmail(
  orgName: string,
  currentPlan: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .error { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚫 Trial Expired</h1>
        </div>
        <div class="content">
          <h2>Hi there!</h2>
          <p>Your free trial for <strong>${orgName}</strong> has expired.</p>
          
          <div class="error">
            <strong>❌ Organization Suspended</strong>
            <p style="margin: 10px 0 0 0;">Your organization has been temporarily suspended. Team members cannot access the platform.</p>
          </div>

          <h3>Reactivate your organization:</h3>
          <p>Upgrade to a paid plan to restore full access immediately!</p>
          
          <a href="${
            process.env.FRONTEND_URL
          }/dashboard/billing" class="button">
            🔓 Upgrade & Reactivate
          </a>

          <h3>Your data is safe</h3>
          <ul>
            <li>✅ All teams and members are securely stored</li>
            <li>✅ Data retained for 30 days</li>
            <li>✅ Instant reactivation upon upgrade</li>
          </ul>

          <p><strong>Questions?</strong> Contact us at <a href="mailto:support@teammanagement.com">support@teammanagement.com</a></p>
        </div>
        <div class="footer">
          <p>Team Management System | © ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTeamMemberAddedEmail(
  userName: string,
  teamName: string,
  organizationName: string,
  addedByName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to the Team!</h1>
        </div>
        <div class="content">
          <h2>Hi ${userName}!</h2>
          <p>You've been added to <strong>${teamName}</strong> in <strong>${organizationName}</strong> by ${addedByName}.</p>
          
          <h3>What's next?</h3>
          <ul>
            <li>✅ Access your team dashboard</li>
            <li>✅ View team members and projects</li>
            <li>✅ Collaborate with your teammates</li>
          </ul>
          
          <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
            🚀 Go to Dashboard
          </a>

          <p>If you have any questions, feel free to reach out to your team manager or contact support.</p>
        </div>
        <div class="footer">
          <p>Team Management System | © ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTeamManagerAssignedEmail(
  managerName: string,
  teamName: string,
  organizationName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👔 New Management Role</h1>
        </div>
        <div class="content">
          <h2>Hi ${managerName}!</h2>
          <p>You've been assigned as the manager of <strong>${teamName}</strong> in <strong>${organizationName}</strong>.</p>
          
          <h3>Your responsibilities:</h3>
          <ul>
            <li>📋 Manage team members</li>
            <li>✅ Approve team requests</li>
            <li>📊 Monitor team performance</li>
            <li>🤝 Coordinate team activities</li>
          </ul>
          
          <a href="${process.env.FRONTEND_URL}/dashboard/teams" class="button">
            📂 Manage Team
          </a>

          <p>Need help with your new role? Check out our <a href="${
            process.env.FRONTEND_URL
          }/docs/manager-guide">Manager's Guide</a>.</p>
        </div>
        <div class="footer">
          <p>Team Management System | © ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
