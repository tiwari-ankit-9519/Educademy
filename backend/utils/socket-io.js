import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const maxIdleTime = 30 * 60 * 1000; // 30 minutes

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
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    return this.io;
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
          return next(new Error("Invalid user"));
        }

        if (!user.isActive) {
          return next(new Error("Account is inactive"));
        }

        socket.userId = user.id;
        socket.user = user;
        socket.deviceInfo = {
          userAgent: socket.handshake.headers["user-agent"],
          ip: socket.handshake.address,
          connectedAt: new Date(),
        };

        next();
      } catch (error) {
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

      socket.join(`user:${userId}`);
      socket.join(`role:${socket.user.role}`);

      await this.createDeviceSession(socket);

      socket.emit("connected", {
        success: true,
        message: "Connected successfully",
        userId: userId,
        connectedDevices: this.userSockets.get(userId).size,
        timestamp: new Date().toISOString(),
      });

      await this.checkAndNotifyNewDevice(socket);
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

    socket.on("join_course", (data) => {
      this.handleJoinCourse(socket, data);
    });

    socket.on("leave_course", (data) => {
      this.handleLeaveCourse(socket, data);
    });

    socket.on("join_live_session", (data) => {
      this.handleJoinLiveSession(socket, data);
    });

    socket.on("leave_live_session", (data) => {
      this.handleLeaveLiveSession(socket, data);
    });

    socket.on("mark_notifications_read", (data) => {
      this.handleMarkNotificationsRead(socket, data);
    });

    socket.on("update_notification_settings", (data) => {
      this.handleUpdateNotificationSettings(socket, data);
    });

    socket.on("lesson_completed", (data) => {
      this.handleLessonCompleted(socket, data);
    });

    socket.on("course_progress_update", (data) => {
      this.handleCourseProgressUpdate(socket, data);
    });

    socket.on("quiz_submitted_for_grading", (data) => {
      this.handleQuizSubmittedForGrading(socket, data);
    });

    socket.on("assignment_submitted", (data) => {
      this.handleAssignmentSubmitted(socket, data);
    });

    socket.on("question_asked", (data) => {
      this.handleQuestionAsked(socket, data);
    });

    socket.on("question_answered", (data) => {
      this.handleQuestionAnswered(socket, data);
    });

    socket.on("send_message", (data) => {
      this.handleSendMessage(socket, data);
    });

    socket.on("typing", (data) => {
      this.handleTyping(socket, data);
    });

    socket.on("live_interaction", (data) => {
      this.handleLiveSessionInteraction(socket, data);
    });

    socket.on("screen_share", (data) => {
      this.handleScreenShare(socket, data);
    });

    socket.on("grade_submitted", (data) => {
      this.handleGradeSubmitted(socket, data);
    });

    socket.on("course_content_updated", (data) => {
      this.handleCourseContentUpdated(socket, data);
    });

    socket.on("admin_action", (data) => {
      this.handleAdminAction(socket, data);
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

      await this.updateDeviceSession(socketId, reason);

      this.liveSessions.forEach((participants, sessionId) => {
        if (participants.has(userId)) {
          participants.delete(userId);
          this.io.to(`live:${sessionId}`).emit("user_left_live", {
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

  async checkAndNotifyNewDevice(socket) {
    try {
      const recentSessions = await prisma.session.findMany({
        where: {
          userId: socket.userId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const currentDevice = this.getDeviceType(socket.deviceInfo.userAgent);
      const currentOS = this.getOS(socket.deviceInfo.userAgent);
      const currentIP = socket.deviceInfo.ip;

      const isSuspicious = !recentSessions.some(
        (session) =>
          session.deviceType === currentDevice &&
          session.ipAddress === currentIP
      );

      if (isSuspicious) {
        socket.emit("security_alert", {
          type: "new_device_login",
          deviceInfo: {
            device: currentDevice,
            os: currentOS,
            ip: currentIP,
            location: "Unknown",
            timestamp: new Date(),
          },
          message:
            "New device login detected. If this wasn't you, please secure your account.",
        });
      }
    } catch (error) {
      console.error("Failed to check device security", error);
    }
  }

  async handleJoinCourse(socket, data) {
    const { courseId } = data;

    try {
      const hasAccess = await this.checkCourseAccess(
        socket.userId,
        courseId,
        socket.user.role
      );

      if (!hasAccess) {
        socket.emit("error", { message: "No access to this course" });
        return;
      }

      if (socket.user.role === "STUDENT") {
        socket.join(`course:${courseId}:students`);
      } else if (socket.user.role === "INSTRUCTOR") {
        socket.join(`course:${courseId}:instructor`);
      }

      socket.join(`course:${courseId}`);
      socket.emit("joined_course", { courseId });
    } catch (error) {
      console.error("Failed to join course", error);
      socket.emit("error", { message: "Failed to join course" });
    }
  }

  handleLeaveCourse(socket, data) {
    const { courseId } = data;

    socket.leave(`course:${courseId}`);
    socket.leave(`course:${courseId}:students`);
    socket.leave(`course:${courseId}:instructor`);

    socket.emit("left_course", { courseId });
  }

  async checkCourseAccess(userId, courseId, role) {
    try {
      if (role === "STUDENT") {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            studentId_courseId: {
              studentId: userId,
              courseId: courseId,
            },
          },
        });
        return !!enrollment;
      } else if (role === "INSTRUCTOR") {
        const course = await prisma.course.findFirst({
          where: {
            id: courseId,
            instructorId: userId,
          },
        });
        return !!course;
      } else if (role === "ADMIN") {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to check course access", error);
      return false;
    }
  }

  handleLessonCompleted(socket, data) {
    const { courseId, lessonId, completionTime, progress } = data;

    socket.to(`course:${courseId}:instructor`).emit("student_progress_update", {
      type: "lesson_completed",
      studentId: socket.userId,
      studentName: `${socket.user.firstName} ${socket.user.lastName}`,
      lessonId,
      completionTime,
      overallProgress: progress,
      timestamp: new Date(),
    });
  }

  handleCourseProgressUpdate(socket, data) {
    const { courseId, progressPercentage, milestonesReached } = data;

    if (milestonesReached && milestonesReached.length > 0) {
      socket.to(`course:${courseId}:instructor`).emit("student_milestone", {
        studentId: socket.userId,
        studentName: `${socket.user.firstName} ${socket.user.lastName}`,
        milestones: milestonesReached,
        currentProgress: progressPercentage,
        timestamp: new Date(),
      });
    }
  }

  handleQuizSubmittedForGrading(socket, data) {
    const { quizId, courseId, needsManualGrading, hasEssayQuestions } = data;

    if (needsManualGrading || hasEssayQuestions) {
      socket.to(`course:${courseId}:instructor`).emit("grading_required", {
        type: "quiz",
        studentId: socket.userId,
        studentName: `${socket.user.firstName} ${socket.user.lastName}`,
        quizId,
        requiresManualReview: hasEssayQuestions,
        submittedAt: new Date(),
      });
    }
  }

  handleAssignmentSubmitted(socket, data) {
    const { assignmentId, courseId, submissionType } = data;

    socket.to(`course:${courseId}:instructor`).emit("grading_required", {
      type: "assignment",
      studentId: socket.userId,
      studentName: `${socket.user.firstName} ${socket.user.lastName}`,
      assignmentId,
      submissionType,
      submittedAt: new Date(),
    });
  }

  handleQuestionAsked(socket, data) {
    const { courseId, questionText, lessonId, isUrgent } = data;

    socket.to(`course:${courseId}:instructor`).emit("student_question", {
      studentId: socket.userId,
      studentName: `${socket.user.firstName} ${socket.user.lastName}`,
      questionText: questionText.substring(0, 200),
      lessonId,
      courseId,
      isUrgent: isUrgent || false,
      timestamp: new Date(),
    });
  }

  handleQuestionAnswered(socket, data) {
    const { questionId, studentId, answer, isHelpful } = data;

    this.sendToUser(studentId, "your_question_answered", {
      questionId,
      instructorName: `${socket.user.firstName} ${socket.user.lastName}`,
      answerPreview: answer.substring(0, 100),
      isDetailed: answer.length > 100,
      answeredAt: new Date(),
    });
  }

  handleGradeSubmitted(socket, data) {
    const { studentId, gradeData } = data;

    this.sendToUser(studentId, "work_graded", {
      type: gradeData.type,
      title: gradeData.title,
      grade: gradeData.grade,
      maxGrade: gradeData.maxGrade,
      percentage: gradeData.percentage,
      passed: gradeData.passed,
      feedback: gradeData.feedback,
      gradedAt: new Date(),
    });
  }

  handleCourseContentUpdated(socket, data) {
    const { courseId, updateType, newContent } = data;

    const significantUpdates = [
      "new_lesson",
      "new_section",
      "new_assignment",
      "new_quiz",
    ];

    if (significantUpdates.includes(updateType)) {
      socket.to(`course:${courseId}:students`).emit("course_updated", {
        courseId,
        updateType,
        title: newContent.title,
        description: `New ${updateType.replace("new_", "")} added: ${
          newContent.title
        }`,
        updatedAt: new Date(),
      });
    }
  }

  handleJoinLiveSession(socket, data) {
    const { sessionId, courseId } = data;

    socket.join(`live:${sessionId}`);

    if (!this.liveSessions.has(sessionId)) {
      this.liveSessions.set(sessionId, new Set());
    }
    this.liveSessions.get(sessionId).add(socket.userId);

    socket.to(`live:${sessionId}`).emit("user_joined_live", {
      userId: socket.userId,
      userName: `${socket.user.firstName} ${socket.user.lastName}`,
      role: socket.user.role,
      totalParticipants: this.liveSessions.get(sessionId).size,
    });

    socket.emit("joined_live_session", {
      sessionId,
      totalParticipants: this.liveSessions.get(sessionId).size,
    });
  }

  handleLeaveLiveSession(socket, data) {
    const { sessionId } = data;

    socket.leave(`live:${sessionId}`);

    if (this.liveSessions.has(sessionId)) {
      this.liveSessions.get(sessionId).delete(socket.userId);

      socket.to(`live:${sessionId}`).emit("user_left_live", {
        userId: socket.userId,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        totalParticipants: this.liveSessions.get(sessionId).size,
      });

      if (this.liveSessions.get(sessionId).size === 0) {
        this.liveSessions.delete(sessionId);
      }
    }
  }

  handleLiveSessionInteraction(socket, data) {
    const { sessionId, type, content } = data;

    socket.to(`live:${sessionId}`).emit("live_interaction", {
      userId: socket.userId,
      userName: `${socket.user.firstName} ${socket.user.lastName}`,
      role: socket.user.role,
      type,
      content,
      timestamp: new Date(),
    });
  }

  handleScreenShare(socket, data) {
    const { sessionId, isSharing, streamId } = data;

    socket.to(`live:${sessionId}`).emit("screen_share_update", {
      userId: socket.userId,
      userName: `${socket.user.firstName} ${socket.user.lastName}`,
      isSharing,
      streamId,
      timestamp: new Date(),
    });
  }

  handleTyping(socket, data) {
    const { roomId, isTyping } = data;

    socket.to(roomId).emit("user_typing", {
      userId: socket.userId,
      userName: `${socket.user.firstName} ${socket.user.lastName}`,
      isTyping,
    });
  }

  async handleSendMessage(socket, data) {
    const { receiverId, content, messageType, attachments } = data;

    try {
      const message = await prisma.message.create({
        data: {
          senderId: socket.userId,
          receiverId,
          content,
          messageType: messageType || "DIRECT",
          attachments: attachments || null,
        },
      });

      this.sendToUser(receiverId, "new_message", {
        messageId: message.id,
        senderId: socket.userId,
        senderName: `${socket.user.firstName} ${socket.user.lastName}`,
        content,
        messageType,
        hasAttachments: !!attachments,
        sentAt: message.createdAt,
      });

      socket.emit("message_sent", { messageId: message.id });
    } catch (error) {
      console.error("Failed to send message", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  }

  handleAdminAction(socket, data) {
    if (socket.user.role !== "ADMIN" && socket.user.role !== "MODERATOR") {
      socket.emit("error", { message: "Unauthorized action" });
      return;
    }

    const { action, targetUserId, reason, data: actionData } = data;

    switch (action) {
      case "ban_user":
        this.sendToUser(targetUserId, "account_action", {
          action: "banned",
          reason,
          effectiveDate: new Date(),
          appealProcess: "Contact support to appeal this decision",
        });
        break;

      case "warn_user":
        this.sendToUser(targetUserId, "account_action", {
          action: "warning",
          reason,
          effectiveDate: new Date(),
          consequences: "Further violations may result in account suspension",
        });
        break;

      case "course_approved":
        this.sendToUser(targetUserId, "course_status_update", {
          courseId: actionData.courseId,
          courseName: actionData.courseName,
          status: "approved",
          message:
            "Congratulations! Your course has been approved and is now live.",
          approvedAt: new Date(),
        });
        break;

      case "course_rejected":
        this.sendToUser(targetUserId, "course_status_update", {
          courseId: actionData.courseId,
          courseName: actionData.courseName,
          status: "rejected",
          feedback: reason,
          resubmissionAllowed: true,
          rejectedAt: new Date(),
        });
        break;
    }
  }

  async handleUpdateNotificationSettings(socket, data) {
    try {
      await prisma.notificationSettings.upsert({
        where: { userId: socket.userId },
        update: data.settings,
        create: {
          userId: socket.userId,
          ...data.settings,
        },
      });

      socket.emit("notification_settings_updated", {
        success: true,
        settings: data.settings,
      });
    } catch (error) {
      console.error("Failed to update notification settings", error);
      socket.emit("error", {
        message: "Failed to update notification settings",
      });
    }
  }

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
      console.error("Failed to mark notifications as read", error);
    }
  }

  async sendNotificationToUser(userId, notification) {
    try {
      const settings = await prisma.notificationSettings.findUnique({
        where: { userId },
      });

      if (!settings) return;

      const shouldSend = this.shouldSendNotification(notification, settings);

      if (shouldSend && this.isUserOnline(userId)) {
        this.sendToUser(userId, "notification", notification);
      }
    } catch (error) {
      console.error("Failed to send notification", error);
    }
  }

  shouldSendNotification(notification, settings) {
    const typeMap = {
      your_question_answered: settings.discussionUpdates,
      work_graded: settings.assignmentUpdates,
      certificate_ready: true,
      course_updated: settings.courseUpdates,
      payment_confirmed: settings.paymentUpdates,
      payment_failed: settings.paymentUpdates,
      refund_processed: settings.paymentUpdates,
      new_student_enrolled: settings.courseUpdates,
      course_status_update: settings.courseUpdates,
      new_message: true,
      account_action: settings.accountUpdates,
      security_alert: true,
      system_maintenance: settings.accountUpdates,
    };

    return settings.inApp && (typeMap[notification.type] ?? false);
  }

  async sendPendingNotifications(userId) {
    try {
      const settings = await prisma.notificationSettings.findUnique({
        where: { userId },
      });

      if (!settings || !settings.inApp) return;

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

      const filteredNotifications = notifications.filter((notification) =>
        this.shouldSendNotification(notification, settings)
      );

      if (filteredNotifications.length > 0) {
        this.sendToUser(userId, "pending_notifications", {
          notifications: filteredNotifications,
          count: filteredNotifications.length,
        });
      }
    } catch (error) {
      console.error("Failed to send pending notifications", error);
    }
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

  async createDeviceSession(socket) {
    try {
      await prisma.session.create({
        data: {
          deviceType: this.getDeviceType(socket.deviceInfo.userAgent),
          operatingSystem: this.getOS(socket.deviceInfo.userAgent),
          browser: this.getBrowser(socket.deviceInfo.userAgent),
          ipAddress: socket.deviceInfo.ip,
          isActive: true,
          lastActivity: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          token: socket.id,
          userId: socket.userId,
        },
      });
    } catch (error) {
      console.error("Failed to create device session", error);
    }
  }

  async updateDeviceSession(socketId, reason) {
    try {
      await prisma.session.updateMany({
        where: { token: socketId },
        data: {
          isActive: false,
          lastActivity: new Date(),
        },
      });
    } catch (error) {
      console.error("Failed to update device session", error);
    }
  }

  sendToUser(userId, event, data) {
    if (this.userSockets.has(userId)) {
      this.io.to(`user:${userId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  sendToUsers(userIds, event, data) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, event, data);
    });
  }

  sendToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  sendToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  sendToCourse(courseId, event, data) {
    this.io.to(`course:${courseId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  sendToLiveSession(sessionId, event, data) {
    this.io.to(`live:${sessionId}`).emit(event, {
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

  getRoomStats(roomId) {
    return {
      roomId,
      memberCount: this.rooms.get(roomId)?.size || 0,
      members: Array.from(this.rooms.get(roomId) || []),
    };
  }

  getLiveSessionStats(sessionId) {
    return {
      sessionId,
      participantCount: this.liveSessions.get(sessionId)?.size || 0,
      participants: Array.from(this.liveSessions.get(sessionId) || []),
    };
  }

  getUserConnectionHistory(userId) {
    const connections = [];
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).forEach((socketId) => {
        const deviceInfo = this.deviceSessions.get(socketId);
        if (deviceInfo) {
          connections.push(deviceInfo);
        }
      });
    }
    return connections;
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

  disconnectUserFromCourse(userId, courseId, reason = "admin_action") {
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).forEach((socketId) => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.leave(`course:${courseId}`);
          socket.leave(`course:${courseId}:students`);
          socket.leave(`course:${courseId}:instructor`);
          socket.emit("removed_from_course", {
            courseId,
            reason,
            message: "You have been removed from this course.",
          });
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

  broadcastSystemUpdate(updateData) {
    this.broadcast("system_update", {
      version: updateData.version,
      features: updateData.features,
      updateTime: updateData.updateTime,
      requiresReload: updateData.requiresReload || false,
    });
  }

  announceToCourse(courseId, announcement) {
    this.sendToCourse(courseId, "course_announcement", {
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority || "normal",
      fromInstructor: announcement.fromInstructor || false,
    });
  }

  controlLiveSession(sessionId, action, data = {}) {
    this.sendToLiveSession(sessionId, "session_control", {
      action,
      ...data,
    });
  }

  notifyUserGroup(userIds, notification) {
    userIds.forEach((userId) => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  announceToRole(role, announcement) {
    this.sendToRole(role, "role_announcement", {
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority || "normal",
      actionRequired: announcement.actionRequired || false,
    });
  }
}

const socketManager = new SocketManager();

setInterval(() => {
  socketManager.cleanupInactiveConnections();
}, 5 * 60 * 1000);

setInterval(() => {
  const stats = socketManager.getSystemStats();
  console.log("Socket.io System Stats:", stats);
}, 60 * 60 * 1000);

export default socketManager;
