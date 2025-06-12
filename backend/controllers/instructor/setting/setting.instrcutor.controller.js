import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import educademyLogger from "../../utils/logger.js";
import { performance } from "perf_hooks";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
  errorFormat: "pretty",
});

prisma.$on("query", (e) => {
  const queryLower = (e.query || "").toLowerCase().trim();
  let tableName = "unknown";
  let operation = "QUERY";

  if (queryLower.includes("select")) {
    operation = "SELECT";
    const fromMatch =
      queryLower.match(/from\s+"?(\w+)"?\."?(\w+)"?/i) ||
      queryLower.match(/from\s+"?(\w+)"?/i);
    if (fromMatch) {
      tableName = fromMatch[2] || fromMatch[1];
    }
  } else if (queryLower.includes("insert")) {
    operation = "INSERT";
    const intoMatch =
      queryLower.match(/insert\s+into\s+"?(\w+)"?\."?(\w+)"?/i) ||
      queryLower.match(/insert\s+into\s+"?(\w+)"?/i);
    if (intoMatch) {
      tableName = intoMatch[2] || intoMatch[1];
    }
  } else if (queryLower.includes("update")) {
    operation = "UPDATE";
    const updateMatch =
      queryLower.match(/update\s+"?(\w+)"?\."?(\w+)"?/i) ||
      queryLower.match(/update\s+"?(\w+)"?/i);
    if (updateMatch) {
      tableName = updateMatch[2] || updateMatch[1];
    }
  } else if (queryLower.includes("delete")) {
    operation = "DELETE";
    const deleteMatch =
      queryLower.match(/delete\s+from\s+"?(\w+)"?\."?(\w+)"?/i) ||
      queryLower.match(/delete\s+from\s+"?(\w+)"?/i);
    if (deleteMatch) {
      tableName = deleteMatch[2] || deleteMatch[1];
    }
  }

  educademyLogger.logger.log("info", `DATABASE ${operation}: ${tableName}`, {
    sqlQuery: e.query,
    sqlParams: e.params,
    database: {
      operation: operation.toUpperCase(),
      table: tableName,
      duration: e.duration ? `${e.duration}ms` : null,
    },
  });
});

export const getNotificationSettings = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SettingsController",
    methodName: "getNotificationSettings",
  });

  educademyLogger.logMethodEntry(
    "SettingsController",
    "getNotificationSettings",
    {
      userId: req.userAuthId,
    }
  );

  try {
    // Get instructor
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    // Get notification settings or create default if not exists
    let notificationSettings = await prisma.notificationSettings.findUnique({
      where: { userId: req.userAuthId },
    });

    if (!notificationSettings) {
      // Create default notification settings
      notificationSettings = await prisma.notificationSettings.create({
        data: {
          userId: req.userAuthId,
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          newEnrollments: true,
          courseUpdates: true,
          studentMessages: true,
          reviewNotifications: true,
          paymentNotifications: true,
          marketingEmails: false,
          weeklyReports: true,
          monthlyReports: true,
        },
      });
    }

    const settingsData = {
      emailNotifications: notificationSettings.emailNotifications,
      pushNotifications: notificationSettings.pushNotifications,
      smsNotifications: notificationSettings.smsNotifications,
      preferences: {
        newEnrollments: notificationSettings.newEnrollments,
        courseUpdates: notificationSettings.courseUpdates,
        studentMessages: notificationSettings.studentMessages,
        reviewNotifications: notificationSettings.reviewNotifications,
        paymentNotifications: notificationSettings.paymentNotifications,
        marketingEmails: notificationSettings.marketingEmails,
      },
      reports: {
        weeklyReports: notificationSettings.weeklyReports,
        monthlyReports: notificationSettings.monthlyReports,
      },
      updatedAt: notificationSettings.updatedAt,
    };

    educademyLogger.logBusinessOperation(
      "GET_NOTIFICATION_SETTINGS",
      "NOTIFICATION_SETTINGS",
      notificationSettings.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_NOTIFICATION_SETTINGS", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "getNotificationSettings",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Notification settings fetched successfully",
      data: settingsData,
    });
  } catch (error) {
    educademyLogger.error("Get notification settings failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_NOTIFICATION_SETTINGS",
        entity: "NOTIFICATION_SETTINGS",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "getNotificationSettings",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch notification settings",
      requestId,
    });
  }
});

