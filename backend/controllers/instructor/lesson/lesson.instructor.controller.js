import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import educademyLogger from "../../utils/logger.js";
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

export const createLesson = asyncHandler(async (req, res) => {
  uploadCourseMedia.fields([
    { name: "video", maxCount: 1 },
    { name: "transcript", maxCount: 1 },
    { name: "attachments", maxCount: 5 },
  ])(req, res, async (err) => {
    if (err) {
      educademyLogger.logValidationError("fileUpload", req.files, err.message, {
        userId: req.userAuthId,
        operation: "CREATE_LESSON",
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
      className: "LessonController",
      methodName: "createLesson",
    });

    educademyLogger.logMethodEntry("LessonController", "createLesson", {
      userId: req.userAuthId,
      sectionId: req.params.sectionId,
      title: req.body.title,
      lessonType: req.body.lessonType,
    });

    try {
      const { sectionId } = req.params;
      const {
        title,
        description,
        content,
        lessonType,
        videoUrl,
        transcriptText,
        duration,
        order,
        isFree = false,
        isPreview = false,
        resources,
      } = req.body;

      if (!title) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch((err) => {
                  educademyLogger.warn(
                    "Failed to delete uploaded file after validation error",
                    {
                      filename: file.filename,
                      error: err.message,
                    }
                  );
                });
              }
            });
        }

        return res.status(400).json({
          success: false,
          message: "Title is required",
        });
      }

      if (!lessonType) {
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
          message: "Lesson type is required",
        });
      }

      const validLessonTypes = [
        "VIDEO",
        "TEXT",
        "AUDIO",
        "INTERACTIVE",
        "DOCUMENT",
        "PRESENTATION",
      ];
      if (!validLessonTypes.includes(lessonType)) {
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
            "Invalid lesson type. Must be one of: " +
            validLessonTypes.join(", "),
        });
      }

      if (order !== undefined && order < 0) {
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

      if (duration !== undefined && duration < 0) {
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
          message: "Duration must be a non-negative number",
        });
      }

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
          message: "You can only create lessons for your own courses",
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
          message: "Only verified instructors can create lessons",
        });
      }

      let lessonOrder = order;
      if (lessonOrder === undefined) {
        const lastLesson = await prisma.lesson.findFirst({
          where: { sectionId },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        lessonOrder = lastLesson ? lastLesson.order + 1 : 1;
      }

      const existingLesson = await prisma.lesson.findFirst({
        where: {
          sectionId,
          order: lessonOrder,
        },
      });

      if (existingLesson) {
        await prisma.lesson.updateMany({
          where: {
            sectionId,
            order: { gte: lessonOrder },
          },
          data: {
            order: { increment: 1 },
          },
        });
      }

      const uploadedVideo = req.files?.video?.[0]?.path || null;
      const uploadedTranscript = req.files?.transcript?.[0]?.path || null;
      const uploadedAttachments = req.files?.attachments || [];

      let finalVideoUrl = videoUrl;

      if (lessonType === "VIDEO") {
        if (uploadedVideo) {
          finalVideoUrl = uploadedVideo;
        } else if (!videoUrl) {
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
              "Video URL or uploaded video file is required for video lessons",
          });
        }
      }

      if (lessonType === "TEXT" && !content) {
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
          message: "Content is required for text lessons",
        });
      }

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

      const parsedResources = parseArrayField(resources);
      const lessonDuration = duration ? parseInt(duration) : null;

      const lesson = await prisma.lesson.create({
        data: {
          title: title.trim(),
          description: description?.trim(),
          order: lessonOrder,
          duration: lessonDuration || 0,
          isFree: isFree === "true" || isFree === true,
          isPreview: isPreview === "true" || isPreview === true,
          type: lessonType,
          content,
          videoUrl: finalVideoUrl,
          transcript: uploadedTranscript,
          transcriptText: transcriptText || null,
          videoQuality: null,
          captions: null,
          resources:
            parsedResources.length > 0 ? JSON.stringify(parsedResources) : null,
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
          completions: {
            select: {
              id: true,
              completedAt: true,
              timeSpent: true,
              watchTime: true,
            },
            take: 5,
          },
          attachments: {
            select: {
              id: true,
              name: true,
              fileUrl: true,
              fileSize: true,
              fileType: true,
            },
          },
        },
      });

      if (uploadedAttachments.length > 0) {
        const attachmentPromises = uploadedAttachments.map((attachment) =>
          prisma.attachment.create({
            data: {
              name: attachment.originalname,
              fileUrl: attachment.path,
              fileSize: attachment.size,
              fileType: attachment.mimetype,
              lessonId: lesson.id,
            },
          })
        );
        await Promise.all(attachmentPromises);
      }

      await prisma.section.update({
        where: { id: sectionId },
        data: { updatedAt: new Date() },
      });

      await prisma.course.update({
        where: { id: section.course.id },
        data: { updatedAt: new Date() },
      });

      educademyLogger.logBusinessOperation(
        "CREATE_LESSON",
        "LESSON",
        lesson.id,
        "SUCCESS",
        {
          sectionId,
          courseId: section.course.id,
          lessonTitle: title,
          lessonType,
          order: lessonOrder,
          hasUploadedVideo: !!uploadedVideo,
          hasUploadedTranscript: !!uploadedTranscript,
          hasTranscriptText: !!transcriptText,
          hasAttachments: uploadedAttachments.length > 0,
          instructorId: section.course.instructorId,
          userId: req.userAuthId,
        }
      );

      educademyLogger.performance("CREATE_LESSON", startTime, {
        userId: req.userAuthId,
        lessonId: lesson.id,
        sectionId,
        courseId: section.course.id,
      });

      educademyLogger.logMethodExit(
        "LessonController",
        "createLesson",
        true,
        performance.now() - startTime
      );

      const responseData = {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          lessonType: lesson.type,
          videoUrl: lesson.videoUrl,
          transcript: lesson.transcript,
          transcriptText: lesson.transcriptText,
          duration: lesson.duration,
          order: lesson.order,
          isFree: lesson.isFree,
          isPreview: lesson.isPreview,
          resources: lesson.resources ? JSON.parse(lesson.resources) : [],
          attachments: lesson.attachments || [],
          sectionId: lesson.sectionId,
          section: lesson.section,
          stats: {
            totalCompletions: lesson.completions.length,
            totalAttachments: lesson.attachments.length,
            estimatedDuration: lesson.duration || 0,
            hasTranscript: !!(lesson.transcript || lesson.transcriptText),
          },
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt,
        },
      };

      res.status(201).json({
        success: true,
        message: "Lesson created successfully",
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

      educademyLogger.error("Create lesson failed", error, {
        userId: req.userAuthId,
        sectionId: req.params.sectionId,
        title: req.body.title,
        lessonType: req.body.lessonType,
        business: {
          operation: "CREATE_LESSON",
          entity: "LESSON",
          status: "ERROR",
        },
      });

      educademyLogger.logMethodExit(
        "LessonController",
        "createLesson",
        false,
        performance.now() - startTime
      );

      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "A lesson with this order already exists in the section",
          requestId,
        });
      }

      if (error.code === "P2003") {
        return res.status(400).json({
          success: false,
          message: "Invalid section reference",
          requestId,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create lesson",
        requestId,
      });
    }
  });
});

