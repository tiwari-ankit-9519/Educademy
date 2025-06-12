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

export const getInstructorStudents = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "StudentController",
    methodName: "getInstructorStudents",
  });

  educademyLogger.logMethodEntry("StudentController", "getInstructorStudents", {
    userId: req.userAuthId,
  });

  try {
    const {
      page = 1,
      limit = 20,
      courseId,
      search,
      enrollmentStatus = "ACTIVE",
      sortBy = "enrolledAt",
      sortOrder = "desc",
      startDate,
      endDate,
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
        message: "Only verified instructors can view students",
      });
    }

    // Build where clause for enrollments in instructor's courses
    const whereClause = {
      course: {
        instructorId: instructor.id,
      },
    };

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (enrollmentStatus) {
      whereClause.status = enrollmentStatus.toUpperCase();
    }

    if (startDate && endDate) {
      whereClause.enrolledAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.enrolledAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.enrolledAt = {
        lte: new Date(endDate),
      };
    }

    if (search?.trim()) {
      whereClause.student = {
        user: {
          OR: [
            {
              firstName: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
          ],
        },
      };
    }

    // Build order by
    const validSortFields = [
      "enrolledAt",
      "progress",
      "lastActivityAt",
      "completedAt",
    ];
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

    // Get enrollments with student details
    const [enrollments, totalCount] = await Promise.all([
      prisma.enrollment.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                  createdAt: true,
                },
              },
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              totalLessons: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.enrollment.count({
        where: whereClause,
      }),
    ]);

    // Calculate summary statistics
    const summaryStats = await prisma.enrollment.groupBy({
      by: ["status"],
      where: {
        course: {
          instructorId: instructor.id,
        },
        ...(courseId && { courseId }),
      },
      _count: {
        status: true,
      },
    });

    const statusDistribution = {
      ACTIVE: 0,
      COMPLETED: 0,
      DROPPED: 0,
      SUSPENDED: 0,
    };

    summaryStats.forEach((stat) => {
      statusDistribution[stat.status] = stat._count.status;
    });

    // Calculate average progress
    const progressStats = await prisma.enrollment.aggregate({
      where: {
        course: {
          instructorId: instructor.id,
        },
        status: "ACTIVE",
        ...(courseId && { courseId }),
      },
      _avg: {
        progress: true,
      },
    });

    const summary = {
      totalStudents: totalCount,
      statusDistribution,
      averageProgress: progressStats._avg.progress
        ? parseFloat(progressStats._avg.progress.toFixed(2))
        : 0,
      activeStudents: statusDistribution.ACTIVE,
      completedStudents: statusDistribution.COMPLETED,
      completionRate:
        statusDistribution.ACTIVE > 0
          ? (
              (statusDistribution.COMPLETED /
                (statusDistribution.ACTIVE + statusDistribution.COMPLETED)) *
              100
            ).toFixed(2)
          : 0,
    };

    const totalPages = Math.ceil(totalCount / limitNum);

    educademyLogger.logBusinessOperation(
      "GET_INSTRUCTOR_STUDENTS",
      "ENROLLMENT",
      instructor.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        studentsReturned: enrollments.length,
        totalStudents: totalCount,
        averageProgress: summary.averageProgress,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_INSTRUCTOR_STUDENTS", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
      studentsCount: enrollments.length,
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "getInstructorStudents",
      true,
      performance.now() - startTime
    );

    const responseData = {
      students: enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        lastActivityAt: enrollment.lastActivityAt,
        completedAt: enrollment.completedAt,
        student: {
          id: enrollment.student.id,
          user: enrollment.student.user,
        },
        course: enrollment.course,
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
          search: search || null,
          enrollmentStatus: enrollmentStatus || null,
          startDate: startDate || null,
          endDate: endDate || null,
          sortBy,
          sortOrder,
        },
        available: {
          sortFields: validSortFields,
          statuses: ["ACTIVE", "COMPLETED", "DROPPED", "SUSPENDED"],
        },
      },
    };

    res.status(200).json({
      success: true,
      message: "Instructor students fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get instructor students failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_INSTRUCTOR_STUDENTS",
        entity: "ENROLLMENT",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "getInstructorStudents",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch instructor students",
      requestId,
    });
  }
});

