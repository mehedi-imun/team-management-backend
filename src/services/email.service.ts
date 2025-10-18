import nodemailer from "nodemailer";
import envConfig from "../config/env";

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private async getTransporter() {
    if (!this.transporter) {
      // Use secure: true for port 465, false for port 587
      const isSecurePort = envConfig.SMTP_PORT === 465;

      // Debug: Log email configuration (without exposing password)
      console.log("📧 Email Configuration:");
      console.log(`  Host: ${envConfig.SMTP_HOST}`);
      console.log(`  Port: ${envConfig.SMTP_PORT}`);
      console.log(`  Secure: ${isSecurePort}`);
      console.log(`  User: ${envConfig.SMTP_USER}`);
      console.log(
        `  Password configured: ${envConfig.SMTP_PASSWORD ? "Yes" : "No"}`
      );
      console.log(`  From: ${envConfig.EMAIL_FROM}`);

      this.transporter = nodemailer.createTransport({
        host: envConfig.SMTP_HOST,
        port: envConfig.SMTP_PORT,
        secure: isSecurePort, // true for 465, false for other ports
        auth: {
          user: envConfig.SMTP_USER,
          pass: envConfig.SMTP_PASSWORD,
        },
      });
    }
    return this.transporter;
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName: string
  ) {
    const resetUrl = `${envConfig.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #4F46E5;">Password Reset Request</h1>
        <p>Hello ${userName},</p>
        <p>We received a request to reset your password.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
      </body>
      </html>
    `;

    try {
      const transporter = await this.getTransporter();
      if (!transporter) return false;

      await transporter.sendMail({
        from: `"Team Management" <${envConfig.EMAIL_FROM}>`,
        to,
        subject: "Password Reset Request",
        html,
      });
      console.log(`✅ Password reset email sent to ${to}`);
      return true;
    } catch (error) {
      console.error("❌ Email send error:", error);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, userName: string, role: string) {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #4F46E5;">Welcome to Team Management!</h1>
        <p>Hello ${userName},</p>
        <p>Your account has been created successfully!</p>
        <p><strong>Your role:</strong> ${role}</p>
        <a href="${envConfig.FRONTEND_URL}/login" style="display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Login Now</a>
      </body>
      </html>
    `;

    try {
      const transporter = await this.getTransporter();
      if (!transporter) return false;

      await transporter.sendMail({
        from: `"Team Management" <${envConfig.EMAIL_FROM}>`,
        to,
        subject: "Welcome to Team Management",
        html,
      });
      console.log(`✅ Welcome email sent to ${to}`);
      return true;
    } catch (error) {
      console.error("❌ Email error:", error);
      return false;
    }
  }

  async sendEmailVerification(
    to: string,
    userName: string,
    verificationUrl: string
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">Verify Your Email</h1>
          </div>
          <p style="font-size: 16px; color: #333;">Hello ${userName},</p>
          <p style="font-size: 16px; color: #333;">Thank you for registering with Team Management! Please verify your email address to activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 15px 40px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
          </div>
          <p style="font-size: 14px; color: #666;"><strong>This link will expire in 24 hours.</strong></p>
          <p style="font-size: 14px; color: #666;">If you didn't create an account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">Team Management System - Secure Organization Management</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Hello ${userName},

Thank you for registering with Team Management!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.
    `;

    try {
      const transporter = await this.getTransporter();
      if (!transporter) return false;

      await transporter.sendMail({
        from: `"Team Management" <${envConfig.EMAIL_FROM}>`,
        to,
        subject: "Verify Your Email Address - Team Management",
        html,
        text,
      });
      console.log(`✅ Email verification sent to ${to}`);
      return true;
    } catch (error) {
      console.error("❌ Email verification error:", error);
      return false;
    }
  }

  async sendInvitationEmail(
    to: string,
    token: string,
    inviterName: string,
    teamName: string,
    organizationId: string
  ) {
    const inviteUrl = `${envConfig.FRONTEND_URL}/accept-invite?token=${token}`;
    const teamText = teamName ? ` to join the team "${teamName}"` : "";

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #4F46E5;">You've Been Invited!</h1>
        <p>Hello,</p>
        <p>${inviterName} has invited you${teamText} in their organization.</p>
        <p>Click the button below to accept the invitation and create your account:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Accept Invitation</a>
        <p><strong>This invitation will expire in 7 days.</strong></p>
        <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
      </body>
      </html>
    `;

    try {
      const transporter = await this.getTransporter();
      if (!transporter) return false;

      await transporter.sendMail({
        from: `"Team Management" <${envConfig.EMAIL_FROM}>`,
        to,
        subject: `Invitation to join Team Management`,
        html,
      });
      console.log(`✅ Invitation email sent to ${to}`);
      return true;
    } catch (error) {
      console.error("❌ Email error:", error);
      return false;
    }
  }

  async sendOrganizationSetupEmail(
    to: string,
    token: string,
    organizationName: string,
    ownerName: string
  ) {
    const setupUrl = `${envConfig.FRONTEND_URL}/setup-organization?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #4F46E5;">Set Up Your Organization</h1>
        <p>Hello ${ownerName},</p>
        <p>An administrator has created the organization "${organizationName}" and designated you as the owner.</p>
        <p>Click the button below to set up your account and access your organization:</p>
        <a href="${setupUrl}" style="display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Set Up Organization</a>
        <p><strong>This link will expire in 48 hours.</strong></p>
        <p>If you have any questions, please contact support.</p>
      </body>
      </html>
    `;

    try {
      const transporter = await this.getTransporter();
      if (!transporter) return false;

      await transporter.sendMail({
        from: `"Team Management" <${envConfig.EMAIL_FROM}>`,
        to,
        subject: `Set Up Your Organization - ${organizationName}`,
        html,
      });
      console.log(`✅ Organization setup email sent to ${to}`);
      return true;
    } catch (error) {
      console.error("❌ Email error:", error);
      return false;
    }
  }

  // Generic send email method
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string; // Add text version support
    from?: string;
  }) {
    try {
      const transporter = await this.getTransporter();
      if (!transporter) return false;

      await transporter.sendMail({
        from: options.from || `"Team Management" <${envConfig.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text, // Include text version
      });
      console.log(`✅ Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      console.error("❌ Email error:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();

// Export sendEmail as a standalone function for convenience
export const sendEmail = (options: {
  to: string;
  subject: string;
  html: string;
  text?: string; // Add text version support
  from?: string;
}) => emailService.sendEmail(options);
