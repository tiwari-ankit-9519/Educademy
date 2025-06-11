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

export const createFAQ = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "FAQController",
    methodName: "createFAQ",
  });

  educademyLogger.logMethodEntry("FAQController", "createFAQ", {
    userId: req.userAuthId,
    courseId,
    question: req.body.question,
  });

  try {
    const { question, answer, order, isActive = true } = req.body;

    // Validation
    if (!question?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    if (!answer?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Answer is required",
      });
    }

    if (order !== undefined && order < 0) {
      return res.status(400).json({
        success: false,
        message: "Order must be a non-negative number",
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
        message: "You can only create FAQs for your own courses",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can create FAQs",
      });
    }

    // Handle order
    let faqOrder = order;
    if (faqOrder === undefined) {
      const lastFAQ = await prisma.fAQ.findFirst({
        where: { courseId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      faqOrder = lastFAQ ? lastFAQ.order + 1 : 1;
    }

    // Check for existing FAQ with same order
    const existingFAQ = await prisma.fAQ.findFirst({
      where: {
        courseId,
        order: faqOrder,
      },
    });

    if (existingFAQ) {
      await prisma.fAQ.updateMany({
        where: {
          courseId,
          order: { gte: faqOrder },
        },
        data: {
          order: { increment: 1 },
        },
      });
    }

    // Create FAQ
    const faq = await prisma.fAQ.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        order: faqOrder,
        isActive: isActive === "true" || isActive === true,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
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
      },
    });

    // Update course timestamp
    await prisma.course.update({
      where: { id: courseId },
      data: { updatedAt: new Date() },
    });

    // Create notification for instructor
    await prisma.notification.create({
      data: {
        type: "COURSE_UPDATED",
        title: "FAQ Created",
        message: `FAQ "${question}" has been created successfully for course "${course.title}".`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          faqId: faq.id,
          faqQuestion: question,
          courseId,
          courseTitle: course.title,
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "CREATE_FAQ",
      "FAQ",
      faq.id,
      "SUCCESS",
      {
        faqQuestion: question,
        courseId,
        courseTitle: course.title,
        order: faqOrder,
        isActive: faq.isActive,
        instructorId: course.instructorId,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("CREATE_FAQ", startTime, {
      userId: req.userAuthId,
      faqId: faq.id,
      courseId,
    });

    educademyLogger.logMethodExit(
      "FAQController",
      "createFAQ",
      true,
      performance.now() - startTime
    );

    const responseData = {
      faq: {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        order: faq.order,
        isActive: faq.isActive,
        courseId: faq.courseId,
        course: faq.course,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt,
      },
    };

    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Create FAQ failed", error, {
      userId: req.userAuthId,
      courseId,
      question: req.body.question,
      business: {
        operation: "CREATE_FAQ",
        entity: "FAQ",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "FAQController",
      "createFAQ",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to create FAQ",
      requestId,
    });
  }
});