export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SettingsController",
    methodName: "updateNotificationSettings",
  });

  educademyLogger.logMethodEntry(
    "SettingsController",
    "updateNotificationSettings",
    {
      userId: req.userAuthId,
    }
  );

  try {
    const {
      emailNotifications,
      pushNotifications,
      smsNotifications,
      newEnrollments,
      courseUpdates,
      studentMessages,
      reviewNotifications,
      paymentNotifications,
      marketingEmails,
      weeklyReports,
      monthlyReports,
    } = req.body;

    // Get instructor
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    const updateData = {};

    // Validate and prepare updates
    if (emailNotifications !== undefined) {
      updateData.emailNotifications =
        emailNotifications === true || emailNotifications === "true";
    }

    if (pushNotifications !== undefined) {
      updateData.pushNotifications =
        pushNotifications === true || pushNotifications === "true";
    }

    if (smsNotifications !== undefined) {
      updateData.smsNotifications =
        smsNotifications === true || smsNotifications === "true";
    }

    if (newEnrollments !== undefined) {
      updateData.newEnrollments =
        newEnrollments === true || newEnrollments === "true";
    }

    if (courseUpdates !== undefined) {
      updateData.courseUpdates =
        courseUpdates === true || courseUpdates === "true";
    }

    if (studentMessages !== undefined) {
      updateData.studentMessages =
        studentMessages === true || studentMessages === "true";
    }

    if (reviewNotifications !== undefined) {
      updateData.reviewNotifications =
        reviewNotifications === true || reviewNotifications === "true";
    }

    if (paymentNotifications !== undefined) {
      updateData.paymentNotifications =
        paymentNotifications === true || paymentNotifications === "true";
    }

    if (marketingEmails !== undefined) {
      updateData.marketingEmails =
        marketingEmails === true || marketingEmails === "true";
    }

    if (weeklyReports !== undefined) {
      updateData.weeklyReports =
        weeklyReports === true || weeklyReports === "true";
    }

    if (monthlyReports !== undefined) {
      updateData.monthlyReports =
        monthlyReports === true || monthlyReports === "true";
    }

    updateData.updatedAt = new Date();

    // Update or create notification settings
    const updatedSettings = await prisma.notificationSettings.upsert({
      where: { userId: req.userAuthId },
      update: updateData,
      create: {
        userId: req.userAuthId,
        emailNotifications: updateData.emailNotifications ?? true,
        pushNotifications: updateData.pushNotifications ?? true,
        smsNotifications: updateData.smsNotifications ?? false,
        newEnrollments: updateData.newEnrollments ?? true,
        courseUpdates: updateData.courseUpdates ?? true,
        studentMessages: updateData.studentMessages ?? true,
        reviewNotifications: updateData.reviewNotifications ?? true,
        paymentNotifications: updateData.paymentNotifications ?? true,
        marketingEmails: updateData.marketingEmails ?? false,
        weeklyReports: updateData.weeklyReports ?? true,
        monthlyReports: updateData.monthlyReports ?? true,
      },
    });

    educademyLogger.logBusinessOperation(
      "UPDATE_NOTIFICATION_SETTINGS",
      "NOTIFICATION_SETTINGS",
      updatedSettings.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        settingsUpdated: Object.keys(updateData),
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("UPDATE_NOTIFICATION_SETTINGS", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
      fieldsUpdated: Object.keys(updateData).length,
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "updateNotificationSettings",
      true,
      performance.now() - startTime
    );

    const responseData = {
      emailNotifications: updatedSettings.emailNotifications,
      pushNotifications: updatedSettings.pushNotifications,
      smsNotifications: updatedSettings.smsNotifications,
      preferences: {
        newEnrollments: updatedSettings.newEnrollments,
        courseUpdates: updatedSettings.courseUpdates,
        studentMessages: updatedSettings.studentMessages,
        reviewNotifications: updatedSettings.reviewNotifications,
        paymentNotifications: updatedSettings.paymentNotifications,
        marketingEmails: updatedSettings.marketingEmails,
      },
      reports: {
        weeklyReports: updatedSettings.weeklyReports,
        monthlyReports: updatedSettings.monthlyReports,
      },
      changes: Object.keys(updateData),
      updatedAt: updatedSettings.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Update notification settings failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "UPDATE_NOTIFICATION_SETTINGS",
        entity: "NOTIFICATION_SETTINGS",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "updateNotificationSettings",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to update notification settings",
      requestId,
    });
  }
});

