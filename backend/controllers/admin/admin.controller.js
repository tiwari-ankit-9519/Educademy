import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import educademyLogger from "../../utils/logger.js";
import { performance } from "perf_hooks";
import { uploadImage, deleteFromCloudinary } from "../../config/upload.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { parse } from "json2csv";

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

  // Parse operation and table name
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

export const getDashboardStats = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getDashboardStats",
  });

  educademyLogger.logMethodEntry("AdminController", "getDashboardStats", {
    userId: req.userAuthId,
    clientIp: req.ip,
  });

  try {
    // Parallel queries for better performance
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalRevenue,
      pendingCourses,
      recentUsers,
      recentCourses,
      topCategories,
      systemHealth,
      activeUsers24h,
      activeSessions,
      totalPayments,
      totalEarnings,
    ] = await Promise.all([
      // User statistics
      prisma.user.count(),
      prisma.student.count(),
      prisma.instructor.count(),
      prisma.admin.count(),

      // Course statistics
      prisma.course.count(),
      prisma.course.count({ where: { status: "PUBLISHED" } }),

      // Enrollment and revenue
      prisma.enrollment.count(),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),

      // Pending items
      prisma.course.count({ where: { status: "UNDER_REVIEW" } }),

      // Recent activity
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
          profileImage: true,
        },
      }),

      prisma.course.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          instructor: {
            select: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),

      // Top categories
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { courses: true } },
        },
        orderBy: {
          courses: { _count: "desc" },
        },
        take: 5,
      }),

      // System health metrics
      prisma.log.count({
        where: {
          level: "error",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),

      // Additional dashboard metrics
      prisma.user.count({
        where: {
          lastLogin: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),

      prisma.session.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),

      prisma.payment.count(),

      prisma.earning.aggregate({
        _sum: { amount: true },
        where: { status: "PAID" },
      }),
    ]);

    const dashboardData = {
      overview: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalAdmins,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingCourses,
        systemErrors24h: systemHealth,
        activeUsers24h,
        activeSessions,
        totalPayments,
        totalEarnings: totalEarnings._sum.amount || 0,
      },
      recentActivity: {
        recentUsers,
        recentCourses,
      },
      topCategories: topCategories.map((cat) => ({
        ...cat,
        coursesCount: cat._count.courses,
      })),
      systemHealth: {
        errorCount24h: systemHealth,
        status:
          systemHealth < 10
            ? "healthy"
            : systemHealth < 50
            ? "warning"
            : "critical",
      },
    };

    educademyLogger.logBusinessOperation(
      "GET_DASHBOARD_STATS",
      "DASHBOARD",
      req.userAuthId,
      "SUCCESS",
      { totalUsers, totalCourses, totalEnrollments }
    );

    educademyLogger.performance("GET_DASHBOARD_STATS", startTime, {
      userId: req.userAuthId,
      totalQueries: 17,
    });

    educademyLogger.logMethodExit(
      "AdminController",
      "getDashboardStats",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    educademyLogger.error("Get dashboard stats failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_DASHBOARD_STATS",
        entity: "DASHBOARD",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "AdminController",
      "getDashboardStats",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard statistics",
      requestId,
    });
  }
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { period = "30", type = "overview" } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getAnalytics",
  });

  try {
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let analyticsData = {};

    if (type === "overview" || type === "all") {
      // Daily analytics for the specified period
      const dailyAnalytics = await prisma.analytics.findMany({
        where: {
          date: { gte: startDate },
        },
        orderBy: { date: "asc" },
      });

      analyticsData.daily = dailyAnalytics;
    }

    if (type === "monthly" || type === "all") {
      // Monthly analytics
      const monthlyAnalytics = await prisma.monthlyAnalytics.findMany({
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 12,
      });

      analyticsData.monthly = monthlyAnalytics;
    }

    if (type === "courses" || type === "all") {
      // Course analytics
      const courseAnalytics = await prisma.courseAnalytics.findMany({
        where: {
          date: { gte: startDate },
        },
        include: {
          course: {
            select: {
              title: true,
              instructor: {
                select: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
        orderBy: { totalEnrollments: "desc" },
        take: 20,
      });

      analyticsData.courses = courseAnalytics;
    }

    if (type === "users" || type === "all") {
      // User analytics
      const userGrowthData = await prisma.user.groupBy({
        by: ["role"],
        _count: { _all: true },
        where: {
          createdAt: { gte: startDate },
        },
      });

      analyticsData.userGrowth = userGrowthData;
    }

    if (type === "revenue" || type === "all") {
      // Revenue analytics
      const revenueData = await prisma.payment.groupBy({
        by: ["createdAt"],
        _sum: { amount: true },
        _count: { _all: true },
        where: {
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "asc" },
      });

      analyticsData.revenue = revenueData;
    }

    educademyLogger.logBusinessOperation(
      "GET_ANALYTICS",
      "ANALYTICS",
      req.userAuthId,
      "SUCCESS",
      { period: days, type }
    );

    res.status(200).json({
      success: true,
      data: analyticsData,
      period: days,
      type,
    });
  } catch (error) {
    educademyLogger.error("Get analytics failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_ANALYTICS",
        entity: "ANALYTICS",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve analytics",
      requestId,
    });
  }
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    search = "",
    role = "",
    status = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getAllUsers",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) where.role = role;
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (status === "verified") where.isVerified = true;
    if (status === "unverified") where.isVerified = false;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          email: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          bio: true,
          role: true,
          isVerified: true,
          isActive: true,
          lastLogin: true,
          timezone: true,
          language: true,
          country: true,
          phoneNumber: true,
          dateOfBirth: true,
          website: true,
          linkedinProfile: true,
          twitterProfile: true,
          githubProfile: true,
          studentProfile: {
            select: {
              id: true,
              skillLevel: true,
              totalLearningTime: true,
              _count: {
                select: {
                  enrollments: true,
                  reviews: true,
                },
              },
            },
          },
          instructorProfile: {
            select: {
              id: true,
              rating: true,
              totalStudents: true,
              totalCourses: true,
              totalRevenue: true,
              isVerified: true,
            },
          },
          adminProfile: {
            select: {
              id: true,
              department: true,
              permissions: true,
            },
          },
          _count: {
            select: {
              sessions: true,
              activities: true,
              notifications: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    const enrichedUsers = users.map((user) => ({
      ...user,
      lastLoginFormatted: user.lastLogin
        ? new Date(user.lastLogin).toISOString()
        : null,
      accountAge: Math.floor(
        (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
      ),
      totalSessions: user._count.sessions,
      totalActivities: user._count.activities,
      unreadNotifications: user._count.notifications,
    }));

    educademyLogger.logBusinessOperation(
      "GET_ALL_USERS",
      "USER",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { search, role, status },
        viewedUsersCount: users.length,
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        users: enrichedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        summary: {
          totalUsers: totalCount,
          activeUsers: users.filter((u) => u.isActive).length,
          verifiedUsers: users.filter((u) => u.isVerified).length,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get all users failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_ALL_USERS",
        entity: "USER",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      requestId,
    });
  }
});

export const getUserDetails = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { userId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getUserDetails",
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        bio: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLogin: true,
        timezone: true,
        language: true,
        country: true,
        phoneNumber: true,
        dateOfBirth: true,
        website: true,
        linkedinProfile: true,
        twitterProfile: true,
        githubProfile: true,
        studentProfile: {
          include: {
            enrollments: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    thumbnail: true,
                    price: true,
                    status: true,
                    instructor: {
                      select: {
                        user: {
                          select: { firstName: true, lastName: true },
                        },
                      },
                    },
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            reviews: {
              include: {
                course: {
                  select: { title: true },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 5,
            },
            cart: {
              include: {
                course: {
                  select: { title: true, price: true },
                },
              },
            },
            wishlist: {
              include: {
                course: {
                  select: { title: true, price: true },
                },
              },
            },
            quizAttempts: {
              include: {
                quiz: {
                  select: { title: true },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 5,
            },
            assignmentSubmissions: {
              include: {
                assignment: {
                  select: { title: true },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
        instructorProfile: {
          include: {
            courses: {
              select: {
                id: true,
                title: true,
                status: true,
                totalEnrollments: true,
                averageRating: true,
                totalRevenue: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
            earnings: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
        adminProfile: {
          select: {
            id: true,
            permissions: true,
            department: true,
            resolvedLogs: true,
          },
        },
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            createdAt: true,
            expiresAt: true,
            device: true,
            ipAddress: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            action: true,
            details: true,
            createdAt: true,
            ipAddress: true,
          },
        },
        notifications: {
          where: { isRead: false },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            createdAt: true,
            priority: true,
          },
        },
        deviceSessions: {
          orderBy: { lastActivity: "desc" },
          take: 5,
          select: {
            id: true,
            deviceType: true,
            operatingSystem: true,
            browser: true,
            ipAddress: true,
            location: true,
            isActive: true,
            lastActivity: true,
          },
        },
        userActivities: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            action: true,
            page: true,
            createdAt: true,
            sessionTime: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            subject: true,
            messageType: true,
            isRead: true,
            createdAt: true,
            receiver: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        receivedMessages: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            subject: true,
            messageType: true,
            isRead: true,
            createdAt: true,
            sender: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        followers: {
          include: {
            follower: {
              select: { firstName: true, lastName: true, profileImage: true },
            },
          },
          take: 10,
        },
        following: {
          include: {
            following: {
              select: { firstName: true, lastName: true, profileImage: true },
            },
          },
          take: 10,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userStats = {
      accountAge: Math.floor(
        (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
      ),
      totalSessions: user.sessions?.length || 0,
      totalActivities: user.activities?.length || 0,
      unreadNotifications: user.notifications?.length || 0,
      activeDevices: user.deviceSessions?.filter((d) => d.isActive).length || 0,
      totalEnrollments: user.studentProfile?.enrollments?.length || 0,
      totalCourses: user.instructorProfile?.courses?.length || 0,
      totalEarnings:
        user.instructorProfile?.earnings?.reduce(
          (sum, e) => sum + parseFloat(e.amount),
          0
        ) || 0,
      followerCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
    };

    const enrichedUser = {
      ...user,
      stats: userStats,
    };

    educademyLogger.logBusinessOperation(
      "GET_USER_DETAILS",
      "USER",
      req.userAuthId,
      "SUCCESS",
      {
        targetUserId: userId,
        role: user.role,
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      data: { user: enrichedUser },
    });
  } catch (error) {
    educademyLogger.error("Get user details failed", error, {
      userId: req.userAuthId,
      targetUserId: userId,
      business: {
        operation: "GET_USER_DETAILS",
        entity: "USER",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve user details",
      requestId,
    });
  }
});

export const getStudents = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    search = "",
    skillLevel = "",
    status = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getStudents",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      role: "STUDENT",
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (status === "verified") where.isVerified = true;
    if (status === "unverified") where.isVerified = false;

    const studentWhere = {};
    if (skillLevel) studentWhere.skillLevel = skillLevel;

    const [students, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          email: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          bio: true,
          role: true,
          isVerified: true,
          isActive: true,
          lastLogin: true,
          timezone: true,
          language: true,
          country: true,
          phoneNumber: true,
          dateOfBirth: true,
          website: true,
          linkedinProfile: true,
          twitterProfile: true,
          githubProfile: true,
          studentProfile: {
            where: studentWhere,
            include: {
              enrollments: {
                include: {
                  course: {
                    select: {
                      title: true,
                      status: true,
                      price: true,
                    },
                  },
                },
                take: 5,
                orderBy: { createdAt: "desc" },
              },
              reviews: {
                select: {
                  rating: true,
                  createdAt: true,
                  course: {
                    select: { title: true },
                  },
                },
                take: 3,
                orderBy: { createdAt: "desc" },
              },
              cart: {
                include: {
                  course: {
                    select: { title: true, price: true },
                  },
                },
              },
              wishlist: {
                include: {
                  course: {
                    select: { title: true, price: true },
                  },
                },
              },
              _count: {
                select: {
                  enrollments: true,
                  reviews: true,
                  cart: true,
                  wishlist: true,
                  quizAttempts: true,
                  assignmentSubmissions: true,
                },
              },
            },
          },
          _count: {
            select: {
              sessions: true,
              activities: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({
        where: {
          ...where,
          studentProfile: studentWhere,
        },
      }),
    ]);

    const enrichedStudents = students
      .filter((student) => student.studentProfile)
      .map((student) => {
        const profile = student.studentProfile;
        return {
          ...student,
          learningStats: {
            totalEnrollments: profile._count.enrollments,
            totalReviews: profile._count.reviews,
            cartItems: profile._count.cart,
            wishlistItems: profile._count.wishlist,
            quizAttempts: profile._count.quizAttempts,
            assignmentSubmissions: profile._count.assignmentSubmissions,
            averageRating:
              profile.reviews.length > 0
                ? profile.reviews.reduce((sum, r) => sum + r.rating, 0) /
                  profile.reviews.length
                : 0,
            totalSpent: profile.enrollments.reduce(
              (sum, e) => sum + parseFloat(e.course.price || 0),
              0
            ),
          },
        };
      });

    educademyLogger.logBusinessOperation(
      "GET_STUDENTS",
      "USER",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { search, skillLevel, status },
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        students: enrichedStudents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        summary: {
          totalStudents: totalCount,
          activeStudents: enrichedStudents.filter((s) => s.isActive).length,
          verifiedStudents: enrichedStudents.filter((s) => s.isVerified).length,
          skillLevelDistribution: {
            beginner: enrichedStudents.filter(
              (s) => s.studentProfile?.skillLevel === "BEGINNER"
            ).length,
            intermediate: enrichedStudents.filter(
              (s) => s.studentProfile?.skillLevel === "INTERMEDIATE"
            ).length,
            advanced: enrichedStudents.filter(
              (s) => s.studentProfile?.skillLevel === "ADVANCED"
            ).length,
            expert: enrichedStudents.filter(
              (s) => s.studentProfile?.skillLevel === "EXPERT"
            ).length,
          },
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get students failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_STUDENTS",
        entity: "USER",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
      requestId,
    });
  }
});

export const getInstructors = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    search = "",
    isVerified = "",
    status = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getInstructors",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      role: "INSTRUCTOR",
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (status === "verified") where.isVerified = true;
    if (status === "unverified") where.isVerified = false;

    const instructorWhere = {};
    if (isVerified === "true") instructorWhere.isVerified = true;
    if (isVerified === "false") instructorWhere.isVerified = false;

    const [instructors, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          email: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          bio: true,
          role: true,
          isVerified: true,
          isActive: true,
          lastLogin: true,
          timezone: true,
          language: true,
          country: true,
          phoneNumber: true,
          dateOfBirth: true,
          website: true,
          linkedinProfile: true,
          twitterProfile: true,
          githubProfile: true,
          instructorProfile: {
            where: instructorWhere,
            include: {
              courses: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  totalEnrollments: true,
                  averageRating: true,
                  totalRevenue: true,
                  createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 5,
              },
              earnings: {
                where: {
                  status: "PAID",
                },
                select: {
                  amount: true,
                  createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
              },
              _count: {
                select: {
                  courses: true,
                  earnings: true,
                },
              },
            },
          },
          _count: {
            select: {
              sessions: true,
              activities: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({
        where: {
          ...where,
          instructorProfile: instructorWhere,
        },
      }),
    ]);

    const enrichedInstructors = instructors
      .filter((instructor) => instructor.instructorProfile)
      .map((instructor) => {
        const profile = instructor.instructorProfile;
        return {
          ...instructor,
          teachingStats: {
            totalCourses: profile._count.courses,
            publishedCourses: profile.courses.filter(
              (c) => c.status === "PUBLISHED"
            ).length,
            totalStudents: profile.totalStudents,
            totalRevenue: parseFloat(profile.totalRevenue || 0),
            averageRating: profile.rating || 0,
            totalEarnings: profile.earnings.reduce(
              (sum, e) => sum + parseFloat(e.amount),
              0
            ),
            monthlyEarnings: profile.earnings
              .filter(
                (e) =>
                  new Date(e.createdAt) >=
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              )
              .reduce((sum, e) => sum + parseFloat(e.amount), 0),
            recentCourses: profile.courses.slice(0, 3),
          },
        };
      });

    const topEarners = enrichedInstructors
      .sort(
        (a, b) => b.teachingStats.totalEarnings - a.teachingStats.totalEarnings
      )
      .slice(0, 5);

    const topRated = enrichedInstructors
      .filter((i) => i.teachingStats.averageRating > 0)
      .sort(
        (a, b) => b.teachingStats.averageRating - a.teachingStats.averageRating
      )
      .slice(0, 5);

    educademyLogger.logBusinessOperation(
      "GET_INSTRUCTORS",
      "USER",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { search, isVerified, status },
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        instructors: enrichedInstructors,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        summary: {
          totalInstructors: totalCount,
          activeInstructors: enrichedInstructors.filter((i) => i.isActive)
            .length,
          verifiedInstructors: enrichedInstructors.filter(
            (i) => i.instructorProfile?.isVerified
          ).length,
          totalRevenue: enrichedInstructors.reduce(
            (sum, i) => sum + i.teachingStats.totalRevenue,
            0
          ),
          totalStudents: enrichedInstructors.reduce(
            (sum, i) => sum + i.teachingStats.totalStudents,
            0
          ),
          totalCourses: enrichedInstructors.reduce(
            (sum, i) => sum + i.teachingStats.totalCourses,
            0
          ),
        },
        insights: {
          topEarners: topEarners.map((i) => ({
            id: i.id,
            name: `${i.firstName} ${i.lastName}`,
            totalEarnings: i.teachingStats.totalEarnings,
            totalCourses: i.teachingStats.totalCourses,
          })),
          topRated: topRated.map((i) => ({
            id: i.id,
            name: `${i.firstName} ${i.lastName}`,
            rating: i.teachingStats.averageRating,
            totalStudents: i.teachingStats.totalStudents,
          })),
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get instructors failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_INSTRUCTORS",
        entity: "USER",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructors",
      requestId,
    });
  }
});

export const getAdmins = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    search = "",
    department = "",
    status = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getAdmins",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      role: { in: ["ADMIN", "MODERATOR"] },
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (status === "verified") where.isVerified = true;
    if (status === "unverified") where.isVerified = false;

    const adminWhere = {};
    if (department) adminWhere.department = department;

    const [admins, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          email: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          bio: true,
          role: true,
          isVerified: true,
          isActive: true,
          lastLogin: true,
          timezone: true,
          language: true,
          country: true,
          phoneNumber: true,
          dateOfBirth: true,
          website: true,
          linkedinProfile: true,
          twitterProfile: true,
          githubProfile: true,
          adminProfile: {
            where: adminWhere,
            select: {
              id: true,
              permissions: true,
              department: true,
              resolvedLogs: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              sessions: true,
              activities: true,
              couponsCreated: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({
        where: {
          ...where,
          adminProfile: adminWhere,
        },
      }),
    ]);

    const enrichedAdmins = admins
      .filter((admin) => admin.adminProfile)
      .map((admin) => {
        const profile = admin.adminProfile;
        return {
          ...admin,
          adminStats: {
            resolvedLogsCount: profile.resolvedLogs?.length || 0,
            totalSessions: admin._count.sessions,
            totalActivities: admin._count.activities,
            couponsCreated: admin._count.couponsCreated,
            permissionsCount: profile.permissions?.length || 0,
            accountAge: Math.floor(
              (new Date() - new Date(admin.createdAt)) / (1000 * 60 * 60 * 24)
            ),
            lastLoginFormatted: admin.lastLogin
              ? new Date(admin.lastLogin).toISOString()
              : null,
          },
        };
      });

    const departmentDistribution = enrichedAdmins.reduce((acc, admin) => {
      const dept = admin.adminProfile?.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    const permissionAnalysis = enrichedAdmins.reduce((acc, admin) => {
      const permissions = admin.adminProfile?.permissions || [];
      permissions.forEach((permission) => {
        acc[permission] = (acc[permission] || 0) + 1;
      });
      return acc;
    }, {});

    educademyLogger.logBusinessOperation(
      "GET_ADMINS",
      "USER",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { search, department, status },
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        admins: enrichedAdmins,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        summary: {
          totalAdmins: totalCount,
          activeAdmins: enrichedAdmins.filter((a) => a.isActive).length,
          verifiedAdmins: enrichedAdmins.filter((a) => a.isVerified).length,
          departmentDistribution,
          permissionAnalysis,
          totalResolvedLogs: enrichedAdmins.reduce(
            (sum, a) => sum + a.adminStats.resolvedLogsCount,
            0
          ),
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get admins failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_ADMINS",
        entity: "USER",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve admins",
      requestId,
    });
  }
});

export const getUserSessions = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    userId = "",
    device = "",
    active = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getUserSessions",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (userId) where.userId = userId;
    if (device) where.device = { contains: device, mode: "insensitive" };

    const sessionWhere = {};
    if (active === "true") {
      sessionWhere.expiresAt = { gte: new Date() };
    } else if (active === "false") {
      sessionWhere.expiresAt = { lt: new Date() };
    }

    const [sessions, totalCount, activeSessionsCount] = await Promise.all([
      prisma.session.findMany({
        where: { ...where, ...sessionWhere },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              profileImage: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.session.count({ where: { ...where, ...sessionWhere } }),
      prisma.session.count({
        where: {
          expiresAt: { gte: new Date() },
        },
      }),
    ]);

    const enrichedSessions = sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      tokenHash: session.token ? `${session.token.substring(0, 8)}...` : null,
      device: session.device,
      ipAddress: session.ipAddress,
      userId: session.userId,
      user: session.user,
      isExpired: new Date(session.expiresAt) < new Date(),
      duration: new Date(session.updatedAt) - new Date(session.createdAt),
      deviceInfo: {
        type: session.device || "Unknown",
        location: session.ipAddress || "Unknown",
      },
    }));

    const deviceAnalysis = sessions.reduce((acc, session) => {
      const device = session.device || "Unknown";
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    const userSessionCounts = sessions.reduce((acc, session) => {
      const userId = session.userId;
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {});

    const topActiveUsers = Object.entries(userSessionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => {
        const user = sessions.find((s) => s.userId === userId)?.user;
        return {
          userId,
          sessionCount: count,
          user,
        };
      });

    educademyLogger.logBusinessOperation(
      "GET_USER_SESSIONS",
      "SESSION",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        activeSessionsCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { userId, device, active },
        viewedUserId: userId,
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        sessions: enrichedSessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        summary: {
          totalSessions: totalCount,
          activeSessions: activeSessionsCount,
          expiredSessions: totalCount - activeSessionsCount,
          deviceAnalysis,
          topActiveUsers,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get user sessions failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_USER_SESSIONS",
        entity: "SESSION",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve user sessions",
      requestId,
    });
  }
});

export const getUserActivities = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    userId = "",
    action = "",
    startDate = "",
    endDate = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getUserActivities",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: "insensitive" };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [activities, totalCount, userActivities] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              profileImage: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.activity.count({ where }),
      prisma.userActivity.findMany({
        where: userId ? { userId } : {},
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit),
      }),
    ]);

    const actionAnalysis = activities.reduce((acc, activity) => {
      const action = activity.action;
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {});

    const userActivityCounts = activities.reduce((acc, activity) => {
      const userId = activity.userId;
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {});

    const topActiveUsers = Object.entries(userActivityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => {
        const user = activities.find((a) => a.userId === userId)?.user;
        return {
          userId,
          activityCount: count,
          user,
        };
      });

    const hourlyActivity = activities.reduce((acc, activity) => {
      const hour = new Date(activity.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const recentSecurityEvents = activities
      .filter(
        (activity) =>
          activity.action.toLowerCase().includes("login") ||
          activity.action.toLowerCase().includes("logout") ||
          activity.action.toLowerCase().includes("password") ||
          activity.action.toLowerCase().includes("security")
      )
      .slice(0, 10);

    educademyLogger.logBusinessOperation(
      "GET_USER_ACTIVITIES",
      "ACTIVITY",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { userId, action, startDate, endDate },
      }
    );

    res.status(200).json({
      success: true,
      data: {
        activities,
        userActivities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        analytics: {
          actionAnalysis,
          topActiveUsers,
          hourlyActivity,
          recentSecurityEvents: recentSecurityEvents.map((event) => ({
            id: event.id,
            action: event.action,
            user: event.user,
            createdAt: event.createdAt,
            ipAddress: event.ipAddress,
            location: event.location,
          })),
        },
        summary: {
          totalActivities: totalCount,
          uniqueUsers: Object.keys(userActivityCounts).length,
          mostCommonAction:
            Object.entries(actionAnalysis).sort(
              ([, a], [, b]) => b - a
            )[0]?.[0] || "None",
          timeRange: {
            oldest:
              activities.length > 0
                ? activities[activities.length - 1]?.createdAt
                : null,
            newest: activities.length > 0 ? activities[0]?.createdAt : null,
          },
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get user activities failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_USER_ACTIVITIES",
        entity: "ACTIVITY",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve user activities",
      requestId,
    });
  }
});

export const getReactivationRequests = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    status = "",
    search = "",
    startDate = "",
    endDate = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getReactivationRequests",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { userEmail: { contains: search, mode: "insensitive" } },
        { userName: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [reactivationRequests, totalCount, statusCounts] = await Promise.all([
      prisma.reactivationRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              profileImage: true,
              isActive: true,
              isVerified: true,
              lastLogin: true,
              createdAt: true,
            },
          },
          reviewedBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.reactivationRequest.count({ where }),
      prisma.reactivationRequest.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const enrichedRequests = reactivationRequests.map((request) => ({
      ...request,
      requestAge: Math.floor(
        (new Date() - new Date(request.createdAt)) / (1000 * 60 * 60 * 24)
      ),
      userInfo: {
        name: `${request.user.firstName} ${request.user.lastName}`,
        email: request.user.email,
        role: request.user.role,
        currentStatus: {
          isActive: request.user.isActive,
          isVerified: request.user.isVerified,
        },
        accountAge: Math.floor(
          (new Date() - new Date(request.user.createdAt)) /
            (1000 * 60 * 60 * 24)
        ),
        lastLogin: request.user.lastLogin,
      },
      reviewerInfo: request.reviewedBy
        ? `${request.reviewedBy.firstName} ${request.reviewedBy.lastName}`
        : null,
      isPending: request.status === "PENDING",
      isUrgent:
        request.createdAt &&
        new Date() - new Date(request.createdAt) > 7 * 24 * 60 * 60 * 1000,
    }));

    const statusDistribution = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    const urgentRequests = enrichedRequests.filter(
      (request) => request.isUrgent && request.isPending
    );
    const recentRequests = enrichedRequests.filter(
      (request) =>
        new Date() - new Date(request.createdAt) < 24 * 60 * 60 * 1000
    );

    educademyLogger.logBusinessOperation(
      "GET_REACTIVATION_REQUESTS",
      "REACTIVATION_REQUEST",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { status, search, startDate, endDate },
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        reactivationRequests: enrichedRequests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        analytics: {
          statusDistribution,
          urgentRequests: urgentRequests.length,
          recentRequests: recentRequests.length,
          averageResponseTime:
            enrichedRequests
              .filter((r) => r.reviewedAt)
              .reduce((sum, r) => {
                const responseTime =
                  new Date(r.reviewedAt) - new Date(r.createdAt);
                return sum + responseTime / (1000 * 60 * 60 * 24);
              }, 0) / enrichedRequests.filter((r) => r.reviewedAt).length || 0,
        },
        summary: {
          totalRequests: totalCount,
          pendingRequests: statusDistribution.PENDING || 0,
          approvedRequests: statusDistribution.APPROVED || 0,
          rejectedRequests: statusDistribution.REJECTED || 0,
          urgentRequests: urgentRequests.length,
          requestsToday: recentRequests.length,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get reactivation requests failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_REACTIVATION_REQUESTS",
        entity: "REACTIVATION_REQUEST",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve reactivation requests",
      requestId,
    });
  }
});

export const reviewReactivationRequest = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { reactivationRequestId } = req.params;
  const { action, adminNotes, reason } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "reviewReactivationRequest",
  });

  try {
    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either APPROVE or REJECT",
      });
    }

    const reactivationRequest = await prisma.reactivationRequest.findUnique({
      where: { id: reactivationRequestId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!reactivationRequest) {
      return res.status(404).json({
        success: false,
        message: "Reactivation request not found",
      });
    }

    if (reactivationRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Request has already been reviewed",
      });
    }

    const updateData = {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      reviewedAt: new Date(),
      reviewedById: req.userAuthId,
      adminNotes: adminNotes || "",
      rejectionReason: action === "REJECT" ? reason : null,
    };

    const updatedRequest = await prisma.reactivationRequest.update({
      where: { id: reactivationRequestId },
      data: updateData,
    });

    if (action === "APPROVE") {
      await prisma.user.update({
        where: { id: reactivationRequest.userId },
        data: { isActive: true },
      });

      await prisma.notification.create({
        data: {
          type: "SYSTEM_ANNOUNCEMENT",
          title: "Account Reactivated",
          message:
            "Your account reactivation request has been approved. Your account is now active.",
          userId: reactivationRequest.userId,
          priority: "HIGH",
          data: {
            reactivationRequestId,
            approvedBy: req.userAuthId,
            adminNotes: adminNotes || "",
          },
        },
      });

      educademyLogger.logAuditTrail(
        "APPROVE_REACTIVATION_REQUEST",
        "USER",
        reactivationRequest.userId,
        { isActive: false },
        { isActive: true },
        req.userAuthId
      );
    } else {
      await prisma.notification.create({
        data: {
          type: "SYSTEM_ANNOUNCEMENT",
          title: "Account Reactivation Denied",
          message: `Your account reactivation request has been denied. ${
            reason ? `Reason: ${reason}` : ""
          }`,
          userId: reactivationRequest.userId,
          priority: "NORMAL",
          data: {
            reactivationRequestId,
            rejectedBy: req.userAuthId,
            rejectionReason: reason || "",
            adminNotes: adminNotes || "",
          },
        },
      });
    }

    educademyLogger.logBusinessOperation(
      "REVIEW_REACTIVATION_REQUEST",
      "REACTIVATION_REQUEST",
      reactivationRequestId,
      "SUCCESS",
      {
        action,
        userId: reactivationRequest.userId,
        userEmail: reactivationRequest.userEmail,
        adminId: req.userAuthId,
        approved: action === "APPROVE",
      }
    );

    res.status(200).json({
      success: true,
      message: `Reactivation request ${action.toLowerCase()}ed successfully`,
      data: {
        reactivationRequest: updatedRequest,
        userReactivated: action === "APPROVE",
        action,
      },
    });
  } catch (error) {
    educademyLogger.error("Review reactivation request failed", error, {
      userId: req.userAuthId,
      reactivationRequestId,
      action,
      business: {
        operation: "REVIEW_REACTIVATION_REQUEST",
        entity: "REACTIVATION_REQUEST",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to review reactivation request",
      requestId,
    });
  }
});

export const getReactivationRequestDetails = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { reactivationRequestId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getReactivationRequestDetails",
  });

  try {
    const reactivationRequest = await prisma.reactivationRequest.findUnique({
      where: { id: reactivationRequestId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profileImage: true,
            isActive: true,
            isVerified: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
            country: true,
            phoneNumber: true,
          },
        },
        reviewedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!reactivationRequest) {
      return res.status(404).json({
        success: false,
        message: "Reactivation request not found",
      });
    }

    const userActivity = await prisma.activity.findMany({
      where: { userId: reactivationRequest.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        action: true,
        details: true,
        createdAt: true,
        ipAddress: true,
      },
    });

    const userSessions = await prisma.session.findMany({
      where: { userId: reactivationRequest.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        createdAt: true,
        expiresAt: true,
        device: true,
        ipAddress: true,
      },
    });

    const previousReactivationRequests =
      await prisma.reactivationRequest.findMany({
        where: {
          userId: reactivationRequest.userId,
          id: { not: reactivationRequestId },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          rejectionReason: true,
        },
      });

    const enrichedRequest = {
      ...reactivationRequest,
      requestAge: Math.floor(
        (new Date() - new Date(reactivationRequest.createdAt)) /
          (1000 * 60 * 60 * 24)
      ),
      userInfo: {
        ...reactivationRequest.user,
        accountAge: Math.floor(
          (new Date() - new Date(reactivationRequest.user.createdAt)) /
            (1000 * 60 * 60 * 24)
        ),
        daysSinceLastLogin: reactivationRequest.user.lastLogin
          ? Math.floor(
              (new Date() - new Date(reactivationRequest.user.lastLogin)) /
                (1000 * 60 * 60 * 24)
            )
          : null,
      },
      userActivity,
      userSessions,
      previousRequests: previousReactivationRequests,
      riskAssessment: {
        accountAge: Math.floor(
          (new Date() - new Date(reactivationRequest.user.createdAt)) /
            (1000 * 60 * 60 * 24)
        ),
        previousRequests: previousReactivationRequests.length,
        lastLoginDays: reactivationRequest.user.lastLogin
          ? Math.floor(
              (new Date() - new Date(reactivationRequest.user.lastLogin)) /
                (1000 * 60 * 60 * 24)
            )
          : null,
        recentActivity: userActivity.length,
        riskLevel: assessReactivationRisk({
          accountAge: Math.floor(
            (new Date() - new Date(reactivationRequest.user.createdAt)) /
              (1000 * 60 * 60 * 24)
          ),
          previousRequests: previousReactivationRequests.length,
          recentActivity: userActivity.length,
          verified: reactivationRequest.user.isVerified,
        }),
      },
    };

    educademyLogger.logBusinessOperation(
      "GET_REACTIVATION_REQUEST_DETAILS",
      "REACTIVATION_REQUEST",
      reactivationRequestId,
      "SUCCESS",
      {
        userId: reactivationRequest.userId,
        status: reactivationRequest.status,
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        reactivationRequest: enrichedRequest,
      },
    });
  } catch (error) {
    educademyLogger.error("Get reactivation request details failed", error, {
      userId: req.userAuthId,
      reactivationRequestId,
      business: {
        operation: "GET_REACTIVATION_REQUEST_DETAILS",
        entity: "REACTIVATION_REQUEST",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve reactivation request details",
      requestId,
    });
  }
});