export const updateLesson = asyncHandler(async (req, res) => {
  uploadCourseMedia.fields([
    { name: "video", maxCount: 1 },
    { name: "transcript", maxCount: 1 },
    { name: "attachments", maxCount: 5 },
  ])(req, res, async (err) => {
    if (err) {
      educademyLogger.logValidationError("fileUpload", req.files, err.message, {
        userId: req.userAuthId,
        operation: "UPDATE_LESSON",
      });
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const startTime = performance.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    const { lessonId } = req.params;

    educademyLogger.setContext({
      requestId,
      userId: req.userAuthId,
      className: "LessonController",
      methodName: "updateLesson",
    });

    educademyLogger.logMethodEntry("LessonController", "updateLesson", {
      userId: req.userAuthId,
      lessonId,
      title: req.body.title,
      lessonType: req.body.lessonType,
      clientIp: req.ip,
      userAgent: req.get("User-Agent"),
    });

    try {
      const {
        title,
        description,
        content,
        lessonType,
        videoUrl,
        transcriptText,
        duration,
        order,
        isFree,
        isPreview,
        resources,
        removeVideo = false,
        removeTranscript = false,
      } = req.body;

      const currentLesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
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
          completions: {
            select: {
              id: true,
              completedAt: true,
              timeSpent: true,
              watchTime: true,
            },
          },
          attachments: {
            select: {
              id: true,
              name: true,
              fileUrl: true,
              fileSize: true,
              fileType: true,
            },
          },
        },
      });

      if (!currentLesson) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        educademyLogger.logValidationError(
          "lessonNotFound",
          lessonId,
          "Lesson not found",
          {
            userId: req.userAuthId,
            lessonId,
          }
        );

        return res.status(404).json({
          success: false,
          message: "Lesson not found",
        });
      }

      const instructor = await prisma.instructor.findUnique({
        where: { userId: req.userAuthId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              isActive: true,
              isVerified: true,
            },
          },
        },
      });

      if (
        !instructor ||
        instructor.id !== currentLesson.section.course.instructorId
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

        educademyLogger.logSecurityEvent(
          "UNAUTHORIZED_LESSON_UPDATE_ATTEMPT",
          "HIGH",
          {
            userId: req.userAuthId,
            lessonId,
            actualInstructorId: currentLesson.section.course.instructorId,
          },
          req.userAuthId
        );

        return res.status(403).json({
          success: false,
          message: "You can only update lessons for your own courses",
        });
      }

      if (!instructor.user.isActive) {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        educademyLogger.logSecurityEvent(
          "INACTIVE_USER_LESSON_UPDATE_ATTEMPT",
          "HIGH",
          {
            userId: req.userAuthId,
            email: instructor.user.email,
            lessonId,
          },
          req.userAuthId
        );

        return res.status(403).json({
          success: false,
          message: "Account is not active. Please contact support.",
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

        educademyLogger.logValidationError(
          "unverifiedInstructor",
          instructor.id,
          "Unverified instructor attempting lesson update",
          {
            userId: req.userAuthId,
            instructorId: instructor.id,
          }
        );

        return res.status(403).json({
          success: false,
          message: "Only verified instructors can update lessons",
        });
      }

      if (currentLesson.section.course.status === "UNDER_REVIEW") {
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach((file) => {
              if (file.filename) {
                deleteFromCloudinary(file.filename).catch(() => {});
              }
            });
        }

        educademyLogger.logValidationError(
          "courseUnderReview",
          currentLesson.section.course.id,
          "Cannot update lesson while course is under review",
          {
            userId: req.userAuthId,
            lessonId,
            courseStatus: currentLesson.section.course.status,
          }
        );

        return res.status(400).json({
          success: false,
          message: "Cannot update lesson while course is under review",
        });
      }

      if (currentLesson.section.course.status === "PUBLISHED") {
        const enrollmentCount = await prisma.enrollment.count({
          where: {
            courseId: currentLesson.section.course.id,
            status: "ACTIVE",
          },
        });

        if (enrollmentCount > 0) {
          if (lessonType && lessonType !== currentLesson.type) {
            if (req.files) {
              Object.values(req.files)
                .flat()
                .forEach((file) => {
                  if (file.filename) {
                    deleteFromCloudinary(file.filename).catch(() => {});
                  }
                });
            }

            educademyLogger.logValidationError(
              "restrictedLessonTypeChange",
              { oldType: currentLesson.type, newType: lessonType },
              "Cannot change lesson type for published course with enrollments",
              {
                userId: req.userAuthId,
                lessonId,
                enrollmentCount,
              }
            );

            return res.status(400).json({
              success: false,
              message:
                "Cannot change lesson type for published courses with active enrollments",
            });
          }

          if (isFree === false && currentLesson.isFree === true) {
            if (req.files) {
              Object.values(req.files)
                .flat()
                .forEach((file) => {
                  if (file.filename) {
                    deleteFromCloudinary(file.filename).catch(() => {});
                  }
                });
            }

            educademyLogger.logValidationError(
              "changingFreeToFreemium",
              { lessonId, enrollmentCount },
              "Attempting to make free lesson paid",
              {
                userId: req.userAuthId,
                lessonId,
                enrollmentCount,
              }
            );

            return res.status(400).json({
              success: false,
              message:
                "Cannot make a free lesson paid for published courses with active enrollments",
            });
          }
        }
      }

      const updateData = {};

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

      if (description !== undefined)
        updateData.description = description?.trim();
      if (content !== undefined) updateData.content = content;
      if (isFree !== undefined)
        updateData.isFree = isFree === "true" || isFree === true;
      if (isPreview !== undefined)
        updateData.isPreview = isPreview === "true" || isPreview === true;

      if (lessonType !== undefined) {
        const validLessonTypes = [
          "VIDEO",
          "TEXT",
          "AUDIO",
          "INTERACTIVE",
          "DOCUMENT",
          "PRESENTATION",
        ];
        if (!validLessonTypes.includes(lessonType)) {
          if (req.files) {
            Object.values(req.files)
              .flat()
              .forEach((file) => {
                if (file.filename) {
                  deleteFromCloudinary(file.filename).catch(() => {});
                }
              });
          }

          educademyLogger.logValidationError(
            "invalidLessonType",
            lessonType,
            "Invalid lesson type",
            {
              userId: req.userAuthId,
              validTypes: validLessonTypes,
            }
          );

          return res.status(400).json({
            success: false,
            message: `Invalid lesson type. Must be one of: ${validLessonTypes.join(
              ", "
            )}`,
          });
        }
        updateData.type = lessonType;
      }

      if (duration !== undefined) {
        if (duration < 0) {
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
            message: "Duration must be a non-negative number",
          });
        }
        updateData.duration = parseInt(duration);
      }

      const uploadedVideo = req.files?.video?.[0]?.path || null;
      const uploadedTranscript = req.files?.transcript?.[0]?.path || null;
      const uploadedAttachments = req.files?.attachments || [];

      if (uploadedVideo) {
        if (currentLesson.videoUrl) {
          try {
            const publicId = currentLesson.videoUrl
              .split("/")
              .pop()
              .split(".")[0];
            await deleteFromCloudinary(`educademy/videos/${publicId}`);
          } catch (deleteError) {
            educademyLogger.warn("Failed to delete old video", {
              lessonId,
              oldVideo: currentLesson.videoUrl,
              error: deleteError.message,
            });
          }
        }
        updateData.videoUrl = uploadedVideo;
      } else if (removeVideo === "true" && currentLesson.videoUrl) {
        try {
          const publicId = currentLesson.videoUrl
            .split("/")
            .pop()
            .split(".")[0];
          await deleteFromCloudinary(`educademy/videos/${publicId}`);
        } catch (deleteError) {
          educademyLogger.warn("Failed to delete removed video", {
            lessonId,
            removedVideo: currentLesson.videoUrl,
            error: deleteError.message,
          });
        }
        updateData.videoUrl = null;
      } else if (videoUrl !== undefined) {
        updateData.videoUrl = videoUrl;
      }

      if (uploadedTranscript) {
        if (currentLesson.transcript) {
          try {
            const publicId = currentLesson.transcript
              .split("/")
              .pop()
              .split(".")[0];
            await deleteFromCloudinary(`educademy/documents/${publicId}`);
          } catch (deleteError) {
            educademyLogger.warn("Failed to delete old transcript", {
              lessonId,
              oldTranscript: currentLesson.transcript,
              error: deleteError.message,
            });
          }
        }
        updateData.transcript = uploadedTranscript;
      } else if (removeTranscript === "true" && currentLesson.transcript) {
        try {
          const publicId = currentLesson.transcript
            .split("/")
            .pop()
            .split(".")[0];
          await deleteFromCloudinary(`educademy/documents/${publicId}`);
        } catch (deleteError) {
          educademyLogger.warn("Failed to delete removed transcript", {
            lessonId,
            removedTranscript: currentLesson.transcript,
            error: deleteError.message,
          });
        }
        updateData.transcript = null;
      }

      if (transcriptText !== undefined) {
        updateData.transcriptText = transcriptText || null;
      }

      const finalLessonType = lessonType || currentLesson.type;

      if (finalLessonType === "VIDEO") {
        const finalVideoUrl =
          updateData.videoUrl !== undefined
            ? updateData.videoUrl
            : currentLesson.videoUrl;
        if (!finalVideoUrl) {
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
            message: "Video URL is required for video lessons",
          });
        }
      }

      if (finalLessonType === "TEXT") {
        const finalContent =
          content !== undefined ? content : currentLesson.content;
        if (!finalContent) {
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
            message: "Content is required for text lessons",
          });
        }
      }

      if (order !== undefined && order !== currentLesson.order) {
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

        const conflictingLesson = await prisma.lesson.findFirst({
          where: {
            sectionId: currentLesson.sectionId,
            order,
            id: { not: lessonId },
          },
        });

        if (conflictingLesson) {
          if (order > currentLesson.order) {
            await prisma.lesson.updateMany({
              where: {
                sectionId: currentLesson.sectionId,
                order: {
                  gt: currentLesson.order,
                  lte: order,
                },
                id: { not: lessonId },
              },
              data: {
                order: { decrement: 1 },
              },
            });
          } else {
            await prisma.lesson.updateMany({
              where: {
                sectionId: currentLesson.sectionId,
                order: {
                  gte: order,
                  lt: currentLesson.order,
                },
                id: { not: lessonId },
              },
              data: {
                order: { increment: 1 },
              },
            });
          }
        }

        updateData.order = order;
      }

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

        const parsedResources = parseArrayField(resources);
        updateData.resources =
          parsedResources.length > 0 ? JSON.stringify(parsedResources) : null;
      }

      updateData.updatedAt = new Date();

      const updatedLesson = await prisma.lesson.update({
        where: { id: lessonId },
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
          completions: {
            select: {
              id: true,
              completedAt: true,
              timeSpent: true,
              watchTime: true,
            },
            take: 5,
          },
          attachments: {
            select: {
              id: true,
              name: true,
              fileUrl: true,
              fileSize: true,
              fileType: true,
            },
          },
        },
      });

      if (uploadedAttachments.length > 0) {
        const attachmentPromises = uploadedAttachments.map((attachment) =>
          prisma.attachment.create({
            data: {
              name: attachment.originalname,
              fileUrl: attachment.path,
              fileSize: attachment.size,
              fileType: attachment.mimetype,
              lessonId: updatedLesson.id,
            },
          })
        );
        await Promise.all(attachmentPromises);
      }

      await Promise.all([
        prisma.section.update({
          where: { id: currentLesson.sectionId },
          data: { updatedAt: new Date() },
        }),
        prisma.course.update({
          where: { id: currentLesson.section.course.id },
          data: { updatedAt: new Date() },
        }),
      ]);

      const significantChanges = [
        "title",
        "content",
        "type",
        "videoUrl",
        "transcript",
        "transcriptText",
      ];
      const hasSignificantChanges = significantChanges.some(
        (field) => updateData[field] !== undefined
      );

      if (
        hasSignificantChanges &&
        currentLesson.section.course.status === "PUBLISHED"
      ) {
        try {
          const enrolledStudents = await prisma.enrollment.findMany({
            where: {
              courseId: currentLesson.section.course.id,
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
                  type: "COURSE_UPDATED",
                  title: "Lesson Updated",
                  message: `The lesson "${updatedLesson.title}" has been updated in your enrolled course.`,
                  userId: enrollment.student.user.id,
                  priority: "NORMAL",
                  data: {
                    lessonId: updatedLesson.id,
                    lessonTitle: updatedLesson.title,
                    courseId: currentLesson.section.course.id,
                    courseTitle: currentLesson.section.course.title,
                    sectionId: currentLesson.sectionId,
                    changedFields: Object.keys(updateData),
                  },
                },
              })
              .catch((error) => {
                educademyLogger.error(
                  "Failed to create student notification",
                  error,
                  {
                    userId: enrollment.student.user.id,
                    lessonId: updatedLesson.id,
                  }
                );
              })
          );

          await Promise.allSettled(notificationPromises);
        } catch (notificationError) {
          educademyLogger.error(
            "Failed to send lesson update notifications",
            notificationError,
            {
              userId: req.userAuthId,
              lessonId: updatedLesson.id,
            }
          );
        }
      }

      educademyLogger.logBusinessOperation(
        "UPDATE_LESSON",
        "LESSON",
        lessonId,
        "SUCCESS",
        {
          lessonTitle: updatedLesson.title,
          lessonType: updatedLesson.type,
          sectionId: currentLesson.sectionId,
          courseId: currentLesson.section.course.id,
          changedFields: Object.keys(updateData),
          hasSignificantChanges,
          hasUploadedVideo: !!uploadedVideo,
          hasUploadedTranscript: !!uploadedTranscript,
          hasTranscriptText: !!transcriptText,
          hasAttachments: uploadedAttachments.length > 0,
          instructorId: currentLesson.section.course.instructorId,
          userId: req.userAuthId,
        }
      );

      educademyLogger.logAuditTrail(
        "UPDATE_LESSON",
        "LESSON",
        lessonId,
        {
          title: currentLesson.title,
          type: currentLesson.type,
          content: currentLesson.content ? "[CONTENT_PRESENT]" : null,
          videoUrl: currentLesson.videoUrl,
          transcript: currentLesson.transcript,
          transcriptText: currentLesson.transcriptText
            ? "[TRANSCRIPT_TEXT_PRESENT]"
            : null,
          order: currentLesson.order,
          isFree: currentLesson.isFree,
        },
        updateData,
        req.userAuthId
      );

      educademyLogger.performance("UPDATE_LESSON", startTime, {
        userId: req.userAuthId,
        lessonId,
        sectionId: currentLesson.sectionId,
        courseId: currentLesson.section.course.id,
        changedFields: Object.keys(updateData).length,
        hasSignificantChanges,
      });

      educademyLogger.logMethodExit(
        "LessonController",
        "updateLesson",
        true,
        performance.now() - startTime
      );

      const responseData = {
        lesson: {
          id: updatedLesson.id,
          title: updatedLesson.title,
          description: updatedLesson.description,
          content: updatedLesson.content,
          lessonType: updatedLesson.type,
          videoUrl: updatedLesson.videoUrl,
          transcript: updatedLesson.transcript,
          transcriptText: updatedLesson.transcriptText,
          duration: updatedLesson.duration,
          order: updatedLesson.order,
          isFree: updatedLesson.isFree,
          isPreview: updatedLesson.isPreview,
          resources: updatedLesson.resources
            ? JSON.parse(updatedLesson.resources)
            : [],
          attachments: updatedLesson.attachments || [],
          sectionId: updatedLesson.sectionId,
          section: updatedLesson.section,
          stats: {
            totalCompletions: updatedLesson.completions.length,
            totalAttachments: updatedLesson.attachments.length,
            estimatedDuration: updatedLesson.duration || 0,
            hasTranscript: !!(
              updatedLesson.transcript || updatedLesson.transcriptText
            ),
          },
          recentProgress: updatedLesson.completions,
          createdAt: updatedLesson.createdAt,
          updatedAt: updatedLesson.updatedAt,
        },
        changes: {
          fieldsUpdated: Object.keys(updateData),
          hasSignificantChanges,
          orderChanged: updateData.order !== undefined,
          transcriptChanged: !!(
            updateData.transcript !== undefined ||
            updateData.transcriptText !== undefined
          ),
          notificationsTriggered:
            hasSignificantChanges &&
            currentLesson.section.course.status === "PUBLISHED",
        },
        metadata: {
          previousValues: {
            title: currentLesson.title,
            lessonType: currentLesson.type,
            order: currentLesson.order,
            isFree: currentLesson.isFree,
            hasTranscript: !!(
              currentLesson.transcript || currentLesson.transcriptText
            ),
          },
          courseStatus: currentLesson.section.course.status,
          instructorVerified: instructor.isVerified,
        },
      };

      res.status(200).json({
        success: true,
        message: "Lesson updated successfully",
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

      educademyLogger.error("Update lesson failed", error, {
        userId: req.userAuthId,
        lessonId,
        business: {
          operation: "UPDATE_LESSON",
          entity: "LESSON",
          status: "ERROR",
        },
        request: {
          hasTitle: !!req.body.title,
          hasContent: !!req.body.content,
          lessonType: req.body.lessonType,
          orderChange: req.body.order,
        },
        stack: error.stack,
      });

      educademyLogger.logMethodExit(
        "LessonController",
        "updateLesson",
        false,
        performance.now() - startTime
      );

      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "A lesson with this order already exists in the section",
          requestId,
        });
      }

      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Lesson not found or has been deleted",
          requestId,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update lesson",
        requestId,
      });
    }
  });
});