export const getCourseStudents = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "StudentController",
    methodName: "getCourseStudents",
  });

  educademyLogger.logMethodEntry("StudentController", "getCourseStudents", {
    userId: req.userAuthId,
    courseId,
  });

  try {
    const {
      page = 1,
      limit = 20,
      search,
      enrollmentStatus = "ACTIVE",
      sortBy = "enrolledAt",
      sortOrder = "desc",
      minProgress,
      maxProgress,
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
        message: "You can only view students for your own courses",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can view students",
      });
    }

    // Build where clause
    const whereClause = {
      courseId,
    };

    if (enrollmentStatus) {
      whereClause.status = enrollmentStatus.toUpperCase();
    }

    if (minProgress !== undefined && maxProgress !== undefined) {
      whereClause.progress = {
        gte: parseFloat(minProgress),
        lte: parseFloat(maxProgress),
      };
    } else if (minProgress !== undefined) {
      whereClause.progress = {
        gte: parseFloat(minProgress),
      };
    } else if (maxProgress !== undefined) {
      whereClause.progress = {
        lte: parseFloat(maxProgress),
      };
    }

    if (search?.trim()) {
      whereClause.student = {
        user: {
          OR: [
            {
              firstName: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
          ],
        },
      };
    }

    // Build order by
    const validSortFields = [
      "enrolledAt",
      "progress",
      "lastActivityAt",
      "completedAt",
    ];
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

    // Get enrollments
    const [enrollments, totalCount] = await Promise.all([
      prisma.enrollment.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.enrollment.count({
        where: whereClause,
      }),
    ]);

    // Calculate course-specific statistics
    const courseStats = await prisma.enrollment.groupBy({
      by: ["status"],
      where: { courseId },
      _count: {
        status: true,
      },
    });

    const statusDistribution = {
      ACTIVE: 0,
      COMPLETED: 0,
      DROPPED: 0,
      SUSPENDED: 0,
    };

    courseStats.forEach((stat) => {
      statusDistribution[stat.status] = stat._count.status;
    });

    // Calculate progress distribution
    const progressDistribution = await prisma.enrollment.groupBy({
      by: ["progress"],
      where: {
        courseId,
        status: "ACTIVE",
      },
      _count: {
        progress: true,
      },
    });

    const progressRanges = {
      "0-25": 0,
      "26-50": 0,
      "51-75": 0,
      "76-99": 0,
      100: 0,
    };

    progressDistribution.forEach((dist) => {
      const progress = dist.progress;
      if (progress === 100) {
        progressRanges["100"] += dist._count.progress;
      } else if (progress >= 76) {
        progressRanges["76-99"] += dist._count.progress;
      } else if (progress >= 51) {
        progressRanges["51-75"] += dist._count.progress;
      } else if (progress >= 26) {
        progressRanges["26-50"] += dist._count.progress;
      } else {
        progressRanges["0-25"] += dist._count.progress;
      }
    });

    const avgProgress = await prisma.enrollment.aggregate({
      where: {
        courseId,
        status: "ACTIVE",
      },
      _avg: {
        progress: true,
      },
    });

    const summary = {
      courseId,
      courseTitle: course.title,
      totalEnrollments: totalCount,
      statusDistribution,
      progressRanges,
      averageProgress: avgProgress._avg.progress
        ? parseFloat(avgProgress._avg.progress.toFixed(2))
        : 0,
      completionRate:
        statusDistribution.ACTIVE > 0
          ? (
              (statusDistribution.COMPLETED /
                (statusDistribution.ACTIVE + statusDistribution.COMPLETED)) *
              100
            ).toFixed(2)
          : 0,
    };

    const totalPages = Math.ceil(totalCount / limitNum);

    educademyLogger.logBusinessOperation(
      "GET_COURSE_STUDENTS",
      "ENROLLMENT",
      courseId,
      "SUCCESS",
      {
        courseId,
        courseTitle: course.title,
        instructorId: instructor.id,
        studentsReturned: enrollments.length,
        totalStudents: totalCount,
        averageProgress: summary.averageProgress,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_COURSE_STUDENTS", startTime, {
      userId: req.userAuthId,
      courseId,
      studentsCount: enrollments.length,
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "getCourseStudents",
      true,
      performance.now() - startTime
    );

    const responseData = {
      students: enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        lastActivityAt: enrollment.lastActivityAt,
        completedAt: enrollment.completedAt,
        student: {
          id: enrollment.student.id,
          user: enrollment.student.user,
        },
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
        totalLessons: course.totalLessons,
        enrollmentCount: course.enrollmentCount,
      },
      filters: {
        applied: {
          search: search || null,
          enrollmentStatus: enrollmentStatus || null,
          minProgress: minProgress || null,
          maxProgress: maxProgress || null,
          sortBy,
          sortOrder,
        },
        available: {
          sortFields: validSortFields,
          statuses: ["ACTIVE", "COMPLETED", "DROPPED", "SUSPENDED"],
        },
      },
    };

    res.status(200).json({
      success: true,
      message: "Course students fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get course students failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "GET_COURSE_STUDENTS",
        entity: "ENROLLMENT",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "getCourseStudents",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch course students",
      requestId,
    });
  }
});