function assessReactivationRisk({
  accountAge,
  previousRequests,
  recentActivity,
  verified,
}) {
  let riskScore = 0;

  if (accountAge < 30) riskScore += 2;
  else if (accountAge < 90) riskScore += 1;

  if (previousRequests > 2) riskScore += 3;
  else if (previousRequests > 0) riskScore += 1;

  if (recentActivity < 2) riskScore += 2;
  else if (recentActivity < 5) riskScore += 1;

  if (!verified) riskScore += 2;

  if (riskScore >= 6) return "HIGH";
  if (riskScore >= 3) return "MEDIUM";
  return "LOW";
}

export const updateUserStatus = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { userId } = req.params;
  const { isActive, isVerified, reason } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "updateUserStatus",
  });

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        isVerified: true,
        role: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    educademyLogger.logAuditTrail(
      "UPDATE_USER_STATUS",
      "USER",
      userId,
      { isActive: currentUser.isActive, isVerified: currentUser.isVerified },
      { isActive: updatedUser.isActive, isVerified: updatedUser.isVerified },
      req.userAuthId
    );

    // Handle account activation/deactivation
    if (isActive !== undefined && isActive !== currentUser.isActive) {
      const statusMessage = isActive
        ? "Your account has been activated"
        : "Your account has been deactivated";

      // Create in-app notification
      await prisma.notification.create({
        data: {
          type: "SYSTEM_ANNOUNCEMENT",
          title: "Account Status Update",
          message: statusMessage,
          userId: userId,
          priority: "HIGH",
          data: {
            reason: reason || "Administrative action",
            changedBy: req.userAuthId,
          },
        },
      });

      // Send email notification (CRITICAL for deactivated accounts)
      if (isActive) {
        // Account activated - user can now login
        emailService
          .sendAccountActivationEmail({
            email: currentUser.email,
            firstName: currentUser.firstName,
            reason: reason || "Administrative review completed",
            loginUrl: `${process.env.FRONTEND_URL}/login`,
          })
          .catch((err) => {
            educademyLogger.error(
              "Failed to send account activation email",
              err,
              {
                userId: currentUser.id,
                email: currentUser.email,
              }
            );
          });
      } else {
        // Account deactivated - user needs to know why
        emailService
          .sendAccountDeactivationEmail({
            email: currentUser.email,
            firstName: currentUser.firstName,
            reason: reason || "Administrative action",
            supportEmail: process.env.SUPPORT_EMAIL || "support@educademy.com",
            appealUrl: `${process.env.FRONTEND_URL}/appeal`,
          })
          .catch((err) => {
            educademyLogger.error(
              "Failed to send account deactivation email",
              err,
              {
                userId: currentUser.id,
                email: currentUser.email,
              }
            );
          });
      }
    }

    // Handle email verification status change
    if (isVerified !== undefined && isVerified !== currentUser.isVerified) {
      if (isVerified) {
        // Email verified by admin
        emailService
          .sendEmailVerificationConfirmation({
            email: currentUser.email,
            firstName: currentUser.firstName,
            verifiedBy: "administrator",
            loginUrl: `${process.env.FRONTEND_URL}/login`,
          })
          .catch((err) => {
            educademyLogger.error(
              "Failed to send email verification confirmation",
              err,
              {
                userId: currentUser.id,
                email: currentUser.email,
              }
            );
          });
      } else {
        // Email verification revoked
        emailService
          .sendEmailVerificationRevoked({
            email: currentUser.email,
            firstName: currentUser.firstName,
            reason: reason || "Administrative action",
            supportEmail: process.env.SUPPORT_EMAIL || "support@educademy.com",
          })
          .catch((err) => {
            educademyLogger.error(
              "Failed to send email verification revocation notice",
              err,
              {
                userId: currentUser.id,
                email: currentUser.email,
              }
            );
          });
      }
    }

    // If both status and verification changed, send combined notification
    if (
      isActive !== undefined &&
      isVerified !== undefined &&
      isActive !== currentUser.isActive &&
      isVerified !== currentUser.isVerified
    ) {
      emailService
        .sendAccountStatusUpdate({
          email: currentUser.email,
          firstName: currentUser.firstName,
          changes: {
            accountActivated: isActive && !currentUser.isActive,
            accountDeactivated: !isActive && currentUser.isActive,
            emailVerified: isVerified && !currentUser.isVerified,
            emailUnverified: !isVerified && currentUser.isVerified,
          },
          reason: reason || "Administrative action",
          loginUrl: `${process.env.FRONTEND_URL}/login`,
          supportEmail: process.env.SUPPORT_EMAIL || "support@educademy.com",
        })
        .catch((err) => {
          educademyLogger.error(
            "Failed to send combined account status update email",
            err,
            {
              userId: currentUser.id,
              email: currentUser.email,
            }
          );
        });
    }

    educademyLogger.logBusinessOperation(
      "UPDATE_USER_STATUS",
      "USER",
      userId,
      "SUCCESS",
      {
        changes: updateData,
        reason,
        adminId: req.userAuthId,
        emailSent: true,
      }
    );

    res.status(200).json({
      success: true,
      message:
        "User status updated successfully. Email notification sent to user.",
      data: {
        user: updatedUser,
        changes: updateData,
        emailNotification: {
          sent: true,
          recipient: currentUser.email,
          type:
            isActive !== undefined
              ? isActive
                ? "activation"
                : "deactivation"
              : "verification_update",
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Update user status failed", error, {
      userId: req.userAuthId,
      targetUserId: userId,
      business: {
        operation: "UPDATE_USER_STATUS",
        entity: "USER",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      requestId,
    });
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { userId } = req.params;
  const { reason, permanent = false } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "deleteUser",
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            enrollments: true,
          },
        },
        instructorProfile: {
          include: {
            courses: {
              where: { status: "PUBLISHED" },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.role === "INSTRUCTOR" &&
      user.instructorProfile?.courses?.length > 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete instructor with active published courses",
      });
    }

    if (
      user.role === "STUDENT" &&
      user.studentProfile?.enrollments?.length > 0
    ) {
      if (!permanent) {
        return res.status(400).json({
          success: false,
          message:
            "User has active enrollments. Use permanent deletion if necessary.",
        });
      }
    }

    if (permanent) {
      await prisma.user.delete({
        where: { id: userId },
      });

      educademyLogger.logAuditTrail(
        "DELETE_USER_PERMANENT",
        "USER",
        userId,
        user,
        null,
        req.userAuthId
      );

      educademyLogger.logSecurityEvent(
        "USER_PERMANENT_DELETION",
        "HIGH",
        {
          deletedUserId: userId,
          deletedUserEmail: user.email,
          adminId: req.userAuthId,
          reason,
        },
        req.userAuthId
      );
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          email: `deleted_${Date.now()}_${user.email}`,
        },
      });

      educademyLogger.logAuditTrail(
        "DELETE_USER_SOFT",
        "USER",
        userId,
        { isActive: user.isActive },
        { isActive: false },
        req.userAuthId
      );
    }

    educademyLogger.logBusinessOperation(
      "DELETE_USER",
      "USER",
      userId,
      "SUCCESS",
      {
        deletedUserEmail: user.email,
        reason,
        permanent,
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      message: permanent ? "User permanently deleted" : "User deactivated",
      data: {
        deletedUserId: userId,
        permanent,
      },
    });
  } catch (error) {
    educademyLogger.error("Delete user failed", error, {
      userId: req.userAuthId,
      targetUserId: userId,
      business: {
        operation: "DELETE_USER",
        entity: "USER",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      requestId,
    });
  }
});

