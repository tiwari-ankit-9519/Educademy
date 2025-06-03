import { PrismaClient } from "@prisma/client";
import educademyLogger from "./logger.js";

const prisma = new PrismaClient();

class NotificationService {
  constructor() {
    this.socketManager = null;
  }

  setSocketManager(socketManager) {
    this.socketManager = socketManager;
    educademyLogger.info("Socket manager connected to notification service");
  }

  async createNotification({
    userId,
    type,
    title,
    message,
    priority = "NORMAL",
    data = null,
    actionUrl = null,
    expiresAt = null,
    sendEmail = true,
    sendSocket = true,
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          priority,
          data,
          actionUrl,
          expiresAt,
          isDelivered: false,
        },
      });

      educademyLogger.businessOperation(
        "CREATE_NOTIFICATION",
        "NOTIFICATION",
        notification.id,
        "SUCCESS",
        {
          userId,
          type,
          priority,
          hasActionUrl: !!actionUrl,
        }
      );

      if (sendSocket && this.socketManager) {
        const socketData = {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          data: notification.data,
          actionUrl: notification.actionUrl,
          createdAt: notification.createdAt,
        };

        if (this.socketManager.isUserOnline(userId)) {
          this.socketManager.sendToUser(userId, "new_notification", socketData);

          // Mark as delivered since user is online
          await this.markAsDelivered(notification.id);

          educademyLogger.logBusinessOperation(
            "SEND_SOCKET_NOTIFICATION",
            "NOTIFICATION",
            notification.id,
            "SUCCESS",
            { userId, isOnline: true }
          );
        } else {
          educademyLogger.logBusinessOperation(
            "SKIP_SOCKET_NOTIFICATION",
            "NOTIFICATION",
            notification.id,
            "USER_OFFLINE",
            { userId, isOnline: false }
          );
        }
      }

      // Send email notification if enabled
      if (sendEmail && (await this.shouldSendEmail(userId, type))) {
        await this.sendEmailNotification(userId, notification);
      }

      return notification;
    } catch (error) {
      educademyLogger.error("Failed to create notification", error, {
        userId,
        type,
        business: {
          operation: "CREATE_NOTIFICATION",
          entity: "NOTIFICATION",
          status: "ERROR",
        },
      });
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async createBulkNotifications({
    userIds,
    type,
    title,
    message,
    priority = "NORMAL",
    data = null,
    actionUrl = null,
    expiresAt = null,
    sendEmail = true,
    sendSocket = true,
  }) {
    try {
      const notifications = [];

      // Create notifications in batch
      for (const userId of userIds) {
        const notification = await prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            priority,
            data,
            actionUrl,
            expiresAt,
            isDelivered: false,
          },
        });
        notifications.push(notification);
      }

      educademyLogger.logBusinessOperation(
        "CREATE_BULK_NOTIFICATIONS",
        "NOTIFICATION",
        null,
        "SUCCESS",
        {
          userCount: userIds.length,
          type,
          priority,
        }
      );

      // Send via Socket.IO to online users
      if (sendSocket && this.socketManager) {
        const onlineUsers = userIds.filter((userId) =>
          this.socketManager.isUserOnline(userId)
        );

        onlineUsers.forEach((userId) => {
          const notification = notifications.find((n) => n.userId === userId);
          const socketData = {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            data: notification.data,
            actionUrl: notification.actionUrl,
            createdAt: notification.createdAt,
          };

          this.socketManager.sendToUser(userId, "new_notification", socketData);
        });

        // Mark online notifications as delivered
        const onlineNotificationIds = notifications
          .filter((n) => onlineUsers.includes(n.userId))
          .map((n) => n.id);

        if (onlineNotificationIds.length > 0) {
          await prisma.notification.updateMany({
            where: { id: { in: onlineNotificationIds } },
            data: { isDelivered: true, deliveredAt: new Date() },
          });
        }

        educademyLogger.logBusinessOperation(
          "SEND_BULK_SOCKET_NOTIFICATIONS",
          "NOTIFICATION",
          null,
          "SUCCESS",
          {
            totalUsers: userIds.length,
            onlineUsers: onlineUsers.length,
            offlineUsers: userIds.length - onlineUsers.length,
          }
        );
      } else {
        educademyLogger.logBusinessOperation(
          "SKIP_BULK_SOCKET_NOTIFICATIONS",
          "NOTIFICATION",
          null,
          "NO_SOCKET_MANAGER",
          {
            totalUsers: userIds.length,
          }
        );
      }
    } catch (error) {
      educademyLogger.error("Failed to create bulk notifications", error, {
        userIds,
        type,
        business: {
          operation: "CREATE_BULK_NOTIFICATIONS",
          entity: "NOTIFICATION",
          status: "ERROR",
        },
      });
      throw error;
    }
  }
}
