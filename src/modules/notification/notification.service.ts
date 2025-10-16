import { Notification } from './notification.model';
import { ICreateNotification, INotification } from './notification.interface';

// Get user notifications
const getUserNotifications = async (userId: string, onlyUnread = false) => {
  const query: any = { userId };
  if (onlyUnread) {
    query.isRead = false;
  }

  return await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(50);
};

// Create notification
const createNotification = async (data: ICreateNotification): Promise<INotification> => {
  return await Notification.create(data);
};

// Mark as read
const markAsRead = async (notificationId: string, userId: string) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
};

// Mark all as read
const markAllAsRead = async (userId: string) => {
  return await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );
};

// Delete notification
const deleteNotification = async (notificationId: string, userId: string) => {
  return await Notification.findOneAndDelete({ _id: notificationId, userId });
};

// Get unread count
const getUnreadCount = async (userId: string): Promise<number> => {
  return await Notification.countDocuments({ userId, isRead: false });
};

export const NotificationService = {
  getUserNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};