export const getAllLessons = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { sectionId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "LessonController",
    methodName: "getAllLessons",
  });

  educademyLogger.logMethodEntry("LessonController", "getAllLessons", {
    userId: req.userAuthId,
    sectionId,
    clientIp: req.ip,
    userAgent: req.get("User-Agent"),
    queryParams: req.query,
  });

  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      sortBy = "order",
      sortOrder = "asc",
      includeStats = false,
      isFree,
      isPreview,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      educademyLogger.logValidationError(
        "pagination",
        { page, limit },
        "Invalid pagination parameters",
        {
          userId: req.userAuthId,
        }
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid pagination parameters. Page must be >= 1, limit must be 1-100",
      });
    }

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
      select: { id: true, isVerified: true },
    });

    if (!instructor || instructor.id !== section.course.instructorId) {
      educademyLogger.logSecurityEvent(
        "UNAUTHORIZED_LESSONS_ACCESS_ATTEMPT",
        "HIGH",
        {
          userId: req.userAuthId,
          sectionId,
          actualInstructorId: section.course.instructorId,
        },
        req.userAuthId
      );

      return res.status(403).json({
        success: false,
        message: "You can only view lessons for your own courses",
      });
    }

    const whereClause = {
      sectionId,
    };

    if (search && search.trim()) {
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
        {
          content: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    if (type) {
      const validTypes = [
        "VIDEO",
        "TEXT",
        "AUDIO",
        "INTERACTIVE",
        "DOCUMENT",
        "PRESENTATION",
      ];
      if (validTypes.includes(type.toUpperCase())) {
        whereClause.type = type.toUpperCase();
      } else {
        educademyLogger.logValidationError(
          "invalidLessonType",
          type,
          "Invalid lesson type filter",
          {
            userId: req.userAuthId,
            validTypes,
          }
        );

        return res.status(400).json({
          success: false,
          message: `Invalid lesson type. Must be one of: ${validTypes.join(
            ", "
          )}`,
        });
      }
    }

    if (isFree !== undefined) {
      whereClause.isFree = isFree === "true";
    }

    if (isPreview !== undefined) {
      whereClause.isPreview = isPreview === "true";
    }

    const validSortFields = [
      "title",
      "order",
      "duration",
      "createdAt",
      "updatedAt",
    ];
    if (!validSortFields.includes(sortBy)) {
      educademyLogger.logValidationError(
        "invalidSortField",
        sortBy,
        "Invalid sort field",
        {
          userId: req.userAuthId,
          validSortFields,
        }
      );

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
      attachments: {
        select: {
          id: true,
          name: true,
          fileUrl: true,
          fileSize: true,
          fileType: true,
          isDownloadable: true,
        },
      },
    };

    if (includeStats === "true") {
      includeClause.completions = {
        select: {
          id: true,
          completedAt: true,
          timeSpent: true,
          watchTime: true,
        },
      };
      includeClause.notes = {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
        take: 3,
      };
      includeClause.bookmarks = {
        select: {
          id: true,
          title: true,
          timestamp: true,
        },
        take: 3,
      };
    }

    const [lessons, totalCount, sectionStats] = await Promise.all([
      prisma.lesson.findMany({
        where: whereClause,
        include: includeClause,
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.lesson.count({
        where: whereClause,
      }),

      prisma.lesson.groupBy({
        by: ["type"],
        where: { sectionId },
        _count: {
          id: true,
        },
        _avg: {
          duration: true,
        },
        _sum: {
          duration: true,
        },
      }),
    ]);

    const typeBreakdown = sectionStats.reduce((acc, stat) => {
      acc[stat.type.toLowerCase()] = {
        count: stat._count.id,
        avgDuration: Math.round(stat._avg.duration || 0),
        totalDuration: stat._sum.duration || 0,
      };
      return acc;
    }, {});

    const formattedLessons = lessons.map((lesson) => {
      const baseData = {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        lessonType: lesson.type,
        videoUrl: lesson.videoUrl,
        videoQuality: lesson.videoQuality,
        captions: lesson.captions,
        transcript: lesson.transcript,
        duration: lesson.duration,
        order: lesson.order,
        isFree: lesson.isFree,
        isPreview: lesson.isPreview,
        resources: lesson.resources ? JSON.parse(lesson.resources) : [],
        attachments: lesson.attachments || [],
        sectionId: lesson.sectionId,
        section: lesson.section,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      };

      if (includeStats === "true") {
        baseData.stats = {
          totalCompletions: lesson.completions?.length || 0,
          totalAttachments: lesson.attachments?.length || 0,
          totalNotes: lesson.notes?.length || 0,
          totalBookmarks: lesson.bookmarks?.length || 0,
          avgCompletionTime:
            lesson.completions?.length > 0
              ? Math.round(
                  lesson.completions.reduce(
                    (sum, c) => sum + (c.timeSpent || 0),
                    0
                  ) / lesson.completions.length
                )
              : 0,
          avgWatchTime:
            lesson.completions?.length > 0
              ? Math.round(
                  lesson.completions.reduce(
                    (sum, c) => sum + (c.watchTime || 0),
                    0
                  ) / lesson.completions.length
                )
              : 0,
        };
        baseData.recentActivity = {
          recentCompletions: lesson.completions?.slice(0, 3) || [],
          recentNotes: lesson.notes?.slice(0, 3) || [],
          recentBookmarks: lesson.bookmarks?.slice(0, 3) || [],
        };
      }

      return baseData;
    });

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    const responseData = {
      lessons: formattedLessons,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null,
      },
      summary: {
        totalLessons: totalCount,
        typeBreakdown,
        totalDuration: sectionStats.reduce(
          (sum, stat) => sum + (stat._sum.duration || 0),
          0
        ),
        avgDuration:
          totalCount > 0
            ? Math.round(
                sectionStats.reduce(
                  (sum, stat) => sum + (stat._sum.duration || 0),
                  0
                ) / totalCount
              )
            : 0,
      },
      section: {
        id: section.id,
        title: section.title,
        course: section.course,
      },
      filters: {
        applied: {
          search: search || null,
          type: type || null,
          isFree: isFree || null,
          isPreview: isPreview || null,
          sortBy,
          sortOrder,
        },
        available: {
          types: [
            "VIDEO",
            "TEXT",
            "AUDIO",
            "INTERACTIVE",
            "DOCUMENT",
            "PRESENTATION",
          ],
          sortFields: validSortFields,
        },
      },
      metadata: {
        generatedAt: new Date(),
        includeStats: includeStats === "true",
        requestId,
      },
    };

    educademyLogger.logBusinessOperation(
      "GET_ALL_LESSONS",
      "LESSON",
      sectionId,
      "SUCCESS",
      {
        sectionId,
        courseId: section.course.id,
        lessonsReturned: formattedLessons.length,
        totalLessons: totalCount,
        filters: {
          search: !!search,
          type: !!type,
          hasFilters: !!(search || type || isFree || isPreview),
        },
        includeStats: includeStats === "true",
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_ALL_LESSONS", startTime, {
      userId: req.userAuthId,
      sectionId,
      courseId: section.course.id,
      lessonsCount: formattedLessons.length,
      totalLessons: totalCount,
      hasFilters: !!(search || type || isFree || isPreview),
      includeStats: includeStats === "true",
    });

    educademyLogger.logMethodExit(
      "LessonController",
      "getAllLessons",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Lessons fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get all lessons failed", error, {
      userId: req.userAuthId,
      sectionId,
      business: {
        operation: "GET_ALL_LESSONS",
        entity: "LESSON",
        status: "ERROR",
      },
      filters: {
        search: req.query.search,
        type: req.query.type,
        page: req.query.page,
        limit: req.query.limit,
      },
      stack: error.stack,
    });

    educademyLogger.logMethodExit(
      "LessonController",
      "getAllLessons",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch lessons",
      requestId,
    });
  }
});

