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

export const createSection = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SectionController",
    methodName: "createSection",
  });

  educademyLogger.logMethodEntry("SectionController", "createSection", {
    userId: req.userAuthId,
    courseId: req.body.courseId,
    title: req.body.title,
  });

  try {
    const { courseId } = req.params;
    const {
      title,
      description,
      order,
      isRequired = true,
      isFree = false,
      estimatedTime,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (order !== undefined && order < 0) {
      return res.status(400).json({
        success: false,
        message: "Order must be a non-negative number",
      });
    }

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
        message: "You can only create sections for your own courses",
      });
    }

    let sectionOrder = order;
    if (sectionOrder === undefined) {
      const lastSection = await prisma.section.findFirst({
        where: { courseId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      sectionOrder = lastSection ? lastSection.order + 1 : 1;
    }

    const existingSection = await prisma.section.findFirst({
      where: {
        courseId,
        order: sectionOrder,
      },
    });

    if (existingSection) {
      await prisma.section.updateMany({
        where: {
          courseId,
          order: { gte: sectionOrder },
        },
        data: {
          order: { increment: 1 },
        },
      });
    }

    const section = await prisma.section.create({
      data: {
        title,
        description,
        order: sectionOrder,
        isPublished,
        isRequired,
        isFree,
        estimatedTime,
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
        contentItems: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            order: true,
            itemType: true,
            duration: true,
            isRequired: true,
            isFree: true,
          },
        },
        lessons: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
            isFree: true,
            isPreview: true,
            type: true,
          },
        },
        quizzes: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
            passingScore: true,
            maxAttempts: true,
            isRequired: true,
          },
        },
        assignments: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            order: true,
            totalPoints: true,
            dueDate: true,
          },
        },
        _count: {
          select: {
            contentItems: true,
            lessons: true,
            quizzes: true,
            assignments: true,
            discussions: true,
          },
        },
      },
    });

    await prisma.course.update({
      where: { id: courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    educademyLogger.logBusinessOperation(
      "CREATE_SECTION",
      "SECTION",
      section.id,
      "SUCCESS",
      {
        courseId,
        sectionTitle: title,
        order: sectionOrder,
        instructorId: course.instructorId,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("CREATE_SECTION", startTime, {
      userId: req.userAuthId,
      sectionId: section.id,
      courseId,
    });

    educademyLogger.logMethodExit(
      "SectionController",
      "createSection",
      true,
      performance.now() - startTime
    );

    res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: {
        section: {
          ...section,
          stats: {
            totalContentItems: section._count.contentItems,
            totalLessons: section._count.lessons,
            totalQuizzes: section._count.quizzes,
            totalAssignments: section._count.assignments,
            totalDiscussions: section._count.discussions,
            estimatedDuration: section.estimatedTime || 0,
          },
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Create section failed", error, {
      userId: req.userAuthId,
      courseId: req.body.courseId,
      title: req.body.title,
      business: {
        operation: "CREATE_SECTION",
        entity: "SECTION",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "SectionController",
      "createSection",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to create section",
      requestId,
    });
  }
});

export const updateSection = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { sectionId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SectionController",
    methodName: "updateSection",
  });

  try {
    const { title, description, order, isRequired, isFree, estimatedTime } =
      req.body;

    const currentSection = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: {
            id: true,
            instructorId: true,
            title: true,
          },
        },
      },
    });

    if (!currentSection) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== currentSection.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only update sections for your own courses",
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (isRequired !== undefined) updateData.isRequired = isRequired;
    if (isFree !== undefined) updateData.isFree = isFree;
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime;

    if (order !== undefined && order !== currentSection.order) {
      if (order < 0) {
        return res.status(400).json({
          success: false,
          message: "Order must be a non-negative number",
        });
      }

      const conflictingSection = await prisma.section.findFirst({
        where: {
          courseId: currentSection.courseId,
          order,
          id: { not: sectionId },
        },
      });

      if (conflictingSection) {
        if (order > currentSection.order) {
          await prisma.section.updateMany({
            where: {
              courseId: currentSection.courseId,
              order: {
                gt: currentSection.order,
                lte: order,
              },
            },
            data: {
              order: { decrement: 1 },
            },
          });
        } else {
          await prisma.section.updateMany({
            where: {
              courseId: currentSection.courseId,
              order: {
                gte: order,
                lt: currentSection.order,
              },
            },
            data: {
              order: { increment: 1 },
            },
          });
        }
      }

      updateData.order = order;
    }

    const updatedSection = await prisma.section.update({
      where: { id: sectionId },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            contentItems: true,
            lessons: true,
            quizzes: true,
            assignments: true,
            discussions: true,
          },
        },
      },
    });

    await prisma.course.update({
      where: { id: currentSection.courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    educademyLogger.logAuditTrail(
      "UPDATE_SECTION",
      "SECTION",
      sectionId,
      currentSection,
      updateData,
      req.userAuthId
    );

    educademyLogger.logBusinessOperation(
      "UPDATE_SECTION",
      "SECTION",
      sectionId,
      "SUCCESS",
      {
        sectionTitle: updatedSection.title,
        courseId: currentSection.courseId,
        changedFields: Object.keys(updateData),
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("UPDATE_SECTION", startTime, {
      userId: req.userAuthId,
      sectionId,
    });

    res.status(200).json({
      success: true,
      message: "Section updated successfully",
      data: {
        section: {
          ...updatedSection,
          stats: {
            totalContentItems: updatedSection._count.contentItems,
            totalLessons: updatedSection._count.lessons,
            totalQuizzes: updatedSection._count.quizzes,
            totalAssignments: updatedSection._count.assignments,
            totalDiscussions: updatedSection._count.discussions,
          },
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Update section failed", error, {
      userId: req.userAuthId,
      sectionId,
      business: {
        operation: "UPDATE_SECTION",
        entity: "SECTION",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to update section",
      requestId,
    });
  }
});

export const deleteSection = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { sectionId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SectionController",
    methodName: "deleteSection",
  });

  educademyLogger.logMethodEntry("SectionController", "deleteSection", {
    userId: req.userAuthId,
    sectionId,
  });

  try {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
            status: true,
          },
        },
        _count: {
          select: {
            contentItems: true,
            lessons: true,
            quizzes: true,
            assignments: true,
            discussions: true,
          },
        },
      },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== section.course.instructorId) {
      educademyLogger.logSecurityEvent(
        "UNAUTHORIZED_SECTION_DELETE_ATTEMPT",
        "HIGH",
        {
          userId: req.userAuthId,
          sectionId,
          actualOwnerId: section.course.instructorId,
        },
        req.userAuthId
      );

      return res.status(403).json({
        success: false,
        message: "You can only delete sections from your own courses",
      });
    }

    if (section.course.status === "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete sections from published courses",
        suggestion:
          "Consider archiving the course first if you need to make structural changes",
      });
    }

    const totalContent =
      section._count.contentItems +
      section._count.lessons +
      section._count.quizzes +
      section._count.assignments;

    if (totalContent > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete section that contains content",
        data: {
          contentItems: section._count.contentItems,
          lessons: section._count.lessons,
          quizzes: section._count.quizzes,
          assignments: section._count.assignments,
          discussions: section._count.discussions,
        },
        suggestion: "Delete all content items within this section first",
      });
    }

    await prisma.section.delete({
      where: { id: sectionId },
    });

    await prisma.section.updateMany({
      where: {
        courseId: section.courseId,
        order: { gt: section.order },
      },
      data: {
        order: { decrement: 1 },
      },
    });

    await prisma.course.update({
      where: { id: section.courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    educademyLogger.logBusinessOperation(
      "DELETE_SECTION",
      "SECTION",
      sectionId,
      "SUCCESS",
      {
        sectionTitle: section.title,
        courseId: section.courseId,
        order: section.order,
        instructorId: section.course.instructorId,
      }
    );

    educademyLogger.logAuditTrail(
      "DELETE_SECTION",
      "SECTION",
      sectionId,
      section,
      null,
      req.userAuthId
    );

    educademyLogger.performance("DELETE_SECTION", startTime, {
      sectionId,
      courseId: section.courseId,
    });

    educademyLogger.logMethodExit(
      "SectionController",
      "deleteSection",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Section deleted successfully",
      data: {
        deletedSection: {
          id: section.id,
          title: section.title,
          order: section.order,
        },
        course: {
          id: section.courseId,
          title: section.course.title,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Delete section failed", error, {
      userId: req.userAuthId,
      sectionId,
      business: {
        operation: "DELETE_SECTION",
        entity: "SECTION",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "SectionController",
      "deleteSection",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete section",
      requestId,
    });
  }
});

export const reorderSections = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SectionController",
    methodName: "reorderSections",
  });

  try {
    const { sectionOrders } = req.body;

    if (!Array.isArray(sectionOrders) || sectionOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Section orders array is required",
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
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
        message: "You can only reorder sections for your own courses",
      });
    }

    if (course.status === "UNDER_REVIEW") {
      return res.status(400).json({
        success: false,
        message: "Cannot reorder sections while course is under review",
      });
    }

    const existingSections = await prisma.section.findMany({
      where: { courseId },
      select: { id: true, order: true, title: true },
      orderBy: { order: "asc" },
    });

    const sectionIds = sectionOrders.map((item) => item.id);
    const existingIds = existingSections.map((section) => section.id);

    const missingIds = existingIds.filter((id) => !sectionIds.includes(id));
    const extraIds = sectionIds.filter((id) => !existingIds.includes(id));

    if (missingIds.length > 0 || extraIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Section IDs mismatch",
        data: {
          missingIds,
          extraIds,
          expected: existingIds,
          received: sectionIds,
        },
      });
    }

    for (const orderItem of sectionOrders) {
      if (typeof orderItem.order !== "number" || orderItem.order < 1) {
        return res.status(400).json({
          success: false,
          message: "Order must be a positive number starting from 1",
        });
      }
    }

    const updatePromises = sectionOrders.map(({ id, order }) =>
      prisma.section.update({
        where: { id },
        data: { order },
      })
    );

    await Promise.all(updatePromises);

    await prisma.course.update({
      where: { id: courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    const updatedSections = await prisma.section.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        order: true,
        isRequired: true,
        isFree: true,
        estimatedTime: true,
      },
      orderBy: { order: "asc" },
    });

    educademyLogger.logBusinessOperation(
      "REORDER_SECTIONS",
      "SECTION",
      courseId,
      "SUCCESS",
      {
        courseId,
        sectionCount: sectionOrders.length,
        newOrder: sectionOrders,
        instructorId: course.instructorId,
      }
    );

    educademyLogger.logAuditTrail(
      "REORDER_SECTIONS",
      "COURSE",
      courseId,
      { sections: existingSections },
      { newOrder: sectionOrders },
      req.userAuthId
    );

    educademyLogger.performance("REORDER_SECTIONS", startTime, {
      courseId,
      sectionCount: sectionOrders.length,
    });

    res.status(200).json({
      success: true,
      message: "Sections reordered successfully",
      data: {
        sections: updatedSections,
      },
    });
  } catch (error) {
    educademyLogger.error("Reorder sections failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "REORDER_SECTIONS",
        entity: "SECTION",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to reorder sections",
      requestId,
    });
  }
});