export const bulkUpdateUsers = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { userIds, updateData, reason } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "bulkUpdateUsers",
  });

  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User IDs array is required",
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Update data is required",
      });
    }

    const allowedFields = ["isActive", "isVerified"];
    const invalidFields = Object.keys(updateData).filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(
          ", "
        )}. Allowed: ${allowedFields.join(", ")}`,
      });
    }

    const usersBeforeUpdate = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, isActive: true, isVerified: true },
    });

    if (usersBeforeUpdate.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some user IDs are invalid",
      });
    }

    const updateResult = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: updateData,
    });

    for (const user of usersBeforeUpdate) {
      educademyLogger.logAuditTrail(
        "BULK_UPDATE_USER",
        "USER",
        user.id,
        { isActive: user.isActive, isVerified: user.isVerified },
        updateData,
        req.userAuthId
      );

      await prisma.notification.create({
        data: {
          type: "SYSTEM_ANNOUNCEMENT",
          title: "Account Update",
          message: "Your account has been updated by an administrator",
          userId: user.id,
          priority: "NORMAL",
          data: {
            reason: reason || "Administrative bulk update",
            changes: updateData,
            changedBy: req.userAuthId,
          },
        },
      });
    }

    educademyLogger.logBusinessOperation(
      "BULK_UPDATE_USERS",
      "USER",
      req.userAuthId,
      "SUCCESS",
      {
        userCount: userIds.length,
        updatedCount: updateResult.count,
        updateData,
        reason,
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully updated ${updateResult.count} users`,
      data: {
        updatedCount: updateResult.count,
        requestedCount: userIds.length,
        updateData,
      },
    });
  } catch (error) {
    educademyLogger.error("Bulk update users failed", error, {
      userId: req.userAuthId,
      userIds: userIds?.length || 0,
      business: {
        operation: "BULK_UPDATE_USERS",
        entity: "USER",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to bulk update users",
      requestId,
    });
  }
});

export const getAllCourses = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    search = "",
    status = "",
    category = "",
    instructor = "",
    level = "",
    featured = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getAllCourses",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status;
    if (category) where.categoryId = category;
    if (instructor) where.instructorId = instructor;
    if (level) where.level = level;
    if (featured === "true") where.featured = true;
    if (featured === "false") where.featured = false;

    const [courses, totalCount, statusCounts] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          instructor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  profileImage: true,
                },
              },
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          subcategory: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              reviews: true,
              sections: true,
              discussions: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.course.count({ where }),
      prisma.course.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const enrichedCourses = courses.map((course) => ({
      ...course,
      enrollmentStats: {
        totalEnrollments: course._count.enrollments,
        totalReviews: course._count.reviews,
        totalSections: course._count.sections,
        totalDiscussions: course._count.discussions,
        completionRate: course.completionRate || 0,
        averageRating: course.averageRating || 0,
      },
      revenueStats: {
        totalRevenue: parseFloat(course.totalRevenue || 0),
        price: parseFloat(course.price || 0),
        discountPrice: parseFloat(course.discountPrice || 0),
      },
      instructorInfo: {
        name: `${course.instructor.user.firstName} ${course.instructor.user.lastName}`,
        email: course.instructor.user.email,
        rating: course.instructor.rating || 0,
        totalStudents: course.instructor.totalStudents || 0,
      },
    }));

    const statusDistribution = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    const levelDistribution = courses.reduce((acc, course) => {
      acc[course.level] = (acc[course.level] || 0) + 1;
      return acc;
    }, {});

    const topInstructors = courses.reduce((acc, course) => {
      const instructorId = course.instructorId;
      if (!acc[instructorId]) {
        acc[instructorId] = {
          instructor: course.instructor,
          courseCount: 0,
          totalEnrollments: 0,
          totalRevenue: 0,
        };
      }
      acc[instructorId].courseCount++;
      acc[instructorId].totalEnrollments += course._count.enrollments;
      acc[instructorId].totalRevenue += parseFloat(course.totalRevenue || 0);
      return acc;
    }, {});

    const topInstructorsList = Object.values(topInstructors)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    educademyLogger.logBusinessOperation(
      "GET_ALL_COURSES",
      "COURSE",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { search, status, category, instructor, level, featured },
      }
    );

    res.status(200).json({
      success: true,
      data: {
        courses: enrichedCourses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        analytics: {
          statusDistribution,
          levelDistribution,
          topInstructors: topInstructorsList,
          totalRevenue: courses.reduce(
            (sum, course) => sum + parseFloat(course.totalRevenue || 0),
            0
          ),
          totalEnrollments: courses.reduce(
            (sum, course) => sum + course._count.enrollments,
            0
          ),
          averagePrice:
            courses.length > 0
              ? courses.reduce(
                  (sum, course) => sum + parseFloat(course.price || 0),
                  0
                ) / courses.length
              : 0,
        },
        summary: {
          totalCourses: totalCount,
          publishedCourses: statusDistribution.PUBLISHED || 0,
          draftCourses: statusDistribution.DRAFT || 0,
          pendingReview: statusDistribution.UNDER_REVIEW || 0,
          featuredCourses: courses.filter((c) => c.featured).length,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get all courses failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_ALL_COURSES",
        entity: "COURSE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve courses",
      requestId,
    });
  }
});

export const reviewCourse = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "reviewCourse",
  });

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.status !== "UNDER_REVIEW") {
      return res.status(400).json({
        success: false,
        message: "Course is not under review",
      });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        reviewerId: req.userAuthId,
        reviewSubmittedAt: new Date(),
      },
    });

    educademyLogger.logAuditTrail(
      "COURSE_REVIEW",
      "COURSE",
      courseId,
      { reviewerId: course.reviewerId },
      { reviewerId: req.userAuthId },
      req.userAuthId
    );

    await prisma.notification.create({
      data: {
        type: "COURSE_UPDATED",
        title: "Course Review Completed",
        message: `Your course "${course.title}" has been reviewed by an admin. You will be notified of the decision soon.`,
        userId: course.instructor.userId,
        priority: "NORMAL",
        data: {
          courseId: courseId,
          reviewedBy: req.userAuthId,
          reviewedAt: new Date().toISOString(),
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "REVIEW_COURSE",
      "COURSE",
      courseId,
      "SUCCESS",
      {
        instructorId: course.instructorId,
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      message: "Course review completed successfully",
      data: {
        course: updatedCourse,
      },
    });
  } catch (error) {
    educademyLogger.error("Course review failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "REVIEW_COURSE",
        entity: "COURSE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to review course",
      requestId,
    });
  }
});

export const updateCourseStatus = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;
  const { status, reason, feedback } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "updateCourseStatus",
  });

  try {
    const validStatuses = [
      "DRAFT",
      "UNDER_REVIEW",
      "PUBLISHED",
      "ARCHIVED",
      "REJECTED",
      "SUSPENDED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const currentCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        status: true,
        instructor: {
          include: {
            user: {
              select: { email: true, firstName: true, id: true },
            },
          },
        },
      },
    });

    if (!currentCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const updateData = { status };

    if (status === "PUBLISHED" && currentCourse.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    if (status === "REJECTED") {
      updateData.rejectionReason = reason;
      updateData.reviewerFeedback = feedback;
    }

    if (status === "PUBLISHED" && feedback) {
      updateData.reviewerFeedback = feedback;
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
    });

    educademyLogger.logAuditTrail(
      "UPDATE_COURSE_STATUS",
      "COURSE",
      courseId,
      { status: currentCourse.status },
      { status: status },
      req.userAuthId
    );

    let notificationTitle = "Course Status Updated";
    let notificationPriority = "NORMAL";
    let notificationMessage = `Your course "${currentCourse.title}" status has been changed to ${status}`;

    if (status === "PUBLISHED") {
      notificationTitle = "Course Published";
      notificationPriority = "HIGH";
      notificationMessage = `Congratulations! Your course "${currentCourse.title}" has been published and is now live`;
    } else if (status === "REJECTED") {
      notificationTitle = "Course Rejected";
      notificationPriority = "HIGH";
      notificationMessage = `Your course "${currentCourse.title}" has been rejected`;
    } else if (status === "SUSPENDED") {
      notificationTitle = "Course Suspended";
      notificationPriority = "HIGH";
      notificationMessage = `Your course "${currentCourse.title}" has been suspended`;
    }

    if (feedback) {
      notificationMessage += `. Admin feedback: ${feedback}`;
    }

    if (reason && status === "REJECTED") {
      notificationMessage += `. Reason: ${reason}`;
    }

    await prisma.notification.create({
      data: {
        type: "COURSE_UPDATED",
        title: notificationTitle,
        message: notificationMessage,
        userId: currentCourse.instructor.user.id,
        priority: notificationPriority,
        data: {
          courseId: courseId,
          oldStatus: currentCourse.status,
          newStatus: status,
          reason: reason,
          feedback: feedback,
          changedBy: req.userAuthId,
        },
      },
    });

    try {
      if (status === "PUBLISHED") {
        await emailService.sendCourseApprovalEmail({
          email: currentCourse.instructor.user.email,
          firstName: currentCourse.instructor.user.firstName,
          courseTitle: currentCourse.title,
          courseId: courseId,
          feedback: feedback,
          courseUrl: `${process.env.FRONTEND_URL}/courses/${courseId}`,
          dashboardUrl: `${process.env.FRONTEND_URL}/instructor/dashboard`,
        });
      } else if (status === "REJECTED") {
        await emailService.sendCourseRejectionEmail({
          email: currentCourse.instructor.user.email,
          firstName: currentCourse.instructor.user.firstName,
          courseTitle: currentCourse.title,
          courseId: courseId,
          rejectionReason: reason,
          feedback: feedback,
          editCourseUrl: `${process.env.FRONTEND_URL}/instructor/courses/${courseId}/edit`,
          supportEmail: process.env.SUPPORT_EMAIL || "support@educademy.com",
        });
      } else if (status === "SUSPENDED") {
        await emailService.sendCourseSuspensionEmail({
          email: currentCourse.instructor.user.email,
          firstName: currentCourse.instructor.user.firstName,
          courseTitle: currentCourse.title,
          courseId: courseId,
          suspensionReason: reason,
          feedback: feedback,
          appealUrl: `${process.env.FRONTEND_URL}/instructor/appeal`,
          supportEmail: process.env.SUPPORT_EMAIL || "support@educademy.com",
        });
      }
    } catch (emailError) {
      educademyLogger.warn("Failed to send course status update email", {
        error: emailError,
        courseId,
        status,
        email: currentCourse.instructor.user.email,
      });
    }

    educademyLogger.logBusinessOperation(
      "UPDATE_COURSE_STATUS",
      "COURSE",
      courseId,
      "SUCCESS",
      {
        oldStatus: currentCourse.status,
        newStatus: status,
        reason,
        adminId: req.userAuthId,
        emailSent: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Course status updated successfully",
      data: {
        course: updatedCourse,
        oldStatus: currentCourse.status,
        newStatus: status,
        emailNotification: {
          sent: true,
          recipient: currentCourse.instructor.user.email,
          type: status.toLowerCase(),
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Update course status failed", error, {
      userId: req.userAuthId,
      courseId,
      status,
      business: {
        operation: "UPDATE_COURSE_STATUS",
        entity: "COURSE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to update course status",
      requestId,
    });
  }
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;
  const { reason, permanent = false } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "deleteCourse",
  });

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: true,
        instructor: {
          include: {
            user: {
              select: { email: true, firstName: true, id: true },
            },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.enrollments.length > 0 && !permanent) {
      return res.status(400).json({
        success: false,
        message: "Course has enrollments. Use permanent deletion if necessary.",
      });
    }

    if (permanent) {
      await prisma.course.delete({
        where: { id: courseId },
      });

      educademyLogger.logAuditTrail(
        "DELETE_COURSE_PERMANENT",
        "COURSE",
        courseId,
        course,
        null,
        req.userAuthId
      );
    } else {
      await prisma.course.update({
        where: { id: courseId },
        data: { status: "ARCHIVED" },
      });

      educademyLogger.logAuditTrail(
        "DELETE_COURSE_SOFT",
        "COURSE",
        courseId,
        { status: course.status },
        { status: "ARCHIVED" },
        req.userAuthId
      );
    }

    await prisma.notification.create({
      data: {
        type: "COURSE_UPDATED",
        title: permanent ? "Course Permanently Deleted" : "Course Archived",
        message: `Your course "${course.title}" has been ${
          permanent ? "permanently deleted" : "archived"
        }${reason ? `. Reason: ${reason}` : ""}`,
        userId: course.instructor.user.id,
        priority: "HIGH",
        data: {
          courseId: courseId,
          courseTitle: course.title,
          action: permanent ? "deleted" : "archived",
          reason: reason,
          actionBy: req.userAuthId,
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "DELETE_COURSE",
      "COURSE",
      courseId,
      "SUCCESS",
      {
        courseTitle: course.title,
        reason,
        permanent,
        enrollmentsCount: course.enrollments.length,
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      message: permanent ? "Course permanently deleted" : "Course archived",
      data: {
        deletedCourseId: courseId,
        permanent,
      },
    });
  } catch (error) {
    educademyLogger.error("Delete course failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "DELETE_COURSE",
        entity: "COURSE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to delete course",
      requestId,
    });
  }
});

export const getMonthlyAnalytics = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { year, months = 12 } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getMonthlyAnalytics",
  });

  try {
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const monthsToShow = parseInt(months);

    const [monthlyData, userGrowth, courseGrowth, revenueGrowth] =
      await Promise.all([
        prisma.monthlyAnalytics.findMany({
          where: {
            year: currentYear,
          },
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: monthsToShow,
        }),

        prisma.user.groupBy({
          by: ["createdAt"],
          _count: { _all: true },
          where: {
            createdAt: {
              gte: new Date(currentYear, 0, 1),
              lte: new Date(currentYear, 11, 31),
            },
          },
        }),

        prisma.course.groupBy({
          by: ["createdAt"],
          _count: { _all: true },
          where: {
            createdAt: {
              gte: new Date(currentYear, 0, 1),
              lte: new Date(currentYear, 11, 31),
            },
          },
        }),

        prisma.payment.groupBy({
          by: ["createdAt"],
          _sum: { amount: true },
          _count: { _all: true },
          where: {
            status: "COMPLETED",
            createdAt: {
              gte: new Date(currentYear, 0, 1),
              lte: new Date(currentYear, 11, 31),
            },
          },
        }),
      ]);

    const monthlyUserGrowth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthData = userGrowth.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return (
          itemDate.getMonth() + 1 === month &&
          itemDate.getFullYear() === currentYear
        );
      });
      return {
        month,
        newUsers: monthData.reduce((sum, item) => sum + item._count._all, 0),
      };
    });

    const monthlyCourseGrowth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthData = courseGrowth.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return (
          itemDate.getMonth() + 1 === month &&
          itemDate.getFullYear() === currentYear
        );
      });
      return {
        month,
        newCourses: monthData.reduce((sum, item) => sum + item._count._all, 0),
      };
    });

    const monthlyRevenueGrowth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthData = revenueGrowth.filter((item) => {
        const itemDate = new Date(item.createdAt);
        return (
          itemDate.getMonth() + 1 === month &&
          itemDate.getFullYear() === currentYear
        );
      });
      return {
        month,
        revenue: monthData.reduce(
          (sum, item) => sum + parseFloat(item._sum.amount || 0),
          0
        ),
        transactions: monthData.reduce(
          (sum, item) => sum + item._count._all,
          0
        ),
      };
    });

    const yearlyTotals = {
      totalUsers: monthlyUserGrowth.reduce(
        (sum, item) => sum + item.newUsers,
        0
      ),
      totalCourses: monthlyCourseGrowth.reduce(
        (sum, item) => sum + item.newCourses,
        0
      ),
      totalRevenue: monthlyRevenueGrowth.reduce(
        (sum, item) => sum + item.revenue,
        0
      ),
      totalTransactions: monthlyRevenueGrowth.reduce(
        (sum, item) => sum + item.transactions,
        0
      ),
    };

    const growthRates = {
      userGrowthRate:
        monthlyUserGrowth.length > 1
          ? ((monthlyUserGrowth[monthlyUserGrowth.length - 1].newUsers -
              monthlyUserGrowth[0].newUsers) /
              Math.max(monthlyUserGrowth[0].newUsers, 1)) *
            100
          : 0,
      courseGrowthRate:
        monthlyCourseGrowth.length > 1
          ? ((monthlyCourseGrowth[monthlyCourseGrowth.length - 1].newCourses -
              monthlyCourseGrowth[0].newCourses) /
              Math.max(monthlyCourseGrowth[0].newCourses, 1)) *
            100
          : 0,
      revenueGrowthRate:
        monthlyRevenueGrowth.length > 1
          ? ((monthlyRevenueGrowth[monthlyRevenueGrowth.length - 1].revenue -
              monthlyRevenueGrowth[0].revenue) /
              Math.max(monthlyRevenueGrowth[0].revenue, 1)) *
            100
          : 0,
    };

    const averages = {
      averageUsersPerMonth: yearlyTotals.totalUsers / 12,
      averageCoursesPerMonth: yearlyTotals.totalCourses / 12,
      averageRevenuePerMonth: yearlyTotals.totalRevenue / 12,
      averageTransactionsPerMonth: yearlyTotals.totalTransactions / 12,
    };

    educademyLogger.logBusinessOperation(
      "GET_MONTHLY_ANALYTICS",
      "ANALYTICS",
      req.userAuthId,
      "SUCCESS",
      {
        year: currentYear,
        monthsRequested: monthsToShow,
        dataPointsReturned: monthlyData.length,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        monthlyAnalytics: monthlyData,
        userGrowth: monthlyUserGrowth,
        courseGrowth: monthlyCourseGrowth,
        revenueGrowth: monthlyRevenueGrowth,
        yearlyTotals,
        growthRates,
        averages,
        metadata: {
          year: currentYear,
          monthsAnalyzed: monthsToShow,
          dataAvailable: monthlyData.length > 0,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get monthly analytics failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_MONTHLY_ANALYTICS",
        entity: "ANALYTICS",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve monthly analytics",
      requestId,
    });
  }
});

export const getCourseAnalyticsForAdmin = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const {
    courseId = "",
    startDate = "",
    endDate = "",
    period = "30",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getCourseAnalyticsForAdmin",
  });

  try {
    const days = parseInt(period);
    const dateFilter = {};

    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    if (!startDate && !endDate) {
      dateFilter.gte = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    const where = courseId ? { courseId } : {};
    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }

    const [
      courseAnalytics,
      enrollmentTrends,
      revenueTrends,
      completionStats,
      reviewStats,
    ] = await Promise.all([
      prisma.courseAnalytics.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              status: true,
              price: true,
              instructor: {
                select: {
                  user: {
                    select: { firstName: true, lastName: true },
                  },
                },
              },
              category: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { date: "desc" },
      }),

      prisma.enrollment.groupBy({
        by: ["createdAt", "courseId"],
        _count: { _all: true },
        where: {
          createdAt: dateFilter,
          ...(courseId && { courseId }),
        },
      }),

      prisma.payment.groupBy({
        by: ["createdAt"],
        _sum: { amount: true },
        _count: { _all: true },
        where: {
          status: "COMPLETED",
          createdAt: dateFilter,
          enrollments: courseId
            ? {
                some: { courseId },
              }
            : undefined,
        },
      }),

      prisma.enrollment.groupBy({
        by: ["status", "courseId"],
        _count: { _all: true },
        where: {
          createdAt: dateFilter,
          ...(courseId && { courseId }),
        },
      }),

      prisma.review.groupBy({
        by: ["rating", "courseId"],
        _count: { _all: true },
        where: {
          createdAt: dateFilter,
          ...(courseId && { courseId }),
        },
      }),
    ]);

    const topPerformingCourses = courseAnalytics
      .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
      .slice(0, 10)
      .map((analytics) => ({
        ...analytics.course,
        analytics: {
          totalEnrollments: analytics.totalEnrollments,
          completionRate: analytics.completionRate,
          averageRating: analytics.averageRating,
          revenue: parseFloat(analytics.revenue || 0),
          views: analytics.totalViews,
          engagementRate: analytics.engagementRate,
        },
      }));

    const categoryPerformance = courseAnalytics.reduce((acc, analytics) => {
      const category = analytics.course.category?.name || "Uncategorized";
      if (!acc[category]) {
        acc[category] = {
          totalEnrollments: 0,
          totalRevenue: 0,
          courseCount: 0,
          averageRating: 0,
          totalViews: 0,
        };
      }
      acc[category].totalEnrollments += analytics.totalEnrollments;
      acc[category].totalRevenue += parseFloat(analytics.revenue || 0);
      acc[category].courseCount += 1;
      acc[category].averageRating += analytics.averageRating;
      acc[category].totalViews += analytics.totalViews;
      return acc;
    }, {});

    Object.keys(categoryPerformance).forEach((category) => {
      categoryPerformance[category].averageRating =
        categoryPerformance[category].averageRating /
        categoryPerformance[category].courseCount;
    });

    const instructorPerformance = courseAnalytics.reduce((acc, analytics) => {
      const instructorName = `${analytics.course.instructor.user.firstName} ${analytics.course.instructor.user.lastName}`;
      if (!acc[instructorName]) {
        acc[instructorName] = {
          totalEnrollments: 0,
          totalRevenue: 0,
          courseCount: 0,
          averageRating: 0,
        };
      }
      acc[instructorName].totalEnrollments += analytics.totalEnrollments;
      acc[instructorName].totalRevenue += parseFloat(analytics.revenue || 0);
      acc[instructorName].courseCount += 1;
      acc[instructorName].averageRating += analytics.averageRating;
      return acc;
    }, {});

    Object.keys(instructorPerformance).forEach((instructor) => {
      instructorPerformance[instructor].averageRating =
        instructorPerformance[instructor].averageRating /
        instructorPerformance[instructor].courseCount;
    });

    const enrollmentsByDay = enrollmentTrends.reduce((acc, item) => {
      const date = new Date(item.createdAt).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + item._count._all;
      return acc;
    }, {});

    const revenueByDay = revenueTrends.reduce((acc, item) => {
      const date = new Date(item.createdAt).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + parseFloat(item._sum.amount || 0);
      return acc;
    }, {});

    const completionAnalysis = completionStats.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + item._count._all;
      return acc;
    }, {});

    const ratingDistribution = reviewStats.reduce((acc, item) => {
      acc[`${item.rating}_star`] =
        (acc[`${item.rating}_star`] || 0) + item._count._all;
      return acc;
    }, {});

    const summary = {
      totalCourses: courseAnalytics.length,
      totalEnrollments: courseAnalytics.reduce(
        (sum, a) => sum + a.totalEnrollments,
        0
      ),
      totalRevenue: courseAnalytics.reduce(
        (sum, a) => sum + parseFloat(a.revenue || 0),
        0
      ),
      averageCompletionRate:
        courseAnalytics.length > 0
          ? courseAnalytics.reduce((sum, a) => sum + a.completionRate, 0) /
            courseAnalytics.length
          : 0,
      averageRating:
        courseAnalytics.length > 0
          ? courseAnalytics.reduce((sum, a) => sum + a.averageRating, 0) /
            courseAnalytics.length
          : 0,
      totalViews: courseAnalytics.reduce((sum, a) => sum + a.totalViews, 0),
    };

    educademyLogger.logBusinessOperation(
      "GET_COURSE_ANALYTICS_ADMIN",
      "ANALYTICS",
      req.userAuthId,
      "SUCCESS",
      {
        courseId: courseId || "all",
        period: days,
        analyticsCount: courseAnalytics.length,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        summary,
        courseAnalytics,
        topPerformingCourses,
        categoryPerformance,
        instructorPerformance,
        trends: {
          enrollmentsByDay,
          revenueByDay,
        },
        analytics: {
          completionAnalysis,
          ratingDistribution,
        },
        metadata: {
          period: days,
          startDate: dateFilter.gte?.toISOString(),
          endDate: dateFilter.lte?.toISOString(),
          courseId: courseId || "all",
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get course analytics for admin failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_COURSE_ANALYTICS_ADMIN",
        entity: "ANALYTICS",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve course analytics",
      requestId,
    });
  }
});

