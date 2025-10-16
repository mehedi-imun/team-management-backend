import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import {
  generateAccessToken,
  generatePasswordResetToken,
  generateRefreshToken,
  hashResetToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { User } from "../user/user.model";
import { ILoginResponse, IRefreshTokenResponse } from "./auth.interface";
import { emailService } from "../../services/email.service";

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

  // Return user data and tokens (password excluded by toJSON transform)
  const userResponse: any = user.toJSON();

  return {
    user: {
      _id: userResponse._id,
      email: userResponse.email,
      name: userResponse.name,
      role: userResponse.role,
      isActive: userResponse.isActive,
    },
    accessToken,
    refreshToken,
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

export const AuthService = {
  login,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  logout,
};