export const getSections = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SectionController",
    methodName: "getSections",
  });

  try {
    const {
      includeContent = "false",
      includeStats = "true",
      status = "all",
    } = req.query;

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
        message: "You can only view sections for your own courses",
      });
    }

    const whereClause = { courseId };

    if (status === "required") {
      whereClause.isRequired = true;
    } else if (status === "optional") {
      whereClause.isRequired = false;
    } else if (status === "free") {
      whereClause.isFree = true;
    } else if (status === "paid") {
      whereClause.isFree = false;
    }

    const includeOptions = {
      course: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    };

    if (includeStats === "true") {
      includeOptions._count = {
        select: {
          contentItems: true,
          lessons: true,
          quizzes: true,
          assignments: true,
          discussions: true,
        },
      };
    }

    if (includeContent === "true") {
      includeOptions.contentItems = {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          itemType: true,
          duration: true,
          isRequired: true,
          isFree: true,
        },
      };

      includeOptions.lessons = {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          duration: true,
          isFree: true,
          isPreview: true,
          type: true,
          videoUrl: true,
          content: true,
        },
      };

      includeOptions.quizzes = {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          duration: true,
          passingScore: true,
          maxAttempts: true,
          isRequired: true,
          _count: {
            select: { questions: true },
          },
        },
      };

      includeOptions.assignments = {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          totalPoints: true,
          dueDate: true,
          isRequired: true,
        },
      };
    }

    const sections = await prisma.section.findMany({
      where: whereClause,
      include: includeOptions,
      orderBy: { order: "asc" },
    });

    const formattedSections = sections.map((section) => {
      const formatted = {
        id: section.id,
        title: section.title,
        description: section.description,
        order: section.order,
        isRequired: section.isRequired,
        isFree: section.isFree,
        estimatedTime: section.estimatedTime,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      };

      if (includeStats === "true" && section._count) {
        formatted.stats = {
          totalContentItems: section._count.contentItems,
          totalLessons: section._count.lessons,
          totalQuizzes: section._count.quizzes,
          totalAssignments: section._count.assignments,
          totalDiscussions: section._count.discussions,
          totalContent:
            section._count.contentItems +
            section._count.lessons +
            section._count.quizzes +
            section._count.assignments,
        };
      }

      if (includeContent === "true") {
        formatted.content = {
          contentItems: section.contentItems || [],
          lessons: section.lessons || [],
          quizzes: section.quizzes || [],
          assignments: section.assignments || [],
        };
      }

      return formatted;
    });

    const summary = {
      totalSections: sections.length,
      requiredSections: sections.filter((s) => s.isRequired).length,
      optionalSections: sections.filter((s) => !s.isRequired).length,
      freeSections: sections.filter((s) => s.isFree).length,
      paidSections: sections.filter((s) => !s.isFree).length,
    };

    if (includeStats === "true") {
      summary.totalContent = {
        contentItems: sections.reduce(
          (sum, s) => sum + (s._count?.contentItems || 0),
          0
        ),
        lessons: sections.reduce((sum, s) => sum + (s._count?.lessons || 0), 0),
        quizzes: sections.reduce((sum, s) => sum + (s._count?.quizzes || 0), 0),
        assignments: sections.reduce(
          (sum, s) => sum + (s._count?.assignments || 0),
          0
        ),
        discussions: sections.reduce(
          (sum, s) => sum + (s._count?.discussions || 0),
          0
        ),
      };

      summary.estimatedTotalTime = sections.reduce(
        (sum, s) => sum + (s.estimatedTime || 0),
        0
      );
    }

    educademyLogger.performance("GET_SECTIONS", startTime, {
      courseId,
      sectionCount: sections.length,
      includeContent: includeContent === "true",
      includeStats: includeStats === "true",
    });

    res.status(200).json({
      success: true,
      message: "Sections retrieved successfully",
      data: {
        course: {
          id: course.id,
          title: course.title,
          status: course.status,
        },
        sections: formattedSections,
        summary,
      },
    });
  } catch (error) {
    educademyLogger.error("Get sections failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "GET_SECTIONS",
        entity: "SECTION",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve sections",
      requestId,
    });
  }
});