export const deleteLesson = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { lessonId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "LessonController",
    methodName: "deleteLesson",
  });

  educademyLogger.logMethodEntry("LessonController", "deleteLesson", {
    userId: req.userAuthId,
    lessonId,
  });

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
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
        _count: {
          select: {
            attachments: true,
            progress: true,
            notes: true,
          },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== lesson.section.course.instructorId) {
      educademyLogger.logSecurityEvent(
        "UNAUTHORIZED_LESSON_DELETE_ATTEMPT",
        "HIGH",
        {
          userId: req.userAuthId,
          lessonId,
          actualOwnerId: lesson.section.course.instructorId,
        },
        req.userAuthId
      );

      return res.status(403).json({
        success: false,
        message: "You can only delete lessons from your own courses",
      });
    }

    if (lesson.section.course.status === "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete lessons from published courses",
        suggestion:
          "Consider archiving the course first if you need to make structural changes",
      });
    }

    if (lesson._count.progress > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete lesson with student progress",
        data: {
          studentsWithProgress: lesson._count.progress,
          attachments: lesson._count.attachments,
          notes: lesson._count.notes,
        },
        suggestion:
          "Archive the course instead of deleting lessons with student activity",
      });
    }

    // Clean up media files
    const filesToDelete = [];
    if (lesson.videoUrl) filesToDelete.push(lesson.videoUrl);
    if (lesson.transcript) filesToDelete.push(lesson.transcript);

    // Delete lesson attachments first
    if (lesson._count.attachments > 0) {
      const attachments = await prisma.attachment.findMany({
        where: { lessonId },
        select: { fileUrl: true },
      });

      attachments.forEach((attachment) => {
        if (attachment.fileUrl) filesToDelete.push(attachment.fileUrl);
      });

      await prisma.attachment.deleteMany({
        where: { lessonId },
      });
    }

    // Delete the lesson
    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    // Reorder remaining lessons in the section
    await prisma.lesson.updateMany({
      where: {
        sectionId: lesson.sectionId,
        order: { gt: lesson.order },
      },
      data: {
        order: { decrement: 1 },
      },
    });

    // Update course timestamp
    await prisma.course.update({
      where: { id: lesson.section.courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    // Clean up files from cloud storage
    for (const fileUrl of filesToDelete) {
      try {
        const publicId = fileUrl.split("/").pop().split(".")[0];
        const folder = fileUrl.includes("/videos/")
          ? "educademy/videos"
          : "educademy/files";
        await deleteFromCloudinary(`${folder}/${publicId}`);
      } catch (deleteError) {
        educademyLogger.warn("Failed to delete file from cloud storage", {
          lessonId,
          fileUrl,
          error: deleteError.message,
        });
      }
    }

    educademyLogger.logBusinessOperation(
      "DELETE_LESSON",
      "LESSON",
      lessonId,
      "SUCCESS",
      {
        lessonTitle: lesson.title,
        sectionId: lesson.sectionId,
        courseId: lesson.section.courseId,
        order: lesson.order,
        type: lesson.type,
        hadFiles: filesToDelete.length > 0,
      }
    );

    educademyLogger.logAuditTrail(
      "DELETE_LESSON",
      "LESSON",
      lessonId,
      lesson,
      null,
      req.userAuthId
    );

    educademyLogger.performance("DELETE_LESSON", startTime, {
      lessonId,
      filesDeleted: filesToDelete.length,
    });

    educademyLogger.logMethodExit(
      "LessonController",
      "deleteLesson",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
      data: {
        deletedLesson: {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          type: lesson.type,
        },
        section: {
          id: lesson.sectionId,
          title: lesson.section.title,
        },
        course: {
          id: lesson.section.courseId,
          title: lesson.section.course.title,
        },
        filesDeleted: filesToDelete.length,
      },
    });
  } catch (error) {
    educademyLogger.error("Delete lesson failed", error, {
      userId: req.userAuthId,
      lessonId,
      business: {
        operation: "DELETE_LESSON",
        entity: "LESSON",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "LessonController",
      "deleteLesson",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete lesson",
      requestId,
    });
  }
});

