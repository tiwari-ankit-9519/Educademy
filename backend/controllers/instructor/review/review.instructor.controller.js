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

export const getInstructorReviews = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "ReviewController",
    methodName: "getInstructorReviews",
  });

  educademyLogger.logMethodEntry("ReviewController", "getInstructorReviews", {
    userId: req.userAuthId,
  });

  try {
    const {
      page = 1,
      limit = 20,
      courseId,
      rating,
      hasReply,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
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
        message: "Only verified instructors can view reviews",
      });
    }

    // Build where clause for reviews on instructor's courses
    const whereClause = {
      course: {
        instructorId: instructor.id,
      },
    };

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (rating) {
      whereClause.rating = parseInt(rating);
    }

    if (hasReply !== undefined) {
      if (hasReply === "true") {
        whereClause.instructorReply = { not: null };
      } else if (hasReply === "false") {
        whereClause.instructorReply = null;
      }
    }

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

    if (search?.trim()) {
      whereClause.OR = [
        {
          comment: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          instructorReply: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    // Build order by
    const validSortFields = ["rating", "createdAt", "updatedAt"];
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

    // Get reviews
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
          student: {
            select: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.review.count({
        where: whereClause,
      }),
    ]);

    // Calculate review statistics
    const reviewStats = await prisma.review.groupBy({
      by: ["rating"],
      where: {
        course: {
          instructorId: instructor.id,
        },
      },
      _count: {
        rating: true,
      },
    });

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviewStats.forEach((stat) => {
      ratingDistribution[stat.rating] = stat._count.rating;
    });

    const totalReviews = reviewStats.reduce(
      (sum, stat) => sum + stat._count.rating,
      0
    );
    const averageRating =
      totalReviews > 0
        ? reviewStats.reduce(
            (sum, stat) => sum + stat.rating * stat._count.rating,
            0
          ) / totalReviews
        : 0;

    // Count reviews without replies
    const reviewsWithoutReply = await prisma.review.count({
      where: {
        course: {
          instructorId: instructor.id,
        },
        instructorReply: null,
      },
    });

    const summary = {
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(2)),
      ratingDistribution,
      reviewsWithoutReply,
      replyRate:
        totalReviews > 0
          ? (
              ((totalReviews - reviewsWithoutReply) / totalReviews) *
              100
            ).toFixed(2)
          : 0,
    };

    const totalPages = Math.ceil(totalCount / limitNum);

    educademyLogger.logBusinessOperation(
      "GET_INSTRUCTOR_REVIEWS",
      "REVIEW",
      instructor.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        reviewsReturned: reviews.length,
        totalReviews: totalCount,
        averageRating: summary.averageRating,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_INSTRUCTOR_REVIEWS", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
      reviewsCount: reviews.length,
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "getInstructorReviews",
      true,
      performance.now() - startTime
    );

    const responseData = {
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        instructorReply: review.instructorReply,
        repliedAt: review.repliedAt,
        courseId: review.courseId,
        course: review.course,
        student: review.student,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
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
          courseId: courseId || null,
          rating: rating || null,
          hasReply: hasReply || null,
          startDate: startDate || null,
          endDate: endDate || null,
          search: search || null,
          sortBy,
          sortOrder,
        },
        available: {
          sortFields: validSortFields,
          ratings: [1, 2, 3, 4, 5],
        },
      },
    };

    res.status(200).json({
      success: true,
      message: "Instructor reviews fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get instructor reviews failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_INSTRUCTOR_REVIEWS",
        entity: "REVIEW",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "getInstructorReviews",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch instructor reviews",
      requestId,
    });
  }
});

