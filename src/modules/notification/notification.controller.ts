import { RequestHandler } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { NotificationService } from "./notification.service";

const getMyNotifications: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user?._id as string;
  const onlyUnread = req.query.unread === "true";

  const result = await NotificationService.getUserNotifications(
    userId,
    onlyUnread
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications retrieved successfully",
    data: result,
  });
});

const getUnreadCount: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user?._id as string;
  const count = await NotificationService.getUnreadCount(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Unread count retrieved successfully",
    data: { count },
  });
});

const markAsRead: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user?._id as string;
  const { id } = req.params;

  const result = await NotificationService.markAsRead(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification marked as read",
    data: result,
  });
});

const markAllAsRead: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user?._id as string;

  await NotificationService.markAllAsRead(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All notifications marked as read",
    data: null,
  });
});

const deleteNotification: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user?._id as string;
  const { id } = req.params;

  await NotificationService.deleteNotification(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification deleted successfully",
    data: null,
  });
});

export const NotificationController = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
