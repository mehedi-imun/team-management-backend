import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { emailService } from "../../services/email.service";
import {
  generateAccessToken,
  generatePasswordResetToken,
  generateRefreshToken,
  hashResetToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { User } from "../user/user.model";
import { ILoginResponse, IRefreshTokenResponse } from "./auth.interface";

// Login user
const login = async (
  email: string,
  password: string
): Promise<ILoginResponse> => {
  // Find user with password field
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account has been deactivated"
    );
  }

  // Verify password
  const isPasswordValid = await (user as any).comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  // Generate tokens
  const tokenPayload = {
    userId: user._id!.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Update last login timestamp
  user.lastLoginAt = new Date();
  
  // If this is first login, record it
  if (!user.firstLogin) {
    user.firstLogin = new Date();
  }
  
  await user.save();

  // Return user data and tokens (password excluded by toJSON transform)
  const userResponse: any = user.toJSON();

  return {
    user: {
      _id: userResponse._id,
      email: userResponse.email,
      name: userResponse.name,
      role: userResponse.role,
      isActive: userResponse.isActive,
      organizationId: userResponse.organizationId,
      organizationIds: userResponse.organizationIds,
      mustChangePassword: user.mustChangePassword || false, // Include password change flag
    },
    accessToken,
    refreshToken,
    mustChangePassword: user.mustChangePassword || false, // Top-level flag for easy access
  };
};

// Refresh access token
const refreshAccessToken = async (
  refreshToken: string
): Promise<IRefreshTokenResponse> => {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    return { accessToken: newAccessToken };
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
  }
};

// Forgot password - generate reset token and send email
const forgotPassword = async (email: string): Promise<string> => {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal that email doesn't exist for security
    return "If an account with that email exists, a password reset link has been sent";
  }

  // Generate reset token
  const resetToken = generatePasswordResetToken();
  const hashedToken = hashResetToken(resetToken);

  // Save hashed token and expiry to database
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  await user.save();

  // Send password reset email
  await emailService.sendPasswordResetEmail(user.email, resetToken, user.name);

  return "If an account with that email exists, a password reset link has been sent";
};

// Reset password using token
const resetPassword = async (
  token: string,
  newPassword: string
): Promise<void> => {
  const hashedToken = hashResetToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid or expired reset token"
    );
  }

  // Update password and clear reset token
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
};

// Logout (client should clear cookies/tokens)
const logout = async (): Promise<void> => {
  // In a stateless JWT system, logout is handled client-side
  // If using refresh token rotation or blacklist, handle here
  return;
};

// Self-service registration - create organization + owner in one transaction
// Public users register and become Organization Owners with 14-day free trial
const register = async (data: {
  name: string;
  email: string;
  password: string;
  organizationName: string;
  organizationSlug: string;
}) => {
  const { Organization } = await import("../organization/organization.model");

  // Check if user already exists
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email already in use");
  }

  // Check if organization slug is available
  const slugAvailable = await Organization.checkSlugAvailability(
    data.organizationSlug
  );
  if (!slugAvailable) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Organization slug already taken"
    );
  }

  // Create organization with 14-day free trial
  const organization = await Organization.create({
    name: data.organizationName,
    slug: data.organizationSlug,
    plan: "free",
    subscriptionStatus: "trialing",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    status: "active",
    usage: {
      users: 1, // Owner will be the first user
      teams: 0,
      storage: "0MB",
    },
  });

  // Create owner user account
  // NEW ROLE SYSTEM: Direct role assignment
  const owner = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    organizationId: organization._id!.toString(),
    role: "OrgOwner", // Direct role: Organization Owner
    isActive: true,
  });

  // Update organization with ownerId
  organization.ownerId = owner._id!.toString();
  organization.ownerEmail = owner.email;
  organization.ownerName = owner.name;
  await organization.save();

  // Generate tokens for auto-login
  const tokenPayload = {
    userId: owner._id!.toString(),
    email: owner.email,
    role: owner.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Send welcome email with trial info
  await emailService.sendWelcomeEmail(owner.email, owner.name, "Owner");

  return {
    user: owner,
    organization,
    accessToken,
    refreshToken,
  };
};

// Setup organization (for admin-created organizations)
const setupOrganization = async (data: {
  token: string;
  name: string;
  password: string;
}) => {
  const { Organization } = await import("../organization/organization.model");
  const crypto = await import("crypto");

  // Hash the token for comparison
  const hashedToken = crypto
    .createHash("sha256")
    .update(data.token)
    .digest("hex");

  // Find organization with valid setup token
  const organization = await Organization.findOne({
    setupToken: hashedToken,
    setupTokenExpires: { $gt: new Date() },
    status: "pending_setup",
  });

  if (!organization) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid or expired setup token"
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: organization.ownerEmail });
  if (existingUser) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User already exists with this email"
    );
  }

  // Create owner account
  const owner = await User.create({
    name: data.name,
    email: organization.ownerEmail!,
    password: data.password,
    organizationId: organization._id!.toString(),
    role: "OrgOwner", // Organization Owner role
    isActive: true,
  });

  // Update organization
  organization.ownerId = owner._id!.toString();
  organization.status = "active";
  organization.setupToken = undefined;
  organization.setupTokenExpires = undefined;
  organization.usage.users = 1;
  await organization.save();

  // Generate tokens
  const tokenPayload = {
    userId: owner._id!.toString(),
    email: owner.email,
    role: owner.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: owner,
    organization,
    accessToken,
    refreshToken,
  };
};

export const AuthService = {
  login,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  logout,
  register,
  setupOrganization,
};