export const getCourseReviews = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "ReviewController",
    methodName: "getCourseReviews",
  });

  educademyLogger.logMethodEntry("ReviewController", "getCourseReviews", {
    userId: req.userAuthId,
    courseId,
  });

  try {
    const {
      page = 1,
      limit = 20,
      rating,
      hasReply,
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
        message: "You can only view reviews for your own courses",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can view reviews",
      });
    }

    // Build where clause
    const whereClause = {
      courseId,
    };

    if (rating) {
      whereClause.rating = parseInt(rating);
    }

    if (hasReply !== undefined) {
      if (hasReply === "true") {
        whereClause.instructorReply = { not: null };
      } else if (hasReply === "false") {
        whereClause.instructorReply = null;
      }
    }

    // Build order by
    const validSortFields = ["rating", "createdAt", "updatedAt"];
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

    // Get reviews
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.review.count({
        where: whereClause,
      }),
    ]);

    // Calculate course review statistics
    const courseReviewStats = await prisma.review.groupBy({
      by: ["rating"],
      where: { courseId },
      _count: {
        rating: true,
      },
    });

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    courseReviewStats.forEach((stat) => {
      ratingDistribution[stat.rating] = stat._count.rating;
    });

    const totalCourseReviews = courseReviewStats.reduce(
      (sum, stat) => sum + stat._count.rating,
      0
    );
    const averageRating =
      totalCourseReviews > 0
        ? courseReviewStats.reduce(
            (sum, stat) => sum + stat.rating * stat._count.rating,
            0
          ) / totalCourseReviews
        : 0;

    const reviewsWithoutReply = await prisma.review.count({
      where: {
        courseId,
        instructorReply: null,
      },
    });

    const summary = {
      courseId,
      courseTitle: course.title,
      totalReviews: totalCourseReviews,
      averageRating: parseFloat(averageRating.toFixed(2)),
      ratingDistribution,
      reviewsWithoutReply,
      replyRate:
        totalCourseReviews > 0
          ? (
              ((totalCourseReviews - reviewsWithoutReply) /
                totalCourseReviews) *
              100
            ).toFixed(2)
          : 0,
    };

    const totalPages = Math.ceil(totalCount / limitNum);

    educademyLogger.logBusinessOperation(
      "GET_COURSE_REVIEWS",
      "REVIEW",
      courseId,
      "SUCCESS",
      {
        courseId,
        courseTitle: course.title,
        instructorId: instructor.id,
        reviewsReturned: reviews.length,
        totalReviews: totalCount,
        averageRating: summary.averageRating,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_COURSE_REVIEWS", startTime, {
      userId: req.userAuthId,
      courseId,
      reviewsCount: reviews.length,
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "getCourseReviews",
      true,
      performance.now() - startTime
    );

    const responseData = {
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        instructorReply: review.instructorReply,
        repliedAt: review.repliedAt,
        student: review.student,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
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
      },
      filters: {
        applied: {
          rating: rating || null,
          hasReply: hasReply || null,
          sortBy,
          sortOrder,
        },
        available: {
          sortFields: validSortFields,
          ratings: [1, 2, 3, 4, 5],
        },
      },
    };

    res.status(200).json({
      success: true,
      message: "Course reviews fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get course reviews failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "GET_COURSE_REVIEWS",
        entity: "REVIEW",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "getCourseReviews",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch course reviews",
      requestId,
    });
  }
});

export const replyToReview = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { reviewId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "ReviewController",
    methodName: "replyToReview",
  });

  educademyLogger.logMethodEntry("ReviewController", "replyToReview", {
    userId: req.userAuthId,
    reviewId,
    reply: req.body.reply,
  });

  try {
    const { reply } = req.body;

    // Validation
    if (!reply?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    if (reply.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Reply must be 1000 characters or less",
      });
    }

    // Get review and check ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
        student: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor || instructor.id !== review.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only reply to reviews for your own courses",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can reply to reviews",
      });
    }

    if (review.instructorReply) {
      return res.status(400).json({
        success: false,
        message:
          "This review already has a reply. Use update endpoint to modify it",
        data: {
          existingReply: review.instructorReply,
          repliedAt: review.repliedAt,
        },
      });
    }

    // Update review with reply
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        instructorReply: reply.trim(),
        repliedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        student: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        type: "REVIEW_REPLY",
        title: "Instructor Replied to Your Review",
        message: `The instructor of "${review.course.title}" has replied to your review.`,
        userId: review.student.user.id,
        priority: "NORMAL",
        data: {
          reviewId: updatedReview.id,
          courseId: review.course.id,
          courseTitle: review.course.title,
          instructorReply: reply.trim(),
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "REPLY_TO_REVIEW",
      "REVIEW",
      reviewId,
      "SUCCESS",
      {
        reviewId,
        courseId: review.course.id,
        courseTitle: review.course.title,
        studentId: review.student.user.id,
        instructorId: instructor.id,
        replyLength: reply.trim().length,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "REPLY_TO_REVIEW",
      "REVIEW",
      reviewId,
      { instructorReply: null },
      { instructorReply: reply.trim() },
      req.userAuthId
    );

    educademyLogger.performance("REPLY_TO_REVIEW", startTime, {
      userId: req.userAuthId,
      reviewId,
      courseId: review.course.id,
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "replyToReview",
      true,
      performance.now() - startTime
    );

    const responseData = {
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        instructorReply: updatedReview.instructorReply,
        repliedAt: updatedReview.repliedAt,
        course: updatedReview.course,
        student: updatedReview.student,
        createdAt: updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt,
      },
    };

    res.status(200).json({
      success: true,
      message: "Reply added successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Reply to review failed", error, {
      userId: req.userAuthId,
      reviewId,
      business: {
        operation: "REPLY_TO_REVIEW",
        entity: "REVIEW",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "replyToReview",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to add reply to review",
      requestId,
    });
  }
});

