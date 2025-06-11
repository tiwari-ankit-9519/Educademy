import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import educademyLogger from "../../utils/logger.js";
import emailService from "../../utils/emailService.js";
import { performance } from "perf_hooks";
import {
  uploadCourseMedia,
  deleteFromCloudinary,
} from "../../config/upload.js";

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

export const createAssignment = asyncHandler(async (req, res) => {
  uploadCourseMedia.fields([
    { name: "resources", maxCount: 10 },
    { name: "rubricFile", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      educademyLogger.logValidationError("fileUpload", req.files, err.message, {
        userId: req.userAuthId,
        operation: "CREATE_ASSIGNMENT",
      });
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const startTime = performance.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    educademyLogger.setContext({
      requestId,
      userId: req.userAuthId,
      className: "AssignmentController",
      methodName: "createAssignment",
    });

    educademyLogger.logMethodEntry("AssignmentController", "createAssignment", {
      userId: req.userAuthId,
      sectionId: req.params.sectionId,
      title: req.body.title,
    });

    try {
      const { sectionId } = req.params;
      const {
        title,
        description,
        instructions,
        dueDate,
        totalPoints,
        order,
        allowLateSubmission = false,
        latePenalty,
        resources,
        rubric,
      } = req.body;

      // Validation
      if (!title?.trim()) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        return res.status(400).json({
          success: false,
          message: "Title is required",
        });
      }

      if (!description?.trim()) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        return res.status(400).json({
          success: false,
          message: "Description is required",
        });
      }

      if (!instructions?.trim()) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        return res.status(400).json({
          success: false,
          message: "Instructions are required",
        });
      }

      if (!totalPoints || totalPoints <= 0) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        return res.status(400).json({
          success: false,
          message: "Total points must be greater than 0",
        });
      }

      if (latePenalty !== undefined && (latePenalty < 0 || latePenalty > 100)) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        return res.status(400).json({
          success: false,
          message: "Late penalty must be between 0 and 100 percent",
        });
      }

      // Check section ownership
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
        },
      });

      if (!section) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        return res.status(404).json({
          success: false,
          message: "Section not found",
        });
      }

      const instructor = await prisma.instructor.findUnique({
        where: { userId: req.userAuthId },
        select: { id: true, isVerified: true },
      });

      if (!instructor || instructor.id !== section.course.instructorId) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        return res.status(403).json({
          success: false,
          message: "You can only create assignments for your own courses",
        });
      }

      if (!instructor.isVerified) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        return res.status(403).json({
          success: false,
          message: "Only verified instructors can create assignments",
        });
      }

      // Handle order
      let assignmentOrder = order;
      if (assignmentOrder === undefined) {
        const lastAssignment = await prisma.assignment.findFirst({
          where: { sectionId },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        assignmentOrder = lastAssignment ? lastAssignment.order + 1 : 1;
      }

      // Check for existing assignment with same order
      const existingAssignment = await prisma.assignment.findFirst({
        where: {
          sectionId,
          order: assignmentOrder,
        },
      });

      if (existingAssignment) {
        await prisma.assignment.updateMany({
          where: {
            sectionId,
            order: { gte: assignmentOrder },
          },
          data: {
            order: { increment: 1 },
          },
        });
      }

      // Process uploaded files
      const uploadedResources = req.files?.resources || [];
      const uploadedRubricFile = req.files?.rubricFile?.[0] || null;

      // Parse and validate due date
      let parsedDueDate = null;
      if (dueDate) {
        parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          if (req.files) {
            Object.values(req.files)
              .flat()
              .forEach((file) => {
                if (file.filename) {
                  deleteFromCloudinary(file.filename).catch(() => {});
                }
              });
          }

          return res.status(400).json({
            success: false,
            message: "Invalid due date format",
          });
        }

        // Check if due date is in the future
        if (parsedDueDate <= new Date()) {
          if (req.files) {
            Object.values(req.files)
              .flat()
              .forEach((file) => {
                if (file.filename) {
                  deleteFromCloudinary(file.filename).catch(() => {});
                }
              });
          }

          return res.status(400).json({
            success: false,
            message: "Due date must be in the future",
          });
        }
      }

      // Parse resources and rubric
      const parseArrayField = (field) => {
        if (typeof field === "string") {
          try {
            return JSON.parse(field);
          } catch {
            return field
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);
          }
        }
        return Array.isArray(field) ? field : [];
      };

      let parsedResources = parseArrayField(resources);

      // Add uploaded resource files to resources array
      if (uploadedResources.length > 0) {
        const uploadedResourcesData = uploadedResources.map((file) => ({
          name: file.originalname,
          url: file.path,
          type: file.mimetype,
          size: file.size,
        }));
        parsedResources = [...parsedResources, ...uploadedResourcesData];
      }

      let parsedRubric = null;
      if (rubric) {
        try {
          parsedRubric =
            typeof rubric === "string" ? JSON.parse(rubric) : rubric;
        } catch {
          parsedRubric = null;
        }
      }

      // Add uploaded rubric file to rubric
      if (uploadedRubricFile) {
        if (!parsedRubric) {
          parsedRubric = {};
        }
        parsedRubric.file = {
          name: uploadedRubricFile.originalname,
          url: uploadedRubricFile.path,
          type: uploadedRubricFile.mimetype,
          size: uploadedRubricFile.size,
        };
      }

      // Create assignment
      const assignment = await prisma.assignment.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
          dueDate: parsedDueDate,
          totalPoints: parseInt(totalPoints),
          order: assignmentOrder,
          allowLateSubmission:
            allowLateSubmission === "true" || allowLateSubmission === true,
          latePenalty: latePenalty ? parseFloat(latePenalty) : null,
          resources:
            parsedResources.length > 0 ? JSON.stringify(parsedResources) : null,
          rubric: parsedRubric ? JSON.stringify(parsedRubric) : null,
          sectionId,
        },
        include: {
          section: {
            select: {
              id: true,
              title: true,
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
          },
          submissions: {
            select: {
              id: true,
              status: true,
              submittedAt: true,
              grade: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      });

      // Update section and course timestamps
      await Promise.all([
        prisma.section.update({
          where: { id: sectionId },
          data: { updatedAt: new Date() },
        }),
        prisma.course.update({
          where: { id: section.course.id },
          data: {
            updatedAt: new Date(),
            totalAssignments: { increment: 1 },
          },
        }),
      ]);

      // Create notification for instructor
      await prisma.notification.create({
        data: {
          type: "ASSIGNMENT_CREATED",
          title: "Assignment Created",
          message: `Assignment "${title}" has been created successfully.`,
          userId: req.userAuthId,
          priority: "NORMAL",
          data: {
            assignmentId: assignment.id,
            assignmentTitle: title,
            sectionId,
            courseId: section.course.id,
            courseTitle: section.course.title,
          },
        },
      });

      // If course is published, notify enrolled students
      if (section.course.status === "PUBLISHED") {
        try {
          const enrolledStudents = await prisma.enrollment.findMany({
            where: {
              courseId: section.course.id,
              status: "ACTIVE",
            },
            include: {
              student: {
                include: {
                  user: {
                    select: { id: true, firstName: true, email: true },
                  },
                },
              },
            },
            take: 100,
          });

          const notificationPromises = enrolledStudents.map((enrollment) =>
            prisma.notification
              .create({
                data: {
                  type: "NEW_ASSIGNMENT",
                  title: "New Assignment Available",
                  message: `A new assignment "${title}" has been added to your course.`,
                  userId: enrollment.student.user.id,
                  priority: parsedDueDate ? "HIGH" : "NORMAL",
                  data: {
                    assignmentId: assignment.id,
                    assignmentTitle: title,
                    courseId: section.course.id,
                    courseTitle: section.course.title,
                    dueDate: parsedDueDate,
                    totalPoints: parseInt(totalPoints),
                  },
                },
              })
              .catch((error) => {
                educademyLogger.error(
                  "Failed to create student notification",
                  error,
                  {
                    userId: enrollment.student.user.id,
                    assignmentId: assignment.id,
                  }
                );
              })
          );

          await Promise.allSettled(notificationPromises);

          // Send email notifications for assignments with due dates
          if (parsedDueDate) {
            const emailPromises = enrolledStudents
              .slice(0, 50)
              .map((enrollment) =>
                emailService
                  .sendEmail({
                    to: enrollment.student.user.email,
                    subject: `📋 New Assignment: ${title}`,
                    html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #366092;">New Assignment Available</h2>
                    <p>Hi ${enrollment.student.user.firstName},</p>
                    <p>A new assignment has been added to your course:</p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="color: #366092; margin-top: 0;">${title}</h3>
                      <p><strong>Course:</strong> ${section.course.title}</p>
                      <p><strong>Due Date:</strong> ${parsedDueDate.toLocaleDateString()}</p>
                      <p><strong>Total Points:</strong> ${totalPoints}</p>
                      <p><strong>Description:</strong> ${description.substring(
                        0,
                        200
                      )}${description.length > 200 ? "..." : ""}</p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.FRONTEND_URL}/courses/${
                      section.course.id
                    }/assignments/${assignment.id}" 
                         style="background: #366092; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                        View Assignment
                      </a>
                    </div>

                    <p>Best regards,<br>The Educademy Team</p>
                  </div>
                `,
                  })
                  .catch((error) => {
                    educademyLogger.error(
                      "Failed to send assignment email",
                      error,
                      {
                        userId: enrollment.student.user.id,
                        assignmentId: assignment.id,
                        email: enrollment.student.user.email,
                      }
                    );
                  })
              );

            await Promise.allSettled(emailPromises);
          }
        } catch (notificationError) {
          educademyLogger.error(
            "Failed to send assignment notifications",
            notificationError,
            {
              userId: req.userAuthId,
              assignmentId: assignment.id,
            }
          );
        }
      }

      educademyLogger.logBusinessOperation(
        "CREATE_ASSIGNMENT",
        "ASSIGNMENT",
        assignment.id,
        "SUCCESS",
        {
          assignmentTitle: title,
          sectionId,
          courseId: section.course.id,
          totalPoints: parseInt(totalPoints),
          hasDueDate: !!parsedDueDate,
          hasResources: parsedResources.length > 0,
          hasRubric: !!parsedRubric,
          allowLateSubmission,
          order: assignmentOrder,
          instructorId: section.course.instructorId,
          userId: req.userAuthId,
        }
      );

      educademyLogger.performance("CREATE_ASSIGNMENT", startTime, {
        userId: req.userAuthId,
        assignmentId: assignment.id,
        sectionId,
        courseId: section.course.id,
      });

      educademyLogger.logMethodExit(
        "AssignmentController",
        "createAssignment",
        true,
        performance.now() - startTime
      );

      const responseData = {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          instructions: assignment.instructions,
          dueDate: assignment.dueDate,
          totalPoints: assignment.totalPoints,
          order: assignment.order,
          allowLateSubmission: assignment.allowLateSubmission,
          latePenalty: assignment.latePenalty,
          resources: assignment.resources
            ? JSON.parse(assignment.resources)
            : [],
          rubric: assignment.rubric ? JSON.parse(assignment.rubric) : null,
          sectionId: assignment.sectionId,
          section: assignment.section,
          stats: {
            totalSubmissions: assignment._count.submissions,
            pendingSubmissions: assignment.submissions.filter(
              (s) => s.status === "SUBMITTED"
            ).length,
            gradedSubmissions: assignment.submissions.filter(
              (s) => s.status === "GRADED"
            ).length,
          },
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt,
        },
      };

      res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        data: responseData,
      });
    } catch (error) {
      if (req.files) {
        Object.values(req.files)
          .flat()
          .forEach((file) => {
            if (file.filename) {
              deleteFromCloudinary(file.filename).catch((err) => {
                educademyLogger.warn(
                  "Failed to delete uploaded file after error",
                  {
                    filename: file.filename,
                    error: err.message,
                  }
                );
              });
            }
          });
      }

      educademyLogger.error("Create assignment failed", error, {
        userId: req.userAuthId,
        sectionId: req.params.sectionId,
        title: req.body.title,
        business: {
          operation: "CREATE_ASSIGNMENT",
          entity: "ASSIGNMENT",
          status: "ERROR",
        },
      });

      educademyLogger.logMethodExit(
        "AssignmentController",
        "createAssignment",
        false,
        performance.now() - startTime
      );

      res.status(500).json({
        success: false,
        message: "Failed to create assignment",
        requestId,
      });
    }
  });
});

export const updateAssignment = asyncHandler(async (req, res) => {
  uploadCourseMedia.fields([
    { name: "resources", maxCount: 10 },
    { name: "rubricFile", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      educademyLogger.logValidationError("fileUpload", req.files, err.message, {
        userId: req.userAuthId,
        operation: "UPDATE_ASSIGNMENT",
      });
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const startTime = performance.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    const { assignmentId } = req.params;

    educademyLogger.setContext({
      requestId,
      userId: req.userAuthId,
      className: "AssignmentController",
      methodName: "updateAssignment",
    });

    try {
      const {
        title,
        description,
        instructions,
        dueDate,
        totalPoints,
        order,
        allowLateSubmission,
        latePenalty,
        resources,
        rubric,
        removeResources = [],
        removeRubricFile = false,
      } = req.body;

      // Get current assignment
      const currentAssignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          section: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  instructorId: true,
                  status: true,
                },
              },
            },
          },
          submissions: {
            select: {
              id: true,
              status: true,
              submittedAt: true,
              grade: true,
            },
          },
        },
      });

      if (!currentAssignment) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      // Check ownership
      const instructor = await prisma.instructor.findUnique({
        where: { userId: req.userAuthId },
        select: { id: true, isVerified: true },
      });

      if (
        !instructor ||
        instructor.id !== currentAssignment.section.course.instructorId
      ) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        return res.status(403).json({
          success: false,
          message: "You can only update assignments for your own courses",
        });
      }

      // Check if assignment has submissions - restrict certain changes
      const hasSubmissions = currentAssignment.submissions.length > 0;
      const hasGradedSubmissions = currentAssignment.submissions.some(
        (s) => s.status === "GRADED"
      );

      if (
        hasGradedSubmissions &&
        totalPoints &&
        parseInt(totalPoints) !== currentAssignment.totalPoints
      ) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        return res.status(400).json({
          success: false,
          message:
            "Cannot change total points for assignments with graded submissions",
        });
      }

      const updateData = {};

      // Validate and update fields
      if (title !== undefined) {
        if (!title.trim()) {
          if (req.files) {
            Object.values(req.files)
              .flat()
              .forEach((file) => {
                if (file.filename) {
                  deleteFromCloudinary(file.filename).catch(() => {});
                }
              });
          }

          return res.status(400).json({
            success: false,
            message: "Title cannot be empty",
          });
        }
        updateData.title = title.trim();
      }

      if (description !== undefined) {
        if (!description.trim()) {
          if (req.files) {
            Object.values(req.files)
              .flat()
              .forEach((file) => {
                if (file.filename) {
                  deleteFromCloudinary(file.filename).catch(() => {});
                }
              });
          }

          return res.status(400).json({
            success: false,
            message: "Description cannot be empty",
          });
        }
        updateData.description = description.trim();
      }

      if (instructions !== undefined) {
        if (!instructions.trim()) {
          if (req.files) {
            Object.values(req.files)
              .flat()
              .forEach((file) => {
                if (file.filename) {
                  deleteFromCloudinary(file.filename).catch(() => {});
                }
              });
          }

          return res.status(400).json({
            success: false,
            message: "Instructions cannot be empty",
          });
        }
        updateData.instructions = instructions.trim();
      }

      if (totalPoints !== undefined) {
        if (totalPoints <= 0) {
          if (req.files) {
            Object.values(req.files)
              .flat()
              .forEach((file) => {
                if (file.filename) {
                  deleteFromCloudinary(file.filename).catch(() => {});
                }
              });
          }

          return res.status(400).json({
            success: false,
            message: "Total points must be greater than 0",
          });
        }
        updateData.totalPoints = parseInt(totalPoints);
      }

      if (dueDate !== undefined) {
        if (dueDate) {
          const parsedDueDate = new Date(dueDate);
          if (isNaN(parsedDueDate.getTime())) {
            if (req.files) {
              Object.values(req.files)
                .flat()
                .forEach((file) => {
                  if (file.filename) {
                    deleteFromCloudinary(file.filename).catch(() => {});
                  }
                });
            }

            return res.status(400).json({
              success: false,
              message: "Invalid due date format",
            });
          }

          // Allow past due dates for updates (instructor might extend deadline)
          updateData.dueDate = parsedDueDate;
        } else {
          updateData.dueDate = null;
        }
      }

      if (allowLateSubmission !== undefined) {
        updateData.allowLateSubmission =
          allowLateSubmission === "true" || allowLateSubmission === true;
      }

      if (latePenalty !== undefined) {
        if (latePenalty !== null && (latePenalty < 0 || latePenalty > 100)) {
          if (req.files) {
            Object.values(req.files)
              .flat()
              .forEach((file) => {
                if (file.filename) {
                  deleteFromCloudinary(file.filename).catch(() => {});
                }
              });
          }

          return res.status(400).json({
            success: false,
            message: "Late penalty must be between 0 and 100 percent",
          });
        }
        updateData.latePenalty = latePenalty ? parseFloat(latePenalty) : null;
      }

      // Handle order change
      if (order !== undefined && order !== currentAssignment.order) {
        if (order < 0) {
          if (req.files) {
            Object.values(req.files)
              .flat()
              .forEach((file) => {
                if (file.filename) {
                  deleteFromCloudinary(file.filename).catch(() => {});
                }
              });
          }

          return res.status(400).json({
            success: false,
            message: "Order must be a non-negative number",
          });
        }

        const conflictingAssignment = await prisma.assignment.findFirst({
          where: {
            sectionId: currentAssignment.sectionId,
            order,
            id: { not: assignmentId },
          },
        });

        if (conflictingAssignment) {
          if (order > currentAssignment.order) {
            await prisma.assignment.updateMany({
              where: {
                sectionId: currentAssignment.sectionId,
                order: {
                  gt: currentAssignment.order,
                  lte: order,
                },
                id: { not: assignmentId },
              },
              data: {
                order: { decrement: 1 },
              },
            });
          } else {
            await prisma.assignment.updateMany({
              where: {
                sectionId: currentAssignment.sectionId,
                order: {
                  gte: order,
                  lt: currentAssignment.order,
                },
                id: { not: assignmentId },
              },
              data: {
                order: { increment: 1 },
              },
            });
          }
        }

        updateData.order = order;
      }

      // Handle resources
      const uploadedResources = req.files?.resources || [];
      let currentResources = [];

      if (currentAssignment.resources) {
        try {
          currentResources = JSON.parse(currentAssignment.resources);
        } catch {
          currentResources = [];
        }
      }

      // Remove specified resources
      if (removeResources.length > 0) {
        const resourcesToRemove = Array.isArray(removeResources)
          ? removeResources
          : [removeResources];
        currentResources = currentResources.filter(
          (_, index) => !resourcesToRemove.includes(index.toString())
        );
      }

      // Add new text/link resources
      if (resources !== undefined) {
        const parseArrayField = (field) => {
          if (typeof field === "string") {
            try {
              return JSON.parse(field);
            } catch {
              return field
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
            }
          }
          return Array.isArray(field) ? field : [];
        };

        const newTextResources = parseArrayField(resources);
        currentResources = [...currentResources, ...newTextResources];
      }

      // Add uploaded resource files
      if (uploadedResources.length > 0) {
        const uploadedResourcesData = uploadedResources.map((file) => ({
          name: file.originalname,
          url: file.path,
          type: file.mimetype,
          size: file.size,
        }));
        currentResources = [...currentResources, ...uploadedResourcesData];
      }

      updateData.resources =
        currentResources.length > 0 ? JSON.stringify(currentResources) : null;

      // Handle rubric
      const uploadedRubricFile = req.files?.rubricFile?.[0] || null;
      let currentRubric = null;

      if (currentAssignment.rubric) {
        try {
          currentRubric = JSON.parse(currentAssignment.rubric);
        } catch {
          currentRubric = null;
        }
      }

      // Remove existing rubric file if requested
      if (removeRubricFile === "true" || removeRubricFile === true) {
        if (currentRubric?.file?.url) {
          try {
            await deleteFromCloudinary(currentRubric.file.url);
          } catch (deleteError) {
            educademyLogger.warn("Failed to delete rubric file", {
              assignmentId,
              fileUrl: currentRubric.file.url,
              error: deleteError.message,
            });
          }
        }
        if (currentRubric) {
          delete currentRubric.file;
        }
      }

      // Update rubric text/criteria
      if (rubric !== undefined) {
        try {
          const newRubricData =
            typeof rubric === "string" ? JSON.parse(rubric) : rubric;
          currentRubric = { ...currentRubric, ...newRubricData };
        } catch {
          // Invalid JSON, skip rubric update
        }
      }

      // Add new rubric file
      if (uploadedRubricFile) {
        if (!currentRubric) {
          currentRubric = {};
        }

        // Delete old rubric file if exists
        if (currentRubric.file?.url) {
          try {
            await deleteFromCloudinary(currentRubric.file.url);
          } catch (deleteError) {
            educademyLogger.warn("Failed to delete old rubric file", {
              assignmentId,
              fileUrl: currentRubric.file.url,
              error: deleteError.message,
            });
          }
        }

        currentRubric.file = {
          name: uploadedRubricFile.originalname,
          url: uploadedRubricFile.path,
          type: uploadedRubricFile.mimetype,
          size: uploadedRubricFile.size,
        };
      }

      updateData.rubric = currentRubric ? JSON.stringify(currentRubric) : null;
      updateData.updatedAt = new Date();

      // Update assignment
      const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: updateData,
        include: {
          section: {
            select: {
              id: true,
              title: true,
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
          },
          submissions: {
            select: {
              id: true,
              status: true,
              submittedAt: true,
              grade: true,
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      });

      // Update section and course timestamps
      await Promise.all([
        prisma.section.update({
          where: { id: currentAssignment.sectionId },
          data: { updatedAt: new Date() },
        }),
        prisma.course.update({
          where: { id: currentAssignment.section.course.id },
          data: { updatedAt: new Date() },
        }),
      ]);

      // Notify students if assignment is published and has significant changes
      const significantFields = [
        "title",
        "description",
        "instructions",
        "dueDate",
        "totalPoints",
      ];
      const hasSignificantChanges = significantFields.some(
        (field) => updateData[field] !== undefined
      );

      if (
        hasSignificantChanges &&
        currentAssignment.section.course.status === "PUBLISHED"
      ) {
        try {
          const enrolledStudents = await prisma.enrollment.findMany({
            where: {
              courseId: currentAssignment.section.course.id,
              status: "ACTIVE",
            },
            include: {
              student: {
                include: {
                  user: {
                    select: { id: true, firstName: true, email: true },
                  },
                },
              },
            },
            take: 100,
          });

          const notificationPromises = enrolledStudents.map((enrollment) =>
            prisma.notification
              .create({
                data: {
                  type: "ASSIGNMENT_UPDATED",
                  title: "Assignment Updated",
                  message: `The assignment "${updatedAssignment.title}" has been updated.`,
                  userId: enrollment.student.user.id,
                  priority: updateData.dueDate ? "HIGH" : "NORMAL",
                  data: {
                    assignmentId: updatedAssignment.id,
                    assignmentTitle: updatedAssignment.title,
                    courseId: currentAssignment.section.course.id,
                    courseTitle: currentAssignment.section.course.title,
                    changedFields: Object.keys(updateData),
                    dueDate: updatedAssignment.dueDate,
                  },
                },
              })
              .catch((error) => {
                educademyLogger.error(
                  "Failed to create student notification",
                  error,
                  {
                    userId: enrollment.student.user.id,
                    assignmentId: updatedAssignment.id,
                  }
                );
              })
          );

          await Promise.allSettled(notificationPromises);
        } catch (notificationError) {
          educademyLogger.error(
            "Failed to send assignment update notifications",
            notificationError,
            {
              userId: req.userAuthId,
              assignmentId: updatedAssignment.id,
            }
          );
        }
      }

      educademyLogger.logBusinessOperation(
        "UPDATE_ASSIGNMENT",
        "ASSIGNMENT",
        assignmentId,
        "SUCCESS",
        {
          assignmentTitle: updatedAssignment.title,
          sectionId: currentAssignment.sectionId,
          courseId: currentAssignment.section.course.id,
          changedFields: Object.keys(updateData),
          hasSignificantChanges,
          hasSubmissions,
          hasGradedSubmissions,
          userId: req.userAuthId,
        }
      );

      educademyLogger.logAuditTrail(
        "UPDATE_ASSIGNMENT",
        "ASSIGNMENT",
        assignmentId,
        {
          title: currentAssignment.title,
          totalPoints: currentAssignment.totalPoints,
          dueDate: currentAssignment.dueDate,
          order: currentAssignment.order,
        },
        updateData,
        req.userAuthId
      );

      educademyLogger.performance("UPDATE_ASSIGNMENT", startTime, {
        userId: req.userAuthId,
        assignmentId,
        changedFields: Object.keys(updateData).length,
        hasSignificantChanges,
      });

      educademyLogger.logMethodExit(
        "AssignmentController",
        "updateAssignment",
        true,
        performance.now() - startTime
      );

      const responseData = {
        assignment: {
          id: updatedAssignment.id,
          title: updatedAssignment.title,
          description: updatedAssignment.description,
          instructions: updatedAssignment.instructions,
          dueDate: updatedAssignment.dueDate,
          totalPoints: updatedAssignment.totalPoints,
          order: updatedAssignment.order,
          allowLateSubmission: updatedAssignment.allowLateSubmission,
          latePenalty: updatedAssignment.latePenalty,
          resources: updatedAssignment.resources
            ? JSON.parse(updatedAssignment.resources)
            : [],
          rubric: updatedAssignment.rubric
            ? JSON.parse(updatedAssignment.rubric)
            : null,
          sectionId: updatedAssignment.sectionId,
          section: updatedAssignment.section,
          stats: {
            totalSubmissions: updatedAssignment._count.submissions,
            pendingSubmissions: updatedAssignment.submissions.filter(
              (s) => s.status === "SUBMITTED"
            ).length,
            gradedSubmissions: updatedAssignment.submissions.filter(
              (s) => s.status === "GRADED"
            ).length,
            averageGrade:
              updatedAssignment.submissions
                .filter((s) => s.grade !== null)
                .reduce((sum, s, _, arr) => sum + s.grade / arr.length, 0) || 0,
          },
          recentSubmissions: updatedAssignment.submissions.slice(0, 5),
          createdAt: updatedAssignment.createdAt,
          updatedAt: updatedAssignment.updatedAt,
        },
        changes: {
          fieldsUpdated: Object.keys(updateData),
          hasSignificantChanges,
          orderChanged: updateData.order !== undefined,
          notificationsTriggered:
            hasSignificantChanges &&
            currentAssignment.section.course.status === "PUBLISHED",
        },
      };

      res.status(200).json({
        success: true,
        message: "Assignment updated successfully",
        data: responseData,
      });
    } catch (error) {
      if (req.files) {
        Object.values(req.files)
          .flat()
          .forEach((file) => {
            if (file.filename) {
              deleteFromCloudinary(file.filename).catch((err) => {
                educademyLogger.warn(
                  "Failed to delete uploaded file after error",
                  {
                    filename: file.filename,
                    error: err.message,
                  }
                );
              });
            }
          });
      }

      educademyLogger.error("Update assignment failed", error, {
        userId: req.userAuthId,
        assignmentId,
        business: {
          operation: "UPDATE_ASSIGNMENT",
          entity: "ASSIGNMENT",
          status: "ERROR",
        },
      });

      educademyLogger.logMethodExit(
        "AssignmentController",
        "updateAssignment",
        false,
        performance.now() - startTime
      );

      res.status(500).json({
        success: false,
        message: "Failed to update assignment",
        requestId,
      });
    }
  });
});

export const bulkGradeSubmissions = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { assignmentId } = req.params;
  const { grades } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AssignmentController",
    methodName: "bulkGradeSubmissions",
  });

  try {
    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Grades array is required",
      });
    }

    for (const gradeItem of grades) {
      if (
        !gradeItem.submissionId ||
        typeof gradeItem.grade !== "number" ||
        gradeItem.grade < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each grade item must have submissionId and a non-negative grade",
        });
      }
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        section: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (
      !instructor ||
      instructor.id !== assignment.section.course.instructorId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only grade submissions for your own assignments",
      });
    }

    const invalidGrades = grades.filter(
      (g) => g.grade > assignment.totalPoints
    );
    if (invalidGrades.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some grades exceed assignment total points (${assignment.totalPoints})`,
        invalidGrades: invalidGrades.map((g) => ({
          submissionId: g.submissionId,
          grade: g.grade,
        })),
      });
    }

    const submissionIds = grades.map((g) => g.submissionId);
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        id: { in: submissionIds },
        assignmentId,
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
              },
            },
          },
        },
      },
    });

    if (submissions.length !== submissionIds.length) {
      return res.status(400).json({
        success: false,
        message:
          "Some submissions do not exist or do not belong to this assignment",
      });
    }

    const updatePromises = grades.map((gradeItem) => {
      const { submissionId, grade, feedback, status = "GRADED" } = gradeItem;

      return prisma.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          grade,
          feedback: feedback?.trim() || null,
          status,
          updatedAt: new Date(),
        },
      });
    });

    const updatedSubmissions = await Promise.all(updatePromises);

    const notificationPromises = submissions.map((submission) => {
      const gradeItem = grades.find((g) => g.submissionId === submission.id);
      const percentage = Math.round(
        (gradeItem.grade / assignment.totalPoints) * 100
      );

      return prisma.notification
        .create({
          data: {
            type: "ASSIGNMENT_GRADED",
            title: "Assignment Graded",
            message: `Your assignment "${assignment.title}" has been graded. You received ${gradeItem.grade}/${assignment.totalPoints} points (${percentage}%).`,
            userId: submission.student.user.id,
            priority: "NORMAL",
            data: {
              assignmentId: assignment.id,
              assignmentTitle: assignment.title,
              submissionId: submission.id,
              grade: gradeItem.grade,
              totalPoints: assignment.totalPoints,
              percentage,
              feedback: gradeItem.feedback?.trim() || null,
            },
          },
        })
        .catch((error) => {
          educademyLogger.error(
            "Failed to create bulk grade notification",
            error,
            {
              userId: submission.student.user.id,
              submissionId: submission.id,
            }
          );
        });
    });

    await Promise.allSettled(notificationPromises);

    try {
      const emailPromises = submissions.slice(0, 20).map((submission) => {
        const gradeItem = grades.find((g) => g.submissionId === submission.id);
        const percentage = Math.round(
          (gradeItem.grade / assignment.totalPoints) * 100
        );

        return emailService
          .sendEmail({
            to: submission.student.user.email,
            subject: `📊 Assignment Graded: ${assignment.title}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #366092;">Assignment Graded</h2>
              <p>Hi ${submission.student.user.firstName},</p>
              <p>Your assignment has been graded:</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #366092; margin-top: 0;">${
                  assignment.title
                }</h3>
                <p><strong>Grade:</strong> ${gradeItem.grade}/${
              assignment.totalPoints
            } (${percentage}%)</p>
                ${
                  gradeItem.feedback
                    ? `<p><strong>Feedback:</strong></p><p style="background: white; padding: 15px; border-left: 4px solid #366092;">${gradeItem.feedback}</p>`
                    : ""
                }
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/courses/${
              assignment.section.course.id
            }/assignments/${assignmentId}/submissions/${submission.id}" 
                   style="background: #366092; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                  View Submission
                </a>
              </div>

              <p>Best regards,<br>The Educademy Team</p>
            </div>
          `,
          })
          .catch((error) => {
            educademyLogger.error("Failed to send bulk grade email", error, {
              userId: submission.student.user.id,
              submissionId: submission.id,
              email: submission.student.user.email,
            });
          });
      });

      await Promise.allSettled(emailPromises);
    } catch (emailError) {
      educademyLogger.error("Failed to send bulk grade emails", emailError, {
        userId: req.userAuthId,
        assignmentId,
      });
    }

    educademyLogger.logBusinessOperation(
      "BULK_GRADE_SUBMISSIONS",
      "ASSIGNMENT_SUBMISSION",
      assignmentId,
      "SUCCESS",
      {
        assignmentId,
        assignmentTitle: assignment.title,
        submissionsGraded: grades.length,
        averageGrade:
          grades.reduce((sum, g) => sum + g.grade, 0) / grades.length,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("BULK_GRADE_SUBMISSIONS", startTime, {
      userId: req.userAuthId,
      assignmentId,
      submissionsCount: grades.length,
    });

    const responseData = {
      gradedSubmissions: updatedSubmissions.map((submission, index) => {
        const gradeItem = grades[index];
        const percentage = Math.round(
          (gradeItem.grade / assignment.totalPoints) * 100
        );

        return {
          id: submission.id,
          grade: submission.grade,
          feedback: submission.feedback,
          status: submission.status,
          percentage,
          updatedAt: submission.updatedAt,
        };
      }),
      summary: {
        totalGraded: grades.length,
        averageGrade:
          grades.reduce((sum, g) => sum + g.grade, 0) / grades.length,
        averagePercentage:
          grades.reduce(
            (sum, g) => sum + (g.grade / assignment.totalPoints) * 100,
            0
          ) / grades.length,
        assignment: {
          id: assignment.id,
          title: assignment.title,
          totalPoints: assignment.totalPoints,
        },
      },
    };

    res.status(200).json({
      success: true,
      message: `Successfully graded ${grades.length} submissions`,
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Bulk grade submissions failed", error, {
      userId: req.userAuthId,
      assignmentId,
      business: {
        operation: "BULK_GRADE_SUBMISSIONS",
        entity: "ASSIGNMENT_SUBMISSION",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to bulk grade submissions",
      requestId,
    });
  }
});