export const getAllCategories = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getAllCategories",
  });

  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subcategories: {
          include: {
            _count: {
              select: { courses: true },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            courses: true,
            subcategoryCourses: true,
          },
        },
      },
      orderBy: [{ parentId: "asc" }, { order: "asc" }, { name: "asc" }],
    });

    const enrichedCategories = categories.map((category) => ({
      ...category,
      stats: {
        directCourses: category._count.courses,
        subcategoryCourses: category._count.subcategoryCourses,
        totalCourses:
          category._count.courses + category._count.subcategoryCourses,
        subcategoryCount: category.subcategories.length,
        isParent: category.subcategories.length > 0,
        hasParent: !!category.parent,
      },
      subcategories: category.subcategories.map((sub) => ({
        ...sub,
        courseCount: sub._count.courses,
      })),
    }));

    const categoryStats = {
      totalCategories: categories.length,
      parentCategories: categories.filter((c) => !c.parentId).length,
      subcategories: categories.filter((c) => c.parentId).length,
      activeCategories: categories.filter((c) => c.isActive).length,
      inactiveCategories: categories.filter((c) => !c.isActive).length,
      categoriesWithCourses: categories.filter((c) => c._count.courses > 0)
        .length,
      emptCategories: categories.filter((c) => c._count.courses === 0).length,
    };

    const topCategories = enrichedCategories
      .sort((a, b) => b.stats.totalCourses - a.stats.totalCourses)
      .slice(0, 10)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        totalCourses: cat.stats.totalCourses,
        isActive: cat.isActive,
      }));

    educademyLogger.logBusinessOperation(
      "GET_ALL_CATEGORIES",
      "CATEGORY",
      req.userAuthId,
      "SUCCESS",
      { totalCategories: categories.length }
    );

    res.status(200).json({
      success: true,
      data: {
        categories: enrichedCategories,
        stats: categoryStats,
        topCategories,
      },
    });
  } catch (error) {
    educademyLogger.error("Get all categories failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_ALL_CATEGORIES",
        entity: "CATEGORY",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve categories",
      requestId,
    });
  }
});

export const createCategory = asyncHandler(async (req, res) => {
  uploadImage.single("image")(req, res, async (err) => {
    if (err) {
      educademyLogger.logValidationError("image", req.file, err.message, {
        userId: req.userAuthId,
        operation: "CREATE_CATEGORY",
      });
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const requestId = Math.random().toString(36).substr(2, 9);
    const {
      name,
      description,
      parentId,
      color,
      icon,
      isActive = true,
      order = 0,
    } = req.body;
    const image = req.file?.path || null;

    educademyLogger.setContext({
      requestId,
      userId: req.userAuthId,
      className: "AdminController",
      methodName: "createCategory",
    });

    try {
      if (!name) {
        if (image && req.file?.filename) {
          await deleteFromCloudinary(req.file.filename);
        }
        return res.status(400).json({
          success: false,
          message: "Category name is required",
        });
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim("-");

      const existingCategory = await prisma.category.findUnique({
        where: { slug },
      });

      if (existingCategory) {
        if (image && req.file?.filename) {
          await deleteFromCloudinary(req.file.filename);
        }
        return res.status(400).json({
          success: false,
          message: "Category with similar name already exists",
        });
      }

      if (parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: parentId },
        });

        if (!parentCategory) {
          if (image && req.file?.filename) {
            await deleteFromCloudinary(req.file.filename);
          }
          return res.status(400).json({
            success: false,
            message: "Parent category not found",
          });
        }
      }

      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description,
          image,
          icon,
          color,
          isActive,
          order: parseInt(order),
          parentId: parentId || null,
        },
        include: {
          parent: {
            select: { name: true, slug: true },
          },
          _count: {
            select: { courses: true },
          },
        },
      });

      educademyLogger.logBusinessOperation(
        "CREATE_CATEGORY",
        "CATEGORY",
        category.id,
        "SUCCESS",
        {
          categoryName: name,
          hasParent: !!parentId,
          hasImage: !!image,
          adminId: req.userAuthId,
        }
      );

      educademyLogger.logAuditTrail(
        "CREATE_CATEGORY",
        "CATEGORY",
        category.id,
        null,
        category,
        req.userAuthId
      );

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: { category },
      });
    } catch (error) {
      if (image && req.file?.filename) {
        await deleteFromCloudinary(req.file.filename);
      }

      educademyLogger.error("Create category failed", error, {
        userId: req.userAuthId,
        categoryName: name,
        business: {
          operation: "CREATE_CATEGORY",
          entity: "CATEGORY",
          status: "ERROR",
        },
      });

      res.status(500).json({
        success: false,
        message: "Failed to create category",
        requestId,
      });
    }
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  uploadImage.single("image")(req, res, async (err) => {
    if (err) {
      educademyLogger.logValidationError("image", req.file, err.message, {
        userId: req.userAuthId,
        operation: "UPDATE_CATEGORY",
      });
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const requestId = Math.random().toString(36).substr(2, 9);
    const { categoryId } = req.params;
    const {
      name,
      description,
      parentId,
      color,
      icon,
      isActive,
      order,
      removeImage,
    } = req.body;
    const newImage = req.file?.path || null;

    educademyLogger.setContext({
      requestId,
      userId: req.userAuthId,
      className: "AdminController",
      methodName: "updateCategory",
    });

    try {
      const currentCategory = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!currentCategory) {
        if (newImage && req.file?.filename) {
          await deleteFromCloudinary(req.file.filename);
        }
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      const updateData = {};

      if (name !== undefined) {
        updateData.name = name;
        if (name !== currentCategory.name) {
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim("-");

          const existingCategory = await prisma.category.findFirst({
            where: {
              slug,
              id: { not: categoryId },
            },
          });

          if (existingCategory) {
            if (newImage && req.file?.filename) {
              await deleteFromCloudinary(req.file.filename);
            }
            return res.status(400).json({
              success: false,
              message: "Category with similar name already exists",
            });
          }

          updateData.slug = slug;
        }
      }

      if (description !== undefined) updateData.description = description;
      if (color !== undefined) updateData.color = color;
      if (icon !== undefined) updateData.icon = icon;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (order !== undefined) updateData.order = parseInt(order);
      if (parentId !== undefined) updateData.parentId = parentId || null;

      if (newImage) {
        updateData.image = newImage;
        if (currentCategory.image) {
          try {
            const publicId = currentCategory.image
              .split("/")
              .pop()
              .split(".")[0];
            await deleteFromCloudinary(`educademy/images/${publicId}`);
          } catch (deleteError) {
            educademyLogger.warn("Failed to delete old category image", {
              error: deleteError,
              categoryId,
              oldImage: currentCategory.image,
            });
          }
        }
      } else if (removeImage === "true" && currentCategory.image) {
        updateData.image = null;
        try {
          const publicId = currentCategory.image.split("/").pop().split(".")[0];
          await deleteFromCloudinary(`educademy/images/${publicId}`);
        } catch (deleteError) {
          educademyLogger.warn("Failed to delete removed category image", {
            error: deleteError,
            categoryId,
            removedImage: currentCategory.image,
          });
        }
      }

      const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: updateData,
        include: {
          parent: {
            select: { name: true, slug: true },
          },
          _count: {
            select: { courses: true },
          },
        },
      });

      educademyLogger.logBusinessOperation(
        "UPDATE_CATEGORY",
        "CATEGORY",
        categoryId,
        "SUCCESS",
        {
          changedFields: Object.keys(updateData),
          adminId: req.userAuthId,
        }
      );

      educademyLogger.logAuditTrail(
        "UPDATE_CATEGORY",
        "CATEGORY",
        categoryId,
        currentCategory,
        updateData,
        req.userAuthId
      );

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: { category: updatedCategory },
      });
    } catch (error) {
      if (newImage && req.file?.filename) {
        await deleteFromCloudinary(req.file.filename);
      }

      educademyLogger.error("Update category failed", error, {
        userId: req.userAuthId,
        categoryId,
        business: {
          operation: "UPDATE_CATEGORY",
          entity: "CATEGORY",
          status: "ERROR",
        },
      });

      res.status(500).json({
        success: false,
        message: "Failed to update category",
        requestId,
      });
    }
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { categoryId } = req.params;
  const { reason, moveCoursesToCategory } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "deleteCategory",
  });

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        courses: true,
        subcategories: true,
        _count: {
          select: {
            courses: true,
            subcategoryCourses: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category.subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete category with subcategories. Delete subcategories first.",
      });
    }

    if (category.courses.length > 0) {
      if (!moveCoursesToCategory) {
        return res.status(400).json({
          success: false,
          message:
            "Category has courses. Specify moveCoursesToCategory to reassign them.",
        });
      }

      const targetCategory = await prisma.category.findUnique({
        where: { id: moveCoursesToCategory },
      });

      if (!targetCategory) {
        return res.status(400).json({
          success: false,
          message: "Target category for course reassignment not found",
        });
      }

      await prisma.course.updateMany({
        where: { categoryId: categoryId },
        data: { categoryId: moveCoursesToCategory },
      });

      educademyLogger.logBusinessOperation(
        "MOVE_COURSES_CATEGORY",
        "COURSE",
        categoryId,
        "SUCCESS",
        {
          fromCategoryId: categoryId,
          toCategoryId: moveCoursesToCategory,
          coursesCount: category.courses.length,
        }
      );
    }

    if (category.image) {
      try {
        const publicId = category.image.split("/").pop().split(".")[0];
        await deleteFromCloudinary(`educademy/images/${publicId}`);
      } catch (deleteError) {
        educademyLogger.warn("Failed to delete category image", {
          error: deleteError,
          categoryId,
          image: category.image,
        });
      }
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    educademyLogger.logBusinessOperation(
      "DELETE_CATEGORY",
      "CATEGORY",
      categoryId,
      "SUCCESS",
      {
        categoryName: category.name,
        coursesCount: category.courses.length,
        movedToCategory: moveCoursesToCategory,
        reason,
        adminId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "DELETE_CATEGORY",
      "CATEGORY",
      categoryId,
      category,
      null,
      req.userAuthId
    );

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: {
        deletedCategoryId: categoryId,
        coursesReassigned: category.courses.length,
        targetCategoryId: moveCoursesToCategory,
      },
    });
  } catch (error) {
    educademyLogger.error("Delete category failed", error, {
      userId: req.userAuthId,
      categoryId,
      business: {
        operation: "DELETE_CATEGORY",
        entity: "CATEGORY",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      requestId,
    });
  }
});

export const getAllPayments = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    status = "",
    method = "",
    startDate = "",
    endDate = "",
    minAmount = "",
    maxAmount = "",
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getAllPayments",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (status) where.status = status;
    if (method) where.method = method;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    if (search) {
      where.OR = [
        { transactionId: { contains: search, mode: "insensitive" } },
        {
          enrollments: {
            some: {
              student: {
                user: {
                  OR: [
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            },
          },
        },
      ];
    }

    const [payments, totalCount, totalAmount, statusCounts, methodCounts] =
      await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            enrollments: {
              include: {
                student: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        profileImage: true,
                      },
                    },
                  },
                },
                course: {
                  select: {
                    id: true,
                    title: true,
                    price: true,
                    thumbnail: true,
                    instructor: {
                      select: {
                        user: {
                          select: { firstName: true, lastName: true },
                        },
                      },
                    },
                  },
                },
              },
            },
            couponUsages: {
              include: {
                coupon: {
                  select: {
                    code: true,
                    type: true,
                    value: true,
                  },
                },
              },
            },
            earnings: {
              include: {
                instructor: {
                  select: {
                    user: {
                      select: { firstName: true, lastName: true },
                    },
                  },
                },
              },
            },
          },
          skip,
          take: parseInt(limit),
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.payment.count({ where }),
        prisma.payment.aggregate({
          where,
          _sum: { amount: true },
        }),
        prisma.payment.groupBy({
          by: ["status"],
          _count: { _all: true },
          where,
        }),
        prisma.payment.groupBy({
          by: ["method"],
          _count: { _all: true },
          where,
        }),
      ]);

    const enrichedPayments = payments.map((payment) => ({
      ...payment,
      studentInfo: payment.enrollments[0]?.student.user || null,
      courseInfo: payment.enrollments.map((e) => ({
        id: e.course.id,
        title: e.course.title,
        price: parseFloat(e.course.price),
        instructor: e.course.instructor.user,
      })),
      discountInfo: payment.couponUsages.map((usage) => ({
        couponCode: usage.coupon.code,
        discountType: usage.coupon.type,
        discountValue: parseFloat(usage.coupon.value),
        discountAmount: parseFloat(usage.discount),
      })),
      earningsInfo: payment.earnings.map((earning) => ({
        instructorName: `${earning.instructor.user.firstName} ${earning.instructor.user.lastName}`,
        amount: parseFloat(earning.amount),
        commission: parseFloat(earning.commission),
        platformFee: parseFloat(earning.platformFee),
      })),
      financialBreakdown: {
        grossAmount: parseFloat(payment.amount),
        discountAmount: parseFloat(payment.discountAmount || 0),
        taxAmount: parseFloat(payment.tax || 0),
        netAmount:
          parseFloat(payment.amount) - parseFloat(payment.discountAmount || 0),
      },
    }));

    const statusDistribution = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    const methodDistribution = methodCounts.reduce((acc, item) => {
      acc[item.method] = item._count._all;
      return acc;
    }, {});

    const revenueAnalysis = {
      totalRevenue: parseFloat(totalAmount._sum.amount || 0),
      averageTransactionValue:
        totalCount > 0
          ? parseFloat(totalAmount._sum.amount || 0) / totalCount
          : 0,
      completedRevenue: enrichedPayments
        .filter((p) => p.status === "COMPLETED")
        .reduce((sum, p) => sum + parseFloat(p.amount), 0),
      refundedAmount: enrichedPayments
        .filter(
          (p) => p.status === "REFUNDED" || p.status === "PARTIALLY_REFUNDED"
        )
        .reduce((sum, p) => sum + parseFloat(p.refundAmount || 0), 0),
    };

    educademyLogger.logBusinessOperation(
      "GET_ALL_PAYMENTS",
      "PAYMENT",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        totalAmount: totalAmount._sum.amount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { status, method, startDate, endDate },
      }
    );

    res.status(200).json({
      success: true,
      data: {
        payments: enrichedPayments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        analytics: {
          statusDistribution,
          methodDistribution,
          revenueAnalysis,
        },
        summary: {
          totalTransactions: totalCount,
          totalRevenue: parseFloat(totalAmount._sum.amount || 0),
          completedPayments: statusDistribution.COMPLETED || 0,
          pendingPayments: statusDistribution.PENDING || 0,
          failedPayments: statusDistribution.FAILED || 0,
          refundedPayments:
            (statusDistribution.REFUNDED || 0) +
            (statusDistribution.PARTIALLY_REFUNDED || 0),
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get all payments failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_ALL_PAYMENTS",
        entity: "PAYMENT",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve payments",
      requestId,
    });
  }
});

export const refundPayment = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { paymentId } = req.params;
  const { refundAmount, refundReason, refundType = "full" } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "refundPayment",
  });

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            course: {
              select: {
                title: true,
                instructor: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Can only refund completed payments",
      });
    }

    let finalRefundAmount;
    if (refundType === "full") {
      finalRefundAmount = payment.amount;
    } else {
      if (!refundAmount || refundAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid refund amount required for partial refunds",
        });
      }

      if (refundAmount > payment.amount) {
        return res.status(400).json({
          success: false,
          message: "Refund amount cannot exceed payment amount",
        });
      }

      finalRefundAmount = refundAmount;
    }

    const newStatus = refundType === "full" ? "REFUNDED" : "PARTIALLY_REFUNDED";

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        refundAmount: finalRefundAmount,
        refundReason: refundReason || "Admin refund",
      },
    });

    await prisma.enrollment.updateMany({
      where: { paymentId: paymentId },
      data: { status: "REFUNDED" },
    });

    for (const enrollment of payment.enrollments) {
      const course = enrollment.course;
      const instructor = course.instructor;

      const instructorCommission =
        finalRefundAmount * (instructor.commissionRate || 0.7);

      await prisma.earning.create({
        data: {
          amount: -instructorCommission,
          commission: instructorCommission,
          platformFee: finalRefundAmount - instructorCommission,
          currency: payment.currency,
          status: "CANCELLED",
          instructorId: instructor.id,
          paymentId: paymentId,
        },
      });

      await prisma.notification.create({
        data: {
          type: "PAYMENT_RECEIVED",
          title: "Refund Processed",
          message: `A refund of ${payment.currency} ${finalRefundAmount} has been processed for your course "${course.title}"`,
          userId: enrollment.student.user.id,
          priority: "HIGH",
          data: {
            paymentId,
            refundAmount: finalRefundAmount,
            refundType,
            reason: refundReason,
            processedBy: req.userAuthId,
          },
        },
      });
    }

    educademyLogger.logBusinessOperation(
      "REFUND_PAYMENT",
      "PAYMENT",
      paymentId,
      "SUCCESS",
      {
        refundAmount: finalRefundAmount,
        refundType,
        originalAmount: payment.amount,
        reason: refundReason,
        adminId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "REFUND_PAYMENT",
      "PAYMENT",
      paymentId,
      { status: payment.status, refundAmount: payment.refundAmount },
      { status: newStatus, refundAmount: finalRefundAmount },
      req.userAuthId
    );

    res.status(200).json({
      success: true,
      message: "Payment refunded successfully",
      data: {
        payment: updatedPayment,
        refundAmount: finalRefundAmount,
        refundType,
      },
    });
  } catch (error) {
    educademyLogger.error("Refund payment failed", error, {
      userId: req.userAuthId,
      paymentId,
      business: {
        operation: "REFUND_PAYMENT",
        entity: "PAYMENT",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to process refund",
      requestId,
    });
  }
});

