import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import redisService from "../../utils/redis.js";
import emailService from "../../utils/emailService.js";
import socketManager from "../../utils/socket-io.js";

const prisma = new PrismaClient();

export const getPendingGrading = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const {
    courseId,
    type = "all",
    sortBy = "submittedAt",
    sortOrder = "asc",
    limit = 100,
  } = req.query;

  try {
    const cacheKey = `instructor:${instructorId}:pending-grading:${
      courseId || "all"
    }:${type}:${sortBy}:${sortOrder}:${limit}`;
    let cachedResult = await redisService.getJSON(cacheKey);

    if (cachedResult) {
      return res.status(200).json({
        success: true,
        message: "Pending grading items retrieved successfully",
        data: cachedResult,
        meta: {
          cached: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const courseWhere = {
      instructorId,
      status: "PUBLISHED",
    };

    if (
      courseId &&
      courseId !== "all" &&
      courseId !== "pending-grading" &&
      courseId.length > 10
    ) {
      courseWhere.id = courseId;
    }

    let pendingAssignments = [];

    if (type === "all" || type === "assignment" || type === "assignments") {
      pendingAssignments = await prisma.assignmentSubmission.findMany({
        where: {
          status: "SUBMITTED",
          assignment: {
            section: {
              course: courseWhere,
            },
          },
        },
        include: {
          assignment: {
            include: {
              section: {
                include: {
                  course: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy === "submittedAt" ? "submittedAt" : "createdAt"]: sortOrder,
        },
        take: parseInt(limit),
      });
    }

    const formatSubmissionData = (submission) => ({
      id: submission.id,
      type: "assignment",
      title: submission.assignment.title,
      studentName: `${submission.student.user.firstName} ${submission.student.user.lastName}`,
      studentImage: submission.student.user.profileImage,
      courseName: submission.assignment.section.course.title,
      sectionName: submission.assignment.section.title,
      submittedAt: submission.submittedAt,
      createdAt: submission.createdAt,
      isLate: submission.isLate,
      dueDate: submission.assignment.dueDate,
      maxPoints: submission.assignment.totalPoints,
      attempts: submission.attempts,
      priority: submission.isLate ? "high" : "normal",
      status: "pending",
      content: submission.content,
      attachments: submission.attachments,
      timeSpent: submission.timeSpent,
      description: submission.assignment.description,
      instructions: submission.assignment.instructions,
      rubric: submission.assignment.rubric,
    });

    const result = {
      assignments: pendingAssignments.map(formatSubmissionData),
      quizzes: [],
      summary: {
        totalPendingAssignments: pendingAssignments.length,
        totalPendingQuizzes: 0,
        urgentItems: pendingAssignments.filter((sub) => sub.isLate).length,
        totalPending: pendingAssignments.length,
      },
    };

    await redisService.setJSON(cacheKey, result, { ex: 300 });

    res.status(200).json({
      success: true,
      message: "Pending grading items retrieved successfully",
      data: result,
      meta: {
        cached: false,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get pending grading error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve pending grading items",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const gradeAssignment = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const { submissionId } = req.params;
  const { grade, feedback, rubricScores } = req.body;

  try {
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        assignment: {
          section: {
            course: {
              instructorId,
            },
          },
        },
      },
      include: {
        assignment: {
          select: {
            totalPoints: true,
            title: true,
          },
        },
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
      },
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Assignment submission not found",
      });
    }

    if (submission.status !== "SUBMITTED") {
      return res.status(400).json({
        success: false,
        message: "Assignment submission is not in submitted status",
      });
    }

    if (grade < 0 || grade > submission.assignment.totalPoints) {
      return res.status(400).json({
        success: false,
        message: `Grade must be between 0 and ${submission.assignment.totalPoints}`,
      });
    }

    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade: parseInt(grade),
        feedback,
        status: "GRADED",
        gradedAt: new Date(),
        gradedBy: instructorId,
        ...(rubricScores && { rubricScores: rubricScores }),
      },
      include: {
        assignment: {
          include: {
            section: {
              include: {
                course: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
        student: {
          include: {
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

    await prisma.notification.create({
      data: {
        type: "ASSIGNMENT_GRADED",
        title: "Assignment Graded",
        message: `Your assignment "${submission.assignment.title}" has been graded. Score: ${grade}/${submission.assignment.totalPoints}`,
        userId: submission.student.user.id,
        data: {
          submissionId,
          grade,
          maxPoints: submission.assignment.totalPoints,
          courseName: updatedSubmission.assignment.section.course.title,
        },
      },
    });

    const cacheKeyPattern = `instructor:${instructorId}:pending*`;
    await redisService.delPattern(cacheKeyPattern);

    res.status(200).json({
      success: true,
      message: "Assignment graded successfully",
      data: {
        submissionId: updatedSubmission.id,
        grade: updatedSubmission.grade,
        feedback: updatedSubmission.feedback,
        gradedAt: updatedSubmission.gradedAt,
        status: updatedSubmission.status,
      },
    });
  } catch (error) {
    console.error("Grade assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to grade assignment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const getStudentDetail = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const { studentId, courseId } = req.params;

  try {
    const cacheKey = `instructor:${instructorId}:student:${studentId}:course:${courseId}:detail`;
    let cachedResult = await redisService.getJSON(cacheKey);

    if (cachedResult) {
      return res.status(200).json({
        success: true,
        message: "Student details retrieved successfully",
        data: cachedResult,
        meta: {
          cached: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
        course: {
          instructorId,
          status: "PUBLISHED",
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImage: true,
                country: true,
                timezone: true,
                createdAt: true,
                lastLogin: true,
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
            totalQuizzes: true,
            totalAssignments: true,
            duration: true,
          },
        },
        courseProgress: {
          select: {
            progressPercentage: true,
            lastActivityAt: true,
            currentSectionId: true,
            currentLessonId: true,
            estimatedTimeLeft: true,
            completedItems: true,
            totalContentItems: true,
          },
        },
        certificate: {
          select: {
            id: true,
            certificateId: true,
            issueDate: true,
            url: true,
            isVerified: true,
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

    const [
      lessonCompletions,
      quizAttempts,
      assignmentSubmissions,
      recentActivity,
      courseSections,
    ] = await Promise.all([
      prisma.lessonCompletion.findMany({
        where: {
          studentId,
          lesson: {
            section: {
              courseId,
            },
          },
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              duration: true,
              order: true,
              section: {
                select: {
                  id: true,
                  title: true,
                  order: true,
                },
              },
            },
          },
        },
        orderBy: [
          { lesson: { section: { order: "asc" } } },
          { lesson: { order: "asc" } },
        ],
      }),

      prisma.quizAttempt.findMany({
        where: {
          studentId,
          quiz: {
            section: {
              courseId,
            },
          },
          status: "GRADED",
        },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              passingScore: true,
              maxAttempts: true,
              section: {
                select: {
                  id: true,
                  title: true,
                  order: true,
                },
              },
            },
          },
        },
        orderBy: [
          { quiz: { section: { order: "asc" } } },
          { attemptNumber: "desc" },
        ],
      }),

      prisma.assignmentSubmission.findMany({
        where: {
          studentId,
          assignment: {
            section: {
              courseId,
            },
          },
        },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              totalPoints: true,
              dueDate: true,
              section: {
                select: {
                  id: true,
                  title: true,
                  order: true,
                },
              },
            },
          },
        },
        orderBy: [
          { assignment: { section: { order: "asc" } } },
          { submittedAt: "desc" },
        ],
      }),

      prisma.lessonCompletion.findMany({
        where: {
          studentId,
          lesson: {
            section: {
              courseId,
            },
          },
        },
        select: {
          id: true,
          completedAt: true,
          timeSpent: true,
          lesson: {
            select: {
              title: true,
              section: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          completedAt: "desc",
        },
        take: 10,
      }),

      prisma.section.findMany({
        where: {
          courseId,
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          order: true,
          _count: {
            select: {
              lessons: true,
              quizzes: true,
              assignments: true,
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      }),
    ]);

    const quizStats = {
      totalAttempted: quizAttempts.length,
      totalPassed: quizAttempts.filter((attempt) => attempt.isPassed).length,
      averageScore:
        quizAttempts.length > 0
          ? quizAttempts.reduce(
              (sum, attempt) => sum + (attempt.percentage || 0),
              0
            ) / quizAttempts.length
          : 0,
    };

    const assignmentStats = {
      totalSubmitted: assignmentSubmissions.length,
      totalGraded: assignmentSubmissions.filter(
        (sub) => sub.status === "GRADED"
      ).length,
      averageGrade:
        assignmentSubmissions.filter((sub) => sub.grade !== null).length > 0
          ? assignmentSubmissions
              .filter((sub) => sub.grade !== null)
              .reduce((sum, sub) => sum + sub.grade, 0) /
            assignmentSubmissions.filter((sub) => sub.grade !== null).length
          : 0,
      lateSubmissions: assignmentSubmissions.filter((sub) => sub.isLate).length,
    };

    const sectionProgress = courseSections.map((section) => {
      const sectionLessonCompletions = lessonCompletions.filter(
        (lc) => lc.lesson.section.id === section.id
      );
      const sectionQuizAttempts = quizAttempts.filter(
        (qa) => qa.quiz.section.id === section.id
      );
      const sectionAssignmentSubmissions = assignmentSubmissions.filter(
        (as) => as.assignment.section.id === section.id
      );

      const totalItems =
        section._count.lessons +
        section._count.quizzes +
        section._count.assignments;
      const completedItems =
        sectionLessonCompletions.length +
        sectionQuizAttempts.filter((qa) => qa.isPassed).length +
        sectionAssignmentSubmissions.filter((as) => as.status === "GRADED")
          .length;

      return {
        id: section.id,
        title: section.title,
        order: section.order,
        totalItems,
        completedItems,
        progressPercentage:
          totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
        lessons: {
          total: section._count.lessons,
          completed: sectionLessonCompletions.length,
        },
        quizzes: {
          total: section._count.quizzes,
          completed: sectionQuizAttempts.filter((qa) => qa.isPassed).length,
        },
        assignments: {
          total: section._count.assignments,
          completed: sectionAssignmentSubmissions.filter(
            (as) => as.status === "GRADED"
          ).length,
        },
      };
    });

    const timeSpentBySection = lessonCompletions.reduce((acc, lc) => {
      const sectionId = lc.lesson.section.id;
      acc[sectionId] = (acc[sectionId] || 0) + (lc.timeSpent || 0);
      return acc;
    }, {});

    const result = {
      student: {
        id: enrollment.student.id,
        name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        firstName: enrollment.student.user.firstName,
        lastName: enrollment.student.user.lastName,
        email: enrollment.student.user.email,
        profileImage: enrollment.student.user.profileImage,
        country: enrollment.student.user.country,
        timezone: enrollment.student.user.timezone,
        joinedAt: enrollment.student.user.createdAt,
        lastLogin: enrollment.student.user.lastLogin,
      },
      course: enrollment.course,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.createdAt,
        progress: enrollment.progress,
        lastAccessedAt: enrollment.lastAccessedAt,
        totalTimeSpent: enrollment.totalTimeSpent,
        lessonsCompleted: enrollment.lessonsCompleted,
        quizzesCompleted: enrollment.quizzesCompleted,
        assignmentsCompleted: enrollment.assignmentsCompleted,
      },
      courseProgress: enrollment.courseProgress,
      certificate: enrollment.certificate,
      performance: {
        lessons: {
          total: enrollment.course.totalLessons,
          completed: lessonCompletions.length,
          completionRate:
            enrollment.course.totalLessons > 0
              ? (lessonCompletions.length / enrollment.course.totalLessons) *
                100
              : 0,
          totalTimeSpent: lessonCompletions.reduce(
            (sum, lc) => sum + (lc.timeSpent || 0),
            0
          ),
          averageTimePerLesson:
            lessonCompletions.length > 0
              ? lessonCompletions.reduce(
                  (sum, lc) => sum + (lc.timeSpent || 0),
                  0
                ) / lessonCompletions.length
              : 0,
        },
        quizzes: {
          ...quizStats,
          passRate:
            quizStats.totalAttempted > 0
              ? (quizStats.totalPassed / quizStats.totalAttempted) * 100
              : 0,
        },
        assignments: {
          ...assignmentStats,
          onTimeSubmissionRate:
            assignmentSubmissions.length > 0
              ? ((assignmentSubmissions.length -
                  assignmentStats.lateSubmissions) /
                  assignmentSubmissions.length) *
                100
              : 0,
        },
      },
      sectionProgress,
      timeSpentBySection,
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        type: "lesson_completed",
        title: activity.lesson.title,
        sectionTitle: activity.lesson.section.title,
        completedAt: activity.completedAt,
        timeSpent: activity.timeSpent,
      })),
      detailedProgress: {
        lessonCompletions: lessonCompletions.map((lc) => ({
          id: lc.id,
          lessonId: lc.lesson.id,
          lessonTitle: lc.lesson.title,
          sectionTitle: lc.lesson.section.title,
          sectionOrder: lc.lesson.section.order,
          lessonOrder: lc.lesson.order,
          completedAt: lc.completedAt,
          timeSpent: lc.timeSpent,
          watchTime: lc.watchTime,
        })),
        quizAttempts: quizAttempts.map((qa) => ({
          id: qa.id,
          quizId: qa.quiz.id,
          quizTitle: qa.quiz.title,
          sectionTitle: qa.quiz.section.title,
          sectionOrder: qa.quiz.section.order,
          attemptNumber: qa.attemptNumber,
          score: qa.score,
          percentage: qa.percentage,
          isPassed: qa.isPassed,
          submittedAt: qa.submittedAt,
          timeSpent: qa.timeSpent,
          passingScore: qa.quiz.passingScore,
        })),
        assignmentSubmissions: assignmentSubmissions.map((as) => ({
          id: as.id,
          assignmentId: as.assignment.id,
          assignmentTitle: as.assignment.title,
          sectionTitle: as.assignment.section.title,
          sectionOrder: as.assignment.section.order,
          submittedAt: as.submittedAt,
          grade: as.grade,
          totalPoints: as.assignment.totalPoints,
          status: as.status,
          isLate: as.isLate,
          attempts: as.attempts,
          timeSpent: as.timeSpent,
          dueDate: as.assignment.dueDate,
        })),
      },
    };

    await redisService.setJSON(cacheKey, result, { ex: 300 });

    res.status(200).json({
      success: true,
      message: "Student details retrieved successfully",
      data: result,
      meta: {
        cached: false,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get student detail error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve student details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const bulkGradeAssignments = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const { assignments } = req.body;

  if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Assignments array is required and cannot be empty",
    });
  }

  try {
    const submissionIds = assignments.map((a) => a.submissionId);

    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        id: {
          in: submissionIds,
        },
        status: "SUBMITTED",
        assignment: {
          section: {
            course: {
              instructorId,
            },
          },
        },
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            totalPoints: true,
          },
        },
        student: {
          include: {
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

    if (submissions.length !== assignments.length) {
      return res.status(400).json({
        success: false,
        message: "Some assignments not found or not in submitted status",
      });
    }

    const updatePromises = assignments.map(async (assignmentGrade) => {
      const submission = submissions.find(
        (s) => s.id === assignmentGrade.submissionId
      );

      if (
        assignmentGrade.grade < 0 ||
        assignmentGrade.grade > submission.assignment.totalPoints
      ) {
        throw new Error(
          `Grade for ${submission.assignment.title} must be between 0 and ${submission.assignment.totalPoints}`
        );
      }

      return prisma.assignmentSubmission.update({
        where: { id: assignmentGrade.submissionId },
        data: {
          grade: parseInt(assignmentGrade.grade),
          feedback: assignmentGrade.feedback || "",
          status: "GRADED",
          gradedAt: new Date(),
          gradedBy: instructorId,
        },
      });
    });

    const updatedSubmissions = await Promise.all(updatePromises);

    const notificationPromises = submissions.map((submission) => {
      const gradeInfo = assignments.find(
        (a) => a.submissionId === submission.id
      );
      return prisma.notification.create({
        data: {
          type: "ASSIGNMENT_GRADED",
          title: "Assignment Graded",
          message: `Your assignment "${submission.assignment.title}" has been graded. Score: ${gradeInfo.grade}/${submission.assignment.totalPoints}`,
          userId: submission.student.user.id,
          data: {
            submissionId: submission.id,
            grade: gradeInfo.grade,
            maxPoints: submission.assignment.totalPoints,
          },
        },
      });
    });

    await Promise.all(notificationPromises);

    const cacheKeyPattern = `instructor:${instructorId}:pending*`;
    await redisService.delPattern(cacheKeyPattern);

    res.status(200).json({
      success: true,
      message: `Successfully graded ${updatedSubmissions.length} assignments`,
      data: {
        gradedCount: updatedSubmissions.length,
        submissionIds: updatedSubmissions.map((s) => s.id),
      },
    });
  } catch (error) {
    console.error("Bulk grade assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk grade assignments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const getEnrolledStudents = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const { courseId } = req.params;
  const {
    page = 1,
    limit = 20,
    status,
    search,
    sortBy = "enrolledAt",
    sortOrder = "desc",
  } = req.query;

  const pageSize = Math.min(parseInt(limit), 100);
  const pageNumber = Math.max(parseInt(page), 1);
  const skip = (pageNumber - 1) * pageSize;

  try {
    const cacheKey = `instructor:${instructorId}:students:${Buffer.from(
      JSON.stringify({
        page: pageNumber,
        limit: pageSize,
        courseId,
        status,
        search,
        sortBy,
        sortOrder,
      })
    ).toString("base64")}`;

    let cachedResult = await redisService.getJSON(cacheKey);
    if (cachedResult) {
      return res.status(200).json({
        success: true,
        message: "Students retrieved successfully",
        data: cachedResult,
        meta: {
          cached: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const courseWhere = {
      instructorId,
      status: "PUBLISHED",
    };

    if (courseId) {
      courseWhere.id = courseId;
    }

    const enrollmentWhere = {
      course: courseWhere,
    };

    if (status) {
      enrollmentWhere.status = status;
    }

    if (search) {
      enrollmentWhere.student = {
        user: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      };
    }

    let orderBy = {};
    if (sortBy === "enrolledAt") {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === "progress") {
      orderBy = { progress: sortOrder };
    } else if (sortBy === "lastAccess") {
      orderBy = { lastAccessedAt: sortOrder };
    } else if (sortBy === "name") {
      orderBy = { student: { user: { firstName: sortOrder } } };
    }

    const [enrollments, total, courses] = await Promise.all([
      prisma.enrollment.findMany({
        where: enrollmentWhere,
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profileImage: true,
                  country: true,
                  timezone: true,
                },
              },
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              price: true,
              level: true,
            },
          },
          courseProgress: {
            select: {
              progressPercentage: true,
              lastActivityAt: true,
              currentSectionId: true,
              currentLessonId: true,
              estimatedTimeLeft: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.enrollment.count({ where: enrollmentWhere }),
      prisma.course.findMany({
        where: { instructorId, status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          _count: {
            select: { enrollments: true },
          },
        },
      }),
    ]);

    const studentsWithStats = await Promise.all(
      enrollments.map(async (enrollment) => {
        const studentStats = await Promise.all([
          prisma.lessonCompletion.count({
            where: {
              studentId: enrollment.student.id,
              lesson: {
                section: {
                  courseId: enrollment.courseId,
                },
              },
            },
          }),
          prisma.quizAttempt.count({
            where: {
              studentId: enrollment.student.id,
              quiz: {
                section: {
                  courseId: enrollment.courseId,
                },
              },
              status: "GRADED",
              isPassed: true,
            },
          }),
          prisma.assignmentSubmission.count({
            where: {
              studentId: enrollment.student.id,
              assignment: {
                section: {
                  courseId: enrollment.courseId,
                },
              },
              status: "GRADED",
            },
          }),
        ]);

        return {
          id: enrollment.id,
          enrolledAt: enrollment.createdAt,
          status: enrollment.status,
          progress: enrollment.progress,
          lastAccessedAt: enrollment.lastAccessedAt,
          totalTimeSpent: enrollment.totalTimeSpent,
          student: {
            id: enrollment.student.id,
            name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
            email: enrollment.student.user.email,
            profileImage: enrollment.student.user.profileImage,
            country: enrollment.student.user.country,
            timezone: enrollment.student.user.timezone,
          },
          course: enrollment.course,
          courseProgress: enrollment.courseProgress,
          stats: {
            lessonsCompleted: studentStats[0],
            quizzesPassed: studentStats[1],
            assignmentsSubmitted: studentStats[2],
          },
        };
      })
    );

    const result = {
      students: studentsWithStats,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: skip + pageSize < total,
        hasPrev: pageNumber > 1,
      },
      summary: {
        totalStudents: total,
        courses: courses.map((course) => ({
          id: course.id,
          title: course.title,
          enrollments: course._count.enrollments,
        })),
      },
    };

    await redisService.setJSON(cacheKey, result, { ex: 60 });

    res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: result,
      meta: {
        cached: false,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get enrolled students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const getStudentAnalytics = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const { courseId, timeframe = "month", metrics = "all" } = req.query;

  try {
    const cacheKey = `instructor:${instructorId}:analytics:${
      courseId || "all"
    }:${timeframe}:${metrics}`;
    let cachedResult = await redisService.getJSON(cacheKey);

    if (cachedResult) {
      return res.status(200).json({
        success: true,
        message: "Student analytics retrieved successfully",
        data: cachedResult,
        meta: {
          cached: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const now = new Date();
    let dateFilter = {};

    if (timeframe === "week") {
      dateFilter.gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === "month") {
      dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeframe === "quarter") {
      dateFilter.gte = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeframe === "year") {
      dateFilter.gte = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const courseWhere = {
      instructorId,
      status: "PUBLISHED",
    };

    if (courseId && courseId !== "all") {
      courseWhere.id = courseId;
    }

    const baseEnrollmentWhere = {
      course: courseWhere,
    };

    const [
      enrollmentStats,
      totalEnrollments,
      completedEnrollments,
      engagementData,
      quizStats,
      assignmentStats,
      topPerformers,
      strugglingStudents,
    ] = await Promise.all([
      prisma.enrollment.groupBy({
        by: ["status"],
        where: baseEnrollmentWhere,
        _count: {
          id: true,
        },
      }),

      prisma.enrollment.count({
        where: baseEnrollmentWhere,
      }),

      prisma.enrollment.count({
        where: {
          ...baseEnrollmentWhere,
          progress: {
            gte: 100,
          },
        },
      }),

      prisma.enrollment.aggregate({
        where: baseEnrollmentWhere,
        _avg: {
          progress: true,
          totalTimeSpent: true,
        },
        _count: {
          id: true,
        },
      }),

      prisma.quizAttempt.aggregate({
        where: {
          student: {
            enrollments: {
              some: baseEnrollmentWhere,
            },
          },
          status: "GRADED",
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        _avg: {
          percentage: true,
        },
        _count: {
          id: true,
        },
      }),

      prisma.assignmentSubmission.aggregate({
        where: {
          student: {
            enrollments: {
              some: baseEnrollmentWhere,
            },
          },
          status: "GRADED",
          grade: {
            not: null,
          },
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        _avg: {
          grade: true,
        },
        _count: {
          id: true,
        },
      }),

      prisma.enrollment.findMany({
        where: baseEnrollmentWhere,
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profileImage: true,
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
        orderBy: [{ progress: "desc" }, { totalTimeSpent: "desc" }],
        take: 10,
      }),

      prisma.enrollment.findMany({
        where: {
          ...baseEnrollmentWhere,
          progress: {
            lt: 25,
          },
          OR: [
            { lastAccessedAt: null },
            {
              lastAccessedAt: {
                lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  email: true,
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
        orderBy: [{ lastAccessedAt: "asc" }, { progress: "asc" }],
        take: 10,
      }),
    ]);

    const progressDistribution = await prisma.enrollment.groupBy({
      by: ["progress"],
      where: baseEnrollmentWhere,
      _count: {
        id: true,
      },
    });

    const progressRanges = progressDistribution.reduce((acc, item) => {
      const progress = item.progress;
      let range;

      if (progress >= 100) range = "Completed";
      else if (progress >= 75) range = "75-99%";
      else if (progress >= 50) range = "50-74%";
      else if (progress >= 25) range = "25-49%";
      else if (progress > 0) range = "1-24%";
      else range = "Not Started";

      acc[range] = (acc[range] || 0) + item._count.id;
      return acc;
    }, {});

    const lessonCompletions = await prisma.lessonCompletion.count({
      where: {
        lesson: {
          section: {
            course: courseWhere,
          },
        },
        ...(Object.keys(dateFilter).length > 0 && { completedAt: dateFilter }),
      },
    });

    const dailyActivityData = await prisma.lessonCompletion.groupBy({
      by: ["completedAt"],
      where: {
        lesson: {
          section: {
            course: courseWhere,
          },
        },
        completedAt: {
          gte:
            dateFilter.gte ||
            new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _count: {
        studentId: true,
        id: true,
      },
    });

    const dailyActivity = dailyActivityData
      .map((activity) => ({
        date: activity.completedAt.toISOString().split("T")[0],
        activeStudents: activity._count.studentId,
        lessonCompletions: activity._count.id,
      }))
      .slice(0, 30);

    const passedQuizzes = await prisma.quizAttempt.count({
      where: {
        student: {
          enrollments: {
            some: baseEnrollmentWhere,
          },
        },
        isPassed: true,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    });

    const result = {
      overview: {
        totalEnrollments: totalEnrollments,
        activeStudents: engagementData._count.id,
        completionRate:
          totalEnrollments > 0
            ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1)
            : "0",
        averageProgress: engagementData._avg.progress
          ? Number(engagementData._avg.progress).toFixed(1)
          : "0",
      },
      engagement: {
        activeLearners: engagementData._count.id,
        totalLessonCompletions: lessonCompletions,
        averageLessonTime: engagementData._avg.totalTimeSpent
          ? Number(engagementData._avg.totalTimeSpent).toFixed(0)
          : "0",
        quizAttempts: quizStats._count.id,
        assignmentSubmissions: assignmentStats._count.id,
      },
      performance: {
        averageQuizScore: quizStats._avg.percentage
          ? Number(quizStats._avg.percentage).toFixed(1)
          : "0",
        quizPassRate:
          quizStats._count.id > 0
            ? ((passedQuizzes / quizStats._count.id) * 100).toFixed(1)
            : "0",
        averageAssignmentScore: assignmentStats._avg.grade
          ? Number(assignmentStats._avg.grade).toFixed(1)
          : "0",
      },
      progressDistribution: Object.entries(progressRanges).map(
        ([range, count]) => ({
          range,
          count,
        })
      ),
      topPerformers: topPerformers.map((enrollment) => ({
        studentId: enrollment.student.id,
        name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        profileImage: enrollment.student.user.profileImage,
        courseTitle: enrollment.course.title,
        progress: enrollment.progress,
        totalTimeSpent: enrollment.totalTimeSpent,
        lastAccessed: enrollment.lastAccessedAt,
      })),
      strugglingStudents: strugglingStudents.map((enrollment) => ({
        studentId: enrollment.student.id,
        name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        email: enrollment.student.user.email,
        profileImage: enrollment.student.user.profileImage,
        courseTitle: enrollment.course.title,
        progress: enrollment.progress,
        lastAccessed: enrollment.lastAccessedAt,
        daysSinceLastAccess: enrollment.lastAccessedAt
          ? Math.floor(
              (now - enrollment.lastAccessedAt) / (1000 * 60 * 60 * 24)
            )
          : null,
      })),
      dailyActivity: dailyActivity,
      timeframe,
      generatedAt: new Date().toISOString(),
    };

    await redisService.setJSON(cacheKey, result, { ex: 120 });

    res.status(200).json({
      success: true,
      message: "Student analytics retrieved successfully",
      data: result,
      meta: {
        cached: false,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get student analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve student analytics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const getStudentEngagement = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const { courseId, timeframe = "month" } = req.query;

  try {
    const cacheKey = `instructor:${instructorId}:engagement:${
      courseId || "all"
    }:${timeframe}`;
    let cachedResult = await redisService.getJSON(cacheKey);

    if (cachedResult) {
      return res.status(200).json({
        success: true,
        message: "Student engagement data retrieved successfully",
        data: cachedResult,
        meta: {
          cached: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const now = new Date();
    let dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (timeframe === "week") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === "quarter") {
      dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeframe === "year") {
      dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const baseWhere = {
      instructorId,
      status: "PUBLISHED",
    };

    if (courseId && courseId !== "all") {
      baseWhere.id = courseId;
    }

    const enrollmentWhere = {
      course: baseWhere,
    };

    const [lessonCompletions, allEnrollments] = await Promise.all([
      prisma.lessonCompletion.findMany({
        where: {
          lesson: {
            section: {
              course: baseWhere,
            },
          },
          completedAt: {
            gte: dateFilter,
          },
        },
        select: {
          studentId: true,
          timeSpent: true,
          completedAt: true,
        },
      }),
      prisma.enrollment.findMany({
        where: enrollmentWhere,
        select: {
          studentId: true,
          progress: true,
          totalTimeSpent: true,
          lastAccessedAt: true,
          createdAt: true,
        },
      }),
    ]);

    const activeStudents = new Set();
    allEnrollments.forEach((enrollment) => {
      if (
        enrollment.lastAccessedAt &&
        enrollment.lastAccessedAt >= dateFilter
      ) {
        activeStudents.add(enrollment.studentId);
      }
    });

    const completedStudents = allEnrollments.filter(
      (e) => e.progress === 100
    ).length;

    const totalTimeSpent = allEnrollments.reduce(
      (sum, e) => sum + (e.totalTimeSpent || 0),
      0
    );

    const avgProgress =
      allEnrollments.length > 0
        ? allEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) /
          allEnrollments.length
        : 0;

    const avgLessonTime =
      lessonCompletions.length > 0
        ? lessonCompletions.reduce((sum, lc) => sum + (lc.timeSpent || 0), 0) /
          lessonCompletions.length
        : 0;

    const dailyActivityMap = new Map();

    lessonCompletions.forEach((lc) => {
      const date = lc.completedAt.toISOString().split("T")[0];
      if (!dailyActivityMap.has(date)) {
        dailyActivityMap.set(date, {
          date,
          students: new Set(),
          lessonCompletions: 0,
        });
      }
      const activity = dailyActivityMap.get(date);
      activity.students.add(lc.studentId);
      activity.lessonCompletions++;
    });

    const dailyActivity = Array.from(dailyActivityMap.values())
      .map((activity) => ({
        date: activity.date,
        uniqueActiveStudents: activity.students.size,
        lessonCompletions: activity.lessonCompletions,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);

    const result = {
      summary: {
        totalEnrolled: allEnrollments.length,
        activeStudents: activeStudents.size,
        averageProgress: avgProgress.toFixed(1),
        completedStudents,
        averageTimeSpent: Math.round(
          totalTimeSpent / Math.max(allEnrollments.length, 1)
        ),
        engagementRate:
          allEnrollments.length > 0
            ? ((activeStudents.size / allEnrollments.length) * 100).toFixed(1)
            : "0",
      },
      contentEngagement: {
        lessonCompletions: lessonCompletions.length,
        averageLessonTime: Math.round(avgLessonTime),
        studentsCompletingLessons: new Set(
          lessonCompletions.map((lc) => lc.studentId)
        ).size,
      },
      dailyActivity,
      timeframe,
      generatedAt: new Date().toISOString(),
    };

    await redisService.setJSON(cacheKey, result, { ex: 120 });

    res.status(200).json({
      success: true,
      message: "Student engagement data retrieved successfully",
      data: result,
      meta: {
        cached: false,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get student engagement error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve student engagement data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const exportStudentData = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const {
    courseId,
    format = "csv",
    includeCharts = false,
    timeframe = "month",
    status,
    search,
    sortBy = "enrolledAt",
    sortOrder = "desc",
  } = req.query;

  try {
    const courseWhere = {
      instructorId,
      status: "PUBLISHED",
    };

    if (courseId && courseId !== "all") {
      courseWhere.id = courseId;
    }

    const enrollmentWhere = {
      course: courseWhere,
    };

    if (status) {
      enrollmentWhere.status = status;
    }

    if (search) {
      enrollmentWhere.OR = [
        {
          student: {
            user: {
              firstName: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          student: {
            user: {
              lastName: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          student: {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    let orderBy = {};
    switch (sortBy) {
      case "name":
        orderBy = {
          student: {
            user: {
              firstName: sortOrder,
            },
          },
        };
        break;
      case "progress":
        orderBy = { progress: sortOrder };
        break;
      case "lastAccess":
        orderBy = { lastAccessedAt: sortOrder };
        break;
      case "enrolledAt":
      default:
        orderBy = { createdAt: sortOrder };
        break;
    }

    const enrollments = await prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                country: true,
                timezone: true,
                createdAt: true,
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
        courseProgress: true,
        certificate: {
          select: {
            certificateId: true,
            issueDate: true,
            url: true,
          },
        },
      },
      orderBy,
    });

    if (enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No student data found to export",
      });
    }

    const studentData = enrollments.map((enrollment) => ({
      student_id: enrollment.student.id,
      student_name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
      email: enrollment.student.user.email,
      country: enrollment.student.user.country || "",
      course_title: enrollment.course.title,
      enrolled_date: enrollment.createdAt.toISOString().split("T")[0],
      enrollment_status: enrollment.status,
      progress_percentage: enrollment.progress,
      last_accessed: enrollment.lastAccessedAt
        ? enrollment.lastAccessedAt.toISOString().split("T")[0]
        : "",
      total_time_spent_minutes: enrollment.totalTimeSpent || 0,
      lessons_completed: enrollment.lessonsCompleted,
      quizzes_completed: enrollment.quizzesCompleted,
      assignments_completed: enrollment.assignmentsCompleted,
      certificate_issued: enrollment.certificate ? "Yes" : "No",
      certificate_date: enrollment.certificate?.issueDate
        ? enrollment.certificate.issueDate.toISOString().split("T")[0]
        : "",
    }));

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="students-${Date.now()}.json"`
      );
      return res.status(200).json({
        success: true,
        data: studentData,
        exported_at: new Date().toISOString(),
        total_records: studentData.length,
      });
    }

    const headers = Object.keys(studentData[0]);
    const csvContent = [
      headers.join(","),
      ...studentData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || "";
          })
          .join(",")
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="students-${Date.now()}.csv"`
    );
    res.setHeader("Content-Length", Buffer.byteLength(csvContent, "utf8"));

    return res.status(200).end(csvContent);
  } catch (error) {
    console.error("Export student data error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export student data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const setStudentsFilters = (filters) => {
  return {
    type: "SET_STUDENTS_FILTERS",
    payload: filters,
  };
};

export const resetStudentsFilters = () => {
  return {
    type: "RESET_STUDENTS_FILTERS",
  };
};

export const clearError = () => {
  return {
    type: "CLEAR_ERROR",
  };
};
