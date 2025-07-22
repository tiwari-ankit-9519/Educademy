import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import redisService from "../../utils/redis.js";
import notificationService from "../../utils/notificationservice.js";

const prisma = new PrismaClient();

const generateRequestId = () => {
  return `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getSystemSettings = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const cacheKey = "system_settings";
    let cachedSettings = await redisService.getJSON(cacheKey);

    if (cachedSettings) {
      return res.status(200).json({
        success: true,
        message: "System settings retrieved successfully",
        data: cachedSettings,
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const settings = {
      platform: {
        name: process.env.PLATFORM_NAME || "Educademy",
        description:
          process.env.PLATFORM_DESCRIPTION || "Learn anything, anywhere",
        logo: process.env.PLATFORM_LOGO || "",
        favicon: process.env.PLATFORM_FAVICON || "",
        timezone: process.env.DEFAULT_TIMEZONE || "UTC",
        language: process.env.DEFAULT_LANGUAGE || "en",
        currency: process.env.DEFAULT_CURRENCY || "INR",
        contactEmail: process.env.CONTACT_EMAIL || "",
        supportEmail: process.env.SUPPORT_EMAIL || "",
        version: process.env.APP_VERSION || "1.0.0",
      },
      features: {
        enableRegistration: process.env.ENABLE_REGISTRATION !== "false",
        enableSocialLogin: process.env.ENABLE_SOCIAL_LOGIN !== "false",
        enableEmailVerification:
          process.env.ENABLE_EMAIL_VERIFICATION !== "false",
        enableCourseReview: process.env.ENABLE_COURSE_REVIEW !== "false",
        enableInstructorVerification:
          process.env.ENABLE_INSTRUCTOR_VERIFICATION !== "false",
        enableLiveStreaming: process.env.ENABLE_LIVE_STREAMING === "true",
        enableMobileApp: process.env.ENABLE_MOBILE_APP === "true",
        enableOfflineDownload: process.env.ENABLE_OFFLINE_DOWNLOAD === "true",
        enableCertificates: process.env.ENABLE_CERTIFICATES !== "false",
        enableCoupons: process.env.ENABLE_COUPONS !== "false",
      },
      limits: {
        maxCoursesPerInstructor:
          parseInt(process.env.MAX_COURSES_PER_INSTRUCTOR) || 100,
        maxStudentsPerCourse:
          parseInt(process.env.MAX_STUDENTS_PER_COURSE) || 10000,
        maxFileUploadSize: parseInt(process.env.MAX_FILE_UPLOAD_SIZE) || 100,
        maxVideoLength: parseInt(process.env.MAX_VIDEO_LENGTH) || 240,
        maxCoursePrice: parseInt(process.env.MAX_COURSE_PRICE) || 100000,
        minCoursePrice: parseInt(process.env.MIN_COURSE_PRICE) || 0,
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 2592000,
        rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS) || 1000,
      },
      payments: {
        enableRazorpay: process.env.ENABLE_RAZORPAY === "true",
        enableStripe: process.env.ENABLE_STRIPE === "true",
        enablePaypal: process.env.ENABLE_PAYPAL === "true",
        defaultCommission: parseFloat(process.env.DEFAULT_COMMISSION) || 0.3,
        minPayoutAmount: parseInt(process.env.MIN_PAYOUT_AMOUNT) || 1000,
        payoutSchedule: process.env.PAYOUT_SCHEDULE || "monthly",
        enableInstantPayout: process.env.ENABLE_INSTANT_PAYOUT === "true",
        enableRefunds: process.env.ENABLE_REFUNDS !== "false",
        refundWindow: parseInt(process.env.REFUND_WINDOW) || 30,
      },
      security: {
        enableTwoFactor: process.env.ENABLE_TWO_FACTOR === "true",
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
        passwordRequireSpecial:
          process.env.PASSWORD_REQUIRE_SPECIAL !== "false",
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900,
        enableIPWhitelist: process.env.ENABLE_IP_WHITELIST === "true",
        enableCaptcha: process.env.ENABLE_CAPTCHA === "true",
        enableAuditLog: process.env.ENABLE_AUDIT_LOG !== "false",
      },
      maintenance: {
        maintenanceMode: process.env.MAINTENANCE_MODE === "true",
        maintenanceMessage:
          process.env.MAINTENANCE_MESSAGE || "System under maintenance",
        allowedIPs: process.env.MAINTENANCE_ALLOWED_IPS?.split(",") || [],
        scheduledMaintenance: process.env.SCHEDULED_MAINTENANCE || null,
        backupFrequency: process.env.BACKUP_FREQUENCY || "daily",
        logRetention: parseInt(process.env.LOG_RETENTION) || 90,
      },
    };

    await redisService.setJSON(cacheKey, settings, { ex: 3600 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "System settings retrieved successfully",
      data: settings,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get system settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve system settings",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const updateSystemSettings = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const adminId = req.userAuthId;
    const { category, settings } = req.body;

    if (!category || !settings) {
      return res.status(400).json({
        success: false,
        message: "Category and settings are required",
        code: "INVALID_INPUT",
      });
    }

    const validCategories = [
      "platform",
      "features",
      "limits",
      "payments",
      "security",
      "maintenance",
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid settings category",
        code: "INVALID_CATEGORY",
      });
    }

    const currentSettings =
      (await redisService.getJSON("system_settings")) || {};
    const updatedSettings = {
      ...currentSettings,
      [category]: {
        ...currentSettings[category],
        ...settings,
      },
    };

    await redisService.setJSON("system_settings", updatedSettings, {
      ex: 3600,
    });

    const changeLog = {
      id: generateRequestId(),
      adminId,
      category,
      changes: settings,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };

    await redisService.lpush(
      "system_settings_changes",
      JSON.stringify(changeLog)
    );
    await redisService.ltrim("system_settings_changes", 0, 99);

    if (category === "maintenance" && settings.maintenanceMode !== undefined) {
      if (settings.maintenanceMode) {
        await notificationService.createBulkNotifications({
          userIds: await getAllActiveUserIds(),
          type: "SYSTEM_ANNOUNCEMENT",
          title: "Scheduled Maintenance",
          message:
            settings.maintenanceMessage ||
            "System will be under maintenance shortly",
          priority: "HIGH",
          data: {
            maintenanceMode: true,
            message: settings.maintenanceMessage,
            scheduledTime: settings.scheduledMaintenance,
          },
        });
      }
    }

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: `${category} settings updated successfully`,
      data: {
        category,
        updatedSettings: updatedSettings[category],
        changeId: changeLog.id,
      },
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Update system settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update system settings",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const adminId = req.userAuthId;
    const {
      title,
      content,
      type = "INFO",
      priority = "NORMAL",
      targetAudience = "ALL",
      scheduledFor,
      expiresAt,
      isActive = true,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
        code: "REQUIRED_FIELDS",
      });
    }

    const validTypes = [
      "INFO",
      "WARNING",
      "UPDATE",
      "MAINTENANCE",
      "PROMOTION",
    ];
    const validPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
    const validAudiences = ["ALL", "STUDENTS", "INSTRUCTORS", "ADMINS"];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement type",
        code: "INVALID_TYPE",
      });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority level",
        code: "INVALID_PRIORITY",
      });
    }

    if (!validAudiences.includes(targetAudience)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target audience",
        code: "INVALID_AUDIENCE",
      });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        priority,
        targetAudience,
        isActive,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: adminId,
        readBy: [],
        dismissedBy: [],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const now = new Date();
    const isExpired =
      announcement.expiresAt && new Date(announcement.expiresAt) < now;
    const isScheduled =
      announcement.scheduledFor && new Date(announcement.scheduledFor) > now;

    const enrichedAnnouncement = {
      ...announcement,
      status: isExpired
        ? "expired"
        : isScheduled
        ? "scheduled"
        : announcement.isActive
        ? "active"
        : "inactive",
      readCount: announcement.readBy?.length || 0,
      dismissedCount: announcement.dismissedBy?.length || 0,
    };

    await redisService.delPattern("admin_announcements:*");

    if (isActive && (!scheduledFor || new Date(scheduledFor) <= new Date())) {
      const userIds = await getTargetAudienceUserIds(targetAudience);

      if (userIds.length > 0) {
        await notificationService.createBulkNotifications({
          userIds,
          type: "SYSTEM_ANNOUNCEMENT",
          title: title,
          message:
            content.substring(0, 200) + (content.length > 200 ? "..." : ""),
          priority: priority,
          data: {
            announcementId: announcement.id,
            type,
            targetAudience,
            fullContent: content,
          },
          actionUrl: "/announcements",
        });
      }
    }

    const executionTime = Math.round(performance.now() - startTime);

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: enrichedAnnouncement,
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Create announcement error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create announcement",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { announcementId } = req.params;
    const {
      title,
      content,
      type,
      priority,
      targetAudience,
      scheduledFor,
      expiresAt,
      isActive,
    } = req.body;

    if (!announcementId) {
      return res.status(400).json({
        success: false,
        message: "Announcement ID is required",
        code: "INVALID_INPUT",
      });
    }

    let existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    let isRedisAnnouncement = false;

    if (!existingAnnouncement) {
      const redisAnnouncement = await redisService.getJSON(
        `announcement:${announcementId}`
      );

      if (redisAnnouncement) {
        try {
          existingAnnouncement = await prisma.announcement.create({
            data: {
              id: redisAnnouncement.id,
              title: redisAnnouncement.title,
              content: redisAnnouncement.content,
              type: redisAnnouncement.type || "INFO",
              priority: redisAnnouncement.priority || "NORMAL",
              targetAudience: redisAnnouncement.targetAudience || "ALL",
              isActive: redisAnnouncement.isActive ?? true,
              scheduledFor: redisAnnouncement.scheduledFor
                ? new Date(redisAnnouncement.scheduledFor)
                : null,
              expiresAt: redisAnnouncement.expiresAt
                ? new Date(redisAnnouncement.expiresAt)
                : null,
              createdById: redisAnnouncement.createdBy,
              readBy: redisAnnouncement.readBy || [],
              dismissedBy: redisAnnouncement.dismissedBy || [],
              createdAt: redisAnnouncement.createdAt
                ? new Date(redisAnnouncement.createdAt)
                : new Date(),
            },
          });
          isRedisAnnouncement = true;
        } catch (createError) {
          console.error("Error migrating Redis announcement:", createError);
          return res.status(500).json({
            success: false,
            message: "Failed to migrate announcement from Redis",
            code: "MIGRATION_ERROR",
          });
        }
      }
    }

    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
        code: "ANNOUNCEMENT_NOT_FOUND",
      });
    }

    const validTypes = [
      "INFO",
      "WARNING",
      "UPDATE",
      "MAINTENANCE",
      "PROMOTION",
    ];
    const validPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
    const validAudiences = ["ALL", "STUDENTS", "INSTRUCTORS", "ADMINS"];

    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement type",
        code: "INVALID_TYPE",
      });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority level",
        code: "INVALID_PRIORITY",
      });
    }

    if (targetAudience && !validAudiences.includes(targetAudience)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target audience",
        code: "INVALID_AUDIENCE",
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (targetAudience !== undefined)
      updateData.targetAudience = targetAudience;
    if (scheduledFor !== undefined)
      updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
    if (expiresAt !== undefined)
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: announcementId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const now = new Date();
    const isExpired =
      updatedAnnouncement.expiresAt &&
      new Date(updatedAnnouncement.expiresAt) < now;
    const isScheduled =
      updatedAnnouncement.scheduledFor &&
      new Date(updatedAnnouncement.scheduledFor) > now;

    const enrichedAnnouncement = {
      ...updatedAnnouncement,
      status: isExpired
        ? "expired"
        : isScheduled
        ? "scheduled"
        : updatedAnnouncement.isActive
        ? "active"
        : "inactive",
      readCount: updatedAnnouncement.readBy?.length || 0,
      dismissedCount: updatedAnnouncement.dismissedBy?.length || 0,
      migrated: isRedisAnnouncement,
    };

    await redisService.delPattern("admin_announcements:*");

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: `Announcement updated successfully${
        isRedisAnnouncement ? " (migrated from Redis)" : ""
      }`,
      data: enrichedAnnouncement,
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Update announcement error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update announcement",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const getAllAnnouncements = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const {
      page = 1,
      limit = 20,
      type,
      priority,
      targetAudience,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageSize = Math.min(parseInt(limit), 100);
    const pageNumber = Math.max(parseInt(page), 1);
    const skip = (pageNumber - 1) * pageSize;

    const where = {};
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (targetAudience) where.targetAudience = targetAudience;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.announcement.count({ where }),
    ]);

    const enrichedAnnouncements = announcements.map((announcement) => {
      const now = new Date();
      const isExpired =
        announcement.expiresAt && new Date(announcement.expiresAt) < now;
      const isScheduled =
        announcement.scheduledFor && new Date(announcement.scheduledFor) > now;

      return {
        ...announcement,
        status: isExpired
          ? "expired"
          : isScheduled
          ? "scheduled"
          : announcement.isActive
          ? "active"
          : "inactive",
        readCount: announcement.readBy?.length || 0,
        dismissedCount: announcement.dismissedBy?.length || 0,
      };
    });

    const result = {
      announcements: enrichedAnnouncements,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: skip + pageSize < total,
        hasPrev: pageNumber > 1,
      },
      filters: { type, priority, targetAudience, isActive },
      sort: { sortBy, sortOrder },
      stats: {
        total,
        active: enrichedAnnouncements.filter((a) => a.status === "active")
          .length,
        scheduled: enrichedAnnouncements.filter((a) => a.status === "scheduled")
          .length,
        expired: enrichedAnnouncements.filter((a) => a.status === "expired")
          .length,
        inactive: enrichedAnnouncements.filter((a) => a.status === "inactive")
          .length,
      },
    };

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Announcements retrieved successfully",
      data: result,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get announcements error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve announcements",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { announcementId } = req.params;

    if (!announcementId) {
      return res.status(400).json({
        success: false,
        message: "Announcement ID is required",
        code: "INVALID_INPUT",
      });
    }

    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
        code: "ANNOUNCEMENT_NOT_FOUND",
      });
    }

    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    await redisService.delPattern("admin_announcements:*");

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
      data: {
        deletedAnnouncementId: announcementId,
        deletedAnnouncement: existingAnnouncement,
      },
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const getSystemHealth = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const cacheKey = "system_health";
    let cachedHealth = await redisService.getJSON(cacheKey);

    if (cachedHealth) {
      return res.status(200).json({
        success: true,
        message: "System health retrieved successfully",
        data: cachedHealth,
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const [
      dbHealth,
      redisHealth,
      userCount,
      courseCount,
      enrollmentCount,
      activeSessionCount,
    ] = await Promise.all([
      checkDatabaseHealth(),
      redisService.healthCheck(),
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      getActiveSessionCount(),
    ]);

    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.env.APP_VERSION || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    };

    const health = {
      status: "healthy",
      services: {
        database: {
          status: dbHealth ? "healthy" : "unhealthy",
          responseTime: dbHealth?.responseTime || null,
          connections: dbHealth?.connections || null,
        },
        redis: {
          status: redisHealth ? "healthy" : "unhealthy",
          connected: redisHealth,
        },
        application: {
          status: "healthy",
          uptime: systemMetrics.uptime,
          memory: {
            used: Math.round(systemMetrics.memory.heapUsed / 1024 / 1024),
            total: Math.round(systemMetrics.memory.heapTotal / 1024 / 1024),
            usage: Math.round(
              (systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) *
                100
            ),
          },
        },
      },
      platform: {
        totalUsers: userCount,
        totalCourses: courseCount,
        totalEnrollments: enrollmentCount,
        activeSessions: activeSessionCount,
      },
      system: systemMetrics,
      checks: {
        databaseConnectivity: dbHealth !== null,
        redisConnectivity: redisHealth,
        memoryUsage:
          systemMetrics.memory.heapUsed < systemMetrics.memory.heapTotal * 0.9,
        uptime: systemMetrics.uptime > 60,
      },
    };

    const overallHealthy =
      Object.values(health.checks).every((check) => check === true) &&
      health.services.database.status === "healthy" &&
      health.services.redis.status === "healthy";

    health.status = overallHealthy ? "healthy" : "degraded";

    await redisService.setJSON(cacheKey, health, { ex: 60 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "System health retrieved successfully",
      data: health,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get system health error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve system health",
      code: "INTERNAL_SERVER_ERROR",
      data: {
        status: "unhealthy",
        error: error.message,
      },
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

const getAllActiveUserIds = async () => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    return users.map((user) => user.id);
  } catch (error) {
    console.error("Get active user IDs error:", error);
    return [];
  }
};

const getTargetAudienceUserIds = async (audience) => {
  try {
    const where = { isActive: true };

    if (audience === "STUDENTS") {
      where.role = "STUDENT";
    } else if (audience === "INSTRUCTORS") {
      where.role = "INSTRUCTOR";
    } else if (audience === "ADMINS") {
      where.role = { in: ["ADMIN", "MODERATOR"] };
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    return users.map((user) => user.id);
  } catch (error) {
    console.error("Get target audience user IDs error:", error);
    return [];
  }
};

const checkDatabaseHealth = async () => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;

    return {
      responseTime,
      connections: null,
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return null;
  }
};

const getActiveSessionCount = async () => {
  try {
    const activeSessionsPattern = "session:*";
    const sessionKeys = await redisService.keys(activeSessionsPattern);
    return sessionKeys.length;
  } catch (error) {
    console.error("Get active session count error:", error);
    return 0;
  }
};