export const getStudentDetails = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { studentId, courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "StudentController",
    methodName: "getStudentDetails",
  });

  educademyLogger.logMethodEntry("StudentController", "getStudentDetails", {
    userId: req.userAuthId,
    studentId,
    courseId,
  });

  try {
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
        message: "You can only view student details for your own courses",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can view student details",
      });
    }

    // Get student enrollment details
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                createdAt: true,
                lastLoginAt: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            totalLessons: true,
          },
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Student enrollment not found",
      });
    }

    // Get lesson progress
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        studentId,
        lesson: {
          courseId,
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
          },
        },
      },
      orderBy: {
        lesson: {
          order: "asc",
        },
      },
    });

    // Get assignment submissions
    const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId,
        assignment: {
          courseId,
        },
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            totalPoints: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    // Get quiz attempts
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        studentId,
        quiz: {
          courseId,
        },
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            totalPoints: true,
          },
        },
      },
      orderBy: {
        attemptedAt: "desc",
      },
    });

    // Get student's review for this course
    const studentReview = await prisma.review.findFirst({
      where: {
        courseId,
        studentId,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        instructorReply: true,
        createdAt: true,
      },
    });

    // Calculate detailed progress metrics
    const completedLessons = lessonProgress.filter(
      (lp) => lp.isCompleted
    ).length;
    const totalLessons = course.totalLessons;
    const lessonsProgress =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    const submittedAssignments = assignmentSubmissions.length;
    const totalAssignments = await prisma.assignment.count({
      where: { courseId },
    });

    const completedQuizzes = quizAttempts.filter(
      (qa) => qa.score !== null
    ).length;
    const totalQuizzes = await prisma.quiz.count({
      where: { courseId },
    });

    // Calculate average scores
    const avgAssignmentScore =
      assignmentSubmissions.length > 0
        ? assignmentSubmissions.reduce(
            (sum, sub) => sum + (sub.score || 0),
            0
          ) / assignmentSubmissions.length
        : 0;

    const avgQuizScore =
      quizAttempts.length > 0
        ? quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) /
          quizAttempts.length
        : 0;

    // Get recent activity
    const recentActivity = await prisma.lessonProgress.findMany({
      where: {
        studentId,
        lesson: {
          courseId,
        },
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    const studentDetails = {
      enrollment: {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        lastActivityAt: enrollment.lastActivityAt,
        completedAt: enrollment.completedAt,
      },
      student: enrollment.student,
      course: enrollment.course,
      progressBreakdown: {
        lessons: {
          completed: completedLessons,
          total: totalLessons,
          percentage: parseFloat(lessonsProgress.toFixed(2)),
        },
        assignments: {
          submitted: submittedAssignments,
          total: totalAssignments,
          averageScore: parseFloat(avgAssignmentScore.toFixed(2)),
        },
        quizzes: {
          completed: completedQuizzes,
          total: totalQuizzes,
          averageScore: parseFloat(avgQuizScore.toFixed(2)),
        },
      },
      lessonProgress: lessonProgress.map((lp) => ({
        lessonId: lp.lesson.id,
        lessonTitle: lp.lesson.title,
        lessonOrder: lp.lesson.order,
        isCompleted: lp.isCompleted,
        timeSpent: lp.timeSpent,
        startedAt: lp.startedAt,
        completedAt: lp.completedAt,
        lastAccessedAt: lp.lastAccessedAt,
      })),
      assignmentSubmissions: assignmentSubmissions.map((sub) => ({
        submissionId: sub.id,
        assignment: sub.assignment,
        submittedAt: sub.submittedAt,
        score: sub.score,
        feedback: sub.feedback,
        status: sub.status,
      })),
      quizAttempts: quizAttempts.map((attempt) => ({
        attemptId: attempt.id,
        quiz: attempt.quiz,
        attemptedAt: attempt.attemptedAt,
        completedAt: attempt.completedAt,
        score: attempt.score,
        timeSpent: attempt.timeSpent,
      })),
      review: studentReview,
      recentActivity: recentActivity.map((activity) => ({
        lessonId: activity.lesson.id,
        lessonTitle: activity.lesson.title,
        activityType: activity.isCompleted ? "COMPLETED" : "VIEWED",
        timestamp: activity.updatedAt,
      })),
    };

    educademyLogger.logBusinessOperation(
      "GET_STUDENT_DETAILS",
      "ENROLLMENT",
      enrollment.id,
      "SUCCESS",
      {
        studentId,
        courseId,
        courseTitle: course.title,
        instructorId: instructor.id,
        studentProgress: enrollment.progress,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_STUDENT_DETAILS", startTime, {
      userId: req.userAuthId,
      studentId,
      courseId,
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "getStudentDetails",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Student details fetched successfully",
      data: studentDetails,
    });
  } catch (error) {
    educademyLogger.error("Get student details failed", error, {
      userId: req.userAuthId,
      studentId,
      courseId,
      business: {
        operation: "GET_STUDENT_DETAILS",
        entity: "ENROLLMENT",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "getStudentDetails",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch student details",
      requestId,
    });
  }
});

export const getStudentProgress = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { studentId, courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "StudentController",
    methodName: "getStudentProgress",
  });

  educademyLogger.logMethodEntry("StudentController", "getStudentProgress", {
    userId: req.userAuthId,
    studentId,
    courseId,
  });

  try {
    const { timeframe = "all" } = req.query;

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
        message: "You can only view student progress for your own courses",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can view student progress",
      });
    }

    // Build date filter based on timeframe
    let dateFilter = {};
    const now = new Date();

    switch (timeframe) {
      case "week":
        dateFilter = {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        };
        break;
      case "month":
        dateFilter = {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        };
        break;
      case "quarter":
        dateFilter = {
          gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        };
        break;
      default:
        // All time - no filter
        break;
    }

    // Get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      include: {
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

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Student enrollment not found",
      });
    }

    // Get detailed lesson progress with time tracking
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        studentId,
        lesson: {
          courseId,
        },
        ...(Object.keys(dateFilter).length > 0 && {
          updatedAt: dateFilter,
        }),
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
            type: true,
          },
        },
      },
      orderBy: {
        lesson: {
          order: "asc",
        },
      },
    });

    // Get progress timeline
    const progressTimeline = await prisma.lessonProgress.findMany({
      where: {
        studentId,
        lesson: {
          courseId,
        },
        isCompleted: true,
        ...(Object.keys(dateFilter).length > 0 && {
          completedAt: dateFilter,
        }),
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
      orderBy: {
        completedAt: "asc",
      },
    });

    // Get assignment progress
    const assignmentProgress = await prisma.assignmentSubmission.findMany({
      where: {
        studentId,
        assignment: {
          courseId,
        },
        ...(Object.keys(dateFilter).length > 0 && {
          submittedAt: dateFilter,
        }),
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            totalPoints: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    // Get quiz progress
    const quizProgress = await prisma.quizAttempt.findMany({
      where: {
        studentId,
        quiz: {
          courseId,
        },
        ...(Object.keys(dateFilter).length > 0 && {
          attemptedAt: dateFilter,
        }),
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            totalPoints: true,
          },
        },
      },
      orderBy: {
        attemptedAt: "desc",
      },
    });

    // Calculate time spent analytics
    const totalTimeSpent = lessonProgress.reduce(
      (sum, lp) => sum + (lp.timeSpent || 0),
      0
    );
    const averageSessionTime =
      lessonProgress.length > 0 ? totalTimeSpent / lessonProgress.length : 0;

    // Calculate completion rates
    const completedLessons = lessonProgress.filter(
      (lp) => lp.isCompleted
    ).length;
    const totalLessons = await prisma.lesson.count({ where: { courseId } });
    const lessonCompletionRate =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Calculate score analytics
    const assignmentScores = assignmentProgress
      .filter((ap) => ap.score !== null)
      .map((ap) => ap.score);
    const quizScores = quizProgress
      .filter((qp) => qp.score !== null)
      .map((qp) => qp.score);

    const avgAssignmentScore =
      assignmentScores.length > 0
        ? assignmentScores.reduce((sum, score) => sum + score, 0) /
          assignmentScores.length
        : 0;

    const avgQuizScore =
      quizScores.length > 0
        ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length
        : 0;

    // Generate daily progress for charts (last 30 days)
    const dailyProgress = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayProgress = progressTimeline.filter(
        (pt) => pt.completedAt >= date && pt.completedAt < nextDate
      );

      const dayTimeSpent = lessonProgress
        .filter(
          (lp) => lp.lastAccessedAt >= date && lp.lastAccessedAt < nextDate
        )
        .reduce((sum, lp) => sum + (lp.timeSpent || 0), 0);

      dailyProgress.push({
        date: date.toISOString().split("T")[0],
        lessonsCompleted: dayProgress.length,
        timeSpent: dayTimeSpent,
        cumulativeProgress: progressTimeline.filter(
          (pt) => pt.completedAt <= nextDate
        ).length,
      });
    }

    const progressData = {
      student: enrollment.student,
      enrollment: {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        progress: enrollment.progress,
        lastActivityAt: enrollment.lastActivityAt,
      },
      course: {
        id: course.id,
        title: course.title,
        totalLessons,
      },
      analytics: {
        completionRate: parseFloat(lessonCompletionRate.toFixed(2)),
        timeSpent: {
          total: totalTimeSpent,
          average: parseFloat(averageSessionTime.toFixed(2)),
          formatted: `${Math.floor(totalTimeSpent / 60)}h ${
            totalTimeSpent % 60
          }m`,
        },
        scores: {
          assignments: {
            average: parseFloat(avgAssignmentScore.toFixed(2)),
            count: assignmentScores.length,
          },
          quizzes: {
            average: parseFloat(avgQuizScore.toFixed(2)),
            count: quizScores.length,
          },
        },
      },
      lessonProgress: lessonProgress.map((lp) => ({
        lesson: lp.lesson,
        isCompleted: lp.isCompleted,
        timeSpent: lp.timeSpent,
        progress: lp.progress,
        startedAt: lp.startedAt,
        completedAt: lp.completedAt,
        lastAccessedAt: lp.lastAccessedAt,
      })),
      assignmentProgress: assignmentProgress.map((ap) => ({
        assignment: ap.assignment,
        submittedAt: ap.submittedAt,
        score: ap.score,
        status: ap.status,
        isLate: ap.assignment.dueDate && ap.submittedAt > ap.assignment.dueDate,
      })),
      quizProgress: quizProgress.map((qp) => ({
        quiz: qp.quiz,
        attemptedAt: qp.attemptedAt,
        completedAt: qp.completedAt,
        score: qp.score,
        timeSpent: qp.timeSpent,
      })),
      timeline: progressTimeline.map((pt) => ({
        lesson: pt.lesson,
        completedAt: pt.completedAt,
        timeSpent: pt.timeSpent,
      })),
      dailyProgress,
      timeframe,
    };

    educademyLogger.logBusinessOperation(
      "GET_STUDENT_PROGRESS",
      "ENROLLMENT",
      enrollment.id,
      "SUCCESS",
      {
        studentId,
        courseId,
        courseTitle: course.title,
        instructorId: instructor.id,
        completionRate: progressData.analytics.completionRate,
        timeframe,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_STUDENT_PROGRESS", startTime, {
      userId: req.userAuthId,
      studentId,
      courseId,
      timeframe,
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "getStudentProgress",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Student progress fetched successfully",
      data: progressData,
    });
  } catch (error) {
    educademyLogger.error("Get student progress failed", error, {
      userId: req.userAuthId,
      studentId,
      courseId,
      business: {
        operation: "GET_STUDENT_PROGRESS",
        entity: "ENROLLMENT",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "getStudentProgress",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch student progress",
      requestId,
    });
  }
});