export const getSectionAssignments = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { sectionId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AssignmentController",
    methodName: "getSectionAssignments",
  });

  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "order",
      sortOrder = "asc",
      includeSubmissions = false,
      status,
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

    // Check section ownership
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
        message: "You can only view assignments for your own courses",
      });
    }

    // Build where clause
    const whereClause = {
      sectionId,
    };

    if (search?.trim()) {
      whereClause.OR = [
        {
          title: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    // Status filter (based on due date)
    if (status) {
      const now = new Date();
      switch (status) {
        case "upcoming":
          whereClause.dueDate = { gte: now };
          break;
        case "overdue":
          whereClause.dueDate = { lt: now };
          break;
        case "no_due_date":
          whereClause.dueDate = null;
          break;
      }
    }

    // Build order by
    const validSortFields = [
      "title",
      "order",
      "dueDate",
      "totalPoints",
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

    // Build include clause
    const includeClause = {
      section: {
        select: {
          id: true,
          title: true,
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    };

    if (includeSubmissions === "true") {
      includeClause.submissions = {
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
        },
        orderBy: { submittedAt: "desc" },
      };
    }

    // Execute queries
    const [assignments, totalCount, submissionStats] = await Promise.all([
      prisma.assignment.findMany({
        where: whereClause,
        include: includeClause,
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.assignment.count({
        where: whereClause,
      }),

      // Get submission statistics for the section
      prisma.assignmentSubmission.groupBy({
        by: ["status"],
        where: {
          assignment: {
            sectionId,
          },
        },
        _count: {
          id: true,
        },
        _avg: {
          grade: true,
        },
      }),
    ]);

    // Process submission statistics
    const submissionStatusBreakdown = submissionStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = {
        count: stat._count.id,
        averageGrade: stat._avg.grade || 0,
      };
      return acc;
    }, {});

    // Format assignments
    const formattedAssignments = assignments.map((assignment) => {
      const now = new Date();
      const isOverdue = assignment.dueDate && assignment.dueDate < now;

      const baseData = {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate,
        totalPoints: assignment.totalPoints,
        order: assignment.order,
        allowLateSubmission: assignment.allowLateSubmission,
        latePenalty: assignment.latePenalty,
        resources: assignment.resources ? JSON.parse(assignment.resources) : [],
        rubric: assignment.rubric ? JSON.parse(assignment.rubric) : null,
        sectionId: assignment.sectionId,
        section: assignment.section,
        isOverdue,
        stats: {
          totalSubmissions: assignment._count.submissions,
        },
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      };

      if (includeSubmissions === "true" && assignment.submissions) {
        const submissions = assignment.submissions;
        baseData.stats = {
          ...baseData.stats,
          pendingSubmissions: submissions.filter(
            (s) => s.status === "SUBMITTED"
          ).length,
          gradedSubmissions: submissions.filter((s) => s.status === "GRADED")
            .length,
          draftSubmissions: submissions.filter((s) => s.status === "DRAFT")
            .length,
          lateSubmissions: submissions.filter((s) => s.isLate).length,
          averageGrade:
            submissions
              .filter((s) => s.grade !== null)
              .reduce((sum, s, _, arr) => sum + s.grade / arr.length, 0) || 0,
        };

        baseData.recentSubmissions = submissions
          .slice(0, 5)
          .map((submission) => ({
            id: submission.id,
            status: submission.status,
            submittedAt: submission.submittedAt,
            grade: submission.grade,
            isLate: submission.isLate,
            student: {
              name: `${submission.student.user.firstName} ${submission.student.user.lastName}`,
              profileImage: submission.student.user.profileImage,
            },
          }));
      }

      return baseData;
    });

    // Calculate summary statistics
    const now = new Date();
    const summary = {
      totalAssignments: totalCount,
      upcomingAssignments: assignments.filter(
        (a) => a.dueDate && a.dueDate >= now
      ).length,
      overdueAssignments: assignments.filter(
        (a) => a.dueDate && a.dueDate < now
      ).length,
      assignmentsWithoutDueDate: assignments.filter((a) => !a.dueDate).length,
      totalPoints: assignments.reduce((sum, a) => sum + a.totalPoints, 0),
      submissionStats: submissionStatusBreakdown,
    };

    const totalPages = Math.ceil(totalCount / limitNum);

    educademyLogger.logBusinessOperation(
      "GET_SECTION_ASSIGNMENTS",
      "ASSIGNMENT",
      sectionId,
      "SUCCESS",
      {
        sectionId,
        courseId: section.course.id,
        assignmentsReturned: formattedAssignments.length,
        totalAssignments: totalCount,
        includeSubmissions: includeSubmissions === "true",
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_SECTION_ASSIGNMENTS", startTime, {
      userId: req.userAuthId,
      sectionId,
      assignmentsCount: formattedAssignments.length,
      includeSubmissions: includeSubmissions === "true",
    });

    const responseData = {
      assignments: formattedAssignments,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      summary,
      section: {
        id: section.id,
        title: section.title,
        course: section.course,
      },
      filters: {
        applied: {
          search: search || null,
          status: status || null,
          sortBy,
          sortOrder,
        },
        available: {
          statuses: ["upcoming", "overdue", "no_due_date"],
          sortFields: validSortFields,
        },
      },
    };

    res.status(200).json({
      success: true,
      message: "Section assignments fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get section assignments failed", error, {
      userId: req.userAuthId,
      sectionId,
      business: {
        operation: "GET_SECTION_ASSIGNMENTS",
        entity: "ASSIGNMENT",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch section assignments",
      requestId,
    });
  }
});

export const getAssignment = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { assignmentId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AssignmentController",
    methodName: "getAssignment",
  });

  try {
    const { includeSubmissions = false, includeAnalytics = false } = req.query;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        section: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
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
        },
        submissions:
          includeSubmissions === "true"
            ? {
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
                },
                orderBy: { submittedAt: "desc" },
              }
            : {
                select: {
                  id: true,
                  status: true,
                  grade: true,
                  submittedAt: true,
                  isLate: true,
                },
              },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (
      !instructor ||
      instructor.id !== assignment.section.course.instructorId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view assignments for your own courses",
      });
    }

    const submissions = assignment.submissions;
    const now = new Date();
    const isOverdue = assignment.dueDate && assignment.dueDate < now;

    const stats = {
      totalSubmissions: assignment._count.submissions,
      pendingSubmissions: submissions.filter((s) => s.status === "SUBMITTED")
        .length,
      gradedSubmissions: submissions.filter((s) => s.status === "GRADED")
        .length,
      draftSubmissions: submissions.filter((s) => s.status === "DRAFT").length,
      lateSubmissions: submissions.filter((s) => s.isLate).length,
      averageGrade:
        submissions
          .filter((s) => s.grade !== null)
          .reduce(
            (sum, s, _, arr) =>
              arr.length > 0 ? sum + s.grade / arr.length : 0,
            0
          ) || 0,
      submissionRate: 0,
    };

    if (assignment.section.course.status === "PUBLISHED") {
      const enrollmentCount = await prisma.enrollment.count({
        where: {
          courseId: assignment.section.course.id,
          status: "ACTIVE",
        },
      });

      stats.submissionRate =
        enrollmentCount > 0
          ? (stats.totalSubmissions / enrollmentCount) * 100
          : 0;
      stats.totalEnrolledStudents = enrollmentCount;
    }

    let analytics = null;
    if (includeAnalytics === "true") {
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [submissionTrend, gradeDistribution] = await Promise.all([
        prisma.assignmentSubmission.groupBy({
          by: ["submittedAt"],
          where: {
            assignmentId,
            submittedAt: { gte: last30Days },
          },
          _count: { id: true },
        }),

        prisma.assignmentSubmission.findMany({
          where: {
            assignmentId,
            grade: { not: null },
          },
          select: { grade: true },
        }),
      ]);

      const gradeRanges = {
        "90-100": 0,
        "80-89": 0,
        "70-79": 0,
        "60-69": 0,
        "0-59": 0,
      };

      gradeDistribution.forEach((submission) => {
        const percentage = (submission.grade / assignment.totalPoints) * 100;
        if (percentage >= 90) gradeRanges["90-100"]++;
        else if (percentage >= 80) gradeRanges["80-89"]++;
        else if (percentage >= 70) gradeRanges["70-79"]++;
        else if (percentage >= 60) gradeRanges["60-69"]++;
        else gradeRanges["0-59"]++;
      });

      analytics = {
        submissionTrend: submissionTrend.map((item) => ({
          date: item.submittedAt,
          count: item._count.id,
        })),
        gradeDistribution: gradeRanges,
        averageGradePercentage:
          stats.averageGrade > 0
            ? (stats.averageGrade / assignment.totalPoints) * 100
            : 0,
      };
    }

    const responseData = {
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate,
        totalPoints: assignment.totalPoints,
        order: assignment.order,
        allowLateSubmission: assignment.allowLateSubmission,
        latePenalty: assignment.latePenalty,
        resources: assignment.resources ? JSON.parse(assignment.resources) : [],
        rubric: assignment.rubric ? JSON.parse(assignment.rubric) : null,
        sectionId: assignment.sectionId,
        section: assignment.section,
        isOverdue,
        stats,
        submissions:
          includeSubmissions === "true"
            ? submissions.map((submission) => ({
                id: submission.id,
                status: submission.status,
                submittedAt: submission.submittedAt,
                content: submission.content,
                attachments: submission.attachments,
                grade: submission.grade,
                feedback: submission.feedback,
                attempts: submission.attempts,
                timeSpent: submission.timeSpent,
                submissionType: submission.submissionType,
                isLate: submission.isLate,
                student: {
                  id: submission.student.id,
                  name: `${submission.student.user.firstName} ${submission.student.user.lastName}`,
                  email: submission.student.user.email,
                  profileImage: submission.student.user.profileImage,
                },
                createdAt: submission.createdAt,
                updatedAt: submission.updatedAt,
              }))
            : undefined,
        analytics,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      },
    };

    educademyLogger.logBusinessOperation(
      "GET_ASSIGNMENT",
      "ASSIGNMENT",
      assignmentId,
      "SUCCESS",
      {
        assignmentTitle: assignment.title,
        sectionId: assignment.sectionId,
        courseId: assignment.section.course.id,
        includeSubmissions: includeSubmissions === "true",
        includeAnalytics: includeAnalytics === "true",
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_ASSIGNMENT", startTime, {
      userId: req.userAuthId,
      assignmentId,
      includeSubmissions: includeSubmissions === "true",
      includeAnalytics: includeAnalytics === "true",
    });

    res.status(200).json({
      success: true,
      message: "Assignment fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get assignment failed", error, {
      userId: req.userAuthId,
      assignmentId,
      business: {
        operation: "GET_ASSIGNMENT",
        entity: "ASSIGNMENT",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch assignment",
      requestId,
    });
  }
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { assignmentId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AssignmentController",
    methodName: "deleteAssignment",
  });

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        section: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
                status: true,
              },
            },
          },
        },
        submissions: {
          select: {
            id: true,
            status: true,
            attachments: true,
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (
      !instructor ||
      instructor.id !== assignment.section.course.instructorId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete assignments for your own courses",
      });
    }

    const hasSubmissions = assignment.submissions.length > 0;
    const hasGradedSubmissions = assignment.submissions.some(
      (s) => s.status === "GRADED"
    );

    if (hasGradedSubmissions) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete assignment with graded submissions. Consider archiving instead.",
        details: {
          totalSubmissions: assignment.submissions.length,
          gradedSubmissions: assignment.submissions.filter(
            (s) => s.status === "GRADED"
          ).length,
        },
      });
    }

    if (hasSubmissions && assignment.section.course.status === "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete assignment with submissions from published course. Consider archiving instead.",
        details: {
          totalSubmissions: assignment.submissions.length,
          courseStatus: assignment.section.course.status,
        },
      });
    }

    const cleanupPromises = [];

    if (assignment.resources) {
      try {
        const resources = JSON.parse(assignment.resources);
        resources.forEach((resource) => {
          if (resource.url && typeof resource.url === "string") {
            cleanupPromises.push(
              deleteFromCloudinary(resource.url).catch((error) => {
                educademyLogger.warn("Failed to delete resource file", {
                  assignmentId,
                  resourceUrl: resource.url,
                  error: error.message,
                });
              })
            );
          }
        });
      } catch (parseError) {
        educademyLogger.warn(
          "Failed to parse assignment resources for cleanup",
          {
            assignmentId,
            error: parseError.message,
          }
        );
      }
    }

    if (assignment.rubric) {
      try {
        const rubric = JSON.parse(assignment.rubric);
        if (rubric.file?.url) {
          cleanupPromises.push(
            deleteFromCloudinary(rubric.file.url).catch((error) => {
              educademyLogger.warn("Failed to delete rubric file", {
                assignmentId,
                rubricUrl: rubric.file.url,
                error: error.message,
              });
            })
          );
        }
      } catch (parseError) {
        educademyLogger.warn("Failed to parse assignment rubric for cleanup", {
          assignmentId,
          error: parseError.message,
        });
      }
    }

    assignment.submissions.forEach((submission) => {
      if (submission.attachments) {
        try {
          const attachments =
            typeof submission.attachments === "string"
              ? JSON.parse(submission.attachments)
              : submission.attachments;

          if (Array.isArray(attachments)) {
            attachments.forEach((attachment) => {
              if (attachment.url) {
                cleanupPromises.push(
                  deleteFromCloudinary(attachment.url).catch((error) => {
                    educademyLogger.warn(
                      "Failed to delete submission attachment",
                      {
                        assignmentId,
                        submissionId: submission.id,
                        attachmentUrl: attachment.url,
                        error: error.message,
                      }
                    );
                  })
                );
              }
            });
          }
        } catch (parseError) {
          educademyLogger.warn(
            "Failed to parse submission attachments for cleanup",
            {
              assignmentId,
              submissionId: submission.id,
              error: parseError.message,
            }
          );
        }
      }
    });

    await Promise.allSettled(cleanupPromises);

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    await prisma.assignment.updateMany({
      where: {
        sectionId: assignment.sectionId,
        order: { gt: assignment.order },
      },
      data: {
        order: { decrement: 1 },
      },
    });

    await Promise.all([
      prisma.section.update({
        where: { id: assignment.sectionId },
        data: { updatedAt: new Date() },
      }),
      prisma.course.update({
        where: { id: assignment.section.course.id },
        data: {
          updatedAt: new Date(),
          totalAssignments: { decrement: 1 },
        },
      }),
    ]);

    if (assignment.section.course.status === "PUBLISHED") {
      try {
        const enrolledStudents = await prisma.enrollment.findMany({
          where: {
            courseId: assignment.section.course.id,
            status: "ACTIVE",
          },
          include: {
            student: {
              include: {
                user: {
                  select: { id: true, firstName: true, email: true },
                },
              },
            },
          },
          take: 100,
        });

        const notificationPromises = enrolledStudents.map((enrollment) =>
          prisma.notification
            .create({
              data: {
                type: "ASSIGNMENT_DELETED",
                title: "Assignment Removed",
                message: `The assignment "${assignment.title}" has been removed from your course.`,
                userId: enrollment.student.user.id,
                priority: "NORMAL",
                data: {
                  assignmentId: assignment.id,
                  assignmentTitle: assignment.title,
                  courseId: assignment.section.course.id,
                  courseTitle: assignment.section.course.title,
                  sectionId: assignment.sectionId,
                },
              },
            })
            .catch((error) => {
              educademyLogger.error(
                "Failed to create deletion notification",
                error,
                {
                  userId: enrollment.student.user.id,
                  assignmentId: assignment.id,
                }
              );
            })
        );

        await Promise.allSettled(notificationPromises);
      } catch (notificationError) {
        educademyLogger.error(
          "Failed to send assignment deletion notifications",
          notificationError,
          {
            userId: req.userAuthId,
            assignmentId: assignment.id,
          }
        );
      }
    }

    educademyLogger.logBusinessOperation(
      "DELETE_ASSIGNMENT",
      "ASSIGNMENT",
      assignmentId,
      "SUCCESS",
      {
        assignmentTitle: assignment.title,
        sectionId: assignment.sectionId,
        courseId: assignment.section.course.id,
        hadSubmissions: hasSubmissions,
        submissionCount: assignment.submissions.length,
        order: assignment.order,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "DELETE_ASSIGNMENT",
      "ASSIGNMENT",
      assignmentId,
      {
        title: assignment.title,
        totalPoints: assignment.totalPoints,
        dueDate: assignment.dueDate,
        sectionId: assignment.sectionId,
        courseId: assignment.section.course.id,
      },
      null,
      req.userAuthId
    );

    educademyLogger.performance("DELETE_ASSIGNMENT", startTime, {
      userId: req.userAuthId,
      assignmentId,
      hadSubmissions: hasSubmissions,
      fileCleanupCount: cleanupPromises.length,
    });

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
      data: {
        deletedAssignmentId: assignmentId,
        assignmentTitle: assignment.title,
        sectionId: assignment.sectionId,
        courseId: assignment.section.course.id,
        filesDeleted: cleanupPromises.length,
        submissionsDeleted: assignment.submissions.length,
      },
    });
  } catch (error) {
    educademyLogger.error("Delete assignment failed", error, {
      userId: req.userAuthId,
      assignmentId,
      business: {
        operation: "DELETE_ASSIGNMENT",
        entity: "ASSIGNMENT",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to delete assignment",
      requestId,
    });
  }
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { assignmentId, submissionId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AssignmentController",
    methodName: "gradeSubmission",
  });

  try {
    const { grade, feedback, status = "GRADED" } = req.body;

    if (grade === undefined || grade === null) {
      return res.status(400).json({
        success: false,
        message: "Grade is required",
      });
    }

    if (typeof grade !== "number" || grade < 0) {
      return res.status(400).json({
        success: false,
        message: "Grade must be a non-negative number",
      });
    }

    const validStatuses = ["GRADED", "RESUBMIT_REQUESTED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    if (status === "RESUBMIT_REQUESTED" && !feedback?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Feedback is required when requesting resubmission",
      });
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            section: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    instructorId: true,
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
        message: "Submission not found",
      });
    }

    if (submission.assignmentId !== assignmentId) {
      return res.status(400).json({
        success: false,
        message: "Submission does not belong to this assignment",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (
      !instructor ||
      instructor.id !== submission.assignment.section.course.instructorId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only grade submissions for your own courses",
      });
    }

    if (grade > submission.assignment.totalPoints) {
      return res.status(400).json({
        success: false,
        message: `Grade cannot exceed assignment total points (${submission.assignment.totalPoints})`,
      });
    }

    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade,
        feedback: feedback?.trim() || null,
        status,
        updatedAt: new Date(),
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
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const notificationType =
      status === "GRADED" ? "ASSIGNMENT_GRADED" : "RESUBMIT_REQUESTED";
    const notificationTitle =
      status === "GRADED" ? "Assignment Graded" : "Resubmission Requested";
    const percentage = Math.round(
      (grade / submission.assignment.totalPoints) * 100
    );

    let notificationMessage;
    if (status === "GRADED") {
      notificationMessage = `Your assignment "${submission.assignment.title}" has been graded. You received ${grade}/${submission.assignment.totalPoints} points (${percentage}%).`;
    } else {
      notificationMessage = `Your instructor has requested changes to your assignment "${submission.assignment.title}". Please review the feedback and resubmit.`;
    }

    await prisma.notification.create({
      data: {
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        userId: submission.student.user.id,
        priority: status === "RESUBMIT_REQUESTED" ? "HIGH" : "NORMAL",
        data: {
          assignmentId: submission.assignmentId,
          assignmentTitle: submission.assignment.title,
          submissionId: submission.id,
          grade,
          totalPoints: submission.assignment.totalPoints,
          percentage,
          feedback: feedback?.trim() || null,
          status,
        },
      },
    });

    try {
      const emailSubject =
        status === "GRADED"
          ? `📊 Assignment Graded: ${submission.assignment.title}`
          : `📝 Resubmission Requested: ${submission.assignment.title}`;

      let emailContent;
      if (status === "GRADED") {
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #366092;">Assignment Graded</h2>
            <p>Hi ${submission.student.user.firstName},</p>
            <p>Your assignment has been graded:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #366092; margin-top: 0;">${
                submission.assignment.title
              }</h3>
              <p><strong>Grade:</strong> ${grade}/${
          submission.assignment.totalPoints
        } (${percentage}%)</p>
              ${
                feedback
                  ? `<p><strong>Feedback:</strong></p><p style="background: white; padding: 15px; border-left: 4px solid #366092;">${feedback}</p>`
                  : ""
              }
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/courses/${
          submission.assignment.section.course.id
        }/assignments/${assignmentId}/submissions/${submissionId}" 
                 style="background: #366092; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                View Submission
              </a>
            </div>

            <p>Best regards,<br>The Educademy Team</p>
          </div>
        `;
      } else {
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">Resubmission Requested</h2>
            <p>Hi ${submission.student.user.firstName},</p>
            <p>Your instructor has requested changes to your assignment submission:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #e74c3c; margin-top: 0;">${submission.assignment.title}</h3>
              <p><strong>Current Grade:</strong> ${grade}/${submission.assignment.totalPoints} (${percentage}%)</p>
              <p><strong>Instructor Feedback:</strong></p>
              <p style="background: white; padding: 15px; border-left: 4px solid #e74c3c;">${feedback}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/courses/${submission.assignment.section.course.id}/assignments/${assignmentId}" 
                 style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                Revise & Resubmit
              </a>
            </div>

            <p>Best regards,<br>The Educademy Team</p>
          </div>
        `;
      }

      await emailService.sendEmail({
        to: submission.student.user.email,
        subject: emailSubject,
        html: emailContent,
      });
    } catch (emailError) {
      educademyLogger.error(
        "Failed to send grading notification email",
        emailError,
        {
          userId: req.userAuthId,
          submissionId,
          studentEmail: submission.student.user.email,
        }
      );
    }

    educademyLogger.logBusinessOperation(
      "GRADE_SUBMISSION",
      "ASSIGNMENT_SUBMISSION",
      submissionId,
      "SUCCESS",
      {
        assignmentId,
        assignmentTitle: submission.assignment.title,
        studentId: submission.studentId,
        grade,
        totalPoints: submission.assignment.totalPoints,
        percentage,
        status,
        hasFeedback: !!feedback,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "GRADE_SUBMISSION",
      "ASSIGNMENT_SUBMISSION",
      submissionId,
      {
        previousGrade: submission.grade,
        previousStatus: submission.status,
        previousFeedback: submission.feedback,
      },
      {
        grade,
        status,
        feedback: feedback?.trim() || null,
      },
      req.userAuthId
    );

    educademyLogger.performance("GRADE_SUBMISSION", startTime, {
      userId: req.userAuthId,
      submissionId,
      assignmentId,
    });

    const responseData = {
      submission: {
        id: updatedSubmission.id,
        grade: updatedSubmission.grade,
        feedback: updatedSubmission.feedback,
        status: updatedSubmission.status,
        percentage,
        assignment: {
          id: updatedSubmission.assignment.id,
          title: updatedSubmission.assignment.title,
          totalPoints: updatedSubmission.assignment.totalPoints,
        },
        student: {
          name: `${updatedSubmission.student.user.firstName} ${updatedSubmission.student.user.lastName}`,
          email: updatedSubmission.student.user.email,
        },
        gradedAt: updatedSubmission.updatedAt,
      },
    };

    res.status(200).json({
      success: true,
      message:
        status === "GRADED"
          ? "Submission graded successfully"
          : "Resubmission requested successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Grade submission failed", error, {
      userId: req.userAuthId,
      assignmentId,
      submissionId,
      business: {
        operation: "GRADE_SUBMISSION",
        entity: "ASSIGNMENT_SUBMISSION",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to grade submission",
      requestId,
    });
  }
});