export const getCourseSettings = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SettingsController",
    methodName: "getCourseSettings",
  });

  educademyLogger.logMethodEntry("SettingsController", "getCourseSettings", {
    userId: req.userAuthId,
    courseId,
  });

  try {
    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { id: true },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only view settings for your own courses",
      });
    }

    // Get course settings or create default if not exists
    let courseSettings = await prisma.courseSettings.findUnique({
      where: { courseId },
    });

    if (!courseSettings) {
      // Create default course settings
      courseSettings = await prisma.courseSettings.create({
        data: {
          courseId,
          autoEnrollment: true,
          discussionEnabled: true,
          downloadableResources: true,
          certificateEnabled: true,
          prerequisitesRequired: false,
          maxStudents: null,
          enrollmentDeadline: null,
          accessDuration: null,
          allowReviews: true,
          moderateDiscussions: false,
          emailNotificationsEnabled: true,
        },
      });
    }

    const settingsData = {
      courseId: courseSettings.courseId,
      enrollment: {
        autoEnrollment: courseSettings.autoEnrollment,
        maxStudents: courseSettings.maxStudents,
        enrollmentDeadline: courseSettings.enrollmentDeadline,
        prerequisitesRequired: courseSettings.prerequisitesRequired,
      },
      features: {
        discussionEnabled: courseSettings.discussionEnabled,
        downloadableResources: courseSettings.downloadableResources,
        certificateEnabled: courseSettings.certificateEnabled,
        allowReviews: courseSettings.allowReviews,
      },
      access: {
        accessDuration: courseSettings.accessDuration,
      },
      moderation: {
        moderateDiscussions: courseSettings.moderateDiscussions,
      },
      notifications: {
        emailNotificationsEnabled: courseSettings.emailNotificationsEnabled,
      },
      course: {
        id: course.id,
        title: course.title,
        status: course.status,
      },
      updatedAt: courseSettings.updatedAt,
    };

    educademyLogger.logBusinessOperation(
      "GET_COURSE_SETTINGS",
      "COURSE_SETTINGS",
      courseSettings.id,
      "SUCCESS",
      {
        courseId,
        courseTitle: course.title,
        instructorId: instructor.id,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_COURSE_SETTINGS", startTime, {
      userId: req.userAuthId,
      courseId,
      instructorId: instructor.id,
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "getCourseSettings",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Course settings fetched successfully",
      data: settingsData,
    });
  } catch (error) {
    educademyLogger.error("Get course settings failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "GET_COURSE_SETTINGS",
        entity: "COURSE_SETTINGS",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "getCourseSettings",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch course settings",
      requestId,
    });
  }
});