export const updateReviewReply = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { reviewId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "ReviewController",
    methodName: "updateReviewReply",
  });

  educademyLogger.logMethodEntry("ReviewController", "updateReviewReply", {
    userId: req.userAuthId,
    reviewId,
    reply: req.body.reply,
  });

  try {
    const { reply } = req.body;

    // Validation
    if (!reply?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    if (reply.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Reply must be 1000 characters or less",
      });
    }

    // Get review and check ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
        student: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor || instructor.id !== review.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only update replies for your own course reviews",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can update review replies",
      });
    }

    if (!review.instructorReply) {
      return res.status(400).json({
        success: false,
        message: "This review does not have a reply to update",
      });
    }

    const oldReply = review.instructorReply;

    // Update review reply
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        instructorReply: reply.trim(),
        updatedAt: new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        student: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        type: "REVIEW_REPLY_UPDATED",
        title: "Instructor Updated Their Reply",
        message: `The instructor of "${review.course.title}" has updated their reply to your review.`,
        userId: review.student.user.id,
        priority: "NORMAL",
        data: {
          reviewId: updatedReview.id,
          courseId: review.course.id,
          courseTitle: review.course.title,
          updatedReply: reply.trim(),
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "UPDATE_REVIEW_REPLY",
      "REVIEW",
      reviewId,
      "SUCCESS",
      {
        reviewId,
        courseId: review.course.id,
        courseTitle: review.course.title,
        studentId: review.student.user.id,
        instructorId: instructor.id,
        oldReplyLength: oldReply.length,
        newReplyLength: reply.trim().length,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "UPDATE_REVIEW_REPLY",
      "REVIEW",
      reviewId,
      { instructorReply: oldReply },
      { instructorReply: reply.trim() },
      req.userAuthId
    );

    educademyLogger.performance("UPDATE_REVIEW_REPLY", startTime, {
      userId: req.userAuthId,
      reviewId,
      courseId: review.course.id,
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "updateReviewReply",
      true,
      performance.now() - startTime
    );

    const responseData = {
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        instructorReply: updatedReview.instructorReply,
        repliedAt: updatedReview.repliedAt,
        course: updatedReview.course,
        student: updatedReview.student,
        createdAt: updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt,
      },
      changes: {
        previousReply: oldReply,
        newReply: reply.trim(),
      },
    };

    res.status(200).json({
      success: true,
      message: "Reply updated successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Update review reply failed", error, {
      userId: req.userAuthId,
      reviewId,
      business: {
        operation: "UPDATE_REVIEW_REPLY",
        entity: "REVIEW",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "updateReviewReply",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to update review reply",
      requestId,
    });
  }
});

export const deleteReviewReply = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { reviewId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "ReviewController",
    methodName: "deleteReviewReply",
  });

  educademyLogger.logMethodEntry("ReviewController", "deleteReviewReply", {
    userId: req.userAuthId,
    reviewId,
  });

  try {
    // Get review and check ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
        student: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor || instructor.id !== review.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete replies for your own course reviews",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can delete review replies",
      });
    }

    if (!review.instructorReply) {
      return res.status(400).json({
        success: false,
        message: "This review does not have a reply to delete",
      });
    }

    const deletedReply = review.instructorReply;

    // Remove reply from review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        instructorReply: null,
        repliedAt: null,
        updatedAt: new Date(),
      },
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        type: "REVIEW_REPLY_DELETED",
        title: "Instructor Removed Their Reply",
        message: `The instructor of "${review.course.title}" has removed their reply to your review.`,
        userId: review.student.user.id,
        priority: "NORMAL",
        data: {
          reviewId: updatedReview.id,
          courseId: review.course.id,
          courseTitle: review.course.title,
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "DELETE_REVIEW_REPLY",
      "REVIEW",
      reviewId,
      "SUCCESS",
      {
        reviewId,
        courseId: review.course.id,
        courseTitle: review.course.title,
        studentId: review.student.user.id,
        instructorId: instructor.id,
        deletedReplyLength: deletedReply.length,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "DELETE_REVIEW_REPLY",
      "REVIEW",
      reviewId,
      { instructorReply: deletedReply },
      { instructorReply: null },
      req.userAuthId
    );

    educademyLogger.performance("DELETE_REVIEW_REPLY", startTime, {
      userId: req.userAuthId,
      reviewId,
      courseId: review.course.id,
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "deleteReviewReply",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Reply deleted successfully",
      data: {
        reviewId: updatedReview.id,
        deletedReply,
        courseId: review.course.id,
        courseTitle: review.course.title,
      },
    });
  } catch (error) {
    educademyLogger.error("Delete review reply failed", error, {
      userId: req.userAuthId,
      reviewId,
      business: {
        operation: "DELETE_REVIEW_REPLY",
        entity: "REVIEW",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "deleteReviewReply",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete review reply",
      requestId,
    });
  }
});