export const updateFAQ = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId, faqId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "FAQController",
    methodName: "updateFAQ",
  });

  try {
    const { question, answer, order, isActive } = req.body;

    // Get current FAQ
    const currentFAQ = await prisma.fAQ.findUnique({
      where: { id: faqId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
      },
    });

    if (!currentFAQ) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    if (currentFAQ.courseId !== courseId) {
      return res.status(400).json({
        success: false,
        message: "FAQ does not belong to this course",
      });
    }

    // Check ownership
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor || instructor.id !== currentFAQ.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only update FAQs for your own courses",
      });
    }

    const updateData = {};

    // Validate and update fields
    if (question !== undefined) {
      if (!question.trim()) {
        return res.status(400).json({
          success: false,
          message: "Question cannot be empty",
        });
      }
      updateData.question = question.trim();
    }

    if (answer !== undefined) {
      if (!answer.trim()) {
        return res.status(400).json({
          success: false,
          message: "Answer cannot be empty",
        });
      }
      updateData.answer = answer.trim();
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive === "true" || isActive === true;
    }

    // Handle order change
    if (order !== undefined && order !== currentFAQ.order) {
      if (order < 0) {
        return res.status(400).json({
          success: false,
          message: "Order must be a non-negative number",
        });
      }

      const conflictingFAQ = await prisma.fAQ.findFirst({
        where: {
          courseId,
          order,
          id: { not: faqId },
        },
      });

      if (conflictingFAQ) {
        if (order > currentFAQ.order) {
          await prisma.fAQ.updateMany({
            where: {
              courseId,
              order: {
                gt: currentFAQ.order,
                lte: order,
              },
              id: { not: faqId },
            },
            data: {
              order: { decrement: 1 },
            },
          });
        } else {
          await prisma.fAQ.updateMany({
            where: {
              courseId,
              order: {
                gte: order,
                lt: currentFAQ.order,
              },
              id: { not: faqId },
            },
            data: {
              order: { increment: 1 },
            },
          });
        }
      }

      updateData.order = order;
    }

    updateData.updatedAt = new Date();

    // Update FAQ
    const updatedFAQ = await prisma.fAQ.update({
      where: { id: faqId },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
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
      },
    });

    // Update course timestamp
    await prisma.course.update({
      where: { id: courseId },
      data: { updatedAt: new Date() },
    });

    educademyLogger.logBusinessOperation(
      "UPDATE_FAQ",
      "FAQ",
      faqId,
      "SUCCESS",
      {
        faqQuestion: updatedFAQ.question,
        courseId,
        courseTitle: currentFAQ.course.title,
        changedFields: Object.keys(updateData),
        orderChanged: updateData.order !== undefined,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "UPDATE_FAQ",
      "FAQ",
      faqId,
      {
        question: currentFAQ.question,
        answer: currentFAQ.answer,
        order: currentFAQ.order,
        isActive: currentFAQ.isActive,
      },
      updateData,
      req.userAuthId
    );

    educademyLogger.performance("UPDATE_FAQ", startTime, {
      userId: req.userAuthId,
      faqId,
      courseId,
      changedFields: Object.keys(updateData).length,
    });

    educademyLogger.logMethodExit(
      "FAQController",
      "updateFAQ",
      true,
      performance.now() - startTime
    );

    const responseData = {
      faq: {
        id: updatedFAQ.id,
        question: updatedFAQ.question,
        answer: updatedFAQ.answer,
        order: updatedFAQ.order,
        isActive: updatedFAQ.isActive,
        courseId: updatedFAQ.courseId,
        course: updatedFAQ.course,
        createdAt: updatedFAQ.createdAt,
        updatedAt: updatedFAQ.updatedAt,
      },
      changes: {
        fieldsUpdated: Object.keys(updateData),
        orderChanged: updateData.order !== undefined,
      },
    };

    res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Update FAQ failed", error, {
      userId: req.userAuthId,
      courseId,
      faqId,
      business: {
        operation: "UPDATE_FAQ",
        entity: "FAQ",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "FAQController",
      "updateFAQ",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to update FAQ",
      requestId,
    });
  }
});

export const deleteFAQ = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId, faqId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "FAQController",
    methodName: "deleteFAQ",
  });

  try {
    const faq = await prisma.fAQ.findUnique({
      where: { id: faqId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
      },
    });

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    if (faq.courseId !== courseId) {
      return res.status(400).json({
        success: false,
        message: "FAQ does not belong to this course",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== faq.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete FAQs for your own courses",
      });
    }

    // Delete FAQ
    await prisma.fAQ.delete({
      where: { id: faqId },
    });

    // Update order of remaining FAQs
    await prisma.fAQ.updateMany({
      where: {
        courseId,
        order: { gt: faq.order },
      },
      data: {
        order: { decrement: 1 },
      },
    });

    // Update course timestamp
    await prisma.course.update({
      where: { id: courseId },
      data: { updatedAt: new Date() },
    });

    educademyLogger.logBusinessOperation(
      "DELETE_FAQ",
      "FAQ",
      faqId,
      "SUCCESS",
      {
        faqQuestion: faq.question,
        courseId,
        courseTitle: faq.course.title,
        order: faq.order,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "DELETE_FAQ",
      "FAQ",
      faqId,
      {
        question: faq.question,
        answer: faq.answer,
        order: faq.order,
        isActive: faq.isActive,
        courseId,
      },
      null,
      req.userAuthId
    );

    educademyLogger.performance("DELETE_FAQ", startTime, {
      userId: req.userAuthId,
      faqId,
      courseId,
    });

    res.status(200).json({
      success: true,
      message: "FAQ deleted successfully",
      data: {
        deletedFAQId: faqId,
        faqQuestion: faq.question,
        courseId,
        courseTitle: faq.course.title,
      },
    });
  } catch (error) {
    educademyLogger.error("Delete FAQ failed", error, {
      userId: req.userAuthId,
      courseId,
      faqId,
      business: {
        operation: "DELETE_FAQ",
        entity: "FAQ",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "FAQController",
      "deleteFAQ",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete FAQ",
      requestId,
    });
  }
});

