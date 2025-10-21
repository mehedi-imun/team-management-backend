// Team Member Invitation Email Template

export interface InvitationEmailData {
  memberName: string;
  inviterName: string;
  teamName: string;
  organizationName: string;
  email: string;
  temporaryPassword: string;
  invitationLink: string;
  expiresInDays: number;
}

export const getInvitationEmailTemplate = (
  data: InvitationEmailData
): { subject: string; html: string; text: string } => {
  const {
    memberName,
    inviterName,
    teamName,
    organizationName,
    email,
    temporaryPassword,
    invitationLink,
    expiresInDays,
  } = data;

  const subject = `You've been invited to join ${teamName} at ${organizationName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .credentials-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .credentials-box h3 { margin-top: 0; color: #667eea; }
    .credential-item { margin: 10px 0; }
    .credential-label { font-weight: bold; color: #6b7280; }
    .credential-value { font-family: 'Courier New', monospace; background: #f3f4f6; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .button:hover { background: #5568d3; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .team-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Team Invitation</h1>
      <p>You've been invited to collaborate!</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${memberName}</strong>,</p>
      
      <p><strong>${inviterName}</strong> has invited you to join the team <strong>"${teamName}"</strong> at <strong>${organizationName}</strong>.</p>
      
      <div class="team-info">
        <h3>📋 Team Details</h3>
        <p><strong>Team:</strong> ${teamName}</p>
        <p><strong>Organization:</strong> ${organizationName}</p>
        <p><strong>Invited by:</strong> ${inviterName}</p>
      </div>

      <div class="credentials-box">
        <h3>🔑 Your Login Credentials</h3>
        <p>Use these credentials to access your account:</p>
        
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
        <strong>⚠️ Security Notice:</strong> You'll be required to change your password on first login for security purposes.
      </div>

      <div style="text-align: center;">
        <a href="${invitationLink}" class="button">Accept Invitation & Login</a>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
        <strong>📅 Important:</strong> This invitation expires in <strong>${expiresInDays} days</strong>. Please accept it before then to join the team.
      </p>

      <p style="color: #6b7280; font-size: 14px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
    
    <div class="footer">
      <p>© 2025 Team Management System. All rights reserved.</p>
      <p>Need help? Contact your organization administrator.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Team Invitation

Hi ${memberName},

${inviterName} has invited you to join the team "${teamName}" at ${organizationName}.

Your Login Credentials:
Email: ${email}
Temporary Password: ${temporaryPassword}

Accept Invitation: ${invitationLink}

IMPORTANT: 
- You'll need to change your password on first login
- This invitation expires in ${expiresInDays} days

If you didn't expect this invitation, you can safely ignore this email.

© 2025 Team Management System
  `;

  return { subject, html, text };
};
