// Organization Owner Account Created Email Template

export interface OrgOwnerCreatedEmailData {
  ownerName: string;
  organizationName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  trialDays: number;
  createdBy: string;
}

export const getOrgOwnerCreatedEmailTemplate = (
  data: OrgOwnerCreatedEmailData
): { subject: string; html: string; text: string } => {
  const {
    ownerName,
    organizationName,
    email,
    temporaryPassword,
    loginUrl,
    trialDays,
    createdBy,
  } = data;

  const subject = `Your ${organizationName} account has been created`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .credentials-box { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .credentials-box h3 { margin-top: 0; color: #10b981; }
    .credential-item { margin: 10px 0; }
    .credential-label { font-weight: bold; color: #6b7280; }
    .credential-value { font-family: 'Courier New', monospace; background: #f3f4f6; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .button:hover { background: #059669; }
    .trial-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .features-list { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
    .features-list ul { margin: 10px 0; padding-left: 20px; }
    .features-list li { margin: 8px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏢 Welcome to Your Organization</h1>
      <p>Your account has been created successfully!</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${ownerName}</strong>,</p>
      
      <p>Your account for <strong>"${organizationName}"</strong> has been created by <strong>${createdBy}</strong>. You now have full ownership access to manage your organization.</p>

      <div class="credentials-box">
        <h3>🔑 Your Login Credentials</h3>
        <p>Use these credentials to access your organization:</p>
        
        <div class="credential-item">
          <div class="credential-label">Email:</div>
          <div class="credential-value">${email}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Temporary Password:</div>
          <div class="credential-value">${temporaryPassword}</div>
        </div>
      </div>

      <div class="warning">
        <strong>🔒 Security Requirement:</strong> You <strong>must change your password</strong> on first login. You'll be redirected to a password change page automatically.
      </div>

      <div class="trial-box">
        <h3>🎁 ${trialDays}-Day Free Trial Started</h3>
        <p>Your organization comes with a <strong>${trialDays}-day free trial</strong> with full access to all features. You can upgrade to a paid plan anytime.</p>
      </div>

      <div class="features-list">
        <h3>✨ What You Can Do Now:</h3>
        <ul>
          <li>✅ Create and manage teams</li>
          <li>✅ Invite team members via email</li>
          <li>✅ Assign roles (Org Admin, Org Member)</li>
          <li>✅ Manage organization settings</li>
          <li>✅ Access analytics and reports</li>
          <li>✅ Manage billing and subscriptions</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">Login to Your Account</a>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <strong>📧 Next Steps:</strong>
        <ol style="margin-top: 10px;">
          <li>Login using the credentials above</li>
          <li>Change your password immediately</li>
          <li>Complete your organization profile</li>
          <li>Start inviting your team members</li>
        </ol>
      </p>
    </div>
    
    <div class="footer">
      <p>© 2025 Team Management System. All rights reserved.</p>
      <p>Need help? Contact our support team.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Your Organization Account Has Been Created

Hi ${ownerName},

Your account for "${organizationName}" has been created by ${createdBy}. You now have full ownership access.

Your Login Credentials:
Email: ${email}
Temporary Password: ${temporaryPassword}

Login URL: ${loginUrl}

IMPORTANT SECURITY NOTICE:
You MUST change your password on first login for security.

${trialDays}-DAY FREE TRIAL:
Your organization comes with a ${trialDays}-day free trial with full access to all features.

What You Can Do:
- Create and manage teams
- Invite team members via email
- Assign roles
- Manage organization settings
- Access analytics
- Manage billing

Next Steps:
1. Login using the credentials above
2. Change your password immediately
3. Complete your organization profile
4. Start inviting your team members

© 2025 Team Management System
  `;

  return { subject, html, text };
};