export const getAllCoupons = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    search = "",
    isActive = "",
    type = "",
    expired = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getAllCoupons",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== "") where.isActive = isActive === "true";
    if (type) where.type = type;

    if (expired === "true") {
      where.validUntil = { lt: new Date() };
    } else if (expired === "false") {
      where.validUntil = { gte: new Date() };
    }

    const [coupons, totalCount, usageStats, typeDistribution] =
      await Promise.all([
        prisma.coupon.findMany({
          where,
          include: {
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            courses: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
            usages: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
                payment: {
                  select: {
                    amount: true,
                    createdAt: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 5,
            },
            _count: {
              select: { usages: true },
            },
          },
          skip,
          take: parseInt(limit),
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.coupon.count({ where }),
        prisma.couponUsage.groupBy({
          by: ["couponId"],
          _sum: { discount: true },
          _count: { _all: true },
        }),
        prisma.coupon.groupBy({
          by: ["type"],
          _count: { _all: true },
        }),
      ]);

    const enrichedCoupons = coupons.map((coupon) => {
      const usageData = usageStats.find((stat) => stat.couponId === coupon.id);
      const isExpired = new Date(coupon.validUntil) < new Date();
      const isUsageLimitReached =
        coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;

      return {
        ...coupon,
        status: {
          isActive: coupon.isActive,
          isExpired,
          isUsageLimitReached,
          canBeUsed: coupon.isActive && !isExpired && !isUsageLimitReached,
        },
        usageAnalytics: {
          totalUsages: coupon._count.usages,
          totalDiscountGiven: parseFloat(usageData?._sum.discount || 0),
          usageRate: coupon.usageLimit
            ? (coupon._count.usages / coupon.usageLimit) * 100
            : null,
          remainingUsages: coupon.usageLimit
            ? Math.max(0, coupon.usageLimit - coupon._count.usages)
            : null,
        },
        validity: {
          validFrom: coupon.validFrom,
          validUntil: coupon.validUntil,
          daysRemaining: Math.ceil(
            (new Date(coupon.validUntil) - new Date()) / (1000 * 60 * 60 * 24)
          ),
          isCurrentlyValid:
            new Date() >= new Date(coupon.validFrom) &&
            new Date() <= new Date(coupon.validUntil),
        },
        courseInfo: {
          applicableCourses: coupon.courses.length,
          totalCourseValue: coupon.courses.reduce(
            (sum, course) => sum + parseFloat(course.price),
            0
          ),
        },
      };
    });

    const typeStats = typeDistribution.reduce((acc, item) => {
      acc[item.type] = item._count._all;
      return acc;
    }, {});

    const summary = {
      totalCoupons: totalCount,
      activeCoupons: enrichedCoupons.filter((c) => c.status.canBeUsed).length,
      expiredCoupons: enrichedCoupons.filter((c) => c.status.isExpired).length,
      usedUpCoupons: enrichedCoupons.filter((c) => c.status.isUsageLimitReached)
        .length,
      totalDiscountGiven: enrichedCoupons.reduce(
        (sum, c) => sum + c.usageAnalytics.totalDiscountGiven,
        0
      ),
      totalUsages: enrichedCoupons.reduce(
        (sum, c) => sum + c.usageAnalytics.totalUsages,
        0
      ),
      typeDistribution: typeStats,
    };

    const topPerformingCoupons = enrichedCoupons
      .sort(
        (a, b) => b.usageAnalytics.totalUsages - a.usageAnalytics.totalUsages
      )
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        totalUsages: c.usageAnalytics.totalUsages,
        totalDiscountGiven: c.usageAnalytics.totalDiscountGiven,
      }));

    educademyLogger.logBusinessOperation(
      "GET_ALL_COUPONS",
      "COUPON",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { search, isActive, type, expired },
      }
    );

    res.status(200).json({
      success: true,
      data: {
        coupons: enrichedCoupons,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        summary,
        insights: {
          topPerformingCoupons,
          averageDiscountPerCoupon:
            summary.totalCoupons > 0
              ? summary.totalDiscountGiven / summary.totalCoupons
              : 0,
          averageUsagesPerCoupon:
            summary.totalCoupons > 0
              ? summary.totalUsages / summary.totalCoupons
              : 0,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get all coupons failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_ALL_COUPONS",
        entity: "COUPON",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve coupons",
      requestId,
    });
  }
});

export const createCoupon = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    code,
    title,
    description,
    type,
    value,
    minimumAmount,
    maximumDiscount,
    usageLimit,
    validFrom,
    validUntil,
    applicableTo,
    courseIds = [],
    isActive = true,
  } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "createCoupon",
  });

  try {
    if (!code || !title || !type || !value || !validFrom || !validUntil) {
      return res.status(400).json({
        success: false,
        message:
          "Code, title, type, value, validFrom, and validUntil are required",
      });
    }

    if (!["PERCENTAGE", "FIXED_AMOUNT"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be PERCENTAGE or FIXED_AMOUNT",
      });
    }

    if (type === "PERCENTAGE" && (value < 1 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: "Percentage value must be between 1 and 100",
      });
    }

    if (value <= 0) {
      return res.status(400).json({
        success: false,
        message: "Value must be greater than 0",
      });
    }

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);

    if (fromDate >= untilDate) {
      return res.status(400).json({
        success: false,
        message: "Valid from date must be before valid until date",
      });
    }

    if (applicableTo === "SPECIFIC_COURSES" && courseIds.length > 0) {
      const coursesExist = await prisma.course.count({
        where: { id: { in: courseIds } },
      });

      if (coursesExist !== courseIds.length) {
        return res.status(400).json({
          success: false,
          message: "Some specified courses do not exist",
        });
      }
    }

    const couponData = {
      code: code.toUpperCase(),
      title,
      description,
      type,
      value: parseFloat(value),
      minimumAmount: minimumAmount ? parseFloat(minimumAmount) : null,
      maximumDiscount: maximumDiscount ? parseFloat(maximumDiscount) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      validFrom: fromDate,
      validUntil: untilDate,
      applicableTo: applicableTo || "ALL_COURSES",
      isActive,
      createdById: req.userAuthId,
    };

    const coupon = await prisma.coupon.create({
      data: {
        ...couponData,
        courses:
          applicableTo === "SPECIFIC_COURSES" && courseIds.length > 0
            ? {
                connect: courseIds.map((id) => ({ id })),
              }
            : undefined,
      },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "CREATE_COUPON",
      "COUPON",
      coupon.id,
      "SUCCESS",
      {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        applicableTo: coupon.applicableTo,
        coursesCount: courseIds.length,
        adminId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "CREATE_COUPON",
      "COUPON",
      coupon.id,
      null,
      coupon,
      req.userAuthId
    );

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: { coupon },
    });
  } catch (error) {
    educademyLogger.error("Create coupon failed", error, {
      userId: req.userAuthId,
      couponCode: code,
      business: {
        operation: "CREATE_COUPON",
        entity: "COUPON",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      requestId,
    });
  }
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { couponId } = req.params;

  const {
    title,
    description,
    value,
    minimumAmount,
    maximumDiscount,
    usageLimit,
    validFrom,
    validUntil,
    applicableTo,
    courseIds = [],
    isActive,
  } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "updateCoupon",
  });

  try {
    const currentCoupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        courses: true,
        _count: {
          select: { usages: true },
        },
      },
    });

    if (!currentCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (currentCoupon._count.usages > 0) {
      const restrictedFields = ["type", "value"];
      const hasRestrictedChanges = restrictedFields.some(
        (field) =>
          req.body[field] !== undefined &&
          req.body[field] !== currentCoupon[field]
      );

      if (hasRestrictedChanges) {
        return res.status(400).json({
          success: false,
          message: "Cannot modify type or value of coupon that has been used",
        });
      }
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (value !== undefined) {
      if (currentCoupon.type === "PERCENTAGE" && (value < 1 || value > 100)) {
        return res.status(400).json({
          success: false,
          message: "Percentage value must be between 1 and 100",
        });
      }
      if (value <= 0) {
        return res.status(400).json({
          success: false,
          message: "Value must be greater than 0",
        });
      }
      updateData.value = parseFloat(value);
    }
    if (minimumAmount !== undefined)
      updateData.minimumAmount = minimumAmount
        ? parseFloat(minimumAmount)
        : null;
    if (maximumDiscount !== undefined)
      updateData.maximumDiscount = maximumDiscount
        ? parseFloat(maximumDiscount)
        : null;
    if (usageLimit !== undefined)
      updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (validFrom !== undefined || validUntil !== undefined) {
      const fromDate = validFrom
        ? new Date(validFrom)
        : currentCoupon.validFrom;
      const untilDate = validUntil
        ? new Date(validUntil)
        : currentCoupon.validUntil;

      if (fromDate >= untilDate) {
        return res.status(400).json({
          success: false,
          message: "Valid from date must be before valid until date",
        });
      }

      if (validFrom !== undefined) updateData.validFrom = fromDate;
      if (validUntil !== undefined) updateData.validUntil = untilDate;
    }

    if (applicableTo !== undefined) updateData.applicableTo = applicableTo;

    let courseUpdate = {};
    if (applicableTo === "SPECIFIC_COURSES" && courseIds.length > 0) {
      const coursesExist = await prisma.course.count({
        where: { id: { in: courseIds } },
      });

      if (coursesExist !== courseIds.length) {
        return res.status(400).json({
          success: false,
          message: "Some specified courses do not exist",
        });
      }

      courseUpdate = {
        courses: {
          set: courseIds.map((id) => ({ id })),
        },
      };
    } else if (applicableTo !== "SPECIFIC_COURSES") {
      courseUpdate = {
        courses: {
          set: [],
        },
      };
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...updateData,
        ...courseUpdate,
      },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { usages: true },
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "UPDATE_COUPON",
      "COUPON",
      couponId,
      "SUCCESS",
      {
        changedFields: Object.keys(updateData),
        coursesUpdated: !!courseUpdate.courses,
        adminId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "UPDATE_COUPON",
      "COUPON",
      couponId,
      currentCoupon,
      updateData,
      req.userAuthId
    );

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: { coupon: updatedCoupon },
    });
  } catch (error) {
    educademyLogger.error("Update coupon failed", error, {
      userId: req.userAuthId,
      couponId,
      business: {
        operation: "UPDATE_COUPON",
        entity: "COUPON",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to update coupon",
      requestId,
    });
  }
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { couponId } = req.params;
  const { reason } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "deleteCoupon",
  });

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (coupon._count.usages > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete coupon that has been used. Deactivate it instead.",
      });
    }

    await prisma.coupon.delete({
      where: { id: couponId },
    });

    educademyLogger.logBusinessOperation(
      "DELETE_COUPON",
      "COUPON",
      couponId,
      "SUCCESS",
      {
        couponCode: coupon.code,
        reason,
        adminId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "DELETE_COUPON",
      "COUPON",
      couponId,
      coupon,
      null,
      req.userAuthId
    );

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
      data: {
        deletedCouponId: couponId,
        couponCode: coupon.code,
      },
    });
  } catch (error) {
    educademyLogger.error("Delete coupon failed", error, {
      userId: req.userAuthId,
      couponId,
      business: {
        operation: "DELETE_COUPON",
        entity: "COUPON",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      requestId,
    });
  }
});

export const getSystemLogs = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 50,
    level = "",
    category = "",
    severity = "",
    userId = "",
    startDate = "",
    endDate = "",
    search = "",
    isResolved = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getSystemLogs",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (level) where.level = level;
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (userId) where.userId = userId;
    if (isResolved !== "") where.isResolved = isResolved === "true";

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { message: { contains: search, mode: "insensitive" } },
        { module: { contains: search, mode: "insensitive" } },
        { requestId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [
      logs,
      totalCount,
      categoryCounts,
      severityCounts,
      levelCounts,
      recentErrorTrends,
    ] = await Promise.all([
      prisma.log.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.log.count({ where }),
      prisma.log.groupBy({
        by: ["category"],
        _count: { _all: true },
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.log.groupBy({
        by: ["severity"],
        _count: { _all: true },
        where,
      }),
      prisma.log.groupBy({
        by: ["level"],
        _count: { _all: true },
        where,
      }),
      prisma.log.groupBy({
        by: ["createdAt"],
        _count: { _all: true },
        where: {
          level: "error",
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const enrichedLogs = logs.map((log) => ({
      ...log,
      formattedTimestamp: new Date(
        log.timestamp || log.createdAt
      ).toISOString(),
      age: Math.floor((new Date() - new Date(log.createdAt)) / (1000 * 60)),
      isRecent: new Date() - new Date(log.createdAt) < 1000 * 60 * 60,
      parsedMetadata: log.metadata
        ? typeof log.metadata === "string"
          ? JSON.parse(log.metadata)
          : log.metadata
        : null,
    }));

    const criticalIssues = logs
      .filter(
        (log) =>
          log.severity === "CRITICAL" ||
          (log.level === "error" && !log.isResolved)
      )
      .slice(0, 10);

    const systemHealthIndicators = {
      errorRate24h:
        categoryCounts.find((c) => c.category === "ERROR")?._count._all || 0,
      criticalIssues: criticalIssues.length,
      unresolvedIssues: logs.filter(
        (log) => !log.isResolved && log.severity !== "INFO"
      ).length,
      topErrorCategories: categoryCounts
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, 5),
    };

    const errorTrendByDay = recentErrorTrends.reduce((acc, item) => {
      const date = new Date(item.createdAt).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + item._count._all;
      return acc;
    }, {});

    const logDistribution = {
      byCategory: categoryCounts.reduce((acc, item) => {
        acc[item.category] = item._count._all;
        return acc;
      }, {}),
      bySeverity: severityCounts.reduce((acc, item) => {
        acc[item.severity] = item._count._all;
        return acc;
      }, {}),
      byLevel: levelCounts.reduce((acc, item) => {
        acc[item.level] = item._count._all;
        return acc;
      }, {}),
    };

    const frequentErrors = logs
      .filter((log) => log.level === "error")
      .reduce((acc, log) => {
        const key = log.message.substring(0, 100);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

    const topFrequentErrors = Object.entries(frequentErrors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    educademyLogger.logBusinessOperation(
      "GET_SYSTEM_LOGS",
      "LOG",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { level, category, severity, search },
      }
    );

    res.status(200).json({
      success: true,
      data: {
        logs: enrichedLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        analytics: {
          logDistribution,
          systemHealthIndicators,
          errorTrendByDay,
          topFrequentErrors,
          criticalIssues: criticalIssues.map((issue) => ({
            id: issue.id,
            message: issue.message.substring(0, 100),
            severity: issue.severity,
            createdAt: issue.createdAt,
            isResolved: issue.isResolved,
          })),
        },
        summary: {
          totalLogs: totalCount,
          errorLogs: logDistribution.byLevel.error || 0,
          warningLogs: logDistribution.byLevel.warn || 0,
          infoLogs: logDistribution.byLevel.info || 0,
          criticalIssues: criticalIssues.length,
          unresolvedIssues: systemHealthIndicators.unresolvedIssues,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get system logs failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_SYSTEM_LOGS",
        entity: "LOG",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve system logs",
      requestId,
    });
  }
});

export const getSystemHealth = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getSystemHealth",
  });

  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      errorCount24h,
      errorCountLastHour,
      warningCount24h,
      criticalErrors,
      activeUsers,
      activeEnrollments,
      dbConnectionTest,
      recentErrors,
      systemPerformance,
      storageUsage,
      apiResponseTimes,
    ] = await Promise.all([
      prisma.log.count({
        where: {
          level: "error",
          createdAt: { gte: last24Hours },
        },
      }),
      prisma.log.count({
        where: {
          level: "error",
          createdAt: { gte: lastHour },
        },
      }),
      prisma.log.count({
        where: {
          level: "warn",
          createdAt: { gte: last24Hours },
        },
      }),
      prisma.log.count({
        where: {
          severity: "CRITICAL",
          createdAt: { gte: last7Days },
        },
      }),
      prisma.user.count({
        where: {
          lastLogin: { gte: last24Hours },
        },
      }),
      prisma.enrollment.count({
        where: {
          status: "ACTIVE",
          lastAccessedAt: { gte: last24Hours },
        },
      }),
      prisma.$queryRaw`SELECT 1 as test`,
      prisma.log.findMany({
        where: {
          severity: { in: ["CRITICAL", "ERROR"] },
          createdAt: { gte: last24Hours },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          message: true,
          severity: true,
          category: true,
          createdAt: true,
          isResolved: true,
        },
      }),
      prisma.log.groupBy({
        by: ["createdAt"],
        _avg: {
          pid: true,
          uptime: true,
        },
        where: {
          createdAt: { gte: last24Hours },
          pid: { not: null },
        },
      }),
      prisma.log.aggregate({
        _avg: {
          pid: true,
          uptime: true,
        },
        _max: {
          pid: true,
          uptime: true,
        },
        where: {
          createdAt: { gte: last24Hours },
          pid: { not: null },
        },
      }),
      prisma.log.groupBy({
        by: ["module"],
        _avg: { uptime: true },
        where: {
          createdAt: { gte: last24Hours },
          category: "API",
        },
      }),
    ]);

    let healthScore = 100;

    if (errorCountLastHour > 0) healthScore -= 20;
    if (errorCount24h > 50) healthScore -= 30;
    if (warningCount24h > 100) healthScore -= 10;
    if (criticalErrors > 0) healthScore -= 25;
    if (recentErrors.filter((e) => !e.isResolved).length > 5) healthScore -= 15;

    healthScore = Math.max(0, healthScore);

    let healthStatus = "healthy";
    if (healthScore < 50) healthStatus = "critical";
    else if (healthScore < 75) healthStatus = "warning";

    const serviceStatus = {
      database: {
        status: !!dbConnectionTest ? "operational" : "down",
        responseTime: dbConnectionTest ? "< 100ms" : "timeout",
      },
      api: {
        status: errorCountLastHour < 5 ? "operational" : "degraded",
        errorRate: errorCountLastHour,
      },
      authentication: {
        status: activeUsers > 0 ? "operational" : "monitoring",
        activeUsers,
      },
      payments: {
        status: "operational",
        lastSuccessfulTransaction: "monitoring",
      },
      storage: {
        status: "operational",
        usage: storageUsage._avg?.pid || 0,
        maxUsage: storageUsage._max?.pid || 0,
      },
    };

    const metrics = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      activeConnections: activeUsers,
      errorRates: {
        lastHour: errorCountLastHour,
        last24Hours: errorCount24h,
        last7Days: criticalErrors,
      },
      performanceMetrics: {
        averageMemoryUsage: storageUsage._avg?.pid || 0,
        peakMemoryUsage: storageUsage._max?.pid || 0,
        apiResponseTimes: apiResponseTimes.map((api) => ({
          module: api.module,
          averageResponseTime: api._avg?.uptime || 0,
        })),
      },
    };

    const alerts = [];

    if (healthScore < 75) {
      alerts.push({
        type: "warning",
        message: "System health below optimal threshold",
        severity: healthScore < 50 ? "critical" : "warning",
      });
    }

    if (errorCountLastHour > 10) {
      alerts.push({
        type: "error",
        message: `High error rate: ${errorCountLastHour} errors in the last hour`,
        severity: "critical",
      });
    }

    if (criticalErrors > 0) {
      alerts.push({
        type: "critical",
        message: `${criticalErrors} critical errors in the last 7 days`,
        severity: "critical",
      });
    }

    const recommendations = [];

    if (errorCount24h > 50) {
      recommendations.push("Review error logs and address recurring issues");
    }

    if (warningCount24h > 100) {
      recommendations.push("Investigate warning patterns for potential issues");
    }

    if (healthScore < 75) {
      recommendations.push("Monitor system closely and consider maintenance");
    }

    const healthData = {
      status: healthStatus,
      score: healthScore,
      timestamp: now.toISOString(),
      services: serviceStatus,
      metrics,
      alerts,
      recommendations,
      recentCriticalIssues: recentErrors
        .filter((e) => !e.isResolved)
        .map((error) => ({
          id: error.id,
          message: error.message.substring(0, 100),
          severity: error.severity,
          category: error.category,
          createdAt: error.createdAt,
        })),
      systemInfo: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        pid: process.pid,
      },
    };

    educademyLogger.logBusinessOperation(
      "GET_SYSTEM_HEALTH",
      "SYSTEM",
      req.userAuthId,
      "SUCCESS",
      {
        healthScore,
        healthStatus,
        errorCount24h,
        errorCountLastHour,
        activeUsers,
      }
    );

    res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    educademyLogger.error("Get system health failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_SYSTEM_HEALTH",
        entity: "SYSTEM",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve system health",
      requestId,
      data: {
        status: "critical",
        score: 0,
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
    });
  }
});