export const getSectionById = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { sectionId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SectionController",
    methodName: "getSectionById",
  });

  try {
    const { includeContent = "true", includeStats = "true" } = req.query;

    const includeOptions = {
      course: {
        select: {
          id: true,
          title: true,
          instructorId: true,
          status: true,
        },
      },
    };

    if (includeStats === "true") {
      includeOptions._count = {
        select: {
          contentItems: true,
          lessons: true,
          quizzes: true,
          assignments: true,
          discussions: true,
        },
      };
    }

    if (includeContent === "true") {
      includeOptions.contentItems = {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          itemType: true,
          duration: true,
          isRequired: true,
          isFree: true,
          createdAt: true,
        },
      };

      includeOptions.lessons = {
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: {
              attachments: true,
              progress: true,
            },
          },
        },
      };

      includeOptions.quizzes = {
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      };

      includeOptions.assignments = {
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      };
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: includeOptions,
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== section.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only view sections for your own courses",
      });
    }

    const formattedSection = {
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      isRequired: section.isRequired,
      isFree: section.isFree,
      estimatedTime: section.estimatedTime,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
      course: section.course,
    };

    if (includeStats === "true" && section._count) {
      formattedSection.stats = {
        totalContentItems: section._count.contentItems,
        totalLessons: section._count.lessons,
        totalQuizzes: section._count.quizzes,
        totalAssignments: section._count.assignments,
        totalDiscussions: section._count.discussions,
        totalContent:
          section._count.contentItems +
          section._count.lessons +
          section._count.quizzes +
          section._count.assignments,
      };
    }

    if (includeContent === "true") {
      formattedSection.content = {
        contentItems: section.contentItems || [],
        lessons: section.lessons || [],
        quizzes: section.quizzes || [],
        assignments: section.assignments || [],
      };
    }

    educademyLogger.performance("GET_SECTION_BY_ID", startTime, {
      sectionId,
      includeContent: includeContent === "true",
      includeStats: includeStats === "true",
    });

    res.status(200).json({
      success: true,
      message: "Section retrieved successfully",
      data: {
        section: formattedSection,
      },
    });
  } catch (error) {
    educademyLogger.error("Get section by ID failed", error, {
      userId: req.userAuthId,
      sectionId,
      business: {
        operation: "GET_SECTION_BY_ID",
        entity: "SECTION",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve section",
      requestId,
    });
  }
});