export const reorderLessons = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { sectionId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "LessonController",
    methodName: "reorderLessons",
  });

  try {
    const { lessonOrders } = req.body;

    if (!Array.isArray(lessonOrders) || lessonOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Lesson orders array is required",
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
        message: "You can only reorder lessons for your own courses",
      });
    }

    if (section.course.status === "UNDER_REVIEW") {
      return res.status(400).json({
        success: false,
        message: "Cannot reorder lessons while course is under review",
      });
    }

    const existingLessons = await prisma.lesson.findMany({
      where: { sectionId },
      select: { id: true, order: true, title: true },
      orderBy: { order: "asc" },
    });

    const lessonIds = lessonOrders.map((item) => item.id);
    const existingIds = existingLessons.map((lesson) => lesson.id);

    const missingIds = existingIds.filter((id) => !lessonIds.includes(id));
    const extraIds = lessonIds.filter((id) => !existingIds.includes(id));

    if (missingIds.length > 0 || extraIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Lesson IDs mismatch",
        data: {
          missingIds,
          extraIds,
          expected: existingIds,
          received: lessonIds,
        },
      });
    }

    for (const orderItem of lessonOrders) {
      if (typeof orderItem.order !== "number" || orderItem.order < 1) {
        return res.status(400).json({
          success: false,
          message: "Order must be a positive number starting from 1",
        });
      }
    }

    const updatePromises = lessonOrders.map(({ id, order }) =>
      prisma.lesson.update({
        where: { id },
        data: { order },
      })
    );

    await Promise.all(updatePromises);

    await prisma.course.update({
      where: { id: section.courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    const updatedLessons = await prisma.lesson.findMany({
      where: { sectionId },
      select: {
        id: true,
        title: true,
        order: true,
        type: true,
        duration: true,
        isFree: true,
        isPreview: true,
      },
      orderBy: { order: "asc" },
    });

    educademyLogger.logBusinessOperation(
      "REORDER_LESSONS",
      "LESSON",
      sectionId,
      "SUCCESS",
      {
        sectionId,
        courseId: section.courseId,
        lessonCount: lessonOrders.length,
        newOrder: lessonOrders,
      }
    );

    educademyLogger.logAuditTrail(
      "REORDER_LESSONS",
      "SECTION",
      sectionId,
      { lessons: existingLessons },
      { newOrder: lessonOrders },
      req.userAuthId
    );

    educademyLogger.performance("REORDER_LESSONS", startTime, {
      sectionId,
      lessonCount: lessonOrders.length,
    });

    res.status(200).json({
      success: true,
      message: "Lessons reordered successfully",
      data: {
        section: {
          id: section.id,
          title: section.title,
        },
        lessons: updatedLessons,
      },
    });
  } catch (error) {
    educademyLogger.error("Reorder lessons failed", error, {
      userId: req.userAuthId,
      sectionId,
      business: {
        operation: "REORDER_LESSONS",
        entity: "LESSON",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to reorder lessons",
      requestId,
    });
  }
});

export const getLessonById = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { lessonId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "LessonController",
    methodName: "getLessonById",
  });

  try {
    const { includeAttachments = "true", includeProgress = "false" } =
      req.query;

    const includeOptions = {
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
      _count: {
        select: {
          attachments: true,
          progress: true,
          notes: true,
        },
      },
    };

    if (includeAttachments === "true") {
      includeOptions.attachments = {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          fileUrl: true,
          fileType: true,
          fileSize: true,
          order: true,
          isRequired: true,
          createdAt: true,
        },
      };
    }

    if (includeProgress === "true") {
      includeOptions.progress = {
        select: {
          id: true,
          userId: true,
          completedAt: true,
          timeSpent: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { completedAt: "desc" },
        take: 10,
      };
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: includeOptions,
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== lesson.section.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only view lessons from your own courses",
      });
    }

    const formattedLesson = {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      transcript: lesson.transcript,
      transcriptText: lesson.transcriptText,
      duration: lesson.duration,
      order: lesson.order,
      type: lesson.type,
      isFree: lesson.isFree,
      isPreview: lesson.isPreview,
      isRequired: lesson.isRequired,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      section: {
        id: lesson.section.id,
        title: lesson.section.title,
        course: lesson.section.course,
      },
      stats: {
        totalAttachments: lesson._count.attachments,
        totalProgress: lesson._count.progress,
        totalNotes: lesson._count.notes,
      },
    };

    if (includeAttachments === "true") {
      formattedLesson.attachments = lesson.attachments || [];
    }

    if (includeProgress === "true") {
      formattedLesson.recentProgress = lesson.progress || [];
    }

    educademyLogger.performance("GET_LESSON_BY_ID", startTime, {
      lessonId,
      includeAttachments: includeAttachments === "true",
      includeProgress: includeProgress === "true",
    });

    res.status(200).json({
      success: true,
      message: "Lesson retrieved successfully",
      data: {
        lesson: formattedLesson,
      },
    });
  } catch (error) {
    educademyLogger.error("Get lesson by ID failed", error, {
      userId: req.userAuthId,
      lessonId,
      business: {
        operation: "GET_LESSON_BY_ID",
        entity: "LESSON",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve lesson",
      requestId,
    });
  }
});