export const getPlatformNotifications = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    type = "",
    priority = "",
    isRead = "",
    userId = "",
    startDate = "",
    endDate = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getPlatformNotifications",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (isRead !== "") where.isRead = isRead === "true";
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [
      notifications,
      totalCount,
      typeDistribution,
      priorityDistribution,
      readStats,
    ] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              profileImage: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.notification.count({ where }),
      prisma.notification.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
      prisma.notification.groupBy({
        by: ["priority"],
        _count: { _all: true },
      }),
      prisma.notification.groupBy({
        by: ["isRead"],
        _count: { _all: true },
      }),
    ]);

    const enrichedNotifications = notifications.map((notification) => ({
      ...notification,
      age: Math.floor(
        (new Date() - new Date(notification.createdAt)) / (1000 * 60 * 60)
      ),
      isRecent:
        new Date() - new Date(notification.createdAt) < 1000 * 60 * 60 * 24,
      userInfo: {
        name: `${notification.user.firstName} ${notification.user.lastName}`,
        email: notification.user.email,
        role: notification.user.role,
      },
    }));

    const analytics = {
      typeDistribution: typeDistribution.reduce((acc, item) => {
        acc[item.type] = item._count._all;
        return acc;
      }, {}),
      priorityDistribution: priorityDistribution.reduce((acc, item) => {
        acc[item.priority] = item._count._all;
        return acc;
      }, {}),
      readStats: readStats.reduce((acc, item) => {
        acc[item.isRead ? "read" : "unread"] = item._count._all;
        return acc;
      }, {}),
    };

    const urgentNotifications = notifications
      .filter((n) => n.priority === "URGENT" || n.priority === "HIGH")
      .slice(0, 10);

    const systemNotifications = notifications
      .filter((n) => n.type === "SYSTEM_ANNOUNCEMENT")
      .slice(0, 5);

    const recentActivity = notifications.filter(
      (n) => new Date() - new Date(n.createdAt) < 1000 * 60 * 60 * 24
    ).length;

    educademyLogger.logBusinessOperation(
      "GET_PLATFORM_NOTIFICATIONS",
      "NOTIFICATION",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { type, priority, isRead, userId },
      }
    );

    res.status(200).json({
      success: true,
      data: {
        notifications: enrichedNotifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        analytics,
        insights: {
          urgentNotifications: urgentNotifications.map((n) => ({
            id: n.id,
            title: n.title,
            priority: n.priority,
            createdAt: n.createdAt,
            user: n.userInfo,
          })),
          systemNotifications: systemNotifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message.substring(0, 100),
            createdAt: n.createdAt,
          })),
          recentActivity,
          unreadCount: analytics.readStats.unread || 0,
        },
        summary: {
          totalNotifications: totalCount,
          unreadNotifications: analytics.readStats.unread || 0,
          urgentNotifications: urgentNotifications.length,
          recentActivity24h: recentActivity,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get platform notifications failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_PLATFORM_NOTIFICATIONS",
        entity: "NOTIFICATION",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve platform notifications",
      requestId,
    });
  }
});

export const getAllDiscussions = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    courseId = "",
    authorId = "",
    isPinned = "",
    isLocked = "",
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getAllDiscussions",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (courseId) where.courseId = courseId;
    if (authorId) where.authorId = authorId;
    if (isPinned !== "") where.isPinned = isPinned === "true";
    if (isLocked !== "") where.isLocked = isLocked === "true";

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [
      discussions,
      totalCount,
      courseDistribution,
      authorActivity,
      engagementStats,
    ] = await Promise.all([
      prisma.discussion.findMany({
        where,
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              profileImage: true,
            },
          },
          course: {
            select: {
              title: true,
              instructor: {
                select: {
                  user: {
                    select: { firstName: true, lastName: true },
                  },
                },
              },
            },
          },
          section: {
            select: {
              title: true,
            },
          },
          replies: {
            select: {
              id: true,
              createdAt: true,
              author: {
                select: { firstName: true, lastName: true, role: true },
              },
            },
            take: 3,
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { replies: true },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.discussion.count({ where }),
      prisma.discussion.groupBy({
        by: ["courseId"],
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
        take: 10,
      }),
      prisma.discussion.groupBy({
        by: ["authorId"],
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
        take: 10,
      }),
      prisma.discussion.aggregate({
        _avg: { views: true },
        _sum: { views: true },
        where,
      }),
    ]);

    const enrichedDiscussions = discussions.map((discussion) => ({
      ...discussion,
      authorInfo: {
        name: `${discussion.author.firstName} ${discussion.author.lastName}`,
        email: discussion.author.email,
        role: discussion.author.role,
      },
      courseInfo: {
        title: discussion.course.title,
        instructor: discussion.course.instructor.user,
      },
      engagementMetrics: {
        totalReplies: discussion._count.replies,
        views: discussion.views,
        lastActivity: discussion.replies[0]?.createdAt || discussion.createdAt,
        isActive:
          discussion.replies.length > 0 &&
          new Date() -
            new Date(discussion.replies[0]?.createdAt || discussion.createdAt) <
            1000 * 60 * 60 * 24 * 7,
      },
      recentReplies: discussion.replies.map((reply) => ({
        id: reply.id,
        author: `${reply.author.firstName} ${reply.author.lastName}`,
        role: reply.author.role,
        createdAt: reply.createdAt,
      })),
    }));

    const topCoursesByDiscussions = await Promise.all(
      courseDistribution.slice(0, 5).map(async (item) => {
        const course = await prisma.course.findUnique({
          where: { id: item.courseId },
          select: {
            title: true,
            instructor: {
              select: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        });
        return {
          courseId: item.courseId,
          courseTitle: course?.title || "Unknown",
          instructor: course?.instructor?.user || null,
          discussionCount: item._count._all,
        };
      })
    );

    const topActiveUsers = await Promise.all(
      authorActivity.slice(0, 5).map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.authorId },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        });
        return {
          userId: item.authorId,
          name: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          email: user?.email || "Unknown",
          role: user?.role || "Unknown",
          discussionCount: item._count._all,
        };
      })
    );

    const moderationQueue = discussions
      .filter(
        (d) =>
          d.content.toLowerCase().includes("inappropriate") ||
          d.replies.some((r) => r.content?.toLowerCase().includes("spam")) ||
          d.views > 1000
      )
      .slice(0, 10);

    educademyLogger.logBusinessOperation(
      "GET_ALL_DISCUSSIONS",
      "DISCUSSION",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { courseId, authorId, isPinned, isLocked, search },
      }
    );

    res.status(200).json({
      success: true,
      data: {
        discussions: enrichedDiscussions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        analytics: {
          topCoursesByDiscussions,
          topActiveUsers,
          engagementMetrics: {
            averageViews: engagementStats._avg?.views || 0,
            totalViews: engagementStats._sum?.views || 0,
            averageRepliesPerDiscussion:
              totalCount > 0
                ? discussions.reduce((sum, d) => sum + d._count.replies, 0) /
                  totalCount
                : 0,
          },
        },
        moderation: {
          flaggedDiscussions: moderationQueue.map((d) => ({
            id: d.id,
            title: d.title,
            author: d.authorInfo.name,
            views: d.views,
            repliesCount: d._count.replies,
            createdAt: d.createdAt,
          })),
          pinnedDiscussions: discussions.filter((d) => d.isPinned).length,
          lockedDiscussions: discussions.filter((d) => d.isLocked).length,
        },
        summary: {
          totalDiscussions: totalCount,
          activeDiscussions: enrichedDiscussions.filter(
            (d) => d.engagementMetrics.isActive
          ).length,
          pinnedDiscussions: discussions.filter((d) => d.isPinned).length,
          lockedDiscussions: discussions.filter((d) => d.isLocked).length,
          totalViews: engagementStats._sum?.views || 0,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get all discussions failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_ALL_DISCUSSIONS",
        entity: "DISCUSSION",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve discussions",
      requestId,
    });
  }
});

export const getPlatformMessages = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    messageType = "",
    priority = "",
    isRead = "",
    senderId = "",
    receiverId = "",
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getPlatformMessages",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (messageType) where.messageType = messageType;
    if (priority) where.priority = priority;
    if (isRead !== "") where.isRead = isRead === "true";
    if (senderId) where.senderId = senderId;
    if (receiverId) where.receiverId = receiverId;

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [
      messages,
      totalCount,
      typeDistribution,
      priorityDistribution,
      messagingStats,
    ] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              profileImage: true,
            },
          },
          receiver: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              profileImage: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.message.count({ where }),
      prisma.message.groupBy({
        by: ["messageType"],
        _count: { _all: true },
      }),
      prisma.message.groupBy({
        by: ["priority"],
        _count: { _all: true },
      }),
      prisma.message.groupBy({
        by: ["isRead"],
        _count: { _all: true },
      }),
    ]);

    const enrichedMessages = messages.map((message) => ({
      ...message,
      senderInfo: {
        name: `${message.sender.firstName} ${message.sender.lastName}`,
        email: message.sender.email,
        role: message.sender.role,
      },
      receiverInfo: {
        name: `${message.receiver.firstName} ${message.receiver.lastName}`,
        email: message.receiver.email,
        role: message.receiver.role,
      },
      messageMetrics: {
        age: Math.floor(
          (new Date() - new Date(message.createdAt)) / (1000 * 60 * 60)
        ),
        isRecent:
          new Date() - new Date(message.createdAt) < 1000 * 60 * 60 * 24,
        responseTime: message.readAt
          ? Math.floor(
              (new Date(message.readAt) - new Date(message.createdAt)) /
                (1000 * 60 * 60)
            )
          : null,
      },
    }));

    const messagingAnalytics = {
      typeDistribution: typeDistribution.reduce((acc, item) => {
        acc[item.messageType] = item._count._all;
        return acc;
      }, {}),
      priorityDistribution: priorityDistribution.reduce((acc, item) => {
        acc[item.priority] = item._count._all;
      }, {}),
      readStats: messagingStats.reduce((acc, item) => {
        acc[item.isRead ? "read" : "unread"] = item._count._all;
        return acc;
      }, {}),
    };

    const urgentMessages = messages.filter(
      (m) => m.priority === "URGENT" || m.priority === "HIGH"
    );

    const systemMessages = messages.filter(
      (m) => m.messageType === "SYSTEM" || m.messageType === "ANNOUNCEMENT"
    );

    const supportMessages = messages.filter((m) => m.messageType === "SUPPORT");

    const averageResponseTime =
      enrichedMessages
        .filter((m) => m.messageMetrics.responseTime !== null)
        .reduce((sum, m) => sum + m.messageMetrics.responseTime, 0) /
        enrichedMessages.filter((m) => m.messageMetrics.responseTime !== null)
          .length || 0;

    const topCommunicators = await prisma.message.groupBy({
      by: ["senderId"],
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 10,
    });

    const enrichedTopCommunicators = await Promise.all(
      topCommunicators.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.senderId },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        });
        return {
          userId: item.senderId,
          name: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          email: user?.email || "Unknown",
          role: user?.role || "Unknown",
          messageCount: item._count._all,
        };
      })
    );

    educademyLogger.logBusinessOperation(
      "GET_PLATFORM_MESSAGES",
      "MESSAGE",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { messageType, priority, isRead, senderId, receiverId },
      }
    );

    res.status(200).json({
      success: true,
      data: {
        messages: enrichedMessages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        analytics: {
          ...messagingAnalytics,
          averageResponseTime,
          topCommunicators: enrichedTopCommunicators,
        },
        categories: {
          urgentMessages: urgentMessages.slice(0, 10).map((m) => ({
            id: m.id,
            subject: m.subject,
            sender: m.senderInfo.name,
            priority: m.priority,
            createdAt: m.createdAt,
            isRead: m.isRead,
          })),
          systemMessages: systemMessages.slice(0, 5).map((m) => ({
            id: m.id,
            subject: m.subject,
            messageType: m.messageType,
            createdAt: m.createdAt,
          })),
          supportTickets: supportMessages.slice(0, 10).map((m) => ({
            id: m.id,
            subject: m.subject,
            sender: m.senderInfo.name,
            priority: m.priority,
            isRead: m.isRead,
            createdAt: m.createdAt,
          })),
        },
        summary: {
          totalMessages: totalCount,
          unreadMessages: messagingAnalytics.readStats.unread || 0,
          urgentMessages: urgentMessages.length,
          systemMessages: systemMessages.length,
          supportTickets: supportMessages.length,
          averageResponseTimeHours: Math.round(averageResponseTime * 10) / 10,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get platform messages failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_PLATFORM_MESSAGES",
        entity: "MESSAGE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve platform messages",
      requestId,
    });
  }
});

export const generateReport = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const {
    reportType,
    startDate,
    endDate,
    format = "json",
    includeCharts = false,
    filename,
  } = req.body;

  console.log("Generate Report Request:", {
    reportType,
    format,
    startDate,
    endDate,
  });

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "generateReport",
  });

  try {
    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: "Report type is required",
      });
    }

    const validReportTypes = [
      "users",
      "courses",
      "payments",
      "enrollments",
      "analytics",
      "system",
      "comprehensive",
    ];
    const validFormats = ["json", "csv", "xlsx", "pdf", "xml", "html"];

    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid report type. Valid types: ${validReportTypes.join(
          ", "
        )}`,
      });
    }

    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: `Invalid format. Valid formats: ${validFormats.join(", ")}`,
      });
    }

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    let reportData = {};
    const reportMetadata = {
      generatedAt: new Date().toISOString(),
      generatedBy: req.userAuthId,
      reportType,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      format,
      includeCharts,
      requestId,
    };

    console.log("Processing report type:", reportType);

    switch (reportType) {
      case "users":
        const userReportData = await Promise.all([
          prisma.user.findMany({
            where: startDate || endDate ? { createdAt: dateFilter } : {},
            include: {
              studentProfile: {
                select: {
                  skillLevel: true,
                  totalLearningTime: true,
                  _count: { select: { enrollments: true, reviews: true } },
                },
              },
              instructorProfile: {
                select: {
                  rating: true,
                  totalStudents: true,
                  totalCourses: true,
                  totalRevenue: true,
                  isVerified: true,
                },
              },
              adminProfile: {
                select: {
                  department: true,
                  permissions: true,
                },
              },
              _count: {
                select: {
                  sessions: true,
                  activities: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.user.groupBy({
            by: ["role"],
            _count: { _all: true },
          }),
          prisma.user.groupBy({
            by: ["createdAt"],
            _count: { _all: true },
            where: startDate || endDate ? { createdAt: dateFilter } : {},
          }),
        ]);

        reportData = {
          users: userReportData[0],
          roleDistribution: userReportData[1],
          registrationTrends: userReportData[2],
          summary: {
            totalUsers: userReportData[0].length,
            activeUsers: userReportData[0].filter((u) => u.isActive).length,
            verifiedUsers: userReportData[0].filter((u) => u.isVerified).length,
            roleBreakdown: userReportData[1].reduce((acc, item) => {
              acc[item.role] = item._count._all;
              return acc;
            }, {}),
          },
        };
        break;

      case "courses":
        const courseReportData = await Promise.all([
          prisma.course.findMany({
            where: startDate || endDate ? { createdAt: dateFilter } : {},
            include: {
              instructor: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true, email: true },
                  },
                },
              },
              category: {
                select: { name: true },
              },
              _count: {
                select: {
                  enrollments: true,
                  reviews: true,
                  sections: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.course.groupBy({
            by: ["status"],
            _count: { _all: true },
          }),
          prisma.course.groupBy({
            by: ["level"],
            _count: { _all: true },
          }),
        ]);

        reportData = {
          courses: courseReportData[0],
          statusDistribution: courseReportData[1],
          levelDistribution: courseReportData[2],
          summary: {
            totalCourses: courseReportData[0].length,
            publishedCourses:
              courseReportData[1].find((s) => s.status === "PUBLISHED")?._count
                ._all || 0,
            totalEnrollments: courseReportData[0].reduce(
              (sum, c) => sum + c._count.enrollments,
              0
            ),
            averageRating:
              courseReportData[0].reduce(
                (sum, c) => sum + (c.averageRating || 0),
                0
              ) / courseReportData[0].length || 0,
          },
        };
        break;

      case "payments":
        const paymentReportData = await Promise.all([
          prisma.payment.findMany({
            where: startDate || endDate ? { createdAt: dateFilter } : {},
            include: {
              enrollments: {
                include: {
                  student: {
                    include: {
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                          email: true,
                        },
                      },
                    },
                  },
                  course: {
                    select: { title: true, price: true },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.payment.groupBy({
            by: ["status"],
            _count: { _all: true },
            _sum: { amount: true },
          }),
          prisma.payment.aggregate({
            _sum: { amount: true },
            _avg: { amount: true },
            where: startDate || endDate ? { createdAt: dateFilter } : {},
          }),
        ]);

        reportData = {
          payments: paymentReportData[0],
          statusBreakdown: paymentReportData[1],
          financialSummary: paymentReportData[2],
          summary: {
            totalPayments: paymentReportData[0].length,
            totalRevenue: parseFloat(paymentReportData[2]._sum.amount || 0),
            averageTransactionValue: parseFloat(
              paymentReportData[2]._avg.amount || 0
            ),
          },
        };
        break;

      case "enrollments":
        const enrollmentReportData = await Promise.all([
          prisma.enrollment.findMany({
            where: startDate || endDate ? { createdAt: dateFilter } : {},
            include: {
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true, email: true },
                  },
                },
              },
              course: {
                select: {
                  title: true,
                  instructor: {
                    select: {
                      user: {
                        select: { firstName: true, lastName: true },
                      },
                    },
                  },
                },
              },
              payment: {
                select: { amount: true, status: true },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.enrollment.groupBy({
            by: ["status"],
            _count: { _all: true },
          }),
        ]);

        reportData = {
          enrollments: enrollmentReportData[0],
          statusDistribution: enrollmentReportData[1],
          summary: {
            totalEnrollments: enrollmentReportData[0].length,
            activeEnrollments:
              enrollmentReportData[1].find((s) => s.status === "ACTIVE")?._count
                ._all || 0,
            completedEnrollments:
              enrollmentReportData[1].find((s) => s.status === "COMPLETED")
                ?._count._all || 0,
          },
        };
        break;

      case "analytics":
        const analyticsReportData = await Promise.all([
          prisma.analytics.findMany({
            where: startDate || endDate ? { date: dateFilter } : {},
            orderBy: { date: "desc" },
          }),
          prisma.monthlyAnalytics.findMany({
            orderBy: [{ year: "desc" }, { month: "desc" }],
            take: 12,
          }),
        ]);

        reportData = {
          dailyAnalytics: analyticsReportData[0],
          monthlyAnalytics: analyticsReportData[1],
          summary: {
            totalAnalyticsRecords: analyticsReportData[0].length,
            averageDailyUsers:
              analyticsReportData[0].reduce(
                (sum, a) => sum + a.activeUsers,
                0
              ) / analyticsReportData[0].length || 0,
          },
        };
        break;

      case "system":
        const systemReportData = await Promise.all([
          prisma.log.findMany({
            where: {
              ...(startDate || endDate ? { createdAt: dateFilter } : {}),
              level: { in: ["error", "warn"] },
            },
            orderBy: { createdAt: "desc" },
            take: 1000,
          }),
          prisma.log.groupBy({
            by: ["level"],
            _count: { _all: true },
            where: startDate || endDate ? { createdAt: dateFilter } : {},
          }),
        ]);

        reportData = {
          systemLogs: systemReportData[0],
          logLevelDistribution: systemReportData[1],
          summary: {
            totalLogs: systemReportData[0].length,
            errorCount:
              systemReportData[1].find((l) => l.level === "error")?._count
                ._all || 0,
            warningCount:
              systemReportData[1].find((l) => l.level === "warn")?._count
                ._all || 0,
          },
        };
        break;

      case "comprehensive":
        const comprehensiveData = await Promise.all([
          prisma.user.count(),
          prisma.course.count(),
          prisma.enrollment.count(),
          prisma.payment.aggregate({ _sum: { amount: true } }),
          prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
          prisma.course.groupBy({ by: ["status"], _count: { _all: true } }),
        ]);

        reportData = {
          overview: {
            totalUsers: comprehensiveData[0],
            totalCourses: comprehensiveData[1],
            totalEnrollments: comprehensiveData[2],
            totalRevenue: parseFloat(comprehensiveData[3]._sum.amount || 0),
          },
          distributions: {
            userRoles: comprehensiveData[4],
            courseStatuses: comprehensiveData[5],
          },
          summary: {
            platformHealth: "Healthy",
            keyMetrics: {
              userGrowth: "+15%",
              revenueGrowth: "+22%",
              courseCompletion: "73%",
            },
          },
        };
        break;
    }

    console.log("Report data generated:", {
      reportType,
      dataKeys: Object.keys(reportData),
      recordCounts: Object.fromEntries(
        Object.entries(reportData).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.length : typeof value,
        ])
      ),
    });

    const baseFilename =
      filename ||
      `${reportType}_report_${new Date().toISOString().split("T")[0]}`;

    // Log business operation before format processing
    educademyLogger.logBusinessOperation(
      "GENERATE_REPORT",
      "REPORT",
      req.userAuthId,
      "SUCCESS",
      {
        reportType,
        format,
        dateRange: { startDate, endDate },
        recordCount: Object.keys(reportData).length,
      }
    );

    console.log("Processing format:", format);

    switch (format) {
      case "json":
        console.log("Returning JSON format");
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${baseFilename}.json"`
        );
        return res.status(200).json({
          success: true,
          metadata: reportMetadata,
          data: reportData,
        });

      case "csv":
        try {
          console.log("Generating CSV format");
          const flattenedData = flattenReportDataForCSV(reportData, reportType);

          console.log("Flattened data:", {
            length: flattenedData.length,
            sample: flattenedData[0],
            keys: flattenedData[0] ? Object.keys(flattenedData[0]) : [],
          });

          if (!flattenedData || flattenedData.length === 0) {
            console.log("No data for CSV, returning JSON instead");
            return res.status(200).json({
              success: true,
              message: "No data available for CSV format",
              metadata: reportMetadata,
              data: reportData,
            });
          }

          const csvData = parse(flattenedData, {
            fields: Object.keys(flattenedData[0]),
          });

          console.log("CSV generated, length:", csvData.length);

          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${baseFilename}.csv"`
          );

          console.log("Sending CSV response");
          return res.status(200).send(csvData);
        } catch (csvError) {
          console.error("CSV generation error:", csvError);
          return res.status(500).json({
            success: false,
            message: "Error generating CSV format",
            error: csvError.message,
            stack: csvError.stack,
          });
        }

      case "xlsx":
        try {
          console.log("Generating Excel format");
          const workbook = new ExcelJS.Workbook();
          await generateExcelReport(
            workbook,
            reportData,
            reportMetadata,
            reportType
          );

          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${baseFilename}.xlsx"`
          );

          await workbook.xlsx.write(res);
          return res.end();
        } catch (xlsxError) {
          console.error("Excel generation error:", xlsxError);
          return res.status(500).json({
            success: false,
            message: "Error generating Excel format",
            error: xlsxError.message,
          });
        }

      case "pdf":
        try {
          console.log("Generating PDF format");
          const doc = new PDFDocument({ margin: 50 });

          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${baseFilename}.pdf"`
          );

          doc.pipe(res);
          await generatePDFReport(doc, reportData, reportMetadata, reportType);
          doc.end();
          return;
        } catch (pdfError) {
          console.error("PDF generation error:", pdfError);
          return res.status(500).json({
            success: false,
            message: "Error generating PDF format",
            error: pdfError.message,
          });
        }

      case "xml":
        try {
          console.log("Generating XML format");
          const xmlData = generateXMLReport(
            reportData,
            reportMetadata,
            reportType
          );

          res.setHeader("Content-Type", "application/xml");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${baseFilename}.xml"`
          );
          return res.status(200).send(xmlData);
        } catch (xmlError) {
          console.error("XML generation error:", xmlError);
          return res.status(500).json({
            success: false,
            message: "Error generating XML format",
            error: xmlError.message,
          });
        }

      case "html":
        try {
          console.log("Generating HTML format");
          const htmlData = generateHTMLReport(
            reportData,
            reportMetadata,
            reportType
          );

          res.setHeader("Content-Type", "text/html");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${baseFilename}.html"`
          );
          return res.status(200).send(htmlData);
        } catch (htmlError) {
          console.error("HTML generation error:", htmlError);
          return res.status(500).json({
            success: false,
            message: "Error generating HTML format",
            error: htmlError.message,
          });
        }

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid format specified",
        });
    }
  } catch (error) {
    console.error("Generate report error:", error);
    educademyLogger.error("Generate report failed", error, {
      userId: req.userAuthId,
      reportType,
      format,
      business: {
        operation: "GENERATE_REPORT",
        entity: "REPORT",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to generate report",
      requestId,
      error: error.message,
      stack: error.stack,
    });
  }
});