export const getReviewAnalytics = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "ReviewController",
    methodName: "getReviewAnalytics",
  });

  educademyLogger.logMethodEntry("ReviewController", "getReviewAnalytics", {
    userId: req.userAuthId,
  });

  try {
    const { period = "year", year, month, courseId } = req.query;

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
        message: "Only verified instructors can view review analytics",
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

    // Build base where clause
    const baseWhere = {
      course: {
        instructorId: instructor.id,
      },
      ...dateFilter,
    };

    if (courseId) {
      baseWhere.courseId = courseId;
    }

    // Get comprehensive analytics
    const [
      overallStats,
      ratingDistribution,
      coursePerformance,
      recentReviews,
      monthlyTrend,
    ] = await Promise.all([
      // Overall statistics
      prisma.review.aggregate({
        where: baseWhere,
        _avg: { rating: true },
        _count: { id: true },
      }),

      // Rating distribution
      prisma.review.groupBy({
        by: ["rating"],
        where: baseWhere,
        _count: { rating: true },
        orderBy: { rating: "asc" },
      }),

      // Course performance
      prisma.review.groupBy({
        by: ["courseId"],
        where: baseWhere,
        _avg: { rating: true },
        _count: { id: true },
        orderBy: { _avg: { rating: "desc" } },
        take: 10,
      }),

      // Recent reviews
      prisma.review.findMany({
        where: {
          course: {
            instructorId: instructor.id,
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        include: {
          course: {
            select: { id: true, title: true },
          },
          student: {
            select: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Monthly trend for the year
      prisma.review.groupBy({
        by: ["createdAt"],
        where: {
          course: {
            instructorId: instructor.id,
          },
          createdAt: {
            gte: new Date(currentDate.getFullYear(), 0, 1),
            lte: new Date(currentDate.getFullYear(), 11, 31),
          },
          ...(courseId && { courseId }),
        },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    // Get course details for performance analysis
    const courseIds = coursePerformance.map((perf) => perf.courseId);
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        enrollmentCount: true,
      },
    });

    // Combine course performance with course details
    const topPerformingCourses = coursePerformance.map((perf) => {
      const course = courses.find((c) => c.id === perf.courseId);
      return {
        course,
        averageRating: perf._avg.rating
          ? parseFloat(perf._avg.rating.toFixed(2))
          : 0,
        reviewCount: perf._count.id,
        reviewRate:
          course?.enrollmentCount > 0
            ? ((perf._count.id / course.enrollmentCount) * 100).toFixed(2)
            : 0,
      };
    });

    // Process rating distribution
    const ratingDist = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratingDistribution.forEach((dist) => {
      ratingDist[dist.rating] = dist._count.rating;
    });

    // Calculate reply statistics
    const replyStats = await prisma.review.aggregate({
      where: {
        course: {
          instructorId: instructor.id,
        },
        instructorReply: { not: null },
        ...dateFilter,
      },
      _count: { id: true },
    });

    const totalReviews = overallStats._count.id;
    const repliedReviews = replyStats._count.id;

    // Process monthly trend
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(currentDate.getFullYear(), i).toLocaleString(
        "default",
        { month: "long" }
      ),
      reviewCount: 0,
      averageRating: 0,
    }));

    monthlyTrend.forEach((trend) => {
      const month = new Date(trend.createdAt).getMonth();
      monthlyData[month].reviewCount += trend._count.id;
      monthlyData[month].averageRating = trend._avg.rating
        ? parseFloat(trend._avg.rating.toFixed(2))
        : 0;
    });

    const analytics = {
      overview: {
        totalReviews,
        averageRating: overallStats._avg.rating
          ? parseFloat(overallStats._avg.rating.toFixed(2))
          : 0,
        replyRate:
          totalReviews > 0
            ? ((repliedReviews / totalReviews) * 100).toFixed(2)
            : 0,
        repliedReviews,
        unrepliedReviews: totalReviews - repliedReviews,
      },
      ratingDistribution: ratingDist,
      topPerformingCourses,
      recentReviews: recentReviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        hasReply: !!review.instructorReply,
        course: review.course,
        student: review.student,
        createdAt: review.createdAt,
      })),
      monthlyTrend: monthlyData,
      period: {
        type: period,
        year: year || currentDate.getFullYear(),
        month: month || null,
        courseId: courseId || null,
      },
    };

    educademyLogger.logBusinessOperation(
      "GET_REVIEW_ANALYTICS",
      "REVIEW",
      instructor.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        period,
        totalReviews,
        averageRating: analytics.overview.averageRating,
        topCoursesCount: topPerformingCourses.length,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_REVIEW_ANALYTICS", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
      period,
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "getReviewAnalytics",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Review analytics fetched successfully",
      data: analytics,
    });
  } catch (error) {
    educademyLogger.error("Get review analytics failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_REVIEW_ANALYTICS",
        entity: "REVIEW",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "getReviewAnalytics",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch review analytics",
      requestId,
    });
  }
});