export const toggleLessonStatus = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { lessonId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "LessonController",
    methodName: "toggleLessonStatus",
  });

  try {
    const { field, value } = req.body;

    const validFields = ["isFree", "isPreview", "isRequired"];
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

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
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
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== lesson.section.course.instructorId) {
      return res.status(403).json({
        success: false,
        message: "You can only modify lessons for your own courses",
      });
    }

    if (lesson.section.course.status === "UNDER_REVIEW") {
      return res.status(400).json({
        success: false,
        message: "Cannot modify lesson status while course is under review",
      });
    }

    const updateData = { [field]: value };

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
    });

    await prisma.course.update({
      where: { id: lesson.section.courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    educademyLogger.logBusinessOperation(
      "TOGGLE_LESSON_STATUS",
      "LESSON",
      lessonId,
      "SUCCESS",
      {
        lessonTitle: lesson.title,
        field,
        oldValue: lesson[field],
        newValue: value,
        sectionId: lesson.sectionId,
        courseId: lesson.section.courseId,
      }
    );

    educademyLogger.logAuditTrail(
      "TOGGLE_LESSON_STATUS",
      "LESSON",
      lessonId,
      { [field]: lesson[field] },
      updateData,
      req.userAuthId
    );

    educademyLogger.performance("TOGGLE_LESSON_STATUS", startTime, {
      lessonId,
      field,
    });

    res.status(200).json({
      success: true,
      message: `Lesson ${field} ${value ? "enabled" : "disabled"} successfully`,
      data: {
        lesson: {
          id: updatedLesson.id,
          title: updatedLesson.title,
          [field]: updatedLesson[field],
        },
        change: {
          field,
          from: lesson[field],
          to: value,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Toggle lesson status failed", error, {
      userId: req.userAuthId,
      lessonId,
      business: {
        operation: "TOGGLE_LESSON_STATUS",
        entity: "LESSON",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to toggle lesson status",
      requestId,
    });
  }
});

export const bulkUpdateLessons = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { sectionId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "LessonController",
    methodName: "bulkUpdateLessons",
  });

  try {
    const { lessonIds, updates } = req.body;

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Lesson IDs array is required",
      });
    }

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({
        success: false,
        message: "Updates object is required",
      });
    }

    if (lessonIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Cannot update more than 50 lessons at once",
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
        message: "You can only update lessons for your own courses",
      });
    }

    if (section.course.status === "UNDER_REVIEW") {
      return res.status(400).json({
        success: false,
        message: "Cannot update lessons while course is under review",
      });
    }

    const validFields = ["isFree", "isPreview", "isRequired", "duration"];
    const invalidFields = Object.keys(updates).filter(
      (field) => !validFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidFields.join(
          ", "
        )}. Valid fields: ${validFields.join(", ")}`,
      });
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
        sectionId,
      },
      select: { id: true, title: true },
    });

    if (lessons.length !== lessonIds.length) {
      const foundIds = lessons.map((l) => l.id);
      const missingIds = lessonIds.filter((id) => !foundIds.includes(id));

      return res.status(400).json({
        success: false,
        message: "Some lessons not found in the specified section",
        data: { missingIds },
      });
    }

    const updateData = { ...updates };
    if (updateData.duration) {
      updateData.duration = parseInt(updateData.duration);
      if (isNaN(updateData.duration) || updateData.duration < 0) {
        return res.status(400).json({
          success: false,
          message: "Duration must be a valid positive number",
        });
      }
    }

    await prisma.lesson.updateMany({
      where: {
        id: { in: lessonIds },
        sectionId,
      },
      data: updateData,
    });

    await prisma.course.update({
      where: { id: section.courseId },
      data: {
        lastUpdated: new Date(),
      },
    });

    const updatedLessons = await prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
      },
      select: {
        id: true,
        title: true,
        isFree: true,
        isPreview: true,
        isRequired: true,
        duration: true,
        order: true,
      },
      orderBy: { order: "asc" },
    });

    educademyLogger.logBusinessOperation(
      "BULK_UPDATE_LESSONS",
      "LESSON",
      sectionId,
      "SUCCESS",
      {
        sectionId,
        courseId: section.courseId,
        lessonCount: lessonIds.length,
        updatedFields: Object.keys(updates),
        updates,
      }
    );

    educademyLogger.logAuditTrail(
      "BULK_UPDATE_LESSONS",
      "SECTION",
      sectionId,
      { lessonIds },
      { updates, lessonCount: lessonIds.length },
      req.userAuthId
    );

    educademyLogger.performance("BULK_UPDATE_LESSONS", startTime, {
      sectionId,
      lessonCount: lessonIds.length,
      updateFields: Object.keys(updates).length,
    });

    res.status(200).json({
      success: true,
      message: `${lessonIds.length} lessons updated successfully`,
      data: {
        section: {
          id: section.id,
          title: section.title,
          course: {
            id: section.course.id,
            title: section.course.title,
          },
        },
        updatedLessons,
        summary: {
          totalUpdated: lessonIds.length,
          updatedFields: Object.keys(updates),
          changes: updates,
        },
      },
    });
  } catch (error) {
    educademyLogger.error("Bulk update lessons failed", error, {
      userId: req.userAuthId,
      sectionId,
      business: {
        operation: "BULK_UPDATE_LESSONS",
        entity: "LESSON",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to update lessons",
      requestId,
    });
  }
});