export const getCourseFAQs = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "FAQController",
    methodName: "getCourseFAQs",
  });

  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = "order",
      sortOrder = "asc",
      isActive,
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
      select: {
        id: true,
        title: true,
        instructorId: true,
        status: true,
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
        message: "You can only view FAQs for your own courses",
      });
    }

    // Build where clause
    const whereClause = {
      courseId,
    };

    if (search?.trim()) {
      whereClause.OR = [
        {
          question: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          answer: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === "true";
    }

    // Build order by
    const validSortFields = [
      "question",
      "order",
      "isActive",
      "createdAt",
      "updatedAt",
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

    // Execute queries
    const [faqs, totalCount] = await Promise.all([
      prisma.fAQ.findMany({
        where: whereClause,
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.fAQ.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    // Calculate summary statistics
    const summary = {
      totalFAQs: totalCount,
      activeFAQs: faqs.filter((faq) => faq.isActive).length,
      inactiveFAQs: faqs.filter((faq) => !faq.isActive).length,
    };

    educademyLogger.logBusinessOperation(
      "GET_COURSE_FAQS",
      "FAQ",
      courseId,
      "SUCCESS",
      {
        courseId,
        courseTitle: course.title,
        faqsReturned: faqs.length,
        totalFAQs: totalCount,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_COURSE_FAQS", startTime, {
      userId: req.userAuthId,
      courseId,
      faqsCount: faqs.length,
    });

    const responseData = {
      faqs: faqs.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        order: faq.order,
        isActive: faq.isActive,
        courseId: faq.courseId,
        course: faq.course,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt,
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
      },
      filters: {
        applied: {
          search: search || null,
          isActive: isActive || null,
          sortBy,
          sortOrder,
        },
        available: {
          sortFields: validSortFields,
        },
      },
    };

    res.status(200).json({
      success: true,
      message: "Course FAQs fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get course FAQs failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "GET_COURSE_FAQS",
        entity: "FAQ",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch course FAQs",
      requestId,
    });
  }
});

export const getFAQ = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId, faqId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "FAQController",
    methodName: "getFAQ",
  });

  try {
    const faq = await prisma.fAQ.findUnique({
      where: { id: faqId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
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
    });

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    if (faq.courseId !== courseId) {
      return res.status(400).json({
        success: false,
        message: "FAQ does not belong to this course",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== faq.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only view FAQs for your own courses",
      });
    }

    educademyLogger.logBusinessOperation("GET_FAQ", "FAQ", faqId, "SUCCESS", {
      faqQuestion: faq.question,
      courseId,
      courseTitle: faq.course.title,
      userId: req.userAuthId,
    });

    educademyLogger.performance("GET_FAQ", startTime, {
      userId: req.userAuthId,
      faqId,
      courseId,
    });

    const responseData = {
      faq: {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        order: faq.order,
        isActive: faq.isActive,
        courseId: faq.courseId,
        course: faq.course,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt,
      },
    };

    res.status(200).json({
      success: true,
      message: "FAQ fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get FAQ failed", error, {
      userId: req.userAuthId,
      courseId,
      faqId,
      business: {
        operation: "GET_FAQ",
        entity: "FAQ",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch FAQ",
      requestId,
    });
  }
});

export const reorderFAQs = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;
  const { faqOrders } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "FAQController",
    methodName: "reorderFAQs",
  });

  try {
    if (!Array.isArray(faqOrders) || faqOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "FAQ orders array is required",
      });
    }

    for (const item of faqOrders) {
      if (!item.faqId || typeof item.faqId !== "string") {
        return res.status(400).json({
          success: false,
          message: "Each item must have a valid faqId",
        });
      }
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        instructorId: true,
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
        message: "You can only reorder FAQs for your own courses",
      });
    }

    const faqIds = faqOrders.map((item) => item.faqId);
    const existingFAQs = await prisma.fAQ.findMany({
      where: {
        id: { in: faqIds },
        courseId,
      },
      select: { id: true, question: true },
    });

    if (existingFAQs.length !== faqIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some FAQs do not exist or do not belong to this course",
      });
    }

    const updatePromises = faqOrders.map((item, index) =>
      prisma.fAQ.update({
        where: { id: item.faqId },
        data: { order: index + 1 },
      })
    );

    await Promise.all(updatePromises);

    await prisma.course.update({
      where: { id: courseId },
      data: { updatedAt: new Date() },
    });

    const updatedFAQs = await prisma.fAQ.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        question: true,
        order: true,
        isActive: true,
      },
    });

    educademyLogger.logBusinessOperation(
      "REORDER_FAQS",
      "FAQ",
      courseId,
      "SUCCESS",
      {
        courseId,
        faqsCount: faqOrders.length,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("REORDER_FAQS", startTime, {
      userId: req.userAuthId,
      courseId,
      faqsCount: faqOrders.length,
    });

    res.status(200).json({
      success: true,
      message: "FAQs reordered successfully",
      data: {
        faqs: updatedFAQs,
        courseId,
      },
    });
  } catch (error) {
    educademyLogger.error("Reorder FAQs failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "REORDER_FAQS",
        entity: "FAQ",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to reorder FAQs",
      requestId,
    });
  }
});

