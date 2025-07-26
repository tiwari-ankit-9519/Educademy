import { PrismaClient } from "@prisma/client";
import emailTemplates from "./emailTemplates.js";

const prisma = new PrismaClient();

class NotificationService {
  constructor() {
    this.socketManager = null;
    this.emailService = null;
  }

  setSocketManager(socketManager) {
    this.socketManager = socketManager;
    console.log("Socket manager set in NotificationService");
  }

  setEmailService(emailService) {
    this.emailService = emailService;
  }

  async createNotification({
    userId,
    type,
    title,
    message,
    priority = "NORMAL",
    data = null,
    actionUrl = null,
    sendEmail = null,
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
          isRead: false,
          isDelivered: false,
        },
      });

      if (sendSocket && this.socketManager) {
        await this.socketManager.sendNotificationToUser(userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          data: notification.data,
          actionUrl: notification.actionUrl,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        });

        if (this.socketManager.isUserOnline(userId)) {
          await this.markAsDelivered(notification.id);
        }

        if (type === "SYSTEM_ANNOUNCEMENT" && data?.announcementId) {
          await this.updateAnnouncementStats(data.announcementId);
        }
      }

      const shouldEmail =
        sendEmail !== null
          ? sendEmail
          : await this.shouldSendEmail(userId, type);
      if (shouldEmail && this.emailService) {
        await this.sendEmailNotification(userId, notification);
      }

      return notification;
    } catch (error) {
      console.error("Failed to create notification", error);
      throw error;
    }
  }

  async createBulkNotifications({
    userIds,
    type,
    title,
    message,
    priority = "NORMAL",
    data = null,
    actionUrl = null,
    sendEmail = null,
    sendSocket = true,
  }) {
    try {
      console.log(`Creating bulk notifications for ${userIds.length} users`);

      const notifications = [];
      const batchSize = 100;

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);

        const batchNotifications = await Promise.allSettled(
          batch.map(async (userId) => {
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
                  isRead: false,
                  isDelivered: false,
                },
              });
              return notification;
            } catch (error) {
              console.error(
                `Failed to create notification for user ${userId}:`,
                error
              );
              return null;
            }
          })
        );

        const successfulBatchNotifications = batchNotifications
          .filter((result) => result.status === "fulfilled" && result.value)
          .map((result) => result.value);

        notifications.push(...successfulBatchNotifications);
      }

      console.log(
        `Created ${notifications.length} notifications out of ${userIds.length} attempts`
      );

      if (sendSocket && this.socketManager && notifications.length > 0) {
        const notificationsByUser = notifications.reduce(
          (acc, notification) => {
            if (!acc[notification.userId]) {
              acc[notification.userId] = [];
            }
            acc[notification.userId].push({
              id: notification.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              priority: notification.priority,
              data: notification.data,
              actionUrl: notification.actionUrl,
              isRead: notification.isRead,
              createdAt: notification.createdAt,
            });
            return acc;
          },
          {}
        );

        const socketPromises = Object.entries(notificationsByUser).map(
          async ([userId, userNotifications]) => {
            try {
              if (userNotifications.length === 1) {
                await this.socketManager.sendNotificationToUser(
                  userId,
                  userNotifications[0]
                );
              } else {
                await this.socketManager.sendBulkNotificationsToUser(
                  userId,
                  userNotifications
                );
              }

              if (this.socketManager.isUserOnline(userId)) {
                const notificationIds = userNotifications.map((n) => n.id);
                await Promise.all(
                  notificationIds.map((id) => this.markAsDelivered(id))
                );
              }
            } catch (error) {
              console.error(
                `Failed to send notifications to user ${userId}:`,
                error
              );
            }
          }
        );

        await Promise.allSettled(socketPromises);

        if (type === "SYSTEM_ANNOUNCEMENT" && data?.announcementId) {
          await this.updateAnnouncementStats(data.announcementId);
          await this.broadcastAnnouncementStats(data.announcementId);
        }
      }

      if (this.emailService) {
        const emailPromises = notifications.map(async (notification) => {
          try {
            const shouldEmail =
              sendEmail !== null
                ? sendEmail
                : await this.shouldSendEmail(notification.userId, type);
            if (shouldEmail) {
              await this.sendEmailNotification(
                notification.userId,
                notification
              );
            }
          } catch (error) {
            console.error(
              `Failed to send email for notification ${notification.id}:`,
              error
            );
          }
        });

        await Promise.allSettled(emailPromises);
      }

      return {
        success: true,
        notifications: notifications,
        created: notifications.length,
        failed: userIds.length - notifications.length,
      };
    } catch (error) {
      console.error("Failed to create bulk notifications", error);
      throw error;
    }
  }

  async updateAnnouncementStats(announcementId) {
    try {
      const stats = await prisma.notification.groupBy({
        by: ["isRead"],
        where: {
          data: {
            path: ["announcementId"],
            equals: announcementId,
          },
        },
        _count: {
          id: true,
        },
      });

      const readCount = stats.find((s) => s.isRead === true)?._count.id || 0;
      const unreadCount = stats.find((s) => s.isRead === false)?._count.id || 0;
      const totalCount = readCount + unreadCount;

      return {
        announcementId,
        totalNotifications: totalCount,
        readCount,
        unreadCount,
        readPercentage:
          totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0,
      };
    } catch (error) {
      console.error("Failed to update announcement stats:", error);
      return null;
    }
  }

  async broadcastAnnouncementStats(announcementId) {
    try {
      if (!this.socketManager) return;

      const stats = await this.updateAnnouncementStats(announcementId);
      if (stats) {
        this.socketManager.sendToRole(
          "ADMIN",
          "announcement_stats_updated",
          stats
        );
        this.socketManager.sendToRole(
          "MODERATOR",
          "announcement_stats_updated",
          stats
        );
      }
    } catch (error) {
      console.error("Failed to broadcast announcement stats:", error);
    }
  }

  async markAsDelivered(notificationId) {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isDelivered: true,
          deliveredAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Failed to mark notification as delivered", error);
    }
  }

  async getNotifications({ userId, page = 1, limit = 20, filters = {} }) {
    try {
      const skip = (page - 1) * limit;
      const where = { userId };

      if (filters.isRead !== undefined) {
        where.isRead = filters.isRead;
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: "insensitive" } },
          { message: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters,
      };
    } catch (error) {
      console.error("Get notifications error:", error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: { userId, isRead: false },
      });
      return count;
    } catch (error) {
      console.error("Get unread count error:", error);
      throw error;
    }
  }

  async getNotificationStats(userId) {
    try {
      const [total, unread, delivered, byPriority] = await Promise.all([
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({
          where: {
            userId,
            isRead: false,
          },
        }),
        prisma.notification.count({
          where: { userId, isDelivered: true },
        }),
        prisma.notification.groupBy({
          by: ["priority"],
          where: {
            userId,
            isRead: false,
          },
          _count: { priority: true },
        }),
      ]);

      const priorityStats = byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {});

      return {
        total,
        unread,
        read: total - unread,
        delivered,
        byPriority: priorityStats,
      };
    } catch (error) {
      console.error("Get notification stats error:", error);
      return { total: 0, unread: 0, read: 0, delivered: 0, byPriority: {} };
    }
  }

  async markNotificationsAsRead({ notificationIds, markAll = false, userId }) {
    try {
      const where = { userId };

      if (markAll) {
        where.isRead = false;
      } else {
        where.id = { in: notificationIds };
      }

      const result = await prisma.notification.updateMany({
        where,
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      if (this.socketManager) {
        const targetIds = markAll ? [] : notificationIds;
        this.socketManager.sendToUser(userId, "notifications_marked_read", {
          notificationIds: targetIds,
          markAll,
          count: result.count,
        });

        const unreadCount = await prisma.notification.count({
          where: { userId, isRead: false },
        });

        this.socketManager.sendToUser(userId, "unread_count_updated", {
          count: unreadCount,
        });

        const readNotifications = await prisma.notification.findMany({
          where: markAll
            ? { userId, isRead: true }
            : { id: { in: notificationIds } },
          select: { data: true },
        });

        const announcementIds = readNotifications
          .filter((n) => n.data?.announcementId)
          .map((n) => n.data.announcementId);

        for (const announcementId of [...new Set(announcementIds)]) {
          await this.broadcastAnnouncementStats(announcementId);
        }
      }

      return result;
    } catch (error) {
      console.error("Mark notifications as read error:", error);
      throw error;
    }
  }

  async deleteNotification({ notificationId, userId }) {
    try {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      if (this.socketManager) {
        this.socketManager.sendToUser(userId, "notification_deleted", {
          notificationId,
        });

        const unreadCount = await prisma.notification.count({
          where: { userId, isRead: false },
        });

        this.socketManager.sendToUser(userId, "unread_count_updated", {
          count: unreadCount,
        });

        if (notification.data?.announcementId) {
          await this.broadcastAnnouncementStats(
            notification.data.announcementId
          );
        }
      }

      return { deleted: true, notification };
    } catch (error) {
      console.error("Delete notification error:", error);
      throw error;
    }
  }

  async deleteAllReadNotifications(userId) {
    try {
      const readNotifications = await prisma.notification.findMany({
        where: { userId, isRead: true },
        select: { data: true },
      });

      const result = await prisma.notification.deleteMany({
        where: { userId, isRead: true },
      });

      if (this.socketManager) {
        this.socketManager.sendToUser(userId, "read_notifications_deleted", {
          count: result.count,
        });

        const announcementIds = readNotifications
          .filter((n) => n.data?.announcementId)
          .map((n) => n.data.announcementId);

        for (const announcementId of [...new Set(announcementIds)]) {
          await this.broadcastAnnouncementStats(announcementId);
        }
      }

      return result;
    } catch (error) {
      console.error("Delete all read notifications error:", error);
      throw error;
    }
  }

  async shouldSendEmail(userId, type) {
    try {
      const settings = await prisma.notificationSettings.findUnique({
        where: { userId },
      });

      if (!settings) return this.getDefaultEmailSetting(type);

      const highPriorityTypes = [
        "PAYMENT_RECEIVED",
        "PAYMENT_FAILED",
        "SECURITY_ALERT",
        "ACCOUNT_SUSPENDED",
        "COURSE_APPROVED",
        "COURSE_REJECTED",
        "ASSIGNMENT_GRADED",
        "CERTIFICATE_ISSUED",
        "REFUND_PROCESSED",
        "PAYOUT_PROCESSED",
      ];

      const mediumPriorityTypes = [
        "NEW_ENROLLMENT",
        "COURSE_COMPLETED",
        "SUPPORT_TICKET_RESOLVED",
        "SYSTEM_ANNOUNCEMENT",
      ];

      if (highPriorityTypes.includes(type)) {
        return true;
      }

      if (mediumPriorityTypes.includes(type)) {
        return settings.email && settings.courseUpdates;
      }

      return false;
    } catch (error) {
      console.error("Failed to check email notification settings", error);
      return false;
    }
  }

  getDefaultEmailSetting(type) {
    const alwaysEmailTypes = [
      "PAYMENT_RECEIVED",
      "PAYMENT_FAILED",
      "SECURITY_ALERT",
      "ACCOUNT_SUSPENDED",
      "CERTIFICATE_ISSUED",
    ];
    return alwaysEmailTypes.includes(type);
  }

  async sendEmailNotification(userId, notification) {
    try {
      if (!this.emailService) return;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      if (!user) return;

      const emailData = await this.prepareEmailData(notification, user);
      if (emailData) {
        await this.emailService.send({
          to: user.email,
          subject: emailData.subject,
          html: emailData.html,
        });
      }
    } catch (error) {
      console.error("Failed to send email notification", error);
    }
  }

  async prepareEmailData(notification, user) {
    const { type, title, message, data } = notification;

    switch (type) {
      case "PAYMENT_RECEIVED":
        return {
          subject: "Payment Confirmed - Educademy",
          html: emailTemplates.transactional({
            userName: user.firstName,
            title: "Payment Successful",
            subtitle: "Your course purchase has been confirmed",
            message:
              "Thank you for your purchase! You now have access to your course.",
            transactionType: "success",
            amount: data?.amount,
            currency: data?.currency || "INR",
            transactionId: data?.transactionId,
            actionButton: "Access Course",
            actionUrl: data?.courseUrl,
            details: data?.details || [],
          }),
        };

      case "SYSTEM_ANNOUNCEMENT":
        return {
          subject: `${title} - Educademy`,
          html: emailTemplates.system({
            userName: user.firstName,
            title: title,
            subtitle: "Important announcement from Educademy",
            message: message,
            systemType: "announcement",
            actionButton: "View Details",
            actionUrl: data?.actionUrl || "/announcements",
            additionalInfo: data?.fullContent ? [data.fullContent] : [],
          }),
        };

      case "ASSIGNMENT_GRADED":
        return {
          subject: "Assignment Graded - Educademy",
          html: emailTemplates.communication({
            userName: user.firstName,
            title: "Assignment Graded",
            subtitle: "Your instructor has reviewed your work",
            message:
              "Your assignment has been graded and feedback is available.",
            communicationType: "graded",
            courseName: data?.courseName,
            senderName: data?.instructorName,
            grade: data?.grade,
            feedback: data?.feedback,
            actionButton: "View Details",
            actionUrl: data?.assignmentUrl,
          }),
        };

      default:
        return null;
    }
  }

  async getNotificationSettings(userId) {
    try {
      let settings = await prisma.notificationSettings.findUnique({
        where: { userId },
      });

      if (!settings) {
        settings = await prisma.notificationSettings.create({
          data: {
            userId,
            email: true,
            push: true,
            inApp: true,
            sms: false,
            assignmentUpdates: true,
            courseUpdates: true,
            accountUpdates: true,
            marketingUpdates: false,
            discussionUpdates: true,
            reviewUpdates: true,
            paymentUpdates: true,
          },
        });
      }

      return settings;
    } catch (error) {
      console.error("Get notification settings error:", error);
      throw error;
    }
  }

  async updateNotificationSettings(userId, settings) {
    try {
      const updatedSettings = await prisma.notificationSettings.upsert({
        where: { userId },
        update: settings,
        create: {
          userId,
          ...settings,
        },
      });

      if (this.socketManager) {
        this.socketManager.sendToUser(userId, "notification_settings_updated", {
          settings: updatedSettings,
        });
      }

      return updatedSettings;
    } catch (error) {
      console.error("Update notification settings error:", error);
      throw error;
    }
  }

  async sendTestNotification({ userId, type, title, message, priority }) {
    try {
      const notification = await this.createNotification({
        userId,
        type,
        title,
        message,
        priority,
        data: { isTest: true },
      });

      return notification;
    } catch (error) {
      console.error("Send test notification error:", error);
      throw error;
    }
  }

  async cleanupExpiredNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          isRead: true,
          readAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      console.log(`Cleaned up ${result.count} old read notifications`);
      return result.count;
    } catch (error) {
      console.error("Failed to cleanup old notifications", error);
      return 0;
    }
  }
}

const notificationService = new NotificationService();

setInterval(() => {
  notificationService.cleanupExpiredNotifications();
}, 24 * 60 * 60 * 1000);

export default notificationService;