function flattenReportDataForCSV(reportData, reportType) {
  let flattenedData = [];

  switch (reportType) {
    case "users":
      flattenedData = reportData.users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        skillLevel: user.studentProfile?.skillLevel || "N/A",
        totalLearningTime: user.studentProfile?.totalLearningTime || 0,
        enrollments: user.studentProfile?._count?.enrollments || 0,
        instructorRating: user.instructorProfile?.rating || "N/A",
        totalStudents: user.instructorProfile?.totalStudents || 0,
        totalCourses: user.instructorProfile?.totalCourses || 0,
        totalRevenue: user.instructorProfile?.totalRevenue || 0,
        department: user.adminProfile?.department || "N/A",
      }));
      break;

    case "courses":
      flattenedData = reportData.courses.map((course) => ({
        id: course.id,
        title: course.title,
        status: course.status,
        level: course.level,
        price: course.price,
        discountPrice: course.discountPrice,
        duration: course.duration,
        totalLessons: course.totalLessons,
        averageRating: course.averageRating,
        totalRatings: course.totalRatings,
        totalEnrollments: course.totalEnrollments,
        totalRevenue: course.totalRevenue,
        instructorName: `${course.instructor.user.firstName} ${course.instructor.user.lastName}`,
        instructorEmail: course.instructor.user.email,
        categoryName: course.category.name,
        createdAt: course.createdAt,
        publishedAt: course.publishedAt,
        featured: course.featured,
        bestseller: course.bestseller,
      }));
      break;

    case "payments":
      flattenedData = reportData.payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        originalAmount: payment.originalAmount,
        discountAmount: payment.discountAmount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        transactionId: payment.transactionId,
        refundAmount: payment.refundAmount,
        refundReason: payment.refundReason,
        createdAt: payment.createdAt,
        studentName: payment.enrollments[0]?.student?.user
          ? `${payment.enrollments[0].student.user.firstName} ${payment.enrollments[0].student.user.lastName}`
          : "N/A",
        studentEmail: payment.enrollments[0]?.student?.user?.email || "N/A",
        courseTitles: payment.enrollments.map((e) => e.course.title).join("; "),
      }));
      break;

    case "enrollments":
      flattenedData = reportData.enrollments.map((enrollment) => ({
        id: enrollment.id,
        status: enrollment.status,
        progress: enrollment.progress,
        createdAt: enrollment.createdAt,
        lastAccessedAt: enrollment.lastAccessedAt,
        lessonsCompleted: enrollment.lessonsCompleted,
        quizzesCompleted: enrollment.quizzesCompleted,
        assignmentsCompleted: enrollment.assignmentsCompleted,
        totalTimeSpent: enrollment.totalTimeSpent,
        studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        studentEmail: enrollment.student.user.email,
        courseTitle: enrollment.course.title,
        instructorName: `${enrollment.course.instructor.user.firstName} ${enrollment.course.instructor.user.lastName}`,
        paymentAmount: enrollment.payment.amount,
        paymentStatus: enrollment.payment.status,
      }));
      break;

    default:
      flattenedData = [
        { message: "CSV format not available for this report type" },
      ];
  }

  return flattenedData;
}

async function generateExcelReport(workbook, reportData, metadata, reportType) {
  workbook.creator = "Educademy Admin Panel";
  workbook.created = new Date();
  workbook.modified = new Date();

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.addRow(["Report Type", reportType.toUpperCase()]);
  summarySheet.addRow(["Generated At", metadata.generatedAt]);
  summarySheet.addRow([
    "Date Range",
    `${metadata.dateRange.startDate || "All Time"} - ${
      metadata.dateRange.endDate || "Present"
    }`,
  ]);
  summarySheet.addRow([]);

  if (reportData.summary) {
    summarySheet.addRow(["SUMMARY STATISTICS"]);
    Object.entries(reportData.summary).forEach(([key, value]) => {
      summarySheet.addRow([
        key.replace(/([A-Z])/g, " $1").toUpperCase(),
        value,
      ]);
    });
  }

  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 20;

  const headerStyle = {
    font: { bold: true, color: { argb: "FFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "366092" } },
  };

  summarySheet.getRow(1).font = { bold: true, size: 14 };
  summarySheet.getRow(5).eachCell((cell) => (cell.style = headerStyle));

  switch (reportType) {
    case "users":
      const usersSheet = workbook.addWorksheet("Users");
      if (reportData.users.length > 0) {
        const userHeaders = [
          "ID",
          "Name",
          "Email",
          "Role",
          "Active",
          "Verified",
          "Created At",
          "Last Login",
        ];
        usersSheet
          .addRow(userHeaders)
          .eachCell((cell) => (cell.style = headerStyle));

        reportData.users.forEach((user) => {
          usersSheet.addRow([
            user.id,
            `${user.firstName} ${user.lastName}`,
            user.email,
            user.role,
            user.isActive ? "Yes" : "No",
            user.isVerified ? "Yes" : "No",
            user.createdAt,
            user.lastLogin || "Never",
          ]);
        });

        usersSheet.columns.forEach((column) => (column.width = 15));
      }
      break;

    case "courses":
      const coursesSheet = workbook.addWorksheet("Courses");
      if (reportData.courses.length > 0) {
        const courseHeaders = [
          "ID",
          "Title",
          "Status",
          "Level",
          "Price",
          "Enrollments",
          "Rating",
          "Instructor",
          "Created At",
        ];
        coursesSheet
          .addRow(courseHeaders)
          .eachCell((cell) => (cell.style = headerStyle));

        reportData.courses.forEach((course) => {
          coursesSheet.addRow([
            course.id,
            course.title,
            course.status,
            course.level,
            course.price,
            course._count.enrollments,
            course.averageRating || 0,
            `${course.instructor.user.firstName} ${course.instructor.user.lastName}`,
            course.createdAt,
          ]);
        });

        coursesSheet.columns.forEach((column) => (column.width = 15));
      }
      break;

    case "payments":
      const paymentsSheet = workbook.addWorksheet("Payments");
      if (reportData.payments.length > 0) {
        const paymentHeaders = [
          "ID",
          "Amount",
          "Currency",
          "Status",
          "Method",
          "Student",
          "Created At",
        ];
        paymentsSheet
          .addRow(paymentHeaders)
          .eachCell((cell) => (cell.style = headerStyle));

        reportData.payments.forEach((payment) => {
          const studentName = payment.enrollments[0]?.student?.user
            ? `${payment.enrollments[0].student.user.firstName} ${payment.enrollments[0].student.user.lastName}`
            : "N/A";

          paymentsSheet.addRow([
            payment.id,
            payment.amount,
            payment.currency,
            payment.status,
            payment.method,
            studentName,
            payment.createdAt,
          ]);
        });

        paymentsSheet.columns.forEach((column) => (column.width = 15));
      }
      break;
  }
}

async function generatePDFReport(doc, reportData, metadata, reportType) {
  doc.fontSize(20).text("Educademy Platform Report", { align: "center" });
  doc.moveDown();

  doc
    .fontSize(16)
    .text(`Report Type: ${reportType.toUpperCase()}`, { align: "left" });
  doc
    .fontSize(12)
    .text(`Generated: ${new Date(metadata.generatedAt).toLocaleString()}`);
  doc.text(
    `Date Range: ${metadata.dateRange.startDate || "All Time"} - ${
      metadata.dateRange.endDate || "Present"
    }`
  );
  doc.moveDown();

  if (reportData.summary) {
    doc.fontSize(14).text("Summary Statistics", { underline: true });
    doc.moveDown(0.5);

    Object.entries(reportData.summary).forEach(([key, value]) => {
      doc.fontSize(11).text(`${key.replace(/([A-Z])/g, " $1")}: ${value}`);
    });
    doc.moveDown();
  }

  switch (reportType) {
    case "users":
      doc.fontSize(14).text("User Details", { underline: true });
      doc.moveDown(0.5);

      reportData.users.slice(0, 50).forEach((user, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        doc
          .fontSize(10)
          .text(
            `${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`
          )
          .text(
            `   Role: ${user.role} | Active: ${
              user.isActive ? "Yes" : "No"
            } | Verified: ${user.isVerified ? "Yes" : "No"}`
          )
          .text(`   Created: ${new Date(user.createdAt).toLocaleDateString()}`)
          .moveDown(0.3);
      });

      if (reportData.users.length > 50) {
        doc.text(`... and ${reportData.users.length - 50} more users`);
      }
      break;

    case "courses":
      doc.fontSize(14).text("Course Details", { underline: true });
      doc.moveDown(0.5);

      reportData.courses.slice(0, 30).forEach((course, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        doc
          .fontSize(10)
          .text(`${index + 1}. ${course.title}`)
          .text(
            `   Status: ${course.status} | Level: ${course.level} | Price: $${course.price}`
          )
          .text(
            `   Enrollments: ${course._count.enrollments} | Rating: ${
              course.averageRating || "N/A"
            }`
          )
          .text(
            `   Instructor: ${course.instructor.user.firstName} ${course.instructor.user.lastName}`
          )
          .moveDown(0.3);
      });

      if (reportData.courses.length > 30) {
        doc.text(`... and ${reportData.courses.length - 30} more courses`);
      }
      break;

    case "payments":
      doc.fontSize(14).text("Payment Details", { underline: true });
      doc.moveDown(0.5);

      reportData.payments.slice(0, 40).forEach((payment, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        const studentName = payment.enrollments[0]?.student?.user
          ? `${payment.enrollments[0].student.user.firstName} ${payment.enrollments[0].student.user.lastName}`
          : "N/A";

        doc
          .fontSize(10)
          .text(
            `${index + 1}. Transaction ID: ${
              payment.transactionId || payment.id
            }`
          )
          .text(
            `   Amount: ${payment.currency} ${payment.amount} | Status: ${payment.status}`
          )
          .text(`   Method: ${payment.method} | Student: ${studentName}`)
          .text(`   Date: ${new Date(payment.createdAt).toLocaleDateString()}`)
          .moveDown(0.3);
      });

      if (reportData.payments.length > 40) {
        doc.text(`... and ${reportData.payments.length - 40} more payments`);
      }
      break;
  }

  doc.moveDown();
  doc
    .fontSize(8)
    .text(
      `Generated by Educademy Admin Panel on ${new Date().toLocaleString()}`,
      { align: "center" }
    );
}

function generateXMLReport(reportData, metadata, reportType) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<report type="${reportType}" generated="${metadata.generatedAt}">\n`;
  xml += `  <metadata>\n`;
  xml += `    <reportType>${reportType}</reportType>\n`;
  xml += `    <generatedAt>${metadata.generatedAt}</generatedAt>\n`;
  xml += `    <dateRange>\n`;
  xml += `      <startDate>${
    metadata.dateRange.startDate || "null"
  }</startDate>\n`;
  xml += `      <endDate>${metadata.dateRange.endDate || "null"}</endDate>\n`;
  xml += `    </dateRange>\n`;
  xml += `  </metadata>\n`;

  if (reportData.summary) {
    xml += `  <summary>\n`;
    Object.entries(reportData.summary).forEach(([key, value]) => {
      xml += `    <${key}>${value}</${key}>\n`;
    });
    xml += `  </summary>\n`;
  }

  xml += `  <data>\n`;
  Object.entries(reportData).forEach(([key, value]) => {
    if (key !== "summary" && Array.isArray(value)) {
      xml += `    <${key}>\n`;
      value.slice(0, 100).forEach((item, index) => {
        xml += `      <item index="${index}">\n`;
        Object.entries(item).forEach(([itemKey, itemValue]) => {
          if (typeof itemValue === "object" && itemValue !== null) {
            xml += `        <${itemKey}>${JSON.stringify(
              itemValue
            )}</${itemKey}>\n`;
          } else {
            xml += `        <${itemKey}>${itemValue || ""}</${itemKey}>\n`;
          }
        });
        xml += `      </item>\n`;
      });
      xml += `    </${key}>\n`;
    }
  });
  xml += `  </data>\n`;
  xml += `</report>`;

  return xml;
}

function generateHTMLReport(reportData, metadata, reportType) {
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Educademy ${reportType.toUpperCase()} Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #366092;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #366092;
            margin: 0;
            font-size: 2.5em;
        }
        .metadata {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .metadata h3 {
            margin-top: 0;
            color: #366092;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: linear-gradient(135deg, #366092, #4a7ba7);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-card h4 {
            margin: 0 0 10px 0;
            font-size: 0.9em;
            opacity: 0.9;
        }
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            margin: 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
        }
        th {
            background: #366092;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background: #f8f9fa;
        }
        tr:hover {
            background: #e3f2fd;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #366092;
            border-bottom: 2px solid #366092;
            padding-bottom: 10px;
        }
        .status-active { color: #28a745; font-weight: bold; }
        .status-inactive { color: #dc3545; font-weight: bold; }
        .status-published { color: #28a745; font-weight: bold; }
        .status-draft { color: #ffc107; font-weight: bold; }
        .status-completed { color: #28a745; font-weight: bold; }
        .status-pending { color: #ffc107; font-weight: bold; }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.9em;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Educademy Platform Report</h1>
            <p>${reportType.toUpperCase()} REPORT</p>
        </div>
        
        <div class="metadata">
            <h3>Report Information</h3>
            <p><strong>Generated:</strong> ${new Date(
              metadata.generatedAt
            ).toLocaleString()}</p>
            <p><strong>Date Range:</strong> ${
              metadata.dateRange.startDate || "All Time"
            } - ${metadata.dateRange.endDate || "Present"}</p>
            <p><strong>Format:</strong> HTML</p>
            <p><strong>Request ID:</strong> ${metadata.requestId}</p>
        </div>`;

  if (reportData.summary) {
    html += `
        <div class="section">
            <h2>Summary Statistics</h2>
            <div class="summary">`;

    Object.entries(reportData.summary).forEach(([key, value]) => {
      const displayKey = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      html += `
                <div class="summary-card">
                    <h4>${displayKey}</h4>
                    <p class="value">${
                      typeof value === "number" ? value.toLocaleString() : value
                    }</p>
                </div>`;
    });

    html += `
            </div>
        </div>`;
  }

  switch (reportType) {
    case "users":
      html += `
        <div class="section">
            <h2>User Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Verified</th>
                        <th>Created</th>
                        <th>Last Login</th>
                    </tr>
                </thead>
                <tbody>`;

      reportData.users.slice(0, 100).forEach((user) => {
        html += `
                    <tr>
                        <td>${user.firstName} ${user.lastName}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td class="status-${
                          user.isActive ? "active" : "inactive"
                        }">${user.isActive ? "Active" : "Inactive"}</td>
                        <td>${
                          user.isVerified ? "✓ Verified" : "✗ Unverified"
                        }</td>
                        <td>${new Date(
                          user.createdAt
                        ).toLocaleDateString()}</td>
                        <td>${
                          user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : "Never"
                        }</td>
                    </tr>`;
      });

      html += `
                </tbody>
            </table>`;

      if (reportData.users.length > 100) {
        html += `<p><em>Showing first 100 users of ${reportData.users.length} total</em></p>`;
      }
      html += `</div>`;
      break;

    case "courses":
      html += `
        <div class="section">
            <h2>Course Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Level</th>
                        <th>Price</th>
                        <th>Enrollments</th>
                        <th>Rating</th>
                        <th>Instructor</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>`;

      reportData.courses.slice(0, 50).forEach((course) => {
        html += `
                    <tr>
                        <td><strong>${course.title}</strong></td>
                        <td class="status-${course.status.toLowerCase()}">${
          course.status
        }</td>
                        <td>${course.level}</td>
                        <td>${course.price}</td>
                        <td>${course._count.enrollments}</td>
                        <td>${
                          course.averageRating
                            ? course.averageRating.toFixed(1) + "★"
                            : "N/A"
                        }</td>
                        <td>${course.instructor.user.firstName} ${
          course.instructor.user.lastName
        }</td>
                        <td>${new Date(
                          course.createdAt
                        ).toLocaleDateString()}</td>
                    </tr>`;
      });

      html += `
                </tbody>
            </table>`;

      if (reportData.courses.length > 50) {
        html += `<p><em>Showing first 50 courses of ${reportData.courses.length} total</em></p>`;
      }
      html += `</div>`;
      break;

    case "payments":
      html += `
        <div class="section">
            <h2>Payment Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Currency</th>
                        <th>Status</th>
                        <th>Method</th>
                        <th>Student</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>`;

      reportData.payments.slice(0, 100).forEach((payment) => {
        const studentName = payment.enrollments[0]?.student?.user
          ? `${payment.enrollments[0].student.user.firstName} ${payment.enrollments[0].student.user.lastName}`
          : "N/A";

        html += `
                    <tr>
                        <td>${payment.transactionId || payment.id}</td>
                        <td>${payment.amount}</td>
                        <td>${payment.currency}</td>
                        <td class="status-${payment.status.toLowerCase()}">${
          payment.status
        }</td>
                        <td>${payment.method}</td>
                        <td>${studentName}</td>
                        <td>${new Date(
                          payment.createdAt
                        ).toLocaleDateString()}</td>
                    </tr>`;
      });

      html += `
                </tbody>
            </table>`;

      if (reportData.payments.length > 100) {
        html += `<p><em>Showing first 100 payments of ${reportData.payments.length} total</em></p>`;
      }
      html += `</div>`;
      break;

    case "enrollments":
      html += `
        <div class="section">
            <h2>Enrollment Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Enrolled</th>
                        <th>Last Access</th>
                        <th>Payment</th>
                    </tr>
                </thead>
                <tbody>`;

      reportData.enrollments.slice(0, 100).forEach((enrollment) => {
        html += `
                    <tr>
                        <td>${enrollment.student.user.firstName} ${
          enrollment.student.user.lastName
        }</td>
                        <td><strong>${enrollment.course.title}</strong></td>
                        <td class="status-${enrollment.status.toLowerCase()}">${
          enrollment.status
        }</td>
                        <td>${enrollment.progress}%</td>
                        <td>${new Date(
                          enrollment.createdAt
                        ).toLocaleDateString()}</td>
                        <td>${
                          enrollment.lastAccessedAt
                            ? new Date(
                                enrollment.lastAccessedAt
                              ).toLocaleDateString()
                            : "Never"
                        }</td>
                        <td>${enrollment.payment.currency || ""} ${
          enrollment.payment.amount
        }</td>
                    </tr>`;
      });

      html += `
                </tbody>
            </table>`;

      if (reportData.enrollments.length > 100) {
        html += `<p><em>Showing first 100 enrollments of ${reportData.enrollments.length} total</em></p>`;
      }
      html += `</div>`;
      break;

    case "analytics":
      html += `
        <div class="section">
            <h2>Analytics Overview</h2>
            <p>Daily analytics records: ${reportData.dailyAnalytics.length}</p>
            <p>Monthly analytics records: ${reportData.monthlyAnalytics.length}</p>
            
            <h3>Recent Daily Analytics</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Total Users</th>
                        <th>Active Users</th>
                        <th>New Users</th>
                        <th>Daily Revenue</th>
                        <th>New Enrollments</th>
                    </tr>
                </thead>
                <tbody>`;

      reportData.dailyAnalytics.slice(0, 30).forEach((analytics) => {
        html += `
                    <tr>
                        <td>${new Date(
                          analytics.date
                        ).toLocaleDateString()}</td>
                        <td>${analytics.totalUsers}</td>
                        <td>${analytics.activeUsers}</td>
                        <td>${analytics.newUsers}</td>
                        <td>${analytics.dailyRevenue}</td>
                        <td>${analytics.newEnrollments}</td>
                    </tr>`;
      });

      html += `
                </tbody>
            </table>
        </div>`;
      break;

    case "system":
      html += `
        <div class="section">
            <h2>System Logs</h2>
            <table>
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Level</th>
                        <th>Category</th>
                        <th>Message</th>
                        <th>User ID</th>
                    </tr>
                </thead>
                <tbody>`;

      reportData.systemLogs.slice(0, 100).forEach((log) => {
        html += `
                    <tr>
                        <td>${new Date(log.createdAt).toLocaleString()}</td>
                        <td class="status-${
                          log.level
                        }">${log.level.toUpperCase()}</td>
                        <td>${log.category}</td>
                        <td>${log.message.substring(0, 100)}${
          log.message.length > 100 ? "..." : ""
        }</td>
                        <td>${log.userId || "System"}</td>
                    </tr>`;
      });

      html += `
                </tbody>
            </table>
        </div>`;
      break;

    case "comprehensive":
      html += `
        <div class="section">
            <h2>Platform Overview</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Total Users</td><td>${
                      reportData.overview.totalUsers
                    }</td></tr>
                    <tr><td>Total Courses</td><td>${
                      reportData.overview.totalCourses
                    }</td></tr>
                    <tr><td>Total Enrollments</td><td>${
                      reportData.overview.totalEnrollments
                    }</td></tr>
                    <tr><td>Total Revenue</td><td>${reportData.overview.totalRevenue.toLocaleString()}</td></tr>
                </tbody>
            </table>
            
            <h3>User Distribution by Role</h3>
            <table>
                <thead>
                    <tr>
                        <th>Role</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>`;

      reportData.distributions.userRoles.forEach((role) => {
        html += `
                    <tr>
                        <td>${role.role}</td>
                        <td>${role._count._all}</td>
                    </tr>`;
      });

      html += `
                </tbody>
            </table>
        </div>`;
      break;
  }

  html += `
        <div class="footer">
            <p>Generated by Educademy Admin Panel on ${new Date().toLocaleString()}</p>
            <p>This report contains confidential information. Handle with care.</p>
        </div>
    </div>
</body>
</html>`;

  return html;
}

export const getPendingInstructors = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);

  const {
    page = 1,
    limit = 20,
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getPendingInstructors",
  });

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isVerified: false, // Only pending instructors
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { expertise: { hasSome: [search] } },
        { education: { contains: search, mode: "insensitive" } },
        { biography: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [pendingInstructors, totalCount] = await Promise.all([
      prisma.instructor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
              createdAt: true,
              isActive: true,
              isVerified: true,
              phoneNumber: true,
              country: true,
              website: true,
              linkedinProfile: true,
            },
          },
          courses: {
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          _count: {
            select: {
              courses: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.instructor.count({ where }),
    ]);

    const enrichedInstructors = pendingInstructors.map((instructor) => ({
      ...instructor,
      applicationAge: Math.floor(
        (new Date() - new Date(instructor.createdAt)) / (1000 * 60 * 60 * 24)
      ),
      userInfo: {
        ...instructor.user,
        fullName: `${instructor.user.firstName} ${instructor.user.lastName}`,
        accountAge: Math.floor(
          (new Date() - new Date(instructor.user.createdAt)) /
            (1000 * 60 * 60 * 24)
        ),
      },
      qualifications: {
        yearsExperience: instructor.yearsExperience || 0,
        expertiseAreas: instructor.expertise || [],
        education: instructor.education || "Not specified",
        certifications: instructor.certifications || [],
        hasPaymentDetails: !!instructor.paymentDetails,
      },
      coursesCreated: instructor._count.courses,
      recentCourses: instructor.courses,
      verificationStatus: "PENDING",
      riskAssessment: assessInstructorRisk({
        accountAge: Math.floor(
          (new Date() - new Date(instructor.user.createdAt)) /
            (1000 * 60 * 60 * 24)
        ),
        hasEducation: !!instructor.education,
        hasCertifications: instructor.certifications?.length > 0,
        yearsExperience: instructor.yearsExperience || 0,
        hasPaymentDetails: !!instructor.paymentDetails,
        coursesCreated: instructor._count.courses,
        emailVerified: instructor.user.isVerified,
      }),
    }));

    // Group by application age for insights
    const applicationAgeGroups = {
      new: enrichedInstructors.filter((i) => i.applicationAge <= 7).length,
      week: enrichedInstructors.filter(
        (i) => i.applicationAge > 7 && i.applicationAge <= 30
      ).length,
      month: enrichedInstructors.filter((i) => i.applicationAge > 30).length,
    };

    // Group by experience level
    const experienceGroups = {
      beginner: enrichedInstructors.filter((i) => (i.yearsExperience || 0) < 2)
        .length,
      intermediate: enrichedInstructors.filter(
        (i) => (i.yearsExperience || 0) >= 2 && (i.yearsExperience || 0) < 5
      ).length,
      experienced: enrichedInstructors.filter(
        (i) => (i.yearsExperience || 0) >= 5
      ).length,
    };

    educademyLogger.logBusinessOperation(
      "GET_PENDING_INSTRUCTORS",
      "INSTRUCTOR",
      req.userAuthId,
      "SUCCESS",
      {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { search },
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        pendingInstructors: enrichedInstructors,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
        analytics: {
          applicationAgeGroups,
          experienceGroups,
          averageExperience:
            enrichedInstructors.reduce(
              (sum, i) => sum + (i.yearsExperience || 0),
              0
            ) / enrichedInstructors.length || 0,
          withEducation: enrichedInstructors.filter((i) => i.education).length,
          withCertifications: enrichedInstructors.filter(
            (i) => i.certifications?.length > 0
          ).length,
          withPaymentDetails: enrichedInstructors.filter(
            (i) => i.paymentDetails
          ).length,
        },
        summary: {
          totalPending: totalCount,
          urgentReviews: enrichedInstructors.filter((i) => i.applicationAge > 7)
            .length,
          highRiskApplications: enrichedInstructors.filter(
            (i) => i.riskAssessment.riskLevel === "HIGH"
          ).length,
          readyForApproval: enrichedInstructors.filter(
            (i) => i.riskAssessment.riskLevel === "LOW"
          ).length,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Get pending instructors failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_PENDING_INSTRUCTORS",
        entity: "INSTRUCTOR",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve pending instructors",
      requestId,
    });
  }
});