export const updateCourseSettings = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SettingsController",
    methodName: "updateCourseSettings",
  });

  educademyLogger.logMethodEntry("SettingsController", "updateCourseSettings", {
    userId: req.userAuthId,
    courseId,
  });

  try {
    const {
      autoEnrollment,
      discussionEnabled,
      downloadableResources,
      certificateEnabled,
      prerequisitesRequired,
      maxStudents,
      enrollmentDeadline,
      accessDuration,
      allowReviews,
      moderateDiscussions,
      emailNotificationsEnabled,
    } = req.body;

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { id: true },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only update settings for your own courses",
      });
    }

    const updateData = {};

    // Validate and prepare updates
    if (autoEnrollment !== undefined) {
      updateData.autoEnrollment =
        autoEnrollment === true || autoEnrollment === "true";
    }

    if (discussionEnabled !== undefined) {
      updateData.discussionEnabled =
        discussionEnabled === true || discussionEnabled === "true";
    }

    if (downloadableResources !== undefined) {
      updateData.downloadableResources =
        downloadableResources === true || downloadableResources === "true";
    }

    if (certificateEnabled !== undefined) {
      updateData.certificateEnabled =
        certificateEnabled === true || certificateEnabled === "true";
    }

    if (prerequisitesRequired !== undefined) {
      updateData.prerequisitesRequired =
        prerequisitesRequired === true || prerequisitesRequired === "true";
    }

    if (maxStudents !== undefined) {
      if (maxStudents !== null && (isNaN(maxStudents) || maxStudents < 1)) {
        return res.status(400).json({
          success: false,
          message: "Max students must be a positive number or null",
        });
      }
      updateData.maxStudents = maxStudents ? parseInt(maxStudents) : null;
    }

    if (enrollmentDeadline !== undefined) {
      if (enrollmentDeadline) {
        const deadline = new Date(enrollmentDeadline);
        if (isNaN(deadline.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid enrollment deadline",
          });
        }
        if (deadline < new Date()) {
          return res.status(400).json({
            success: false,
            message: "Enrollment deadline cannot be in the past",
          });
        }
        updateData.enrollmentDeadline = deadline;
      } else {
        updateData.enrollmentDeadline = null;
      }
    }

    if (accessDuration !== undefined) {
      if (
        accessDuration !== null &&
        (isNaN(accessDuration) || accessDuration < 1)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Access duration must be a positive number (in days) or null",
        });
      }
      updateData.accessDuration = accessDuration
        ? parseInt(accessDuration)
        : null;
    }

    if (allowReviews !== undefined) {
      updateData.allowReviews =
        allowReviews === true || allowReviews === "true";
    }

    if (moderateDiscussions !== undefined) {
      updateData.moderateDiscussions =
        moderateDiscussions === true || moderateDiscussions === "true";
    }

    if (emailNotificationsEnabled !== undefined) {
      updateData.emailNotificationsEnabled =
        emailNotificationsEnabled === true ||
        emailNotificationsEnabled === "true";
    }

    updateData.updatedAt = new Date();

    // Update or create course settings
    const updatedSettings = await prisma.courseSettings.upsert({
      where: { courseId },
      update: updateData,
      create: {
        courseId,
        autoEnrollment: updateData.autoEnrollment ?? true,
        discussionEnabled: updateData.discussionEnabled ?? true,
        downloadableResources: updateData.downloadableResources ?? true,
        certificateEnabled: updateData.certificateEnabled ?? true,
        prerequisitesRequired: updateData.prerequisitesRequired ?? false,
        maxStudents: updateData.maxStudents ?? null,
        enrollmentDeadline: updateData.enrollmentDeadline ?? null,
        accessDuration: updateData.accessDuration ?? null,
        allowReviews: updateData.allowReviews ?? true,
        moderateDiscussions: updateData.moderateDiscussions ?? false,
        emailNotificationsEnabled: updateData.emailNotificationsEnabled ?? true,
      },
    });

    educademyLogger.logBusinessOperation(
      "UPDATE_COURSE_SETTINGS",
      "COURSE_SETTINGS",
      updatedSettings.id,
      "SUCCESS",
      {
        courseId,
        courseTitle: course.title,
        instructorId: instructor.id,
        settingsUpdated: Object.keys(updateData),
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("UPDATE_COURSE_SETTINGS", startTime, {
      userId: req.userAuthId,
      courseId,
      fieldsUpdated: Object.keys(updateData).length,
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "updateCourseSettings",
      true,
      performance.now() - startTime
    );

    const responseData = {
      courseId: updatedSettings.courseId,
      enrollment: {
        autoEnrollment: updatedSettings.autoEnrollment,
        maxStudents: updatedSettings.maxStudents,
        enrollmentDeadline: updatedSettings.enrollmentDeadline,
        prerequisitesRequired: updatedSettings.prerequisitesRequired,
      },
      features: {
        discussionEnabled: updatedSettings.discussionEnabled,
        downloadableResources: updatedSettings.downloadableResources,
        certificateEnabled: updatedSettings.certificateEnabled,
        allowReviews: updatedSettings.allowReviews,
      },
      access: {
        accessDuration: updatedSettings.accessDuration,
      },
      moderation: {
        moderateDiscussions: updatedSettings.moderateDiscussions,
      },
      notifications: {
        emailNotificationsEnabled: updatedSettings.emailNotificationsEnabled,
      },
      course: {
        id: course.id,
        title: course.title,
        status: course.status,
      },
      changes: Object.keys(updateData),
      updatedAt: updatedSettings.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Course settings updated successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Update course settings failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "UPDATE_COURSE_SETTINGS",
        entity: "COURSE_SETTINGS",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "updateCourseSettings",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to update course settings",
      requestId,
    });
  }
});

