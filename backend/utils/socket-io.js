import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import educademyLogger from "../utils/logger.js";

const prisma = new PrismaClient();

class SocketManager {
  constructor() {
    this.io = null;
    this.userSockets = new Map();
    this.socketUsers = new Map();
    this.deviceSessions = new Map();
    this.rooms = new Map();
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    educademyLogger.success("Socket.IO server initialized", {
      cors: process.env.FRONTEND_URL || "http://localhost:3000",
    });

    return this.io;
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          educademyLogger.logSecurityEvent(
            "SOCKET_AUTH_MISSING_TOKEN",
            "MEDIUM",
            { socketId: socket.id, ip: socket.handshake.address }
          );
          return next(new Error("Authentication token required"));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
          },
        });

        if (!user) {
          educademyLogger.logSecurityEvent("SOCKET_AUTH_INVALID_USER", "HIGH", {
            userId: decoded.id,
            socketId: socket.id,
          });
          return next(new Error("Invalid user"));
        }

        if (!user.isActive) {
          educademyLogger.logSecurityEvent(
            "SOCKET_AUTH_INACTIVE_USER",
            "HIGH",
            { userId: user.id, socketId: socket.id }
          );
          return next(new Error("Account is inactive"));
        }

        // Store user info in socket
        socket.userId = user.id;
        socket.user = user;
        socket.deviceInfo = {
          userAgent: socket.handshake.headers["user-agent"],
          ip: socket.handshake.address,
          connectedAt: new Date(),
        };

        educademyLogger.logSecurityEvent(
          "SOCKET_AUTH_SUCCESS",
          "INFO",
          {
            userId: user.id,
            socketId: socket.id,
            userAgent: socket.deviceInfo.userAgent,
            ip: socket.deviceInfo.ip,
          },
          user.id
        );

        next();
      } catch (error) {
        educademyLogger.logSecurityEvent("SOCKET_AUTH_ERROR", "HIGH", {
          error: error.message,
          socketId: socket.id,
          ip: socket.handshake.address,
        });
        next(new Error("Authentication failed"));
      }
    });
  }

  /**
   * Setup main event handlers
   */
  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      this.handleConnection(socket);
      this.setupSocketEventHandlers(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  async handleConnection(socket) {
    const userId = socket.userId;
    const socketId = socket.id;

    try {
      // Track user connections (multi-device support)
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(socketId);
      this.socketUsers.set(socketId, userId);
      this.deviceSessions.set(socketId, socket.deviceInfo);

      // Join user to their personal room
      socket.join(`user:${userId}`);

      // Join role-based rooms
      socket.join(`role:${socket.user.role}`);

      // Store device session in database
      await this.createDeviceSession(socket);

      // Emit connection success
      socket.emit("connected", {
        success: true,
        message: "Connected successfully",
        userId: userId,
        connectedDevices: this.userSockets.get(userId).size,
        timestamp: new Date().toISOString(),
      });

      // Notify other devices of new connection
      socket.to(`user:${userId}`).emit("new_device_connected", {
        deviceInfo: {
          userAgent: socket.deviceInfo.userAgent,
          ip: socket.deviceInfo.ip,
          connectedAt: socket.deviceInfo.connectedAt,
        },
        totalDevices: this.userSockets.get(userId).size,
      });

      educademyLogger.logBusinessOperation(
        "SOCKET_CONNECTION",
        "USER_SESSION",
        userId,
        "SUCCESS",
        {
          socketId,
          totalDevices: this.userSockets.get(userId).size,
          userAgent: socket.deviceInfo.userAgent,
          ip: socket.deviceInfo.ip,
        }
      );

      // Send pending notifications
      await this.sendPendingNotifications(userId);
    } catch (error) {
      educademyLogger.error("Socket connection handling failed", error, {
        userId,
        socketId,
        business: {
          operation: "SOCKET_CONNECTION",
          entity: "USER_SESSION",
          status: "ERROR",
        },
      });
    }
  }

  /**
   * Setup individual socket event handlers
   */
  setupSocketEventHandlers(socket) {
    // Handle disconnection
    socket.on("disconnect", (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Join specific rooms (courses, discussions, etc.)
    socket.on("join_room", (data) => {
      this.handleJoinRoom(socket, data);
    });

    // Leave specific rooms
    socket.on("leave_room", (data) => {
      this.handleLeaveRoom(socket, data);
    });

    // Mark notifications as read
    socket.on("mark_notifications_read", (data) => {
      this.handleMarkNotificationsRead(socket, data);
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      this.handleTyping(socket, data);
    });

    // Handle course-related events
    socket.on("join_course", (data) => {
      this.handleJoinCourse(socket, data);
    });

    // Handle discussion events
    socket.on("join_discussion", (data) => {
      this.handleJoinDiscussion(socket, data);
    });

    // Handle live session events
    socket.on("join_live_session", (data) => {
      this.handleJoinLiveSession(socket, data);
    });

    // Handle ping for connection health
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });

    // Handle user status updates
    socket.on("update_status", (data) => {
      this.handleStatusUpdate(socket, data);
    });
  }

  /**
   * Handle socket disconnection
   */
  async handleDisconnection(socket, reason) {
    const userId = socket.userId;
    const socketId = socket.id;

    try {
      // Remove from tracking maps
      if (this.userSockets.has(userId)) {
        this.userSockets.get(userId).delete(socketId);
        if (this.userSockets.get(userId).size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.socketUsers.delete(socketId);
      this.deviceSessions.delete(socketId);

      // Update device session in database
      await this.updateDeviceSession(socketId, reason);

      // Notify other devices
      if (this.userSockets.has(userId)) {
        this.io.to(`user:${userId}`).emit("device_disconnected", {
          reason,
          totalDevices: this.userSockets.get(userId).size,
          timestamp: new Date().toISOString(),
        });
      }

      educademyLogger.logBusinessOperation(
        "SOCKET_DISCONNECTION",
        "USER_SESSION",
        userId,
        "SUCCESS",
        {
          socketId,
          reason,
          remainingDevices: this.userSockets.get(userId)?.size || 0,
        }
      );
    } catch (error) {
      educademyLogger.error("Socket disconnection handling failed", error, {
        userId,
        socketId,
        reason,
      });
    }
  }

  /**
   * Join room handler
   */
  handleJoinRoom(socket, data) {
    const { roomId, roomType } = data;

    if (!roomId || !roomType) {
      socket.emit("error", { message: "Room ID and type are required" });
      return;
    }

    const fullRoomId = `${roomType}:${roomId}`;
    socket.join(fullRoomId);

    // Track room membership
    if (!this.rooms.has(fullRoomId)) {
      this.rooms.set(fullRoomId, new Set());
    }
    this.rooms.get(fullRoomId).add(socket.id);

    socket.emit("joined_room", {
      roomId: fullRoomId,
      members: this.rooms.get(fullRoomId).size,
    });

    educademyLogger.logBusinessOperation(
      "SOCKET_JOIN_ROOM",
      "ROOM",
      roomId,
      "SUCCESS",
      {
        userId: socket.userId,
        socketId: socket.id,
        roomType,
        members: this.rooms.get(fullRoomId).size,
      }
    );
  }

  /**
   * Leave room handler
   */
  handleLeaveRoom(socket, data) {
    const { roomId, roomType } = data;
    const fullRoomId = `${roomType}:${roomId}`;

    socket.leave(fullRoomId);

    if (this.rooms.has(fullRoomId)) {
      this.rooms.get(fullRoomId).delete(socket.id);
      if (this.rooms.get(fullRoomId).size === 0) {
        this.rooms.delete(fullRoomId);
      }
    }

    socket.emit("left_room", { roomId: fullRoomId });
  }

  /**
   * Handle course joining
   */
  async handleJoinCourse(socket, data) {
    const { courseId } = data;

    try {
      // Verify user is enrolled in course
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: socket.user.role === "STUDENT" ? socket.userId : "",
            courseId: courseId,
          },
        },
      });

      if (!enrollment && socket.user.role === "STUDENT") {
        socket.emit("error", { message: "Not enrolled in this course" });
        return;
      }

      socket.join(`course:${courseId}`);
      socket.emit("joined_course", { courseId });
    } catch (error) {
      educademyLogger.error("Failed to join course", error, {
        userId: socket.userId,
        courseId,
      });
      socket.emit("error", { message: "Failed to join course" });
    }
  }

  /**
   * Handle typing indicators
   */
  handleTyping(socket, data) {
    const { roomId, isTyping } = data;

    socket.to(roomId).emit("user_typing", {
      userId: socket.userId,
      userName: `${socket.user.firstName} ${socket.user.lastName}`,
      isTyping,
    });
  }

  /**
   * Mark notifications as read
   */
  async handleMarkNotificationsRead(socket, data) {
    const { notificationIds } = data;

    try {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: socket.userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      socket.emit("notifications_marked_read", { notificationIds });
    } catch (error) {
      educademyLogger.error("Failed to mark notifications as read", error, {
        userId: socket.userId,
        notificationIds,
      });
    }
  }

  /**
   * Send pending notifications to user
   */
  async sendPendingNotifications(userId) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          isRead: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      });

      if (notifications.length > 0) {
        this.sendToUser(userId, "pending_notifications", {
          notifications,
          count: notifications.length,
        });
      }
    } catch (error) {
      educademyLogger.error("Failed to send pending notifications", error, {
        userId,
      });
    }
  }

  /**
   * Create device session in database
   */
  async createDeviceSession(socket) {
    try {
      await prisma.deviceSession.create({
        data: {
          deviceType: this.getDeviceType(socket.deviceInfo.userAgent),
          operatingSystem: this.getOS(socket.deviceInfo.userAgent),
          browser: this.getBrowser(socket.deviceInfo.userAgent),
          ipAddress: socket.deviceInfo.ip,
          isActive: true,
          lastActivity: new Date(),
          userId: socket.userId,
        },
      });
    } catch (error) {
      educademyLogger.error("Failed to create device session", error, {
        userId: socket.userId,
        socketId: socket.id,
      });
    }
  }

  /**
   * Update device session on disconnect
   */
  async updateDeviceSession(socketId, reason) {
    // Implementation depends on how you want to track sessions
    // Could update lastActivity, set isActive to false, etc.
  }

  // =============================================
  // PUBLIC METHODS FOR SENDING NOTIFICATIONS
  // =============================================

  /**
   * Send notification to specific user (all devices)
   */
  sendToUser(userId, event, data) {
    if (this.userSockets.has(userId)) {
      this.io.to(`user:${userId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });

      educademyLogger.logBusinessOperation(
        "SOCKET_SEND_TO_USER",
        "NOTIFICATION",
        userId,
        "SUCCESS",
        {
          event,
          deviceCount: this.userSockets.get(userId).size,
        }
      );
    }
  }

  /**
   * Send notification to multiple users
   */
  sendToUsers(userIds, event, data) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, event, data);
    });
  }

  /**
   * Send to all users with specific role
   */
  sendToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    educademyLogger.logBusinessOperation(
      "SOCKET_SEND_TO_ROLE",
      "NOTIFICATION",
      null,
      "SUCCESS",
      { event, role }
    );
  }

  /**
   * Send to specific room
   */
  sendToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    educademyLogger.logBusinessOperation(
      "SOCKET_SEND_TO_ROOM",
      "NOTIFICATION",
      roomId,
      "SUCCESS",
      { event }
    );
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    educademyLogger.logBusinessOperation(
      "SOCKET_BROADCAST",
      "NOTIFICATION",
      null,
      "SUCCESS",
      { event }
    );
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  /**
   * Get user's connected devices count
   */
  getUserDeviceCount(userId) {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  getDeviceType(userAgent) {
    if (/mobile/i.test(userAgent)) return "mobile";
    if (/tablet/i.test(userAgent)) return "tablet";
    return "desktop";
  }

  getOS(userAgent) {
    if (/windows/i.test(userAgent)) return "Windows";
    if (/macintosh|mac os/i.test(userAgent)) return "macOS";
    if (/linux/i.test(userAgent)) return "Linux";
    if (/android/i.test(userAgent)) return "Android";
    if (/iphone|ipad/i.test(userAgent)) return "iOS";
    return "Unknown";
  }

  getBrowser(userAgent) {
    if (/chrome/i.test(userAgent)) return "Chrome";
    if (/firefox/i.test(userAgent)) return "Firefox";
    if (/safari/i.test(userAgent)) return "Safari";
    if (/edge/i.test(userAgent)) return "Edge";
    return "Unknown";
  }
}

const socketManager = new SocketManager();

export default socketManager;