export const exportSubmissions = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { assignmentId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AssignmentController",
    methodName: "exportSubmissions",
  });

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        section: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
              },
            },
          },
        },
        submissions: {
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
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (
      !instructor ||
      instructor.id !== assignment.section.course.instructorId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only export submissions for your own assignments",
      });
    }

    const csvHeaders = [
      "Student Name",
      "Email",
      "Status",
      "Submitted At",
      "Grade",
      "Percentage",
      "Feedback",
      "Attempts",
      "Time Spent (minutes)",
      "Is Late",
      "Submission Type",
    ];

    const csvRows = assignment.submissions.map((submission) => {
      const percentage =
        submission.grade && assignment.totalPoints > 0
          ? Math.round((submission.grade / assignment.totalPoints) * 100)
          : "";

      const timeSpentMinutes = submission.timeSpent
        ? Math.round(submission.timeSpent / 60)
        : "";

      return [
        `${submission.student.user.firstName} ${submission.student.user.lastName}`,
        submission.student.user.email,
        submission.status,
        submission.submittedAt ? submission.submittedAt.toISOString() : "",
        submission.grade || "",
        percentage,
        (submission.feedback || "").replace(/"/g, '""'),
        submission.attempts,
        timeSpentMinutes,
        submission.isLate ? "Yes" : "No",
        submission.submissionType,
      ];
    });

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" &&
            (cell.includes(",") || cell.includes('"') || cell.includes("\n"))
              ? `"${cell}"`
              : cell
          )
          .join(",")
      ),
    ].join("\n");

    const filename = `${assignment.title.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}_submissions_${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    educademyLogger.logBusinessOperation(
      "EXPORT_SUBMISSIONS",
      "ASSIGNMENT_SUBMISSION",
      assignmentId,
      "SUCCESS",
      {
        assignmentId,
        assignmentTitle: assignment.title,
        submissionsExported: assignment.submissions.length,
        exportFormat: "CSV",
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("EXPORT_SUBMISSIONS", startTime, {
      userId: req.userAuthId,
      assignmentId,
      submissionsCount: assignment.submissions.length,
    });

    res.status(200).send(csvContent);
  } catch (error) {
    educademyLogger.error("Export submissions failed", error, {
      userId: req.userAuthId,
      assignmentId,
      business: {
        operation: "EXPORT_SUBMISSIONS",
        entity: "ASSIGNMENT_SUBMISSION",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to export submissions",
      requestId,
    });
  }
});

export const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { assignmentId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AssignmentController",
    methodName: "getAssignmentSubmissions",
  });

  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = "submittedAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        section: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (
      !instructor ||
      instructor.id !== assignment.section.course.instructorId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view submissions for your own assignments",
      });
    }

    const whereClause = {
      assignmentId,
    };

    if (status) {
      const validStatuses = [
        "DRAFT",
        "SUBMITTED",
        "GRADED",
        "RESUBMIT_REQUESTED",
        "LATE_SUBMITTED",
      ];
      if (validStatuses.includes(status.toUpperCase())) {
        whereClause.status = status.toUpperCase();
      }
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

    const validSortFields = [
      "submittedAt",
      "grade",
      "status",
      "attempts",
      "timeSpent",
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
    orderBy[sortBy] = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";

    const skip = (pageNum - 1) * limitNum;

    const [submissions, totalCount, submissionStats] = await Promise.all([
      prisma.assignmentSubmission.findMany({
        where: whereClause,
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
          assignment: {
            select: {
              title: true,
              totalPoints: true,
              dueDate: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.assignmentSubmission.count({
        where: whereClause,
      }),

      prisma.assignmentSubmission.groupBy({
        by: ["status"],
        where: { assignmentId },
        _count: { id: true },
        _avg: { grade: true },
      }),
    ]);

    const statusBreakdown = submissionStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = {
        count: stat._count.id,
        averageGrade: stat._avg.grade || 0,
      };
      return acc;
    }, {});

    const formattedSubmissions = submissions.map((submission) => {
      const percentage =
        submission.grade && assignment.totalPoints > 0
          ? Math.round((submission.grade / assignment.totalPoints) * 100)
          : null;

      return {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt,
        content: submission.content,
        attachments: submission.attachments,
        grade: submission.grade,
        percentage,
        feedback: submission.feedback,
        attempts: submission.attempts,
        timeSpent: submission.timeSpent,
        submissionType: submission.submissionType,
        isLate: submission.isLate,
        student: {
          id: submission.student.id,
          name: `${submission.student.user.firstName} ${submission.student.user.lastName}`,
          email: submission.student.user.email,
          profileImage: submission.student.user.profileImage,
        },
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      };
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    const enrollmentCount = await prisma.enrollment.count({
      where: {
        courseId: assignment.section.course.id,
        status: "ACTIVE",
      },
    });

    const responseData = {
      submissions: formattedSubmissions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      assignment: {
        id: assignment.id,
        title: assignment.title,
        totalPoints: assignment.totalPoints,
        dueDate: assignment.dueDate,
      },
      statistics: {
        total: totalCount,
        statusBreakdown,
        averageGrade: submissionStats.reduce(
          (sum, stat, _, arr) => sum + (stat._avg.grade || 0) / arr.length,
          0
        ),
        completionRate:
          enrollmentCount > 0
            ? Math.round((totalCount / enrollmentCount) * 100)
            : 0,
        enrollmentCount,
      },
      filters: {
        applied: {
          status: status || null,
          search: search || null,
          sortBy,
          sortOrder,
        },
        available: {
          statuses: [
            "DRAFT",
            "SUBMITTED",
            "GRADED",
            "RESUBMIT_REQUESTED",
            "LATE_SUBMITTED",
          ],
          sortFields: validSortFields,
        },
      },
    };

    educademyLogger.logBusinessOperation(
      "GET_ASSIGNMENT_SUBMISSIONS",
      "ASSIGNMENT_SUBMISSION",
      assignmentId,
      "SUCCESS",
      {
        assignmentId,
        submissionsReturned: formattedSubmissions.length,
        totalSubmissions: totalCount,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_ASSIGNMENT_SUBMISSIONS", startTime, {
      userId: req.userAuthId,
      assignmentId,
      submissionsCount: formattedSubmissions.length,
    });

    res.status(200).json({
      success: true,
      message: "Assignment submissions fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get assignment submissions failed", error, {
      userId: req.userAuthId,
      assignmentId,
      business: {
        operation: "GET_ASSIGNMENT_SUBMISSIONS",
        entity: "ASSIGNMENT_SUBMISSION",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch assignment submissions",
      requestId,
    });
  }
});

export const reorderAssignments = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { sectionId } = req.params;
  const { assignmentOrders } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AssignmentController",
    methodName: "reorderAssignments",
  });

  try {
    if (!Array.isArray(assignmentOrders) || assignmentOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Assignment orders array is required",
      });
    }

    for (const item of assignmentOrders) {
      if (!item.assignmentId || typeof item.assignmentId !== "string") {
        return res.status(400).json({
          success: false,
          message: "Each item must have a valid assignmentId",
        });
      }
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: {
            id: true,
            instructorId: true,
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
        message: "You can only reorder assignments for your own courses",
      });
    }

    const assignmentIds = assignmentOrders.map((item) => item.assignmentId);
    const existingAssignments = await prisma.assignment.findMany({
      where: {
        id: { in: assignmentIds },
        sectionId,
      },
      select: { id: true, title: true },
    });

    if (existingAssignments.length !== assignmentIds.length) {
      return res.status(400).json({
        success: false,
        message:
          "Some assignments do not exist or do not belong to this section",
      });
    }

    const updatePromises = assignmentOrders.map((item, index) =>
      prisma.assignment.update({
        where: { id: item.assignmentId },
        data: { order: index + 1 },
      })
    );

    await Promise.all(updatePromises);

    await prisma.section.update({
      where: { id: sectionId },
      data: { updatedAt: new Date() },
    });

    const updatedAssignments = await prisma.assignment.findMany({
      where: { sectionId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        order: true,
        dueDate: true,
        totalPoints: true,
      },
    });

    educademyLogger.logBusinessOperation(
      "REORDER_ASSIGNMENTS",
      "ASSIGNMENT",
      sectionId,
      "SUCCESS",
      {
        sectionId,
        courseId: section.course.id,
        assignmentsCount: assignmentOrders.length,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("REORDER_ASSIGNMENTS", startTime, {
      userId: req.userAuthId,
      sectionId,
      assignmentsCount: assignmentOrders.length,
    });

    res.status(200).json({
      success: true,
      message: "Assignments reordered successfully",
      data: {
        assignments: updatedAssignments,
        sectionId,
      },
    });
  } catch (error) {
    educademyLogger.error("Reorder assignments failed", error, {
      userId: req.userAuthId,
      sectionId,
      business: {
        operation: "REORDER_ASSIGNMENTS",
        entity: "ASSIGNMENT",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to reorder assignments",
      requestId,
    });
  }
});
