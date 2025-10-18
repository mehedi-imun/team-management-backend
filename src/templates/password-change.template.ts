// Password Change Reminder Email Template

export interface PasswordChangeEmailData {
  userName: string;
  email: string;
  loginUrl: string;
  accountCreatedDate: string;
}

export const getPasswordChangeReminderTemplate = (
  data: PasswordChangeEmailData
): { subject: string; html: string; text: string } => {
  const { userName, email, loginUrl, accountCreatedDate } = data;

  const subject = `🔒 Password Change Required`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .security-box { background: white; border: 3px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .button:hover { background: #d97706; }
    .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Password Change Required</h1>
      <p>For your account security</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${userName}</strong>,</p>
      
      <p>Your account was created on <strong>${accountCreatedDate}</strong> with a temporary password. For security reasons, you need to change your password before accessing all features.</p>

      <div class="security-box">
        <h3 style="margin-top: 0; color: #f59e0b;">🛡️ Security Notice</h3>
        <p style="font-size: 16px;">You're currently using a <strong>temporary password</strong>. Please update it to a secure password of your choice.</p>
      </div>

      <div class="info-box">
        <h3>📋 Password Requirements:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>At least 8 characters long</li>
          <li>Include uppercase and lowercase letters</li>
          <li>Include at least one number</li>
          <li>Include at least one special character (!@#$%^&*)</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">Login & Change Password</a>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <strong>Your login credentials:</strong><br>
        Email: <strong>${email}</strong><br>
        You'll be redirected to change your password immediately after logging in.
      </p>

      <p style="color: #991b1b; background: #fee2e2; padding: 10px; border-radius: 4px; margin-top: 15px;">
        <strong>⚠️ Important:</strong> You won't be able to access all features until you complete the password change.
      </p>
    </div>
    
    <div class="footer">
      <p>© 2025 Team Management System. All rights reserved.</p>
      <p>Need help? Contact support.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
🔒 Password Change Required

Hi ${userName},

Your account was created on ${accountCreatedDate} with a temporary password. For security reasons, you need to change your password.

Your login credentials:
Email: ${email}

Password Requirements:
- At least 8 characters long
- Include uppercase and lowercase letters
- Include at least one number
- Include at least one special character

Login and Change Password: ${loginUrl}

You'll be redirected to change your password immediately after logging in.

⚠️ IMPORTANT: You won't be able to access all features until you complete the password change.

© 2025 Team Management System
  `;

  return { subject, html, text };
};
