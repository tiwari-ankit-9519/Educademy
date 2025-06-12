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

export const getInstructorEarnings = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "EarningsController",
    methodName: "getInstructorEarnings",
  });

  educademyLogger.logMethodEntry(
    "EarningsController",
    "getInstructorEarnings",
    {
      userId: req.userAuthId,
    }
  );

  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      status,
      courseId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid pagination parameters. Page must be >= 1, limit must be 1-100",
      });
    }

    // Get instructor
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can view earnings",
      });
    }

    // Build where clause
    const whereClause = {
      instructorId: instructor.id,
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.createdAt = {
        lte: new Date(endDate),
      };
    }

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    if (courseId) {
      whereClause.courseId = courseId;
    }

    // Build order by
    const validSortFields = ["amount", "status", "createdAt", "updatedAt"];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sortBy field. Must be one of: ${validSortFields.join(
          ", "
        )}`,
      });
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder.toLowerCase() === "desc" ? "desc" : "asc";

    const skip = (pageNum - 1) * limitNum;

    // Get earnings with related data
    const [earnings, totalCount] = await Promise.all([
      prisma.earning.findMany({
        where: whereClause,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              price: true,
            },
          },
          enrollment: {
            select: {
              id: true,
              student: {
                select: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.earning.count({
        where: whereClause,
      }),
    ]);

    // Calculate summary statistics
    const summaryStats = await prisma.earning.groupBy({
      by: ["status"],
      where: {
        instructorId: instructor.id,
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const summary = {
      totalEarnings: summaryStats.reduce(
        (sum, stat) => sum + (stat._sum.amount || 0),
        0
      ),
      pendingEarnings:
        summaryStats.find((s) => s.status === "PENDING")?._sum.amount || 0,
      paidEarnings:
        summaryStats.find((s) => s.status === "PAID")?._sum.amount || 0,
      totalTransactions: summaryStats.reduce(
        (sum, stat) => sum + stat._count.id,
        0
      ),
      pendingTransactions:
        summaryStats.find((s) => s.status === "PENDING")?._count.id || 0,
      paidTransactions:
        summaryStats.find((s) => s.status === "PAID")?._count.id || 0,
    };

    const totalPages = Math.ceil(totalCount / limitNum);

    educademyLogger.logBusinessOperation(
      "GET_INSTRUCTOR_EARNINGS",
      "EARNINGS",
      instructor.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        earningsReturned: earnings.length,
        totalEarnings: totalCount,
        totalAmount: summary.totalEarnings,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_INSTRUCTOR_EARNINGS", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
      earningsCount: earnings.length,
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "getInstructorEarnings",
      true,
      performance.now() - startTime
    );

    const responseData = {
      earnings: earnings.map((earning) => ({
        id: earning.id,
        amount: earning.amount,
        status: earning.status,
        courseId: earning.courseId,
        enrollmentId: earning.enrollmentId,
        course: earning.course,
        student: earning.enrollment?.student,
        createdAt: earning.createdAt,
        updatedAt: earning.updatedAt,
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      summary,
      filters: {
        applied: {
          startDate: startDate || null,
          endDate: endDate || null,
          status: status || null,
          courseId: courseId || null,
          sortBy,
          sortOrder,
        },
        available: {
          sortFields: validSortFields,
          statuses: ["PENDING", "PAID"],
        },
      },
    };

    res.status(200).json({
      success: true,
      message: "Instructor earnings fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get instructor earnings failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_INSTRUCTOR_EARNINGS",
        entity: "EARNINGS",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "getInstructorEarnings",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch instructor earnings",
      requestId,
    });
  }
});

export const getEarningsAnalytics = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "EarningsController",
    methodName: "getEarningsAnalytics",
  });

  educademyLogger.logMethodEntry("EarningsController", "getEarningsAnalytics", {
    userId: req.userAuthId,
  });

  try {
    const { period = "year", year, month } = req.query;

    // Get instructor
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can view earnings analytics",
      });
    }

    let dateFilter = {};
    const currentDate = new Date();

    if (period === "month" && year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };
    } else if (period === "year" && year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };
    } else {
      // Default to current year
      const startDate = new Date(currentDate.getFullYear(), 0, 1);
      const endDate = new Date(currentDate.getFullYear(), 11, 31);
      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    // Get overall statistics and course earnings
    const [overallStats, courseEarnings] = await Promise.all([
      prisma.earning.groupBy({
        by: ["status"],
        where: {
          instructorId: instructor.id,
          ...dateFilter,
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),

      prisma.earning.groupBy({
        by: ["courseId"],
        where: {
          instructorId: instructor.id,
          ...dateFilter,
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            amount: "desc",
          },
        },
        take: 10,
      }),
    ]);

    // Get course details for top earning courses
    const courseIds = courseEarnings.map((earning) => earning.courseId);
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
      },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        price: true,
        enrollmentCount: true,
      },
    });

    // Combine course earnings with course details
    const topCourses = courseEarnings.map((earning) => {
      const course = courses.find((c) => c.id === earning.courseId);
      return {
        course,
        totalEarnings: earning._sum.amount || 0,
        transactionCount: earning._count.id,
        averagePerTransaction:
          earning._count.id > 0
            ? (earning._sum.amount || 0) / earning._count.id
            : 0,
      };
    });

    // Calculate analytics
    const analytics = {
      overview: {
        totalEarnings: overallStats.reduce(
          (sum, stat) => sum + (stat._sum.amount || 0),
          0
        ),
        pendingEarnings:
          overallStats.find((s) => s.status === "PENDING")?._sum.amount || 0,
        paidEarnings:
          overallStats.find((s) => s.status === "PAID")?._sum.amount || 0,
        totalTransactions: overallStats.reduce(
          (sum, stat) => sum + stat._count.id,
          0
        ),
        averagePerTransaction:
          overallStats.reduce((sum, stat) => sum + stat._count.id, 0) > 0
            ? overallStats.reduce(
                (sum, stat) => sum + (stat._sum.amount || 0),
                0
              ) / overallStats.reduce((sum, stat) => sum + stat._count.id, 0)
            : 0,
      },
      topCourses,
      period: {
        type: period,
        year: year || currentDate.getFullYear(),
        month: month || null,
      },
    };

    educademyLogger.logBusinessOperation(
      "GET_EARNINGS_ANALYTICS",
      "EARNINGS",
      instructor.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        period,
        totalEarnings: analytics.overview.totalEarnings,
        topCoursesCount: topCourses.length,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_EARNINGS_ANALYTICS", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
      period,
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "getEarningsAnalytics",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Earnings analytics fetched successfully",
      data: analytics,
    });
  } catch (error) {
    educademyLogger.error("Get earnings analytics failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_EARNINGS_ANALYTICS",
        entity: "EARNINGS",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "getEarningsAnalytics",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch earnings analytics",
      requestId,
    });
  }
});

export const getCourseEarnings = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "EarningsController",
    methodName: "getCourseEarnings",
  });

  educademyLogger.logMethodEntry("EarningsController", "getCourseEarnings", {
    userId: req.userAuthId,
    courseId,
  });

  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid pagination parameters. Page must be >= 1, limit must be 1-100",
      });
    }

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { id: true, isVerified: true },
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
      select: { id: true, isVerified: true },
    });

    if (!instructor || instructor.id !== course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only view earnings for your own courses",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can view earnings",
      });
    }

    // Build where clause
    const whereClause = {
      courseId,
      instructorId: instructor.id,
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.createdAt = {
        lte: new Date(endDate),
      };
    }

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    // Build order by
    const validSortFields = ["amount", "status", "createdAt", "updatedAt"];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sortBy field. Must be one of: ${validSortFields.join(
          ", "
        )}`,
      });
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder.toLowerCase() === "desc" ? "desc" : "asc";

    const skip = (pageNum - 1) * limitNum;

    // Get earnings with related data
    const [earnings, totalCount] = await Promise.all([
      prisma.earning.findMany({
        where: whereClause,
        include: {
          enrollment: {
            select: {
              id: true,
              student: {
                select: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.earning.count({
        where: whereClause,
      }),
    ]);

    // Calculate summary statistics for this course
    const summaryStats = await prisma.earning.groupBy({
      by: ["status"],
      where: {
        courseId,
        instructorId: instructor.id,
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const summary = {
      courseId,
      courseTitle: course.title,
      coursePrice: course.price,
      totalEarnings: summaryStats.reduce(
        (sum, stat) => sum + (stat._sum.amount || 0),
        0
      ),
      pendingEarnings:
        summaryStats.find((s) => s.status === "PENDING")?._sum.amount || 0,
      paidEarnings:
        summaryStats.find((s) => s.status === "PAID")?._sum.amount || 0,
      totalTransactions: summaryStats.reduce(
        (sum, stat) => sum + stat._count.id,
        0
      ),
      pendingTransactions:
        summaryStats.find((s) => s.status === "PENDING")?._count.id || 0,
      paidTransactions:
        summaryStats.find((s) => s.status === "PAID")?._count.id || 0,
    };

    const totalPages = Math.ceil(totalCount / limitNum);

    educademyLogger.logBusinessOperation(
      "GET_COURSE_EARNINGS",
      "EARNINGS",
      courseId,
      "SUCCESS",
      {
        courseId,
        courseTitle: course.title,
        instructorId: instructor.id,
        earningsReturned: earnings.length,
        totalEarnings: totalCount,
        totalAmount: summary.totalEarnings,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_COURSE_EARNINGS", startTime, {
      userId: req.userAuthId,
      courseId,
      earningsCount: earnings.length,
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "getCourseEarnings",
      true,
      performance.now() - startTime
    );

    const responseData = {
      earnings: earnings.map((earning) => ({
        id: earning.id,
        amount: earning.amount,
        status: earning.status,
        enrollmentId: earning.enrollmentId,
        student: earning.enrollment?.student,
        createdAt: earning.createdAt,
        updatedAt: earning.updatedAt,
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      summary,
      course: {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        price: course.price,
        enrollmentCount: course.enrollmentCount,
      },
      filters: {
        applied: {
          startDate: startDate || null,
          endDate: endDate || null,
          status: status || null,
          sortBy,
          sortOrder,
        },
        available: {
          sortFields: validSortFields,
          statuses: ["PENDING", "PAID"],
        },
      },
    };

    res.status(200).json({
      success: true,
      message: "Course earnings fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get course earnings failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "GET_COURSE_EARNINGS",
        entity: "EARNINGS",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "getCourseEarnings",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch course earnings",
      requestId,
    });
  }
});

export const requestPayout = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "EarningsController",
    methodName: "requestPayout",
  });

  educademyLogger.logMethodEntry("EarningsController", "requestPayout", {
    userId: req.userAuthId,
    amount: req.body.amount,
  });

  try {
    const { amount, paymentMethod = "BANK_TRANSFER", notes } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    // Get instructor
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can request payouts",
      });
    }

    // Check available earnings
    const availableEarnings = await prisma.earning.aggregate({
      where: {
        instructorId: instructor.id,
        status: "PENDING",
      },
      _sum: {
        amount: true,
      },
    });

    const availableAmount = availableEarnings._sum.amount || 0;

    if (amount > availableAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available earnings. Available: $${availableAmount}`,
        data: {
          requestedAmount: amount,
          availableAmount,
        },
      });
    }

    // Check for existing pending payout requests
    const existingPayout = await prisma.payout.findFirst({
      where: {
        instructorId: instructor.id,
        status: "PENDING",
      },
    });

    if (existingPayout) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending payout request",
        data: {
          existingPayoutId: existingPayout.id,
          existingAmount: existingPayout.amount,
        },
      });
    }

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        amount,
        status: "PENDING",
        paymentMethod: paymentMethod.toUpperCase(),
        notes: notes?.trim() || null,
        instructorId: instructor.id,
        requestedAt: new Date(),
      },
      include: {
        instructor: {
          select: {
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

    // Create notification for instructor
    await prisma.notification.create({
      data: {
        type: "PAYOUT_REQUESTED",
        title: "Payout Request Submitted",
        message: `Your payout request of $${amount} has been submitted and is being processed.`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          payoutId: payout.id,
          amount,
          paymentMethod,
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "REQUEST_PAYOUT",
      "PAYOUT",
      payout.id,
      "SUCCESS",
      {
        payoutId: payout.id,
        amount,
        paymentMethod,
        instructorId: instructor.id,
        availableEarnings: availableAmount,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("REQUEST_PAYOUT", startTime, {
      userId: req.userAuthId,
      payoutId: payout.id,
      amount,
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "requestPayout",
      true,
      performance.now() - startTime
    );

    res.status(201).json({
      success: true,
      message: "Payout request submitted successfully",
      data: {
        payout: {
          id: payout.id,
          amount: payout.amount,
          status: payout.status,
          paymentMethod: payout.paymentMethod,
          notes: payout.notes,
          requestedAt: payout.requestedAt,
          instructor: payout.instructor,
        },
        availableEarnings: availableAmount - amount,
      },
    });
  } catch (error) {
    educademyLogger.error("Request payout failed", error, {
      userId: req.userAuthId,
      amount: req.body.amount,
      business: {
        operation: "REQUEST_PAYOUT",
        entity: "PAYOUT",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "requestPayout",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to submit payout request",
      requestId,
    });
  }
});

export const getPayoutHistory = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "EarningsController",
    methodName: "getPayoutHistory",
  });

  educademyLogger.logMethodEntry("EarningsController", "getPayoutHistory", {
    userId: req.userAuthId,
  });

  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      sortBy = "requestedAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid pagination parameters. Page must be >= 1, limit must be 1-100",
      });
    }

    // Get instructor
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can view payout history",
      });
    }

    // Build where clause
    const whereClause = {
      instructorId: instructor.id,
    };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    if (startDate && endDate) {
      whereClause.requestedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.requestedAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.requestedAt = {
        lte: new Date(endDate),
      };
    }

    // Build order by
    const validSortFields = ["amount", "status", "requestedAt", "processedAt"];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sortBy field. Must be one of: ${validSortFields.join(
          ", "
        )}`,
      });
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder.toLowerCase() === "desc" ? "desc" : "asc";

    const skip = (pageNum - 1) * limitNum;

    // Get payouts
    const [payouts, totalCount] = await Promise.all([
      prisma.payout.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.payout.count({
        where: whereClause,
      }),
    ]);

    // Calculate summary statistics
    const summaryStats = await prisma.payout.groupBy({
      by: ["status"],
      where: {
        instructorId: instructor.id,
        ...(startDate &&
          endDate && {
            requestedAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const summary = {
      totalPayouts: summaryStats.reduce(
        (sum, stat) => sum + (stat._sum.amount || 0),
        0
      ),
      pendingPayouts:
        summaryStats.find((s) => s.status === "PENDING")?._sum.amount || 0,
      completedPayouts:
        summaryStats.find((s) => s.status === "COMPLETED")?._sum.amount || 0,
      rejectedPayouts:
        summaryStats.find((s) => s.status === "REJECTED")?._sum.amount || 0,
      totalRequests: summaryStats.reduce(
        (sum, stat) => sum + stat._count.id,
        0
      ),
      pendingRequests:
        summaryStats.find((s) => s.status === "PENDING")?._count.id || 0,
      completedRequests:
        summaryStats.find((s) => s.status === "COMPLETED")?._count.id || 0,
      rejectedRequests:
        summaryStats.find((s) => s.status === "REJECTED")?._count.id || 0,
    };

    const totalPages = Math.ceil(totalCount / limitNum);

    educademyLogger.logBusinessOperation(
      "GET_PAYOUT_HISTORY",
      "PAYOUT",
      instructor.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        payoutsReturned: payouts.length,
        totalPayouts: totalCount,
        totalAmount: summary.totalPayouts,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_PAYOUT_HISTORY", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
      payoutsCount: payouts.length,
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "getPayoutHistory",
      true,
      performance.now() - startTime
    );

    const responseData = {
      payouts: payouts.map((payout) => ({
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
        paymentMethod: payout.paymentMethod,
        notes: payout.notes,
        adminNotes: payout.adminNotes,
        requestedAt: payout.requestedAt,
        processedAt: payout.processedAt,
        createdAt: payout.createdAt,
        updatedAt: payout.updatedAt,
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      summary,
      filters: {
        applied: {
          status: status || null,
          startDate: startDate || null,
          endDate: endDate || null,
          sortBy,
          sortOrder,
        },
        available: {
          sortFields: validSortFields,
          statuses: ["PENDING", "COMPLETED", "REJECTED"],
        },
      },
    };

    res.status(200).json({
      success: true,
      message: "Payout history fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get payout history failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_PAYOUT_HISTORY",
        entity: "PAYOUT",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "getPayoutHistory",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch payout history",
      requestId,
    });
  }
});

export const getEarningsSummary = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "EarningsController",
    methodName: "getEarningsSummary",
  });

  educademyLogger.logMethodEntry("EarningsController", "getEarningsSummary", {
    userId: req.userAuthId,
  });

  try {
    // Get instructor
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can view earnings summary",
      });
    }

    // Get current date for period calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get earnings statistics
    const [
      totalEarnings,
      thisMonthEarnings,
      lastMonthEarnings,
      thisYearEarnings,
      availableEarnings,
      pendingPayouts,
      totalCourses,
      activeCourses,
    ] = await Promise.all([
      // Total earnings
      prisma.earning.aggregate({
        where: { instructorId: instructor.id },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // This month earnings
      prisma.earning.aggregate({
        where: {
          instructorId: instructor.id,
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Last month earnings
      prisma.earning.aggregate({
        where: {
          instructorId: instructor.id,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // This year earnings
      prisma.earning.aggregate({
        where: {
          instructorId: instructor.id,
          createdAt: { gte: startOfYear },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Available earnings (pending)
      prisma.earning.aggregate({
        where: {
          instructorId: instructor.id,
          status: "PENDING",
        },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Pending payouts
      prisma.payout.aggregate({
        where: {
          instructorId: instructor.id,
          status: "PENDING",
        },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Total courses
      prisma.course.count({
        where: { instructorId: instructor.id },
      }),

      // Active courses
      prisma.course.count({
        where: {
          instructorId: instructor.id,
          status: "PUBLISHED",
        },
      }),
    ]);

    // Calculate growth percentages
    const thisMonthAmount = thisMonthEarnings._sum.amount || 0;
    const lastMonthAmount = lastMonthEarnings._sum.amount || 0;
    const monthlyGrowth =
      lastMonthAmount > 0
        ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100
        : thisMonthAmount > 0
        ? 100
        : 0;

    // Get top performing courses
    const topCourses = await prisma.earning.groupBy({
      by: ["courseId"],
      where: { instructorId: instructor.id },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    });

    // Get course details for top courses
    const courseIds = topCourses.map((earning) => earning.courseId);
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        price: true,
        enrollmentCount: true,
      },
    });

    const topPerformingCourses = topCourses.map((earning) => {
      const course = courses.find((c) => c.id === earning.courseId);
      return {
        course,
        totalEarnings: earning._sum.amount || 0,
        enrollmentCount: earning._count.id,
      };
    });

    // Recent earnings (last 10)
    const recentEarnings = await prisma.earning.findMany({
      where: { instructorId: instructor.id },
      include: {
        course: {
          select: { id: true, title: true, thumbnail: true },
        },
        enrollment: {
          select: {
            student: {
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
    });

    const summary = {
      overview: {
        totalEarnings: totalEarnings._sum.amount || 0,
        totalTransactions: totalEarnings._count || 0,
        availableBalance: availableEarnings._sum.amount || 0,
        pendingPayouts: pendingPayouts._sum.amount || 0,
        totalCourses,
        activeCourses,
      },
      periods: {
        thisMonth: {
          earnings: thisMonthAmount,
          transactions: thisMonthEarnings._count || 0,
        },
        lastMonth: {
          earnings: lastMonthAmount,
          transactions: lastMonthEarnings._count || 0,
        },
        thisYear: {
          earnings: thisYearEarnings._sum.amount || 0,
          transactions: thisYearEarnings._count || 0,
        },
        growth: {
          monthly: parseFloat(monthlyGrowth.toFixed(2)),
        },
      },
      topPerformingCourses,
      recentEarnings: recentEarnings.map((earning) => ({
        id: earning.id,
        amount: earning.amount,
        status: earning.status,
        course: earning.course,
        student: earning.enrollment?.student,
        createdAt: earning.createdAt,
      })),
    };

    educademyLogger.logBusinessOperation(
      "GET_EARNINGS_SUMMARY",
      "EARNINGS",
      instructor.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        totalEarnings: summary.overview.totalEarnings,
        availableBalance: summary.overview.availableBalance,
        topCoursesCount: topPerformingCourses.length,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_EARNINGS_SUMMARY", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "getEarningsSummary",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Earnings summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    educademyLogger.error("Get earnings summary failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_EARNINGS_SUMMARY",
        entity: "EARNINGS",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "getEarningsSummary",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch earnings summary",
      requestId,
    });
  }
});

export const cancelPayoutRequest = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { payoutId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "EarningsController",
    methodName: "cancelPayoutRequest",
  });

  educademyLogger.logMethodEntry("EarningsController", "cancelPayoutRequest", {
    userId: req.userAuthId,
    payoutId,
  });

  try {
    // Get instructor
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    // Get payout request
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout request not found",
      });
    }

    if (payout.instructorId !== instructor.id) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own payout requests",
      });
    }

    if (payout.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel payout request with status: ${payout.status}`,
        data: {
          currentStatus: payout.status,
          allowedStatus: "PENDING",
        },
      });
    }

    // Update payout status to CANCELLED
    const cancelledPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "CANCELLED",
        processedAt: new Date(),
        adminNotes: "Cancelled by instructor",
        updatedAt: new Date(),
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        type: "PAYOUT_CANCELLED",
        title: "Payout Request Cancelled",
        message: `Your payout request of $${payout.amount} has been cancelled successfully.`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          payoutId: cancelledPayout.id,
          amount: payout.amount,
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "CANCEL_PAYOUT_REQUEST",
      "PAYOUT",
      payoutId,
      "SUCCESS",
      {
        payoutId,
        amount: payout.amount,
        instructorId: instructor.id,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "CANCEL_PAYOUT_REQUEST",
      "PAYOUT",
      payoutId,
      { status: payout.status },
      { status: "CANCELLED" },
      req.userAuthId
    );

    educademyLogger.performance("CANCEL_PAYOUT_REQUEST", startTime, {
      userId: req.userAuthId,
      payoutId,
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "cancelPayoutRequest",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Payout request cancelled successfully",
      data: {
        payout: {
          id: cancelledPayout.id,
          amount: cancelledPayout.amount,
          status: cancelledPayout.status,
          processedAt: cancelledPayout.processedAt,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Cancel payout request failed", error, {
      userId: req.userAuthId,
      payoutId,
      business: {
        operation: "CANCEL_PAYOUT_REQUEST",
        entity: "PAYOUT",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "EarningsController",
      "cancelPayoutRequest",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to cancel payout request",
      requestId,
    });
  }
});