export const sendMessageToStudent = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { studentId, courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "StudentController",
    methodName: "sendMessageToStudent",
  });

  educademyLogger.logMethodEntry("StudentController", "sendMessageToStudent", {
    userId: req.userAuthId,
    studentId,
    courseId,
    subject: req.body.subject,
  });

  try {
    const { subject, message, priority = "NORMAL" } = req.body;

    // Validation
    if (!subject?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message subject is required",
      });
    }

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    if (subject.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: "Subject must be 200 characters or less",
      });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message must be 2000 characters or less",
      });
    }

    const validPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
    if (!validPriorities.includes(priority.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: ${validPriorities.join(
          ", "
        )}`,
      });
    }

    // Check course ownership and student enrollment
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
        message: "You can only send messages to students in your own courses",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can send messages to students",
      });
    }

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      include: {
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
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Student is not enrolled in this course",
      });
    }

    // Create notification for student
    const notification = await prisma.notification.create({
      data: {
        type: "INSTRUCTOR_MESSAGE",
        title: `Message from Instructor: ${subject.trim()}`,
        message: message.trim(),
        userId: enrollment.student.user.id,
        priority: priority.toUpperCase(),
        data: {
          courseId,
          courseTitle: course.title,
          instructorId: instructor.id,
          subject: subject.trim(),
          messageType: "DIRECT_MESSAGE",
        },
      },
    });

    // You might also want to create a separate message record if you have a messaging system
    // For now, we'll just use notifications

    educademyLogger.logBusinessOperation(
      "SEND_MESSAGE_TO_STUDENT",
      "NOTIFICATION",
      notification.id,
      "SUCCESS",
      {
        notificationId: notification.id,
        studentId,
        courseId,
        courseTitle: course.title,
        instructorId: instructor.id,
        subject: subject.trim(),
        priority: priority.toUpperCase(),
        messageLength: message.trim().length,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("SEND_MESSAGE_TO_STUDENT", startTime, {
      userId: req.userAuthId,
      studentId,
      courseId,
      notificationId: notification.id,
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "sendMessageToStudent",
      true,
      performance.now() - startTime
    );

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        notification: {
          id: notification.id,
          subject: subject.trim(),
          message: message.trim(),
          priority: priority.toUpperCase(),
          sentAt: notification.createdAt,
        },
        recipient: {
          studentId: enrollment.student.id,
          studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
          studentEmail: enrollment.student.user.email,
        },
        course: {
          id: course.id,
          title: course.title,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Send message to student failed", error, {
      userId: req.userAuthId,
      studentId,
      courseId,
      business: {
        operation: "SEND_MESSAGE_TO_STUDENT",
        entity: "NOTIFICATION",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "sendMessageToStudent",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to send message to student",
      requestId,
    });
  }
});

export const getStudentAnalytics = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "StudentController",
    methodName: "getStudentAnalytics",
  });

  educademyLogger.logMethodEntry("StudentController", "getStudentAnalytics", {
    userId: req.userAuthId,
  });

  try {
    const { period = "month", courseId } = req.query;

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
        message: "Only verified instructors can view student analytics",
      });
    }

    // Build date filter
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case "week":
        dateFilter = {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        };
        break;
      case "month":
        dateFilter = {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        };
        break;
      case "quarter":
        dateFilter = {
          gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        };
        break;
      case "year":
        dateFilter = {
          gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        };
        break;
      default:
        // All time
        break;
    }

    // Base where clause for instructor's courses
    const baseWhere = {
      course: {
        instructorId: instructor.id,
      },
      ...(courseId && { courseId }),
    };

    // Get enrollment analytics
    const [
      enrollmentStats,
      progressDistribution,
      activityStats,
      completionStats,
      performanceStats,
    ] = await Promise.all([
      // Enrollment statistics
      prisma.enrollment.groupBy({
        by: ["status"],
        where: {
          ...baseWhere,
          ...(Object.keys(dateFilter).length > 0 && {
            enrolledAt: dateFilter,
          }),
        },
        _count: { status: true },
      }),

      // Progress distribution
      prisma.enrollment.groupBy({
        by: ["progress"],
        where: {
          ...baseWhere,
          status: "ACTIVE",
        },
        _count: { progress: true },
      }),

      // Activity statistics
      prisma.lessonProgress.groupBy({
        by: ["isCompleted"],
        where: {
          lesson: {
            course: {
              instructorId: instructor.id,
            },
          },
          ...(courseId && {
            lesson: {
              courseId,
            },
          }),
          ...(Object.keys(dateFilter).length > 0 && {
            updatedAt: dateFilter,
          }),
        },
        _count: { isCompleted: true },
        _sum: { timeSpent: true },
      }),

      // Completion statistics
      prisma.enrollment.aggregate({
        where: {
          ...baseWhere,
          status: "COMPLETED",
          ...(Object.keys(dateFilter).length > 0 && {
            completedAt: dateFilter,
          }),
        },
        _count: { id: true },
        _avg: { progress: true },
      }),

      // Performance statistics
      Promise.all([
        prisma.assignmentSubmission.aggregate({
          where: {
            assignment: {
              course: {
                instructorId: instructor.id,
              },
            },
            ...(courseId && {
              assignment: {
                courseId,
              },
            }),
            ...(Object.keys(dateFilter).length > 0 && {
              submittedAt: dateFilter,
            }),
          },
          _avg: { score: true },
          _count: { id: true },
        }),
        prisma.quizAttempt.aggregate({
          where: {
            quiz: {
              course: {
                instructorId: instructor.id,
              },
            },
            ...(courseId && {
              quiz: {
                courseId,
              },
            }),
            ...(Object.keys(dateFilter).length > 0 && {
              attemptedAt: dateFilter,
            }),
          },
          _avg: { score: true },
          _count: { id: true },
        }),
      ]),
    ]);

    // Process enrollment stats
    const enrollmentDistribution = {
      ACTIVE: 0,
      COMPLETED: 0,
      DROPPED: 0,
      SUSPENDED: 0,
    };

    enrollmentStats.forEach((stat) => {
      enrollmentDistribution[stat.status] = stat._count.status;
    });

    // Process progress distribution
    const progressRanges = {
      "0-25": 0,
      "26-50": 0,
      "51-75": 0,
      "76-99": 0,
      100: 0,
    };

    progressDistribution.forEach((dist) => {
      const progress = dist.progress;
      if (progress === 100) {
        progressRanges["100"] += dist._count.progress;
      } else if (progress >= 76) {
        progressRanges["76-99"] += dist._count.progress;
      } else if (progress >= 51) {
        progressRanges["51-75"] += dist._count.progress;
      } else if (progress >= 26) {
        progressRanges["26-50"] += dist._count.progress;
      } else {
        progressRanges["0-25"] += dist._count.progress;
      }
    });

    // Process activity stats
    const totalLessonViews = activityStats.reduce(
      (sum, stat) => sum + stat._count.isCompleted,
      0
    );
    const completedLessons =
      activityStats.find((stat) => stat.isCompleted)?._count.isCompleted || 0;
    const totalTimeSpent = activityStats.reduce(
      (sum, stat) => sum + (stat._sum.timeSpent || 0),
      0
    );

    // Get top performing students
    const topStudents = await prisma.enrollment.findMany({
      where: {
        ...baseWhere,
        status: "ACTIVE",
      },
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
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        progress: "desc",
      },
      take: 10,
    });

    // Get course performance breakdown
    const coursePerformance = await prisma.enrollment.groupBy({
      by: ["courseId"],
      where: {
        course: {
          instructorId: instructor.id,
        },
        ...(Object.keys(dateFilter).length > 0 && {
          enrolledAt: dateFilter,
        }),
      },
      _avg: { progress: true },
      _count: { id: true },
      orderBy: {
        _avg: {
          progress: "desc",
        },
      },
    });

    // Get course details for performance data
    const courseIds = coursePerformance.map((cp) => cp.courseId);
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        enrollmentCount: true,
      },
    });

    const coursePerformanceWithDetails = coursePerformance.map((cp) => {
      const course = courses.find((c) => c.id === cp.courseId);
      return {
        course,
        averageProgress: cp._avg.progress
          ? parseFloat(cp._avg.progress.toFixed(2))
          : 0,
        enrollmentCount: cp._count.id,
      };
    });

    // Generate engagement timeline (last 30 days)
    const engagementTimeline = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayActivity = await prisma.lessonProgress.count({
        where: {
          lesson: {
            course: {
              instructorId: instructor.id,
            },
          },
          ...(courseId && {
            lesson: {
              courseId,
            },
          }),
          updatedAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      const dayEnrollments = await prisma.enrollment.count({
        where: {
          ...baseWhere,
          enrolledAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      engagementTimeline.push({
        date: date.toISOString().split("T")[0],
        activity: dayActivity,
        enrollments: dayEnrollments,
      });
    }

    const analytics = {
      overview: {
        totalStudents:
          enrollmentDistribution.ACTIVE +
          enrollmentDistribution.COMPLETED +
          enrollmentDistribution.DROPPED +
          enrollmentDistribution.SUSPENDED,
        activeStudents: enrollmentDistribution.ACTIVE,
        completedStudents: enrollmentDistribution.COMPLETED,
        completionRate:
          enrollmentDistribution.ACTIVE > 0
            ? (
                (enrollmentDistribution.COMPLETED /
                  (enrollmentDistribution.ACTIVE +
                    enrollmentDistribution.COMPLETED)) *
                100
              ).toFixed(2)
            : 0,
        averageProgress: completionStats._avg.progress
          ? parseFloat(completionStats._avg.progress.toFixed(2))
          : 0,
      },
      enrollment: {
        distribution: enrollmentDistribution,
        progressRanges,
      },
      engagement: {
        totalLessonViews,
        completedLessons,
        totalTimeSpent,
        averageTimePerStudent:
          enrollmentDistribution.ACTIVE > 0
            ? totalTimeSpent / enrollmentDistribution.ACTIVE
            : 0,
        engagementRate:
          totalLessonViews > 0
            ? ((completedLessons / totalLessonViews) * 100).toFixed(2)
            : 0,
      },
      performance: {
        assignments: {
          averageScore: performanceStats[0]._avg.score
            ? parseFloat(performanceStats[0]._avg.score.toFixed(2))
            : 0,
          totalSubmissions: performanceStats[0]._count.id,
        },
        quizzes: {
          averageScore: performanceStats[1]._avg.score
            ? parseFloat(performanceStats[1]._avg.score.toFixed(2))
            : 0,
          totalAttempts: performanceStats[1]._count.id,
        },
      },
      topPerformingStudents: topStudents.map((student) => ({
        student: student.student,
        course: student.course,
        progress: student.progress,
        enrolledAt: student.enrolledAt,
        lastActivityAt: student.lastActivityAt,
      })),
      coursePerformance: coursePerformanceWithDetails,
      engagementTimeline,
      period: {
        type: period,
        dateRange:
          Object.keys(dateFilter).length > 0
            ? {
                from: dateFilter.gte,
                to: now,
              }
            : null,
        courseId: courseId || null,
      },
    };

    educademyLogger.logBusinessOperation(
      "GET_STUDENT_ANALYTICS",
      "ENROLLMENT",
      instructor.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        period,
        totalStudents: analytics.overview.totalStudents,
        activeStudents: analytics.overview.activeStudents,
        completionRate: analytics.overview.completionRate,
        courseId: courseId || null,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_STUDENT_ANALYTICS", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
      period,
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "getStudentAnalytics",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Student analytics fetched successfully",
      data: analytics,
    });
  } catch (error) {
    educademyLogger.error("Get student analytics failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_STUDENT_ANALYTICS",
        entity: "ENROLLMENT",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "getStudentAnalytics",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch student analytics",
      requestId,
    });
  }
});

export const exportStudentData = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "StudentController",
    methodName: "exportStudentData",
  });

  educademyLogger.logMethodEntry("StudentController", "exportStudentData", {
    userId: req.userAuthId,
    format: req.query.format,
    courseId: req.query.courseId,
  });

  try {
    const {
      format = "csv",
      courseId,
      includeProgress = "true",
      includeScores = "true",
    } = req.query;

    if (!["csv", "json"].includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid format. Must be 'csv' or 'json'",
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
        message: "Only verified instructors can export student data",
      });
    }

    // Build where clause
    const whereClause = {
      course: {
        instructorId: instructor.id,
      },
    };

    if (courseId) {
      whereClause.courseId = courseId;
    }

    // Get student data
    const enrollments = await prisma.enrollment.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                createdAt: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            totalLessons: true,
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    // Prepare export data
    const exportData = [];

    for (const enrollment of enrollments) {
      const baseData = {
        studentId: enrollment.student.id,
        studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        studentEmail: enrollment.student.user.email,
        courseId: enrollment.course.id,
        courseTitle: enrollment.course.title,
        enrollmentStatus: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        totalLessons: enrollment.course.totalLessons,
        lastActivityAt: enrollment.lastActivityAt,
        completedAt: enrollment.completedAt,
      };

      // Add progress details if requested
      if (includeProgress === "true") {
        const lessonProgress = await prisma.lessonProgress.aggregate({
          where: {
            studentId: enrollment.student.id,
            lesson: {
              courseId: enrollment.course.id,
            },
          },
          _sum: { timeSpent: true },
          _count: { id: true },
        });

        baseData.totalTimeSpent = lessonProgress._sum.timeSpent || 0;
        baseData.totalLessonsAccessed = lessonProgress._count.id;
      }

      // Add scores if requested
      if (includeScores === "true") {
        const [assignmentStats, quizStats] = await Promise.all([
          prisma.assignmentSubmission.aggregate({
            where: {
              studentId: enrollment.student.id,
              assignment: {
                courseId: enrollment.course.id,
              },
            },
            _avg: { score: true },
            _count: { id: true },
          }),
          prisma.quizAttempt.aggregate({
            where: {
              studentId: enrollment.student.id,
              quiz: {
                courseId: enrollment.course.id,
              },
            },
            _avg: { score: true },
            _count: { id: true },
          }),
        ]);

        baseData.averageAssignmentScore = assignmentStats._avg.score
          ? parseFloat(assignmentStats._avg.score.toFixed(2))
          : null;
        baseData.assignmentSubmissions = assignmentStats._count.id;
        baseData.averageQuizScore = quizStats._avg.score
          ? parseFloat(quizStats._avg.score.toFixed(2))
          : null;
        baseData.quizAttempts = quizStats._count.id;
      }

      exportData.push(baseData);
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const coursePrefix = courseId ? `course-${courseId}` : "all-courses";
    const filename = `students-${coursePrefix}-${timestamp}.${format}`;

    educademyLogger.logBusinessOperation(
      "EXPORT_STUDENT_DATA",
      "ENROLLMENT",
      instructor.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        format,
        courseId: courseId || null,
        studentsExported: exportData.length,
        includeProgress: includeProgress === "true",
        includeScores: includeScores === "true",
        filename,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("EXPORT_STUDENT_DATA", startTime, {
      userId: req.userAuthId,
      instructorId: instructor.id,
      format,
      studentsCount: exportData.length,
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "exportStudentData",
      true,
      performance.now() - startTime
    );

    if (format.toLowerCase() === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.status(200).json({
        success: true,
        message: "Student data exported successfully",
        data: {
          exportInfo: {
            generatedAt: new Date(),
            totalStudents: exportData.length,
            instructor: {
              id: instructor.id,
              userId: req.userAuthId,
            },
            filters: {
              courseId: courseId || null,
              includeProgress: includeProgress === "true",
              includeScores: includeScores === "true",
            },
          },
          students: exportData,
        },
      });
    } else {
      // Generate CSV
      if (exportData.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No student data to export",
          data: {
            students: [],
            totalCount: 0,
          },
        });
      }

      const headers = Object.keys(exportData[0]);
      const csvRows = [
        headers.join(","),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              if (value === null || value === undefined) return "";
              if (typeof value === "string" && value.includes(",")) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.status(200).send(csvContent);
    }
  } catch (error) {
    educademyLogger.error("Export student data failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "EXPORT_STUDENT_DATA",
        entity: "ENROLLMENT",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "StudentController",
      "exportStudentData",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to export student data",
      requestId,
    });
  }
});
