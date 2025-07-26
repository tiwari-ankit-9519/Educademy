import express from "express";
import { isLoggedIn } from "../../middlewares/middleware.js";
import {
  getNotifications,
  getUnreadCount,
  getNotificationStats,
  markNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  sendTestNotification,
  getNotificationPreferences,
} from "../../controllers/common/notification.controller.js";
import { trackRoute } from "../../utils/routeWrapper.js";

const router = express.Router();

router.use(isLoggedIn);

router.get(
  "/",
  trackRoute("Notifications", "getNotifications"),
  getNotifications
);
router.get(
  "/unread-count",
  trackRoute("Notifications", "getUnreadCount"),
  getUnreadCount
);
router.get(
  "/stats",
  trackRoute("Notifications", "getNotificationStats"),
  getNotificationStats
);
router.get(
  "/settings",
  trackRoute("Notifications", "getNotificationSettings"),
  getNotificationSettings
);
router.get(
  "/preferences",
  trackRoute("Notifications", "getNotificationPreferences"),
  getNotificationPreferences
);

router.put(
  "/mark-read",
  trackRoute("Notifications", "markNotificationsAsRead"),
  markNotificationsAsRead
);
router.put(
  "/settings",
  trackRoute("Notifications", "updateNotificationSettings"),
  updateNotificationSettings
);

router.delete(
  "/:notificationId",
  trackRoute("Notifications", "deleteNotification"),
  deleteNotification
);
router.delete(
  "/read/all",
  trackRoute("Notifications", "deleteAllReadNotifications"),
  deleteAllReadNotifications
);

router.post(
  "/test",
  trackRoute("Notifications", "sendTestNotification"),
  sendTestNotification
);

export default router;