export const toggleSectionStatus = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { sectionId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "SectionController",
    methodName: "toggleSectionStatus",
  });

  try {
    const { field, value } = req.body;

    const validFields = ["isRequired", "isFree"];
    if (!validFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: `Invalid field. Must be one of: ${validFields.join(", ")}`,
      });
    }

    if (typeof value !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Value must be a boolean",
      });
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: {
            id: true,
            instructorId: true,
            status: true,
            title: true,
          },
        },
      },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== section.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only modify sections for your own courses",
      });
    }

    if (section.course.status === "UNDER_REVIEW") {
      return res.status(400).json({
        success: false,
        message: "Cannot modify section status while course is under review",
      });
    }

    const updateData = { [field]: value };

    const updatedSection = await prisma.section.update({
      where: { id: sectionId },
      data: updateData,
    });

    await prisma.course.update({
      where: { id: section.courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    educademyLogger.logBusinessOperation(
      "TOGGLE_SECTION_STATUS",
      "SECTION",
      sectionId,
      "SUCCESS",
      {
        sectionTitle: section.title,
        field,
        oldValue: section[field],
        newValue: value,
        courseId: section.courseId,
      }
    );

    educademyLogger.logAuditTrail(
      "TOGGLE_SECTION_STATUS",
      "SECTION",
      sectionId,
      { [field]: section[field] },
      updateData,
      req.userAuthId
    );

    educademyLogger.performance("TOGGLE_SECTION_STATUS", startTime, {
      sectionId,
      field,
    });

    res.status(200).json({
      success: true,
      message: `Section ${field} ${
        value ? "enabled" : "disabled"
      } successfully`,
      data: {
        section: {
          id: updatedSection.id,
          title: updatedSection.title,
          [field]: updatedSection[field],
        },
        change: {
          field,
          from: section[field],
          to: value,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Toggle section status failed", error, {
      userId: req.userAuthId,
      sectionId,
      business: {
        operation: "TOGGLE_SECTION_STATUS",
        entity: "SECTION",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to toggle section status",
      requestId,
    });
  }
});
