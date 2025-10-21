import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { NotificationController } from "./notification.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/", NotificationController.getMyNotifications);
router.get("/unread-count", NotificationController.getUnreadCount);
router.patch("/:id/read", NotificationController.markAsRead);
router.patch("/read-all", NotificationController.markAllAsRead);
router.delete("/:id", NotificationController.deleteNotification);

export const NotificationRoutes = router;
