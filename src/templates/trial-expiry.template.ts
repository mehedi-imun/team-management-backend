// Trial Expiry Warning and Expired Email Templates

export interface TrialExpiryEmailData {
  ownerName: string;
  organizationName: string;
  daysRemaining?: number; // For warnings
  trialEndDate: string;
  upgradeUrl: string;
  featuresBlocked?: string[]; // For expired
}

// Warning Email (7 days, 3 days, 1 day before expiry)
export const getTrialExpiryWarningTemplate = (
  data: TrialExpiryEmailData
): { subject: string; html: string; text: string } => {
  const { ownerName, organizationName, daysRemaining, trialEndDate, upgradeUrl } =
    data;

  const urgencyLevel =
    daysRemaining === 1
      ? "high"
      : daysRemaining === 3
        ? "medium"
        : "low";
  const urgencyColor =
    urgencyLevel === "high"
      ? "#ef4444"
      : urgencyLevel === "medium"
        ? "#f59e0b"
        : "#3b82f6";
  const urgencyIcon =
    urgencyLevel === "high" ? "🚨" : urgencyLevel === "medium" ? "⚠️" : "📅";

  const subject = `${urgencyIcon} Your trial expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} - ${organizationName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyLevel === "high" ? "#dc2626" : urgencyLevel === "medium" ? "#d97706" : "#2563eb"} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .urgency-box { background: white; border: 3px solid ${urgencyColor}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .countdown { font-size: 48px; font-weight: bold; color: ${urgencyColor}; margin: 10px 0; }
    .button { display: inline-block; background: ${urgencyColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
    .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .features-list { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
    .features-list ul { margin: 10px 0; padding-left: 20px; }
    .features-list li { margin: 8px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${urgencyIcon} Trial Expiring Soon</h1>
      <p>Action required to continue using all features</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${ownerName}</strong>,</p>
      
      <p>Your free trial for <strong>"${organizationName}"</strong> is expiring soon.</p>

      <div class="urgency-box">
        <h2 style="margin-top: 0; color: ${urgencyColor};">⏰ Time Remaining</h2>
        <div class="countdown">${daysRemaining}</div>
        <p style="font-size: 18px; margin: 5px 0;">day${daysRemaining === 1 ? "" : "s"}</p>
        <p style="color: #6b7280; margin-top: 10px;">Trial ends on <strong>${trialEndDate}</strong></p>
      </div>

      ${urgencyLevel === "high" ? `
      <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <strong style="color: #dc2626;">⚠️ URGENT:</strong> Your trial ends <strong>tomorrow</strong>! Upgrade now to avoid service interruption.
      </div>
      ` : ""}

      <div class="info-box">
        <h3>📌 What Happens After Trial Expires?</h3>
        <p>If you don't upgrade before ${trialEndDate}, the following features will be blocked:</p>
        <ul>
          <li>❌ Creating new teams</li>
          <li>❌ Inviting new members</li>
          <li>❌ Editing team information</li>
          <li>❌ Accessing analytics</li>
          <li>✅ View-only access to existing data</li>
        </ul>
      </div>

      <div class="features-list">
        <h3>✨ Upgrade to Continue Enjoying:</h3>
        <ul>
          <li>✅ Unlimited teams and members</li>
          <li>✅ Advanced analytics and reports</li>
          <li>✅ Priority email support</li>
          <li>✅ Custom branding options</li>
          <li>✅ API access and integrations</li>
          <li>✅ Regular feature updates</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${upgradeUrl}" class="button">Upgrade Now & Save Your Work</a>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        Questions about pricing or need help? Contact our sales team - we're here to help!
      </p>
    </div>
    
    <div class="footer">
      <p>© 2025 Team Management System. All rights reserved.</p>
      <p>You're receiving this because you're the owner of ${organizationName}</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
${urgencyIcon} Trial Expiring Soon - ${organizationName}

Hi ${ownerName},

Your free trial is expiring in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}!

Trial ends on: ${trialEndDate}

What happens after trial expires?
- Creating new teams (BLOCKED)
- Inviting new members (BLOCKED)
- Editing team information (BLOCKED)
- Accessing analytics (BLOCKED)
- Viewing existing data (Still available)

Upgrade to continue enjoying:
✅ Unlimited teams and members
✅ Advanced analytics
✅ Priority support
✅ Custom branding
✅ API access

Upgrade Now: ${upgradeUrl}

Questions? Contact our sales team.

© 2025 Team Management System
  `;

  return { subject, html, text };
};

// Expired Email (sent when trial has ended)
export const getTrialExpiredTemplate = (
  data: TrialExpiryEmailData
): { subject: string; html: string; text: string } => {
  const { ownerName, organizationName, trialEndDate, upgradeUrl, featuresBlocked } =
    data;

  const subject = `🔒 Your trial has expired - ${organizationName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .expired-box { background: #fee2e2; border: 3px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .button:hover { background: #dc2626; }
    .blocked-list { background: white; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .blocked-list ul { margin: 10px 0; padding-left: 20px; }
    .blocked-list li { margin: 8px 0; color: #991b1b; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Trial Expired</h1>
      <p>Upgrade now to restore full access</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${ownerName}</strong>,</p>
      
      <p>Your free trial for <strong>"${organizationName}"</strong> has expired as of <strong>${trialEndDate}</strong>.</p>

      <div class="expired-box">
        <h2 style="margin-top: 0; color: #ef4444;">⏰ Trial Ended</h2>
        <p style="font-size: 18px; margin: 15px 0;">Your account is now in <strong>view-only mode</strong></p>
      </div>

      <div class="blocked-list">
        <h3>🚫 Features Currently Blocked:</h3>
        <ul>
          ${
            featuresBlocked && featuresBlocked.length > 0
              ? featuresBlocked.map((f) => `<li>${f}</li>`).join("")
              : `
          <li>Creating new teams</li>
          <li>Inviting new members</li>
          <li>Editing team information</li>
          <li>Accessing analytics and reports</li>
          <li>Managing member roles</li>
          `
          }
        </ul>
      </div>

      <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3>✅ What's Still Available:</h3>
        <p>You can still <strong>view</strong> your existing teams, members, and data in read-only mode. To restore full functionality, please upgrade your account.</p>
      </div>

      <div style="text-align: center;">
        <a href="${upgradeUrl}" class="button">Upgrade Now & Restore Access</a>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <strong>Need more time to decide?</strong> Contact our sales team to discuss options or request an extension.
      </p>
    </div>
    
    <div class="footer">
      <p>© 2025 Team Management System. All rights reserved.</p>
      <p>Questions? Contact support@teammanagement.com</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
🔒 Trial Expired - ${organizationName}

Hi ${ownerName},

Your free trial has expired as of ${trialEndDate}.

Your account is now in VIEW-ONLY mode.

Features Currently Blocked:
${featuresBlocked && featuresBlocked.length > 0 ? featuresBlocked.map((f) => `- ${f}`).join("\n") : `
- Creating new teams
- Inviting new members
- Editing team information
- Accessing analytics
- Managing member roles
`}

What's Still Available:
✅ View existing teams and members (read-only)

Upgrade to restore full access: ${upgradeUrl}

Need more time? Contact our sales team.

© 2025 Team Management System
  `;

  return { subject, html, text };
};
