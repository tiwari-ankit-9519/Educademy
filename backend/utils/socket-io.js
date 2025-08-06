import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const maxIdleTime = 30 * 60 * 1000;

class SocketManager {
  constructor() {
    this.io = null;
    this.userSockets = new Map();
    this.socketUsers = new Map();
    this.deviceSessions = new Map();
    this.rooms = new Map();
    this.liveSessions = new Map();
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 10000,
      connectTimeout: 60000,
      transports: ["websocket", "polling"],
      allowEIO3: true,
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    return this.io;
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      const authTimeout = setTimeout(() => {
        next(new Error("Authentication timeout"));
      }, 30000);

      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          clearTimeout(authTimeout);
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId || decoded.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
        });

        if (!user) {
          clearTimeout(authTimeout);
          return next(new Error("Invalid user"));
        }

        if (!user.isActive) {
          clearTimeout(authTimeout);
          return next(new Error("Account is inactive"));
        }

        socket.userId = user.id;
        socket.user = user;
        socket.deviceInfo = {
          userAgent: socket.handshake.headers["user-agent"],
          ip: socket.handshake.address,
          connectedAt: new Date(),
        };

        clearTimeout(authTimeout);
        next();
      } catch (error) {
        clearTimeout(authTimeout);
        console.error("Socket authentication error:", error);
        next(new Error("Authentication failed"));
      }
    });
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      this.handleConnection(socket);
      this.setupSocketEventHandlers(socket);
    });
  }

  async handleConnection(socket) {
    const userId = socket.userId;
    const socketId = socket.id;

    try {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(socketId);
      this.socketUsers.set(socketId, userId);
      this.deviceSessions.set(socketId, socket.deviceInfo);

      socket.join(`user_${userId}`);

      if (socket.user.role === "STUDENT") {
        socket.join("students");
      } else if (socket.user.role === "INSTRUCTOR") {
        socket.join("instructors");
      } else if (
        socket.user.role === "ADMIN" ||
        socket.user.role === "MODERATOR"
      ) {
        socket.join("admins");
      }

      socket.join("all_users");

      socket.emit("connected", {
        success: true,
        message: "Connected successfully",
        userId: userId,
        role: socket.user.role,
        connectedDevices: this.userSockets.get(userId).size,
        timestamp: new Date().toISOString(),
        rooms: Array.from(socket.rooms),
      });

      await this.sendPendingNotifications(userId);
    } catch (error) {
      console.error("Socket connection handling failed", error);
    }
  }

  setupSocketEventHandlers(socket) {
    socket.on("disconnect", (reason) => {
      this.handleDisconnection(socket, reason);
    });

    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });

    socket.on("join", (data) => {
      socket.emit("joined", {
        userId: socket.userId,
        role: socket.user.role,
        rooms: Array.from(socket.rooms),
      });
    });

    socket.on("mark_notifications_read", async (data) => {
      await this.handleMarkNotificationsRead(socket, data);
    });

    socket.on("get_unread_count", async () => {
      try {
        const count = await prisma.notification.count({
          where: { userId: socket.userId, isRead: false },
        });
        socket.emit("unread_count_updated", { count });
      } catch (error) {
        console.error("Get unread count error:", error);
        socket.emit("error", { message: "Failed to get unread count" });
      }
    });

    socket.on("announcement_created", (announcement) => {
      if (socket.user.role === "ADMIN" || socket.user.role === "MODERATOR") {
        this.broadcastAnnouncementCreated(announcement, socket.userId);
      }
    });

    socket.on("announcement_updated", (announcement) => {
      if (socket.user.role === "ADMIN" || socket.user.role === "MODERATOR") {
        this.broadcastAnnouncementUpdated(announcement, socket.userId);
      }
    });

    socket.on("announcement_deleted", (data) => {
      if (socket.user.role === "ADMIN" || socket.user.role === "MODERATOR") {
        this.broadcastAnnouncementDeleted(data, socket.userId);
      }
    });

    socket.on("update_notification_settings", async (data) => {
      await this.handleUpdateNotificationSettings(socket, data);
    });

    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  }

  async handleDisconnection(socket, reason) {
    const userId = socket.userId;
    const socketId = socket.id;

    try {
      if (this.userSockets.has(userId)) {
        this.userSockets.get(userId).delete(socketId);
        if (this.userSockets.get(userId).size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.socketUsers.delete(socketId);
      this.deviceSessions.delete(socketId);

      this.liveSessions.forEach((participants, sessionId) => {
        if (participants.has(userId)) {
          participants.delete(userId);
          this.io.to(`live_${sessionId}`).emit("user_left_live", {
            userId,
            userName: `${socket.user.firstName} ${socket.user.lastName}`,
            totalParticipants: participants.size,
          });
        }
      });
    } catch (error) {
      console.error("Socket disconnection handling failed", error);
    }
  }

  async handleMarkNotificationsRead(socket, data) {
    try {
      const { notificationIds, markAll = false } = data;

      const where = { userId: socket.userId };
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

      socket.emit("notifications_marked_read", {
        notificationIds: markAll ? [] : notificationIds,
        markAll,
        count: result.count,
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: socket.userId, isRead: false },
      });

      socket.emit("unread_count_updated", { count: unreadCount });
    } catch (error) {
      console.error("Mark notifications read error:", error);
      socket.emit("error", { message: "Failed to mark notifications as read" });
    }
  }

  async handleUpdateNotificationSettings(socket, data) {
    try {
      const updatedSettings = await prisma.notificationSettings.upsert({
        where: { userId: socket.userId },
        update: data.settings,
        create: {
          userId: socket.userId,
          ...data.settings,
        },
      });

      socket.emit("notification_settings_updated", {
        success: true,
        settings: updatedSettings,
      });
    } catch (error) {
      console.error("Failed to update notification settings", error);
      socket.emit("error", {
        message: "Failed to update notification settings",
      });
    }
  }

  broadcastAnnouncementCreated(announcement, excludeUserId = null) {
    const eventData = {
      ...announcement,
      timestamp: new Date().toISOString(),
    };

    this.io
      .to("admins")
      .except(`user_${excludeUserId}`)
      .emit("announcement_created", eventData);
  }

  broadcastAnnouncementUpdated(announcement, excludeUserId = null) {
    const eventData = {
      ...announcement,
      timestamp: new Date().toISOString(),
    };

    this.io
      .to("admins")
      .except(`user_${excludeUserId}`)
      .emit("announcement_updated", eventData);
  }

  broadcastAnnouncementDeleted(data, excludeUserId = null) {
    const eventData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.io
      .to("admins")
      .except(`user_${excludeUserId}`)
      .emit("announcement_deleted", eventData);
  }

  broadcastAnnouncementStats(stats) {
    const eventData = {
      ...stats,
      timestamp: new Date().toISOString(),
    };

    this.io.to("admins").emit("announcement_stats_updated", eventData);
  }

  async sendNotificationToUser(userId, notification) {
    try {
      if (this.isUserOnline(userId)) {
        this.sendToUser(userId, "notification", notification);

        const unreadCount = await prisma.notification.count({
          where: { userId, isRead: false },
        });

        this.sendToUser(userId, "unread_count_updated", { count: unreadCount });
      }
    } catch (error) {
      console.error("Failed to send notification to user:", error);
    }
  }

  async sendBulkNotificationsToUser(userId, notifications) {
    try {
      if (this.isUserOnline(userId)) {
        this.sendToUser(userId, "bulk_notifications", notifications);

        const unreadCount = await prisma.notification.count({
          where: { userId, isRead: false },
        });

        this.sendToUser(userId, "unread_count_updated", { count: unreadCount });
      }
    } catch (error) {
      console.error("Failed to send bulk notifications to user:", error);
    }
  }

  async sendPendingNotifications(userId) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          isRead: false,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });

      if (notifications.length > 0) {
        this.sendToUser(userId, "pending_notifications", {
          notifications: notifications,
          count: notifications.length,
        });
      }
    } catch (error) {
      console.error("Failed to send pending notifications", error);
    }
  }

  sendToUser(userId, event, data) {
    if (this.userSockets.has(userId)) {
      const eventData = {
        ...data,
        timestamp: new Date().toISOString(),
      };
      this.io.to(`user_${userId}`).emit(event, eventData);
    } else {
    }
  }

  sendToUsers(userIds, event, data) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, event, data);
    });
  }

  sendToRole(role, event, data) {
    const eventData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    let roomName = "all_users";
    if (role === "STUDENT") roomName = "students";
    else if (role === "INSTRUCTOR") roomName = "instructors";
    else if (role === "ADMIN" || role === "MODERATOR") roomName = "admins";

    this.io.to(roomName).emit(event, eventData);
  }

  sendToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcast(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastAnnouncement(announcement, targetAudience = "ALL") {
    const eventData = {
      announcement,
      timestamp: new Date().toISOString(),
    };

    this.io.emit("announcement_created", eventData);

    let roomName = "all_users";
    if (targetAudience === "STUDENTS") roomName = "students";
    else if (targetAudience === "INSTRUCTORS") roomName = "instructors";
    else if (targetAudience === "ADMINS") roomName = "admins";

    this.io.to(roomName).emit("announcement_broadcast", eventData);
  }

  emitBulkNotificationsToAudience(userIds, notifications) {
    const notificationsByUser = notifications.reduce((acc, notification) => {
      if (!acc[notification.userId]) {
        acc[notification.userId] = [];
      }
      acc[notification.userId].push(notification);
      return acc;
    }, {});

    Object.entries(notificationsByUser).forEach(
      ([userId, userNotifications]) => {
        this.sendBulkNotificationsToUser(userId, userNotifications);
      }
    );
  }

  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  getUserDeviceCount(userId) {
    return this.userSockets.get(userId)?.size || 0;
  }

  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }

  getOnlineUsersByRole(role) {
    const onlineUsers = [];
    this.userSockets.forEach((sockets, userId) => {
      sockets.forEach((socketId) => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket && socket.user.role === role) {
          onlineUsers.push({
            userId,
            userName: `${socket.user.firstName} ${socket.user.lastName}`,
            connectedDevices: sockets.size,
          });
        }
      });
    });
    return onlineUsers;
  }

  getSystemStats() {
    return {
      connectedUsers: this.userSockets.size,
      totalSockets: this.socketUsers.size,
      activeRooms: this.rooms.size,
      activeLiveSessions: this.liveSessions.size,
      onlineStudents: this.getOnlineUsersByRole("STUDENT").length,
      onlineInstructors: this.getOnlineUsersByRole("INSTRUCTOR").length,
      onlineAdmins: this.getOnlineUsersByRole("ADMIN").length,
      timestamp: new Date().toISOString(),
    };
  }

  disconnectUser(userId, reason = "admin_action") {
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).forEach((socketId) => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit("force_disconnect", {
            reason,
            message: "Your connection has been terminated by an administrator.",
          });
          socket.disconnect(true);
        }
      });
    }
  }

  broadcastEmergency(message, priority = "urgent") {
    this.broadcast("emergency_notification", {
      message,
      type: "emergency",
      priority,
      requiresAcknowledgment: true,
    });
  }

  broadcastMaintenance(maintenanceData) {
    this.broadcast("maintenance_notification", {
      startTime: maintenanceData.startTime,
      endTime: maintenanceData.endTime,
      description: maintenanceData.description,
      affectedServices: maintenanceData.services,
      type: "maintenance",
    });
  }

  broadcastSystemUpdate(updateData) {
    this.broadcast("system_update", {
      version: updateData.version,
      features: updateData.features,
      updateTime: updateData.updateTime,
      requiresReload: updateData.requiresReload || false,
    });
  }

  cleanupInactiveConnections() {
    const now = Date.now();

    this.deviceSessions.forEach((deviceInfo, socketId) => {
      if (now - deviceInfo.connectedAt.getTime() > maxIdleTime) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket && !socket.connected) {
          this.handleDisconnection(socket, "idle_timeout");
        }
      }
    });

    this.liveSessions.forEach((participants, sessionId) => {
      if (participants.size === 0) {
        this.liveSessions.delete(sessionId);
      }
    });

    this.rooms.forEach((members, roomId) => {
      if (members.size === 0) {
        this.rooms.delete(roomId);
      }
    });
  }

  notifyPaymentSuccess(userId, paymentData) {
    this.sendToUser(userId, "payment_confirmed", {
      paymentId: paymentData.paymentId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      courses: paymentData.courses,
      accessGranted: true,
      receiptUrl: paymentData.receiptUrl,
    });
  }

  notifyPaymentFailed(userId, paymentData) {
    this.sendToUser(userId, "payment_failed", {
      paymentId: paymentData.paymentId,
      amount: paymentData.amount,
      reason: paymentData.reason,
      retryUrl: paymentData.retryUrl,
    });
  }

  notifyNewEnrollment(instructorId, enrollmentData) {
    this.sendToUser(instructorId, "new_student_enrolled", {
      studentName: enrollmentData.studentName,
      studentEmail: enrollmentData.studentEmail,
      courseName: enrollmentData.courseName,
      amount: enrollmentData.amount,
      enrolledAt: enrollmentData.enrolledAt,
    });
  }

  notifyCertificateIssued(studentId, certificateData) {
    this.sendToUser(studentId, "certificate_ready", {
      courseName: certificateData.courseName,
      certificateId: certificateData.certificateId,
      downloadUrl: certificateData.downloadUrl,
      shareUrl: certificateData.shareUrl,
      issuedAt: certificateData.issuedAt,
    });
  }

  notifyRefundProcessed(userId, refundData) {
    this.sendToUser(userId, "refund_processed", {
      refundId: refundData.refundId,
      amount: refundData.amount,
      reason: refundData.reason,
      processedAt: refundData.processedAt,
      estimatedDelivery: refundData.estimatedDelivery,
    });
  }

  notifyPayoutProcessed(instructorId, payoutData) {
    this.sendToUser(instructorId, "payout_processed", {
      payoutId: payoutData.payoutId,
      amount: payoutData.amount,
      currency: payoutData.currency,
      method: payoutData.method,
      processedAt: payoutData.processedAt,
    });
  }
}

const socketManager = new SocketManager();

setInterval(() => {
  socketManager.cleanupInactiveConnections();
}, 5 * 60 * 1000);

setInterval(() => {
  const stats = socketManager.getSystemStats();
}, 60 * 60 * 1000);

export default socketManager;
