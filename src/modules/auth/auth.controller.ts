import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { AuthService } from './auth.service';
import sendResponse from '../../utils/sendResponse';
import env from '../../config/env';

// Login
const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    // Set HTTP-only cookies
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout
const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AuthService.logout();

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Logout successful',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: 'No refresh token provided',
        data: null,
      });
    }

    const result = await AuthService.refreshAccessToken(refreshToken);

    // Set new access token cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Token refreshed successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password
const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const resetToken = await AuthService.forgotPassword(email);

    // In production, this would send an email
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
      data: env.NODE_ENV === 'development' ? { resetToken } : null, // Only in dev
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    await AuthService.resetPassword(token, password);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Password reset successful',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Get current user (me)
const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const AuthController = {
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
};
