import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { UserService } from './user.service';
import sendResponse from '../../utils/sendResponse';

// Get all users
const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.getAllUsers(req.query);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Users retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

// Get single user
const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.getUserById(req.params.userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Create user (Admin only)
const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.createUser(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update user
const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.updateUser(req.params.userId, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await UserService.deleteUser(req.params.userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle user status
const toggleUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.toggleUserStatus(req.params.userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User status updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await UserService.changePassword(req.user._id, currentPassword, newPassword);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Password changed successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const UserController = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  changePassword,
};