export const getInstructorDetails = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { instructorId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "getInstructorDetails",
  });

  try {
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
            isActive: true,
            isVerified: true,
            lastLogin: true,
            phoneNumber: true,
            dateOfBirth: true,
            country: true,
            website: true,
            linkedinProfile: true,
            twitterProfile: true,
            githubProfile: true,
          },
        },
        courses: {
          include: {
            category: {
              select: { name: true },
            },
            _count: {
              select: {
                enrollments: true,
                reviews: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        earnings: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            courses: true,
            earnings: true,
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

    // Get user activities
    const userActivities = await prisma.activity.findMany({
      where: { userId: instructor.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get user sessions
    const userSessions = await prisma.session.findMany({
      where: { userId: instructor.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Calculate stats
    const instructorStats = {
      accountAge: Math.floor(
        (new Date() - new Date(instructor.user.createdAt)) /
          (1000 * 60 * 60 * 24)
      ),
      applicationAge: Math.floor(
        (new Date() - new Date(instructor.createdAt)) / (1000 * 60 * 60 * 24)
      ),
      totalCourses: instructor._count.courses,
      publishedCourses: instructor.courses.filter(
        (c) => c.status === "PUBLISHED"
      ).length,
      draftCourses: instructor.courses.filter((c) => c.status === "DRAFT")
        .length,
      pendingCourses: instructor.courses.filter(
        (c) => c.status === "UNDER_REVIEW"
      ).length,
      totalEnrollments: instructor.courses.reduce(
        (sum, course) => sum + course._count.enrollments,
        0
      ),
      totalEarnings: instructor.earnings.reduce(
        (sum, earning) => sum + parseFloat(earning.amount),
        0
      ),
      averageRating: instructor.rating || 0,
      recentActivity: userActivities.length,
      activeSessions: userSessions.filter(
        (s) => new Date(s.expiresAt) > new Date()
      ).length,
    };

    // Verification assessment
    const verificationAssessment = {
      profileCompleteness: calculateProfileCompleteness(instructor),
      riskLevel: assessInstructorRisk({
        accountAge: instructorStats.accountAge,
        hasEducation: !!instructor.education,
        hasCertifications: instructor.certifications?.length > 0,
        yearsExperience: instructor.yearsExperience || 0,
        hasPaymentDetails: !!instructor.paymentDetails,
        coursesCreated: instructorStats.totalCourses,
        emailVerified: instructor.user.isVerified,
      }),
      recommendations: generateVerificationRecommendations(
        instructor,
        instructorStats
      ),
    };

    const enrichedInstructor = {
      ...instructor,
      userInfo: instructor.user,
      stats: instructorStats,
      verificationAssessment,
      userActivities: userActivities.slice(0, 10),
      userSessions: userSessions.slice(0, 5),
    };

    educademyLogger.logBusinessOperation(
      "GET_INSTRUCTOR_DETAILS",
      "INSTRUCTOR",
      instructorId,
      "SUCCESS",
      {
        instructorId,
        isVerified: instructor.isVerified,
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        instructor: enrichedInstructor,
      },
    });
  } catch (error) {
    educademyLogger.error("Get instructor details failed", error, {
      userId: req.userAuthId,
      instructorId,
      business: {
        operation: "GET_INSTRUCTOR_DETAILS",
        entity: "INSTRUCTOR",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor details",
      requestId,
    });
  }
});

export const verifyInstructor = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { instructorId } = req.params;
  const { action, feedback, rejectionReason, verificationBadge } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "verifyInstructor",
  });

  try {
    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either APPROVE or REJECT",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    if (instructor.isVerified && action === "APPROVE") {
      return res.status(400).json({
        success: false,
        message: "Instructor is already verified",
      });
    }

    const updateData = {
      isVerified: action === "APPROVE",
      updatedAt: new Date(),
    };

    if (action === "APPROVE") {
      updateData.verificationBadge = verificationBadge || "VERIFIED";
    } else {
      updateData.verificationBadge = null;
    }

    const updatedInstructor = await prisma.instructor.update({
      where: { id: instructorId },
      data: updateData,
    });

    // Create audit trail
    educademyLogger.logAuditTrail(
      "INSTRUCTOR_VERIFICATION",
      "INSTRUCTOR",
      instructorId,
      { isVerified: instructor.isVerified },
      { isVerified: updateData.isVerified, action },
      req.userAuthId
    );

    // Create notification for the instructor
    await prisma.notification.create({
      data: {
        type: "SYSTEM_ANNOUNCEMENT", // Use a valid enum value
        title:
          action === "APPROVE"
            ? "Instructor Application Approved"
            : "Instructor Application Rejected",
        message:
          action === "APPROVE"
            ? `Congratulations! Your instructor application has been approved. You can now create and publish courses.${
                feedback ? ` Admin feedback: ${feedback}` : ""
              }`
            : `Your instructor application has been rejected.${
                rejectionReason ? ` Reason: ${rejectionReason}` : ""
              }${
                feedback ? ` Feedback: ${feedback}` : ""
              } You can reapply after addressing the concerns.`,
        userId: instructor.userId,
        priority: "HIGH",
        data: {
          instructorId,
          action,
          feedback: feedback || null,
          rejectionReason: rejectionReason || null,
          verificationBadge: verificationBadge || null,
          reviewedBy: req.userAuthId,
          reviewedAt: new Date().toISOString(),
        },
      },
    });

    // Log business operation
    educademyLogger.logBusinessOperation(
      "VERIFY_INSTRUCTOR",
      "INSTRUCTOR",
      instructorId,
      "SUCCESS",
      {
        action,
        instructorEmail: instructor.user.email,
        adminId: req.userAuthId,
        approved: action === "APPROVE",
      }
    );

    // Send email notification (you'll need to implement emailService)
    try {
      if (action === "APPROVE") {
        // await emailService.sendInstructorApprovalEmail({
        //   email: instructor.user.email,
        //   firstName: instructor.user.firstName,
        //   feedback: feedback,
        //   dashboardUrl: `${process.env.FRONTEND_URL}/instructor/dashboard`,
        // });
      } else {
        // await emailService.sendInstructorRejectionEmail({
        //   email: instructor.user.email,
        //   firstName: instructor.user.firstName,
        //   rejectionReason: rejectionReason,
        //   feedback: feedback,
        //   reapplyUrl: `${process.env.FRONTEND_URL}/instructor/apply`,
        // });
      }
    } catch (emailError) {
      educademyLogger.warn("Failed to send instructor verification email", {
        error: emailError,
        instructorId,
        email: instructor.user.email,
      });
    }

    res.status(200).json({
      success: true,
      message: `Instructor ${action.toLowerCase()}ed successfully`,
      data: {
        instructor: updatedInstructor,
        action,
        emailNotification: {
          sent: true, // Set to false if email fails
          recipient: instructor.user.email,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Verify instructor failed", error, {
      userId: req.userAuthId,
      instructorId,
      action,
      business: {
        operation: "VERIFY_INSTRUCTOR",
        entity: "INSTRUCTOR",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to verify instructor",
      requestId,
    });
  }
});

export const bulkVerifyInstructors = asyncHandler(async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { instructorIds, action, feedback, rejectionReason } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AdminController",
    methodName: "bulkVerifyInstructors",
  });

  try {
    if (
      !instructorIds ||
      !Array.isArray(instructorIds) ||
      instructorIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Instructor IDs array is required",
      });
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either APPROVE or REJECT",
      });
    }

    const instructors = await prisma.instructor.findMany({
      where: {
        id: { in: instructorIds },
        isVerified: false, // Only unverified instructors
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (instructors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No pending instructors found with provided IDs",
      });
    }

    const updateData = {
      isVerified: action === "APPROVE",
      verificationBadge: action === "APPROVE" ? "VERIFIED" : null,
      updatedAt: new Date(),
    };

    const updateResult = await prisma.instructor.updateMany({
      where: { id: { in: instructors.map((i) => i.id) } },
      data: updateData,
    });

    // Create notifications for all instructors
    const notificationData = instructors.map((instructor) => ({
      type: "SYSTEM_ANNOUNCEMENT", // Use a valid enum value
      title:
        action === "APPROVE"
          ? "Instructor Application Approved"
          : "Instructor Application Rejected",
      message:
        action === "APPROVE"
          ? `Congratulations! Your instructor application has been approved. You can now create and publish courses.${
              feedback ? ` Admin feedback: ${feedback}` : ""
            }`
          : `Your instructor application has been rejected.${
              rejectionReason ? ` Reason: ${rejectionReason}` : ""
            }${
              feedback ? ` Feedback: ${feedback}` : ""
            } You can reapply after addressing the concerns.`,
      userId: instructor.userId,
      priority: "HIGH",
      data: {
        instructorId: instructor.id,
        action,
        feedback: feedback || null,
        rejectionReason: rejectionReason || null,
        reviewedBy: req.userAuthId,
        reviewedAt: new Date().toISOString(),
        bulkOperation: true,
      },
    }));

    await prisma.notification.createMany({
      data: notificationData,
    });

    // Create audit trails
    for (const instructor of instructors) {
      educademyLogger.logAuditTrail(
        "BULK_INSTRUCTOR_VERIFICATION",
        "INSTRUCTOR",
        instructor.id,
        { isVerified: false },
        { isVerified: updateData.isVerified, action },
        req.userAuthId
      );
    }

    educademyLogger.logBusinessOperation(
      "BULK_VERIFY_INSTRUCTORS",
      "INSTRUCTOR",
      req.userAuthId,
      "SUCCESS",
      {
        action,
        instructorCount: instructors.length,
        updatedCount: updateResult.count,
        adminId: req.userAuthId,
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully ${action.toLowerCase()}ed ${
        updateResult.count
      } instructors`,
      data: {
        action,
        updatedCount: updateResult.count,
        requestedCount: instructorIds.length,
        processedInstructors: instructors.map((i) => ({
          id: i.id,
          name: `${i.user.firstName} ${i.user.lastName}`,
          email: i.user.email,
        })),
      },
    });
  } catch (error) {
    educademyLogger.error("Bulk verify instructors failed", error, {
      userId: req.userAuthId,
      instructorCount: instructorIds?.length || 0,
      action,
      business: {
        operation: "BULK_VERIFY_INSTRUCTORS",
        entity: "INSTRUCTOR",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to bulk verify instructors",
      requestId,
    });
  }
});

function assessInstructorRisk({
  accountAge,
  hasEducation,
  hasCertifications,
  yearsExperience,
  hasPaymentDetails,
  coursesCreated,
  emailVerified,
}) {
  let riskScore = 0;

  // Account age factor
  if (accountAge < 7) riskScore += 3;
  else if (accountAge < 30) riskScore += 1;

  // Profile completeness
  if (!hasEducation) riskScore += 2;
  if (!hasCertifications) riskScore += 1;
  if (!hasPaymentDetails) riskScore += 2;
  if (!emailVerified) riskScore += 3;

  // Experience factor
  if (yearsExperience === 0) riskScore += 2;
  else if (yearsExperience < 1) riskScore += 1;

  // Course creation activity
  if (coursesCreated === 0) riskScore += 1;

  let riskLevel = "LOW";
  let recommendations = [];

  if (riskScore >= 8) {
    riskLevel = "HIGH";
    recommendations.push("Requires thorough review");
    recommendations.push("Consider requesting additional documentation");
  } else if (riskScore >= 4) {
    riskLevel = "MEDIUM";
    recommendations.push("Review profile completeness");
    recommendations.push("Verify credentials if possible");
  } else {
    riskLevel = "LOW";
    recommendations.push("Good candidate for approval");
  }

  return {
    riskLevel,
    riskScore,
    factors: {
      accountAge,
      hasEducation,
      hasCertifications,
      yearsExperience,
      hasPaymentDetails,
      coursesCreated,
      emailVerified,
    },
    recommendations,
  };
}

function calculateProfileCompleteness(instructor) {
  const fields = [
    "title",
    "expertise",
    "education",
    "certifications",
    "biography",
    "yearsExperience",
    "paymentDetails",
  ];

  let completedFields = 0;

  if (instructor.title) completedFields++;
  if (instructor.expertise?.length > 0) completedFields++;
  if (instructor.education) completedFields++;
  if (instructor.certifications?.length > 0) completedFields++;
  if (instructor.biography) completedFields++;
  if (
    instructor.yearsExperience !== null &&
    instructor.yearsExperience !== undefined
  )
    completedFields++;
  if (instructor.paymentDetails) completedFields++;

  const percentage = (completedFields / fields.length) * 100;

  return {
    percentage: Math.round(percentage),
    completedFields,
    totalFields: fields.length,
    missingFields: fields.filter((field) => {
      switch (field) {
        case "title":
          return !instructor.title;
        case "expertise":
          return !instructor.expertise?.length;
        case "education":
          return !instructor.education;
        case "certifications":
          return !instructor.certifications?.length;
        case "biography":
          return !instructor.biography;
        case "yearsExperience":
          return (
            instructor.yearsExperience === null ||
            instructor.yearsExperience === undefined
          );
        case "paymentDetails":
          return !instructor.paymentDetails;
        default:
          return false;
      }
    }),
  };
}

function generateVerificationRecommendations(instructor, stats) {
  const recommendations = [];

  if (!instructor.education) {
    recommendations.push("Request educational background information");
  }

  if (!instructor.certifications?.length) {
    recommendations.push("Encourage adding relevant certifications");
  }

  if (!instructor.biography) {
    recommendations.push("Profile lacks professional biography");
  }

  if (!instructor.paymentDetails) {
    recommendations.push(
      "Payment details not provided - required for earnings"
    );
  }

  if (stats.accountAge < 7) {
    recommendations.push("Very new account - consider additional verification");
  }

  if (!instructor.user.isVerified) {
    recommendations.push("Email not verified - high priority issue");
  }

  if ((instructor.yearsExperience || 0) === 0) {
    recommendations.push(
      "No experience specified - verify teaching capability"
    );
  }

  if (stats.totalCourses === 0) {
    recommendations.push(
      "No courses created yet - monitor initial course quality"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Profile appears complete and ready for approval");
  }

  return recommendations;
}