export const getPrivacySettings = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SettingsController",
    methodName: "getPrivacySettings",
  });

  educademyLogger.logMethodEntry("SettingsController", "getPrivacySettings", {
    userId: req.userAuthId,
  });

  try {
    // Get instructor
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    // Get privacy settings or create default if not exists
    let privacySettings = await prisma.privacySettings.findUnique({
      where: { userId: req.userAuthId },
    });

    if (!privacySettings) {
      // Create default privacy settings
      privacySettings = await prisma.privacySettings.create({
        data: {
          userId: req.userAuthId,
          profileVisibility: "PUBLIC",
          showEmail: false,
          showPhone: false,
          showEarnings: false,
          allowDirectMessages: true,
          showOnlineStatus: true,
          dataCollection: true,
          marketingCommunication: false,
          thirdPartySharing: false,
        },
      });
    }

    const settingsData = {
      profile: {
        profileVisibility: privacySettings.profileVisibility,
        showEmail: privacySettings.showEmail,
        showPhone: privacySettings.showPhone,
        showEarnings: privacySettings.showEarnings,
        showOnlineStatus: privacySettings.showOnlineStatus,
      },
      communication: {
        allowDirectMessages: privacySettings.allowDirectMessages,
      },
      data: {
        dataCollection: privacySettings.dataCollection,
        marketingCommunication: privacySettings.marketingCommunication,
        thirdPartySharing: privacySettings.thirdPartySharing,
      },
      updatedAt: privacySettings.updatedAt,
    };

    educademyLogger.logBusinessOperation(
      "GET_PRIVACY_SETTINGS",
      "PRIVACY_SETTINGS",
      privacySettings.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_PRIVACY_SETTINGS", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "getPrivacySettings",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Privacy settings fetched successfully",
      data: settingsData,
    });
  } catch (error) {
    educademyLogger.error("Get privacy settings failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_PRIVACY_SETTINGS",
        entity: "PRIVACY_SETTINGS",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "getPrivacySettings",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch privacy settings",
      requestId,
    });
  }
});

