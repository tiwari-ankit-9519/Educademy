import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import educademyLogger from "../../../utils/logger.js";
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

export const getInstructorDashboard = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "InstructorController",
    methodName: "getInstructorDashboard",
  });

  try {
    // Get instructor profile
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            isActive: true,
            isVerified: true,
          },
        },
      },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
      });
    }

    if (!instructor.user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is not active. Please contact support.",
      });
    }

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Basic dashboard queries (simplified)
    const [
      totalCourses,
      publishedCourses,
      totalEnrollments,
      monthlyEnrollments,
      totalEarnings,
      monthlyEarnings,
      pendingEarnings,
      totalReviews,
      recentActivity,
    ] = await Promise.all([
      // Course counts
      prisma.course.count({
        where: { instructorId: instructor.id },
      }),

      prisma.course.count({
        where: { instructorId: instructor.id, status: "PUBLISHED" },
      }),

      // Enrollment counts
      prisma.enrollment.count({
        where: { course: { instructorId: instructor.id }, status: "ACTIVE" },
      }),

      prisma.enrollment.count({
        where: {
          course: { instructorId: instructor.id },
          createdAt: { gte: startOfMonth },
          status: "ACTIVE",
        },
      }),

      // Earnings
      prisma.earning.aggregate({
        where: { instructorId: instructor.id },
        _sum: { amount: true },
      }),

      prisma.earning.aggregate({
        where: {
          instructorId: instructor.id,
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      prisma.earning.aggregate({
        where: { instructorId: instructor.id, status: "PENDING" },
        _sum: { amount: true },
      }),

      // Review count
      prisma.review.count({
        where: { course: { instructorId: instructor.id } },
      }),

      // Recent activity (last 5 enrollments)
      prisma.enrollment.findMany({
        where: { course: { instructorId: instructor.id } },
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true, profileImage: true },
              },
            },
          },
          course: {
            select: { title: true, slug: true, thumbnail: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Get average rating
    const avgRating = await prisma.review.aggregate({
      where: { course: { instructorId: instructor.id } },
      _avg: { rating: true },
    });

    // Prepare simplified dashboard response
    const dashboardData = {
      instructor: {
        id: instructor.id,
        name: `${instructor.user.firstName} ${instructor.user.lastName}`,
        email: instructor.user.email,
        profileImage: instructor.user.profileImage,
        isVerified: instructor.isVerified,
      },

      overview: {
        totalCourses,
        publishedCourses,
        draftCourses: totalCourses - publishedCourses,
        totalStudents: totalEnrollments,
        averageRating: parseFloat(avgRating._avg.rating?.toFixed(2)) || 0,
        totalReviews,
      },

      earnings: {
        total: parseFloat(totalEarnings._sum.amount || 0),
        thisMonth: parseFloat(monthlyEarnings._sum.amount || 0),
        pending: parseFloat(pendingEarnings._sum.amount || 0),
      },

      enrollments: {
        total: totalEnrollments,
        thisMonth: monthlyEnrollments,
      },

      recentActivity: recentActivity.map((enrollment) => ({
        id: enrollment.id,
        student: {
          name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
          profileImage: enrollment.student.user.profileImage,
        },
        course: {
          title: enrollment.course.title,
          slug: enrollment.course.slug,
          thumbnail: enrollment.course.thumbnail,
        },
        enrolledAt: enrollment.createdAt,
        progress: enrollment.progress,
      })),

      quickActions: [
        { label: "Create New Course", action: "create_course" },
        { label: "View Analytics", action: "view_analytics" },
        { label: "Manage Earnings", action: "manage_earnings" },
        { label: "Course Settings", action: "course_settings" },
      ],
    };

    educademyLogger.logBusinessOperation(
      "GET_INSTRUCTOR_DASHBOARD",
      "INSTRUCTOR",
      instructor.id,
      "SUCCESS",
      { totalCourses, totalStudents: totalEnrollments }
    );

    res.status(200).json({
      success: true,
      message: "Instructor dashboard fetched successfully",
      data: dashboardData,
    });
  } catch (error) {
    educademyLogger.error("Get instructor dashboard failed", error, {
      userId: req.userAuthId,
      business: { operation: "GET_INSTRUCTOR_DASHBOARD", status: "ERROR" },
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch instructor dashboard",
      requestId,
    });
  }
});

export const getInstructorStats = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            isActive: true,
          },
        },
      },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
      });
    }

    if (!instructor.user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is not active. Please contact support.",
      });
    }

    // Basic statistics queries
    const [
      courseStats,
      enrollmentStats,
      earningStats,
      reviewStats,
      topCourses,
    ] = await Promise.all([
      // Course breakdown by status
      prisma.course.groupBy({
        by: ["status"],
        where: { instructorId: instructor.id },
        _count: { id: true },
      }),

      // Enrollment breakdown by status
      prisma.enrollment.groupBy({
        by: ["status"],
        where: { course: { instructorId: instructor.id } },
        _count: { id: true },
      }),

      // Basic earnings stats
      prisma.earning.aggregate({
        where: { instructorId: instructor.id },
        _sum: { amount: true, commission: true, platformFee: true },
        _count: { id: true },
        _avg: { amount: true },
      }),

      // Review stats
      prisma.review.aggregate({
        where: { course: { instructorId: instructor.id } },
        _count: { id: true },
        _avg: { rating: true },
      }),

      // Top 5 performing courses
      prisma.course.findMany({
        where: { instructorId: instructor.id },
        include: {
          _count: { select: { enrollments: true, reviews: true } },
        },
        orderBy: { totalRevenue: "desc" },
        take: 5,
      }),
    ]);

    // Process basic statistics
    const courseStatusBreakdown = courseStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.id;
      return acc;
    }, {});

    const enrollmentStatusBreakdown = enrollmentStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.id;
      return acc;
    }, {});

    const statsData = {
      instructor: {
        id: instructor.id,
        name: `${instructor.user.firstName} ${instructor.user.lastName}`,
        email: instructor.user.email,
        joinedAt: instructor.user.createdAt,
        isVerified: instructor.isVerified,
        commissionRate: instructor.commissionRate,
      },

      overview: {
        totalCourses: Object.values(courseStatusBreakdown).reduce(
          (a, b) => a + b,
          0
        ),
        publishedCourses: courseStatusBreakdown.published || 0,
        draftCourses: courseStatusBreakdown.draft || 0,
        archivedCourses: courseStatusBreakdown.archived || 0,
        totalStudents: Object.values(enrollmentStatusBreakdown).reduce(
          (a, b) => a + b,
          0
        ),
        activeEnrollments: enrollmentStatusBreakdown.active || 0,
        completedEnrollments: enrollmentStatusBreakdown.completed || 0,
        averageRating: parseFloat(reviewStats._avg.rating?.toFixed(2)) || 0,
        totalReviews: reviewStats._count.id,
        totalEarnings: parseFloat(earningStats._sum.amount || 0),
        avgEarningsPerSale: parseFloat(earningStats._avg.amount || 0),
      },

      courseBreakdown: {
        byStatus: courseStatusBreakdown,
        byEnrollmentStatus: enrollmentStatusBreakdown,
      },

      earnings: {
        total: parseFloat(earningStats._sum.amount || 0),
        totalCommission: parseFloat(earningStats._sum.commission || 0),
        totalPlatformFees: parseFloat(earningStats._sum.platformFee || 0),
        totalTransactions: earningStats._count.id,
        averagePerTransaction: parseFloat(earningStats._avg.amount || 0),
      },

      topCourses: topCourses.map((course) => ({
        id: course.id,
        title: course.title,
        enrollments: course._count.enrollments,
        reviews: course._count.reviews,
        rating: course.averageRating,
        revenue: parseFloat(course.totalRevenue || 0),
        status: course.status,
      })),

      summary: {
        performanceRating:
          reviewStats._avg.rating > 4.5
            ? "Excellent"
            : reviewStats._avg.rating > 4.0
            ? "Very Good"
            : reviewStats._avg.rating > 3.5
            ? "Good"
            : "Needs Improvement",
        totalRevenue: parseFloat(earningStats._sum.amount || 0),
        averageEnrollmentsPerCourse:
          courseStatusBreakdown.published > 0
            ? Math.round(
                (enrollmentStatusBreakdown.active || 0) /
                  courseStatusBreakdown.published
              )
            : 0,
      },
    };

    educademyLogger.logBusinessOperation(
      "GET_INSTRUCTOR_STATS",
      "INSTRUCTOR",
      instructor.id,
      "SUCCESS",
      { coursesAnalyzed: statsData.overview.totalCourses }
    );

    res.status(200).json({
      success: true,
      message: "Instructor statistics fetched successfully",
      data: statsData,
    });
  } catch (error) {
    educademyLogger.error("Get instructor statistics failed", error, {
      userId: req.userAuthId,
      business: { operation: "GET_INSTRUCTOR_STATS", status: "ERROR" },
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch instructor statistics",
      requestId,
    });
  }
});