export const flagReview = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { reviewId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "ReviewController",
    methodName: "flagReview",
  });

  educademyLogger.logMethodEntry("ReviewController", "flagReview", {
    userId: req.userAuthId,
    reviewId,
    reason: req.body.reason,
  });

  try {
    const { reason, description } = req.body;

    // Validation
    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Flag reason is required",
      });
    }

    const validReasons = [
      "INAPPROPRIATE_CONTENT",
      "SPAM",
      "FAKE_REVIEW",
      "HARASSMENT",
      "OFF_TOPIC",
      "OTHER",
    ];

    if (!validReasons.includes(reason.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid reason. Must be one of: ${validReasons.join(", ")}`,
      });
    }

    // Get review and check ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
        student: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor || instructor.id !== review.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only flag reviews for your own courses",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can flag reviews",
      });
    }

    // Check if already flagged by this instructor
    const existingFlag = await prisma.reviewFlag.findFirst({
      where: {
        reviewId,
        flaggedBy: req.userAuthId,
      },
    });

    if (existingFlag) {
      return res.status(400).json({
        success: false,
        message: "You have already flagged this review",
        data: {
          existingFlagId: existingFlag.id,
          flaggedAt: existingFlag.createdAt,
          reason: existingFlag.reason,
        },
      });
    }

    // Create flag
    const flag = await prisma.reviewFlag.create({
      data: {
        reviewId,
        reason: reason.toUpperCase(),
        description: description?.trim() || null,
        flaggedBy: req.userAuthId,
        status: "PENDING",
      },
    });
    educademyLogger.logBusinessOperation(
      "FLAG_REVIEW",
      "REVIEW_FLAG",
      flag.id,
      "SUCCESS",
      {
        flagId: flag.id,
        reviewId,
        reason: reason.toUpperCase(),
        courseId: review.course.id,
        courseTitle: review.course.title,
        studentId: review.student.user.id,
        instructorId: instructor.id,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("FLAG_REVIEW", startTime, {
      userId: req.userAuthId,
      reviewId,
      flagId: flag.id,
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "flagReview",
      true,
      performance.now() - startTime
    );

    res.status(201).json({
      success: true,
      message:
        "Review flagged successfully. It will be reviewed by our moderation team.",
      data: {
        flag: {
          id: flag.id,
          reviewId: flag.reviewId,
          reason: flag.reason,
          description: flag.description,
          status: flag.status,
          createdAt: flag.createdAt,
        },
        review: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          course: review.course,
          student: review.student,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Flag review failed", error, {
      userId: req.userAuthId,
      reviewId,
      business: {
        operation: "FLAG_REVIEW",
        entity: "REVIEW_FLAG",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "ReviewController",
      "flagReview",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to flag review",
      requestId,
    });
  }
});