export const bulkUpdateFAQs = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;
  const { updates } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "FAQController",
    methodName: "bulkUpdateFAQs",
  });

  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates array is required",
      });
    }

    for (const update of updates) {
      if (!update.faqId || typeof update.faqId !== "string") {
        return res.status(400).json({
          success: false,
          message: "Each update must have a valid faqId",
        });
      }
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        instructorId: true,
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
        message: "You can only update FAQs for your own courses",
      });
    }

    const faqIds = updates.map((update) => update.faqId);
    const existingFAQs = await prisma.fAQ.findMany({
      where: {
        id: { in: faqIds },
        courseId,
      },
    });

    if (existingFAQs.length !== faqIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some FAQs do not exist or do not belong to this course",
      });
    }

    const updatePromises = updates.map((update) => {
      const { faqId, question, answer, isActive } = update;
      const updateData = { updatedAt: new Date() };

      if (question !== undefined) {
        updateData.question = question.trim();
      }
      if (answer !== undefined) {
        updateData.answer = answer.trim();
      }
      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }

      return prisma.fAQ.update({
        where: { id: faqId },
        data: updateData,
      });
    });

    const updatedFAQs = await Promise.all(updatePromises);

    await prisma.course.update({
      where: { id: courseId },
      data: { updatedAt: new Date() },
    });

    educademyLogger.logBusinessOperation(
      "BULK_UPDATE_FAQS",
      "FAQ",
      courseId,
      "SUCCESS",
      {
        courseId,
        courseTitle: course.title,
        faqsUpdated: updates.length,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("BULK_UPDATE_FAQS", startTime, {
      userId: req.userAuthId,
      courseId,
      faqsCount: updates.length,
    });

    const responseData = {
      updatedFAQs: updatedFAQs.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        order: faq.order,
        isActive: faq.isActive,
        updatedAt: faq.updatedAt,
      })),
      summary: {
        totalUpdated: updates.length,
        courseId,
        courseTitle: course.title,
      },
    };

    res.status(200).json({
      success: true,
      message: `Successfully updated ${updates.length} FAQs`,
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Bulk update FAQs failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "BULK_UPDATE_FAQS",
        entity: "FAQ",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to bulk update FAQs",
      requestId,
    });
  }
});

export const toggleFAQStatus = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId, faqId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "FAQController",
    methodName: "toggleFAQStatus",
  });

  try {
    const faq = await prisma.fAQ.findUnique({
      where: { id: faqId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
      },
    });

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    if (faq.courseId !== courseId) {
      return res.status(400).json({
        success: false,
        message: "FAQ does not belong to this course",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== faq.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only toggle FAQ status for your own courses",
      });
    }

    const updatedFAQ = await prisma.fAQ.update({
      where: { id: faqId },
      data: {
        isActive: !faq.isActive,
        updatedAt: new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    await prisma.course.update({
      where: { id: courseId },
      data: { updatedAt: new Date() },
    });

    educademyLogger.logBusinessOperation(
      "TOGGLE_FAQ_STATUS",
      "FAQ",
      faqId,
      "SUCCESS",
      {
        faqQuestion: faq.question,
        courseId,
        courseTitle: faq.course.title,
        previousStatus: faq.isActive,
        newStatus: updatedFAQ.isActive,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "TOGGLE_FAQ_STATUS",
      "FAQ",
      faqId,
      { isActive: faq.isActive },
      { isActive: updatedFAQ.isActive },
      req.userAuthId
    );

    educademyLogger.performance("TOGGLE_FAQ_STATUS", startTime, {
      userId: req.userAuthId,
      faqId,
      courseId,
    });

    const responseData = {
      faq: {
        id: updatedFAQ.id,
        question: updatedFAQ.question,
        answer: updatedFAQ.answer,
        order: updatedFAQ.order,
        isActive: updatedFAQ.isActive,
        courseId: updatedFAQ.courseId,
        course: updatedFAQ.course,
        updatedAt: updatedFAQ.updatedAt,
      },
      statusChange: {
        from: faq.isActive,
        to: updatedFAQ.isActive,
      },
    };

    res.status(200).json({
      success: true,
      message: `FAQ ${
        updatedFAQ.isActive ? "activated" : "deactivated"
      } successfully`,
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Toggle FAQ status failed", error, {
      userId: req.userAuthId,
      courseId,
      faqId,
      business: {
        operation: "TOGGLE_FAQ_STATUS",
        entity: "FAQ",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to toggle FAQ status",
      requestId,
    });
  }
});