export const getInstructorCourses = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query;

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid pagination parameters. Page must be >= 1, limit must be 1-100",
      });
    }

    // Get instructor profile
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
      });
    }

    if (!instructor.user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is not active. Please contact support.",
      });
    }

    // Build where clause for filtering
    const whereClause = { instructorId: instructor.id };

    // Status filter
    if (status) {
      const validStatuses = [
        "DRAFT",
        "UNDER_REVIEW",
        "PUBLISHED",
        "ARCHIVED",
        "REJECTED",
      ];
      if (validStatuses.includes(status.toUpperCase())) {
        whereClause.status = status.toUpperCase();
      }
    }

    // Category filter
    if (category) {
      whereClause.categoryId = category;
    }

    // Search filter
    if (search?.trim()) {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
        { tags: { hasSome: [search.trim()] } },
      ];
    }

    // Build sort order
    const validSortFields = [
      "title",
      "createdAt",
      "updatedAt",
      "price",
      "totalEnrollments",
    ];
    const orderBy = {};
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";
    } else {
      orderBy.updatedAt = "desc";
    }

    const skip = (pageNum - 1) * limitNum;

    // Execute queries
    const [courses, totalCount] = await Promise.all([
      prisma.course.findMany({
        where: whereClause,
        include: {
          category: { select: { id: true, name: true } },
          subcategory: { select: { id: true, name: true } },
          _count: {
            select: {
              enrollments: true,
              reviews: true,
              sections: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.course.count({ where: whereClause }),
    ]);

    // Format courses (simplified)
    const formattedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnail: course.thumbnail,
      price: parseFloat(course.price),
      originalPrice: course.originalPrice
        ? parseFloat(course.originalPrice)
        : null,
      level: course.level,
      status: course.status,
      language: course.language,
      duration: course.duration,
      averageRating: course.averageRating,
      totalEnrollments: course.totalEnrollments,
      totalRevenue: parseFloat(course.totalRevenue || 0),
      publishedAt: course.publishedAt,
      lastUpdated: course.lastUpdated,
      createdAt: course.createdAt,
      category: course.category,
      subcategory: course.subcategory,
      counts: {
        enrollments: course._count.enrollments,
        reviews: course._count.reviews,
        sections: course._count.sections,
      },
      actions: {
        canEdit: ["DRAFT", "REJECTED"].includes(course.status),
        canPublish: course.status === "DRAFT" && course._count.sections > 0,
        canArchive: ["PUBLISHED", "SUSPENDED"].includes(course.status),
        canDelete: course.status === "DRAFT" && course._count.enrollments === 0,
      },
    }));

    const totalPages = Math.ceil(totalCount / limitNum);

    const responseData = {
      courses: formattedCourses,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      summary: {
        totalCourses: totalCount,
        statusCounts: {
          draft: formattedCourses.filter((c) => c.status === "DRAFT").length,
          published: formattedCourses.filter((c) => c.status === "PUBLISHED")
            .length,
          underReview: formattedCourses.filter(
            (c) => c.status === "UNDER_REVIEW"
          ).length,
        },
      },
      filters: {
        applied: { status, category, search, sortBy, sortOrder },
        available: {
          statuses: [
            "DRAFT",
            "UNDER_REVIEW",
            "PUBLISHED",
            "ARCHIVED",
            "REJECTED",
          ],
          sortFields: validSortFields,
        },
      },
    };

    educademyLogger.logBusinessOperation(
      "GET_INSTRUCTOR_COURSES",
      "COURSE",
      instructor.id,
      "SUCCESS",
      { coursesReturned: formattedCourses.length, totalCourses: totalCount }
    );

    res.status(200).json({
      success: true,
      message: "Instructor courses fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get instructor courses failed", error, {
      userId: req.userAuthId,
      business: { operation: "GET_INSTRUCTOR_COURSES", status: "ERROR" },
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch instructor courses",
      requestId,
    });
  }
});