export const updatePrivacySettings = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SettingsController",
    methodName: "updatePrivacySettings",
  });

  educademyLogger.logMethodEntry(
    "SettingsController",
    "updatePrivacySettings",
    {
      userId: req.userAuthId,
    }
  );

  try {
    const {
      profileVisibility,
      showEmail,
      showPhone,
      showEarnings,
      allowDirectMessages,
      showOnlineStatus,
      dataCollection,
      marketingCommunication,
      thirdPartySharing,
    } = req.body;

    // Get instructor
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    const updateData = {};

    // Validate and prepare updates
    if (profileVisibility !== undefined) {
      const validVisibilities = ["PUBLIC", "PRIVATE", "STUDENTS_ONLY"];
      if (!validVisibilities.includes(profileVisibility.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid profile visibility. Must be one of: ${validVisibilities.join(
            ", "
          )}`,
        });
      }
      updateData.profileVisibility = profileVisibility.toUpperCase();
    }

    if (showEmail !== undefined) {
      updateData.showEmail = showEmail === true || showEmail === "true";
    }

    if (showPhone !== undefined) {
      updateData.showPhone = showPhone === true || showPhone === "true";
    }

    if (showEarnings !== undefined) {
      updateData.showEarnings =
        showEarnings === true || showEarnings === "true";
    }

    if (allowDirectMessages !== undefined) {
      updateData.allowDirectMessages =
        allowDirectMessages === true || allowDirectMessages === "true";
    }

    if (showOnlineStatus !== undefined) {
      updateData.showOnlineStatus =
        showOnlineStatus === true || showOnlineStatus === "true";
    }

    if (dataCollection !== undefined) {
      updateData.dataCollection =
        dataCollection === true || dataCollection === "true";
    }

    if (marketingCommunication !== undefined) {
      updateData.marketingCommunication =
        marketingCommunication === true || marketingCommunication === "true";
    }

    if (thirdPartySharing !== undefined) {
      updateData.thirdPartySharing =
        thirdPartySharing === true || thirdPartySharing === "true";
    }

    updateData.updatedAt = new Date();

    // Update or create privacy settings
    const updatedSettings = await prisma.privacySettings.upsert({
      where: { userId: req.userAuthId },
      update: updateData,
      create: {
        userId: req.userAuthId,
        profileVisibility: updateData.profileVisibility ?? "PUBLIC",
        showEmail: updateData.showEmail ?? false,
        showPhone: updateData.showPhone ?? false,
        showEarnings: updateData.showEarnings ?? false,
        allowDirectMessages: updateData.allowDirectMessages ?? true,
        showOnlineStatus: updateData.showOnlineStatus ?? true,
        dataCollection: updateData.dataCollection ?? true,
        marketingCommunication: updateData.marketingCommunication ?? false,
        thirdPartySharing: updateData.thirdPartySharing ?? false,
      },
    });

    educademyLogger.logBusinessOperation(
      "UPDATE_PRIVACY_SETTINGS",
      "PRIVACY_SETTINGS",
      updatedSettings.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        settingsUpdated: Object.keys(updateData),
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("UPDATE_PRIVACY_SETTINGS", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
      fieldsUpdated: Object.keys(updateData).length,
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "updatePrivacySettings",
      true,
      performance.now() - startTime
    );

    const responseData = {
      profile: {
        profileVisibility: updatedSettings.profileVisibility,
        showEmail: updatedSettings.showEmail,
        showPhone: updatedSettings.showPhone,
        showEarnings: updatedSettings.showEarnings,
        showOnlineStatus: updatedSettings.showOnlineStatus,
      },
      communication: {
        allowDirectMessages: updatedSettings.allowDirectMessages,
      },
      data: {
        dataCollection: updatedSettings.dataCollection,
        marketingCommunication: updatedSettings.marketingCommunication,
        thirdPartySharing: updatedSettings.thirdPartySharing,
      },
      changes: Object.keys(updateData),
      updatedAt: updatedSettings.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Privacy settings updated successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Update privacy settings failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "UPDATE_PRIVACY_SETTINGS",
        entity: "PRIVACY_SETTINGS",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "updatePrivacySettings",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to update privacy settings",
      requestId,
    });
  }
});

export const deactivateAccount = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SettingsController",
    methodName: "deactivateAccount",
  });

  educademyLogger.logMethodEntry("SettingsController", "deactivateAccount", {
    userId: req.userAuthId,
  });

  try {
    const { reason, feedback, confirmDeactivation } = req.body;

    // Validation
    if (!confirmDeactivation || confirmDeactivation !== "CONFIRM") {
      return res.status(400).json({
        success: false,
        message:
          "Account deactivation must be confirmed by providing 'CONFIRM' in confirmDeactivation field",
      });
    }

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Deactivation reason is required",
      });
    }

    // Get instructor with courses
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    // Check if instructor has active courses with enrolled students
    const activeCoursesWithStudents = await prisma.course.findMany({
      where: {
        instructorId: instructor.id,
        status: "PUBLISHED",
      },
      include: {
        _count: {
          select: {
            enrollments: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
    });

    const coursesWithActiveStudents = activeCoursesWithStudents.filter(
      (course) => course._count.enrollments > 0
    );

    if (coursesWithActiveStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot deactivate account while you have active courses with enrolled students",
        data: {
          activeCoursesCount: coursesWithActiveStudents.length,
          coursesWithStudents: coursesWithActiveStudents.map((course) => ({
            id: course.id,
            title: course.title,
            activeStudents: course._count.enrollments,
          })),
          suggestion:
            "Please complete or transfer your courses before deactivating your account",
        },
      });
    }

    // Create deactivation record
    const deactivation = await prisma.accountDeactivation.create({
      data: {
        userId: req.userAuthId,
        reason: reason.trim(),
        feedback: feedback?.trim() || null,
        requestedAt: new Date(),
        status: "PENDING",
      },
    });

    // Update user status to inactive
    await prisma.user.update({
      where: { id: req.userAuthId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Unpublish all courses
    await prisma.course.updateMany({
      where: {
        instructorId: instructor.id,
        status: "PUBLISHED",
      },
      data: {
        status: "DRAFT",
        updatedAt: new Date(),
      },
    });

    educademyLogger.logBusinessOperation(
      "DEACTIVATE_ACCOUNT",
      "ACCOUNT_DEACTIVATION",
      deactivation.id,
      "SUCCESS",
      {
        deactivationId: deactivation.id,
        instructorId: instructor.id,
        reason: reason.trim(),
        totalCourses: instructor._count.courses,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "DEACTIVATE_ACCOUNT",
      "USER",
      req.userAuthId,
      { isActive: true },
      { isActive: false },
      req.userAuthId
    );

    educademyLogger.performance("DEACTIVATE_ACCOUNT", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "deactivateAccount",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
      data: {
        deactivation: {
          id: deactivation.id,
          reason: deactivation.reason,
          requestedAt: deactivation.requestedAt,
          status: deactivation.status,
        },
        note: "Your account has been deactivated. You can reactivate it by contacting support.",
        coursesAffected: instructor._count.courses,
      },
    });
  } catch (error) {
    educademyLogger.error("Deactivate account failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "DEACTIVATE_ACCOUNT",
        entity: "ACCOUNT_DEACTIVATION",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "SettingsController",
      "deactivateAccount",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to deactivate account",
      requestId,
    });
  }
});
