import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import educademyLogger from "../../utils/logger.js";
import emailService from "../../utils/emailService.js";
import { performance } from "perf_hooks";
import {
  uploadImage,
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

export const createCourse = asyncHandler(async (req, res) => {
  uploadImage.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "previewVideo", maxCount: 1 },
    { name: "introVideo", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      educademyLogger.logValidationError("fileUpload", req.files, err.message, {
        userId: req.userAuthId,
        operation: "CREATE_COURSE",
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
      className: "CourseController",
      methodName: "createCourse",
    });

    educademyLogger.logMethodEntry("CourseController", "createCourse", {
      userId: req.userAuthId,
      clientIp: req.ip,
      userAgent: req.get("User-Agent"),
    });

    try {
      const {
        title,
        description,
        shortDescription,
        price,
        originalPrice,
        duration,
        level,
        categoryId,
        subcategoryId,
        language = "English",
        subtitles = [],
        requirements = [],
        tags = [],
        keyPoints = [],
        learningOutcomes = [],
        targetAudience = [],
        submitForReview = false,
      } = req.body;

      if (
        !title ||
        !description ||
        !shortDescription ||
        !price ||
        !duration ||
        !level ||
        !categoryId
      ) {
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

        educademyLogger.logValidationError(
          "courseData",
          req.body,
          "Missing required fields",
          {
            userId: req.userAuthId,
            missingFields: [
              "title",
              "description",
              "shortDescription",
              "price",
              "duration",
              "level",
              "categoryId",
            ].filter((field) => !req.body[field]),
          }
        );

        return res.status(400).json({
          success: false,
          message:
            "Title, description, short description, price, duration, level, and category are required",
        });
      }

      const coursePrice = parseFloat(price);
      if (isNaN(coursePrice) || coursePrice < 0) {
        educademyLogger.logValidationError(
          "price",
          price,
          "Invalid price value",
          {
            userId: req.userAuthId,
            price,
          }
        );

        return res.status(400).json({
          success: false,
          message: "Price must be a valid positive number",
        });
      }

      let courseOriginalPrice = null;
      if (originalPrice) {
        courseOriginalPrice = parseFloat(originalPrice);
        if (isNaN(courseOriginalPrice) || courseOriginalPrice < 0) {
          educademyLogger.logValidationError(
            "originalPrice",
            originalPrice,
            "Invalid original price value",
            {
              userId: req.userAuthId,
              originalPrice,
            }
          );

          return res.status(400).json({
            success: false,
            message: "Original price must be a valid positive number",
          });
        }

        if (courseOriginalPrice <= coursePrice) {
          educademyLogger.logValidationError(
            "originalPrice",
            { originalPrice, price },
            "Original price must be higher than current price",
            {
              userId: req.userAuthId,
              originalPrice: courseOriginalPrice,
              price: coursePrice,
            }
          );

          return res.status(400).json({
            success: false,
            message: "Original price must be higher than current price",
          });
        }
      }

      const instructorProfile = await prisma.instructor.findUnique({
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

      if (!instructorProfile) {
        educademyLogger.logValidationError(
          "instructorProfile",
          req.userAuthId,
          "Instructor profile not found",
          {
            userId: req.userAuthId,
          }
        );

        return res.status(403).json({
          success: false,
          message: "Instructor profile required to create courses",
        });
      }

      if (!instructorProfile.user.isActive) {
        educademyLogger.logSecurityEvent(
          "INACTIVE_USER_COURSE_CREATION_ATTEMPT",
          "HIGH",
          {
            userId: req.userAuthId,
            email: instructorProfile.user.email,
          },
          req.userAuthId
        );

        return res.status(403).json({
          success: false,
          message: "Account is not active. Please contact support.",
        });
      }

      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true, isActive: true },
      });

      if (!category) {
        educademyLogger.logValidationError(
          "category",
          categoryId,
          "Category not found",
          {
            userId: req.userAuthId,
            categoryId,
          }
        );

        return res.status(400).json({
          success: false,
          message: "Invalid category selected",
        });
      }

      if (!category.isActive) {
        educademyLogger.logValidationError(
          "category",
          categoryId,
          "Category is inactive",
          {
            userId: req.userAuthId,
            categoryId,
          }
        );

        return res.status(400).json({
          success: false,
          message: "Selected category is not available",
        });
      }

      let subcategory = null;
      if (subcategoryId) {
        subcategory = await prisma.category.findUnique({
          where: { id: subcategoryId },
          select: { id: true, name: true, isActive: true, parentId: true },
        });

        if (!subcategory || subcategory.parentId !== categoryId) {
          educademyLogger.logValidationError(
            "subcategory",
            subcategoryId,
            "Invalid subcategory",
            {
              userId: req.userAuthId,
              categoryId,
              subcategoryId,
            }
          );

          return res.status(400).json({
            success: false,
            message: "Invalid subcategory for selected category",
          });
        }
      }

      const validLevels = [
        "BEGINNER",
        "INTERMEDIATE",
        "ADVANCED",
        "ALL_LEVELS",
      ];
      if (!validLevels.includes(level)) {
        educademyLogger.logValidationError(
          "level",
          level,
          "Invalid course level",
          {
            userId: req.userAuthId,
            validLevels,
          }
        );

        return res.status(400).json({
          success: false,
          message: `Invalid level. Must be one of: ${validLevels.join(", ")}`,
        });
      }

      // Generate unique slug from title
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim("-");

      let slug = baseSlug;
      let counter = 1;

      // Ensure slug uniqueness
      while (true) {
        const existingCourse = await prisma.course.findUnique({
          where: { slug },
          select: { id: true },
        });

        if (!existingCourse) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Process uploaded files
      const thumbnail = req.files?.thumbnail?.[0]?.path || null;
      const previewVideo = req.files?.previewVideo?.[0]?.path || null;
      const introVideo = req.files?.introVideo?.[0]?.path || null;

      // Parse array fields from JSON strings if needed
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

      const parsedSubtitles = parseArrayField(subtitles);
      const parsedRequirements = parseArrayField(requirements);
      const parsedTags = parseArrayField(tags);
      const parsedKeyPoints = parseArrayField(keyPoints);
      const parsedLearningOutcomes = parseArrayField(learningOutcomes);
      const parsedTargetAudience = parseArrayField(targetAudience);

      // Determine initial status
      const status = submitForReview ? "UNDER_REVIEW" : "DRAFT";

      // Create course - removed discountPrice as it should be calculated dynamically
      const courseData = {
        title,
        slug,
        description,
        shortDescription,
        thumbnail,
        previewVideo,
        introVideo,
        price: coursePrice,
        originalPrice: courseOriginalPrice,
        duration: parseInt(duration),
        level,
        status,
        language,
        subtitles: parsedSubtitles,
        requirements: parsedRequirements,
        tags: parsedTags,
        keyPoints: parsedKeyPoints,
        learningOutcomes: parsedLearningOutcomes,
        targetAudience: parsedTargetAudience,
        instructorId: instructorProfile.id,
        categoryId,
        subcategoryId: subcategoryId || null,
        lastUpdated: new Date(),
        ...(submitForReview && { reviewSubmittedAt: new Date() }),
      };

      const course = await prisma.course.create({
        data: courseData,
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
          category: {
            select: { name: true },
          },
          subcategory: {
            select: { name: true },
          },
        },
      });

      // Update instructor's total courses count
      await prisma.instructor.update({
        where: { id: instructorProfile.id },
        data: {
          totalCourses: {
            increment: 1,
          },
        },
      });

      // Create course settings with defaults
      await prisma.courseSettings.create({
        data: {
          courseId: course.id,
          allowDiscussions: true,
          allowReviews: true,
          requireApproval: false,
          certificateEnabled: true,
          downloadable: false,
          allowPreview: true,
          autoEnrollmentEmail: true,
          sequentialProgress: true,
          passingGrade: 70,
        },
      });

      // Send notification to instructor
      await prisma.notification.create({
        data: {
          type: "COURSE_UPDATED",
          title: submitForReview
            ? "Course Submitted for Review"
            : "Course Created Successfully",
          message: submitForReview
            ? `Your course "${title}" has been submitted for review. You'll be notified once the review is complete.`
            : `Your course "${title}" has been created successfully. You can continue editing or submit it for review when ready.`,
          userId: req.userAuthId,
          priority: submitForReview ? "HIGH" : "NORMAL",
          data: {
            courseId: course.id,
            courseTitle: title,
            action: submitForReview ? "submitted_for_review" : "created",
            status,
          },
        },
      });

      // Send email notification
      try {
        if (submitForReview) {
          await emailService.sendCourseSubmittedForReview({
            email: instructorProfile.user.email,
            firstName: instructorProfile.user.firstName,
            courseTitle: title,
            instructorName: `${instructorProfile.user.firstName} ${instructorProfile.user.lastName}`,
            submissionDate: new Date(),
            reviewDashboardUrl: `${process.env.FRONTEND_URL}/instructor/courses/${course.id}`,
          });
        } else {
          await emailService.sendCourseCreated({
            email: instructorProfile.user.email,
            firstName: instructorProfile.user.firstName,
            courseTitle: title,
            courseUrl: `${process.env.FRONTEND_URL}/courses/${course.slug}`,
            instructorName: `${instructorProfile.user.firstName} ${instructorProfile.user.lastName}`,
            publicationDate: new Date(),
            dashboardUrl: `${process.env.FRONTEND_URL}/instructor/dashboard`,
          });
        }
      } catch (emailError) {
        educademyLogger.error(
          "Failed to send course creation email",
          emailError,
          {
            userId: req.userAuthId,
            courseId: course.id,
            email: instructorProfile.user.email,
          }
        );
      }

      educademyLogger.logBusinessOperation(
        "CREATE_COURSE",
        "COURSE",
        course.id,
        "SUCCESS",
        {
          courseTitle: title,
          status,
          categoryId,
          subcategoryId,
          level,
          price: coursePrice,
          originalPrice: courseOriginalPrice,
          hasFiles: !!(thumbnail || previewVideo || introVideo),
          submitForReview,
          instructorId: instructorProfile.id,
        }
      );

      educademyLogger.logAuditTrail(
        "CREATE_COURSE",
        "COURSE",
        course.id,
        null,
        {
          title,
          status,
          price: coursePrice,
          instructorId: instructorProfile.id,
        },
        req.userAuthId
      );

      educademyLogger.performance("CREATE_COURSE", startTime, {
        courseId: course.id,
        hasUploads: !!(thumbnail || previewVideo || introVideo),
      });

      educademyLogger.logMethodExit(
        "CourseController",
        "createCourse",
        true,
        performance.now() - startTime
      );

      res.status(201).json({
        success: true,
        message: submitForReview
          ? "Course created and submitted for review successfully"
          : "Course created successfully",
        data: {
          course: {
            id: course.id,
            title: course.title,
            slug: course.slug,
            status: course.status,
            thumbnail: course.thumbnail,
            previewVideo: course.previewVideo,
            price: course.price,
            originalPrice: course.originalPrice,
            level: course.level,
            category: course.category.name,
            subcategory: course.subcategory?.name,
            createdAt: course.createdAt,
            lastUpdated: course.lastUpdated,
          },
          nextSteps: submitForReview
            ? ["Wait for admin review", "Check notifications for updates"]
            : [
                "Add course sections",
                "Create lessons",
                "Submit for review when ready",
              ],
          pricing: {
            basePrice: course.price,
            originalPrice: course.originalPrice,
            note: "Discounts will be applied automatically when students use coupons during checkout",
          },
        },
      });
    } catch (error) {
      // Clean up uploaded files on error
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

      educademyLogger.error("Create course failed", error, {
        userId: req.userAuthId,
        business: {
          operation: "CREATE_COURSE",
          entity: "COURSE",
          status: "ERROR",
        },
        request: {
          title: req.body.title,
          categoryId: req.body.categoryId,
          level: req.body.level,
          price: req.body.price,
        },
        stack: error.stack,
      });

      educademyLogger.logMethodExit(
        "CourseController",
        "createCourse",
        false,
        performance.now() - startTime
      );

      res.status(500).json({
        success: false,
        message: "Failed to create course",
        requestId,
      });
    }
  });
});

export const updateCourse = asyncHandler(async (req, res) => {
  uploadImage.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "previewVideo", maxCount: 1 },
    { name: "introVideo", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      educademyLogger.logValidationError("fileUpload", req.files, err.message, {
        userId: req.userAuthId,
        operation: "UPDATE_COURSE",
      });
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const startTime = performance.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    const { courseId } = req.params;

    educademyLogger.setContext({
      requestId,
      userId: req.userAuthId,
      className: "CourseController",
      methodName: "updateCourse",
    });

    educademyLogger.logMethodEntry("CourseController", "updateCourse", {
      userId: req.userAuthId,
      courseId,
      clientIp: req.ip,
    });

    try {
      const {
        title,
        description,
        shortDescription,
        price,
        discountPrice,
        originalPrice,
        duration,
        level,
        categoryId,
        subcategoryId,
        language,
        subtitles,
        requirements,
        tags,
        keyPoints,
        learningOutcomes,
        targetAudience,
        submitForReview = false,
        removeThumbnail = false,
        removePreviewVideo = false,
        removeIntroVideo = false,
      } = req.body;

      const currentCourse = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          instructor: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  isActive: true,
                },
              },
            },
          },
          category: {
            select: { name: true },
          },
          subcategory: {
            select: { name: true },
          },
          _count: {
            select: {
              enrollments: true,
              sections: true,
            },
          },
        },
      });

      if (!currentCourse) {
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
          message: "Course not found",
        });
      }

      if (currentCourse.instructor.user.id !== req.userAuthId) {
        educademyLogger.logSecurityEvent(
          "UNAUTHORIZED_COURSE_UPDATE_ATTEMPT",
          "HIGH",
          {
            userId: req.userAuthId,
            courseId,
            actualOwnerId: currentCourse.instructor.user.id,
          },
          req.userAuthId
        );

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
          message: "You can only update your own courses",
        });
      }

      if (currentCourse.status === "UNDER_REVIEW") {
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
          message: "Cannot update course while it's under review",
        });
      }

      if (
        currentCourse.status === "PUBLISHED" &&
        currentCourse._count.enrollments > 0
      ) {
        const restrictedFields = ["price", "level"];
        const hasRestrictedChanges = restrictedFields.some(
          (field) =>
            req.body[field] !== undefined &&
            req.body[field] !== currentCourse[field]
        );

        if (hasRestrictedChanges) {
          educademyLogger.logValidationError(
            "restrictedUpdate",
            req.body,
            "Cannot modify restricted fields for published course with enrollments",
            {
              userId: req.userAuthId,
              courseId,
              enrollmentCount: currentCourse._count.enrollments,
              restrictedFields,
            }
          );

          return res.status(400).json({
            success: false,
            message:
              "Cannot modify price or level for published courses with active enrollments",
          });
        }
      }

      let category = null;
      if (categoryId && categoryId !== currentCourse.categoryId) {
        category = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { id: true, name: true, isActive: true },
        });

        if (!category || !category.isActive) {
          return res.status(400).json({
            success: false,
            message: "Invalid or inactive category selected",
          });
        }
      }

      let subcategory = null;
      if (subcategoryId) {
        const targetCategoryId = categoryId || currentCourse.categoryId;
        subcategory = await prisma.category.findUnique({
          where: { id: subcategoryId },
          select: { id: true, name: true, isActive: true, parentId: true },
        });

        if (!subcategory || subcategory.parentId !== targetCategoryId) {
          return res.status(400).json({
            success: false,
            message: "Invalid subcategory for selected category",
          });
        }
      }

      const validLevels = [
        "BEGINNER",
        "INTERMEDIATE",
        "ADVANCED",
        "ALL_LEVELS",
      ];
      if (level && !validLevels.includes(level)) {
        return res.status(400).json({
          success: false,
          message: `Invalid level. Must be one of: ${validLevels.join(", ")}`,
        });
      }

      const updateData = {};

      if (title !== undefined && title !== currentCourse.title) {
        updateData.title = title;

        const baseSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim("-");

        let slug = baseSlug;
        let counter = 1;

        while (true) {
          const existingCourse = await prisma.course.findFirst({
            where: {
              slug,
              id: { not: courseId },
            },
            select: { id: true },
          });

          if (!existingCourse) break;

          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        updateData.slug = slug;
      }

      if (description !== undefined) updateData.description = description;
      if (shortDescription !== undefined)
        updateData.shortDescription = shortDescription;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (discountPrice !== undefined)
        updateData.discountPrice = discountPrice
          ? parseFloat(discountPrice)
          : null;
      if (originalPrice !== undefined)
        updateData.originalPrice = originalPrice
          ? parseFloat(originalPrice)
          : null;
      if (duration !== undefined) updateData.duration = parseInt(duration);
      if (level !== undefined) updateData.level = level;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (subcategoryId !== undefined)
        updateData.subcategoryId = subcategoryId || null;
      if (language !== undefined) updateData.language = language;

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
        return Array.isArray(field) ? field : undefined;
      };

      if (subtitles !== undefined)
        updateData.subtitles = parseArrayField(subtitles) || [];
      if (requirements !== undefined)
        updateData.requirements = parseArrayField(requirements) || [];
      if (tags !== undefined) updateData.tags = parseArrayField(tags) || [];
      if (keyPoints !== undefined)
        updateData.keyPoints = parseArrayField(keyPoints) || [];
      if (learningOutcomes !== undefined)
        updateData.learningOutcomes = parseArrayField(learningOutcomes) || [];
      if (targetAudience !== undefined)
        updateData.targetAudience = parseArrayField(targetAudience) || [];

      const newThumbnail = req.files?.thumbnail?.[0]?.path;
      const newPreviewVideo = req.files?.previewVideo?.[0]?.path;
      const newIntroVideo = req.files?.introVideo?.[0]?.path;

      if (newThumbnail) {
        updateData.thumbnail = newThumbnail;
        if (currentCourse.thumbnail) {
          try {
            const publicId = currentCourse.thumbnail
              .split("/")
              .pop()
              .split(".")[0];
            await deleteFromCloudinary(`educademy/images/${publicId}`);
          } catch (deleteError) {
            educademyLogger.warn("Failed to delete old thumbnail", {
              courseId,
              oldThumbnail: currentCourse.thumbnail,
              error: deleteError.message,
            });
          }
        }
      } else if (removeThumbnail === "true" && currentCourse.thumbnail) {
        updateData.thumbnail = null;
        try {
          const publicId = currentCourse.thumbnail
            .split("/")
            .pop()
            .split(".")[0];
          await deleteFromCloudinary(`educademy/images/${publicId}`);
        } catch (deleteError) {
          educademyLogger.warn("Failed to delete removed thumbnail", {
            courseId,
            removedThumbnail: currentCourse.thumbnail,
            error: deleteError.message,
          });
        }
      }

      if (newPreviewVideo) {
        updateData.previewVideo = newPreviewVideo;
        if (currentCourse.previewVideo) {
          try {
            const publicId = currentCourse.previewVideo
              .split("/")
              .pop()
              .split(".")[0];
            await deleteFromCloudinary(`educademy/videos/${publicId}`);
          } catch (deleteError) {
            educademyLogger.warn("Failed to delete old preview video", {
              courseId,
              oldVideo: currentCourse.previewVideo,
              error: deleteError.message,
            });
          }
        }
      } else if (removePreviewVideo === "true" && currentCourse.previewVideo) {
        updateData.previewVideo = null;
        try {
          const publicId = currentCourse.previewVideo
            .split("/")
            .pop()
            .split(".")[0];
          await deleteFromCloudinary(`educademy/videos/${publicId}`);
        } catch (deleteError) {
          educademyLogger.warn("Failed to delete removed preview video", {
            courseId,
            removedVideo: currentCourse.previewVideo,
            error: deleteError.message,
          });
        }
      }

      if (newIntroVideo) {
        updateData.introVideo = newIntroVideo;
        if (currentCourse.introVideo) {
          try {
            const publicId = currentCourse.introVideo
              .split("/")
              .pop()
              .split(".")[0];
            await deleteFromCloudinary(`educademy/videos/${publicId}`);
          } catch (deleteError) {
            educademyLogger.warn("Failed to delete old intro video", {
              courseId,
              oldVideo: currentCourse.introVideo,
              error: deleteError.message,
            });
          }
        }
      } else if (removeIntroVideo === "true" && currentCourse.introVideo) {
        updateData.introVideo = null;
        try {
          const publicId = currentCourse.introVideo
            .split("/")
            .pop()
            .split(".")[0];
          await deleteFromCloudinary(`educademy/videos/${publicId}`);
        } catch (deleteError) {
          educademyLogger.warn("Failed to delete removed intro video", {
            courseId,
            removedVideo: currentCourse.introVideo,
            error: deleteError.message,
          });
        }
      }

      if (submitForReview && currentCourse.status === "DRAFT") {
        updateData.status = "UNDER_REVIEW";
        updateData.reviewSubmittedAt = new Date();
      }

      updateData.lastUpdated = new Date();

      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: updateData,
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
          category: {
            select: { name: true },
          },
          subcategory: {
            select: { name: true },
          },
          _count: {
            select: {
              enrollments: true,
              sections: true,
              reviews: true,
            },
          },
        },
      });

      let notificationMessage = `Your course "${updatedCourse.title}" has been updated successfully.`;
      let notificationTitle = "Course Updated";
      let notificationPriority = "NORMAL";

      if (submitForReview && currentCourse.status === "DRAFT") {
        notificationMessage = `Your course "${updatedCourse.title}" has been submitted for review. You'll be notified once the review is complete.`;
        notificationTitle = "Course Submitted for Review";
        notificationPriority = "HIGH";
      }

      await prisma.notification.create({
        data: {
          type: "COURSE_UPDATED",
          title: notificationTitle,
          message: notificationMessage,
          userId: req.userAuthId,
          priority: notificationPriority,
          data: {
            courseId: updatedCourse.id,
            courseTitle: updatedCourse.title,
            action: submitForReview ? "submitted_for_review" : "updated",
            status: updatedCourse.status,
            changedFields: Object.keys(updateData),
          },
        },
      });

      try {
        if (submitForReview && currentCourse.status === "DRAFT") {
          await emailService.sendEmail({
            to: currentCourse.instructor.user.email,
            subject: "📋 Course Submitted for Review - What Happens Next",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #366092;">Course Submitted for Review</h2>
                <p>Hi ${currentCourse.instructor.user.firstName},</p>
                <p>Your course "<strong>${updatedCourse.title}</strong>" has been successfully submitted for review.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #366092; margin-top: 0;">What happens next?</h3>
                  <ul>
                    <li>Our team will review your course within 3-5 business days</li>
                    <li>You'll receive an email notification once the review is complete</li>
                    <li>If approved, your course will be published and available to students</li>
                    <li>If changes are needed, we'll provide detailed feedback</li>
                  </ul>
                </div>

                <p>You can track your course status in your instructor dashboard.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL}/instructor/courses/${updatedCourse.id}" 
                     style="background: #366092; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                    View Course Status
                  </a>
                </div>

                <p>Best regards,<br>The Educademy Team</p>
              </div>
            `,
          });
        } else if (Object.keys(updateData).length > 1) {
          await emailService.sendEmail({
            to: currentCourse.instructor.user.email,
            subject: "✏️ Course Updated Successfully",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #366092;">Course Updated</h2>
                <p>Hi ${currentCourse.instructor.user.firstName},</p>
                <p>Your course "<strong>${
                  updatedCourse.title
                }</strong>" has been updated successfully.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #366092; margin-top: 0;">Updated Fields:</h3>
                  <p>${Object.keys(updateData)
                    .filter((field) => field !== "lastUpdated")
                    .join(", ")}</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL}/instructor/courses/${
              updatedCourse.id
            }/edit" 
                     style="background: #366092; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                    Continue Editing
                  </a>
                </div>

                <p>Best regards,<br>The Educademy Team</p>
              </div>
            `,
          });
        }
      } catch (emailError) {
        educademyLogger.error(
          "Failed to send course update email",
          emailError,
          {
            userId: req.userAuthId,
            courseId: updatedCourse.id,
            email: currentCourse.instructor.user.email,
          }
        );
      }

      educademyLogger.logBusinessOperation(
        "UPDATE_COURSE",
        "COURSE",
        courseId,
        "SUCCESS",
        {
          courseTitle: updatedCourse.title,
          oldStatus: currentCourse.status,
          newStatus: updatedCourse.status,
          changedFields: Object.keys(updateData),
          submitForReview,
          hasFileUploads: !!(newThumbnail || newPreviewVideo || newIntroVideo),
          instructorId: currentCourse.instructor.id,
        }
      );

      educademyLogger.logAuditTrail(
        "UPDATE_COURSE",
        "COURSE",
        courseId,
        {
          title: currentCourse.title,
          status: currentCourse.status,
          price: currentCourse.price,
        },
        updateData,
        req.userAuthId
      );

      educademyLogger.performance("UPDATE_COURSE", startTime, {
        courseId,
        changedFields: Object.keys(updateData).length,
        hasUploads: !!(newThumbnail || newPreviewVideo || newIntroVideo),
      });

      educademyLogger.logMethodExit(
        "CourseController",
        "updateCourse",
        true,
        performance.now() - startTime
      );

      res.status(200).json({
        success: true,
        message:
          submitForReview && currentCourse.status === "DRAFT"
            ? "Course updated and submitted for review successfully"
            : "Course updated successfully",
        data: {
          course: {
            id: updatedCourse.id,
            title: updatedCourse.title,
            slug: updatedCourse.slug,
            status: updatedCourse.status,
            thumbnail: updatedCourse.thumbnail,
            previewVideo: updatedCourse.previewVideo,
            introVideo: updatedCourse.introVideo,
            price: updatedCourse.price,
            discountPrice: updatedCourse.discountPrice,
            level: updatedCourse.level,
            category: updatedCourse.category.name,
            subcategory: updatedCourse.subcategory?.name,
            enrollmentCount: updatedCourse._count.enrollments,
            sectionsCount: updatedCourse._count.sections,
            reviewsCount: updatedCourse._count.reviews,
            lastUpdated: updatedCourse.lastUpdated,
            updatedAt: updatedCourse.updatedAt,
          },
          changes: {
            fieldsUpdated: Object.keys(updateData),
            statusChanged: currentCourse.status !== updatedCourse.status,
            submittedForReview:
              submitForReview && currentCourse.status === "DRAFT",
          },
        },
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

      educademyLogger.error("Update course failed", error, {
        userId: req.userAuthId,
        courseId,
        business: {
          operation: "UPDATE_COURSE",
          entity: "COURSE",
          status: "ERROR",
        },
        request: {
          hasFileUploads: !!(req.files && Object.keys(req.files).length > 0),
          submitForReview,
        },
      });

      educademyLogger.logMethodExit(
        "CourseController",
        "updateCourse",
        false,
        performance.now() - startTime
      );

      res.status(500).json({
        success: false,
        message: "Failed to update course",
        requestId,
      });
    }
  });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CourseController",
    methodName: "deleteCourse",
  });

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { userId: true },
        },
        _count: {
          select: {
            enrollments: true,
            sections: true,
            reviews: true,
          },
        },
        sections: {
          include: {
            _count: {
              select: {
                lessons: true,
                assignments: true,
                quizzes: true,
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

    if (course.instructor.userId !== req.userAuthId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own courses",
      });
    }

    if (course.status === "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete published courses. Consider archiving instead.",
      });
    }

    if (course.status === "UNDER_REVIEW") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete courses under review. Please wait for review completion.",
      });
    }

    if (course._count.enrollments > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete course with enrollments. Consider archiving instead.",
        details: {
          enrollments: course._count.enrollments,
        },
      });
    }

    const hasContent = course.sections.some(
      (section) =>
        section._count.lessons > 0 ||
        section._count.assignments > 0 ||
        section._count.quizzes > 0
    );

    if (hasContent) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete course with content. Please remove all sections, lessons, assignments, and quizzes first.",
        details: {
          sections: course._count.sections,
          totalContent: course.sections.reduce(
            (sum, section) =>
              sum +
              section._count.lessons +
              section._count.assignments +
              section._count.quizzes,
            0
          ),
        },
      });
    }

    const cleanupPromises = [];

    if (course.thumbnail) {
      try {
        const publicId = course.thumbnail.split("/").pop().split(".")[0];
        cleanupPromises.push(
          deleteFromCloudinary(`educademy/images/${publicId}`).catch(
            (error) => {
              educademyLogger.warn("Failed to delete course thumbnail", {
                courseId,
                thumbnail: course.thumbnail,
                error: error.message,
              });
            }
          )
        );
      } catch (parseError) {
        educademyLogger.warn("Failed to parse thumbnail URL for deletion", {
          courseId,
          thumbnail: course.thumbnail,
        });
      }
    }

    if (course.previewVideo) {
      try {
        const publicId = course.previewVideo.split("/").pop().split(".")[0];
        cleanupPromises.push(
          deleteFromCloudinary(`educademy/videos/${publicId}`).catch(
            (error) => {
              educademyLogger.warn("Failed to delete course preview video", {
                courseId,
                previewVideo: course.previewVideo,
                error: error.message,
              });
            }
          )
        );
      } catch (parseError) {
        educademyLogger.warn("Failed to parse preview video URL for deletion", {
          courseId,
          previewVideo: course.previewVideo,
        });
      }
    }

    if (course.introVideo) {
      try {
        const publicId = course.introVideo.split("/").pop().split(".")[0];
        cleanupPromises.push(
          deleteFromCloudinary(`educademy/videos/${publicId}`).catch(
            (error) => {
              educademyLogger.warn("Failed to delete course intro video", {
                courseId,
                introVideo: course.introVideo,
                error: error.message,
              });
            }
          )
        );
      } catch (parseError) {
        educademyLogger.warn("Failed to parse intro video URL for deletion", {
          courseId,
          introVideo: course.introVideo,
        });
      }
    }

    await Promise.allSettled(cleanupPromises);

    await prisma.course.delete({
      where: { id: courseId },
    });

    await prisma.instructor.update({
      where: { userId: req.userAuthId },
      data: {
        totalCourses: { decrement: 1 },
      },
    });

    await prisma.notification.create({
      data: {
        type: "COURSE_DELETED",
        title: "Course Deleted",
        message: `Course "${course.title}" has been deleted successfully.`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          courseId: course.id,
          courseTitle: course.title,
          courseSlug: course.slug,
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
        courseStatus: course.status,
        hadEnrollments: course._count.enrollments > 0,
        hadContent: hasContent,
        sectionsCount: course._count.sections,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "DELETE_COURSE",
      "COURSE",
      courseId,
      {
        title: course.title,
        slug: course.slug,
        status: course.status,
        price: course.price,
        enrollmentCount: course._count.enrollments,
      },
      null,
      req.userAuthId
    );

    educademyLogger.performance("DELETE_COURSE", startTime, {
      userId: req.userAuthId,
      courseId,
      fileCleanupCount: cleanupPromises.length,
    });

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: {
        deletedCourseId: courseId,
        courseTitle: course.title,
        filesDeleted: cleanupPromises.length,
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

export const archiveCourse = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CourseController",
    methodName: "archiveCourse",
  });

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { userId: true },
        },
        _count: {
          select: {
            enrollments: true,
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

    if (course.instructor.userId !== req.userAuthId) {
      return res.status(403).json({
        success: false,
        message: "You can only archive your own courses",
      });
    }

    if (course.status === "ARCHIVED") {
      return res.status(400).json({
        success: false,
        message: "Course is already archived",
      });
    }

    if (course.status === "UNDER_REVIEW") {
      return res.status(400).json({
        success: false,
        message: "Cannot archive course while under review",
      });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        lastUpdated: new Date(),
      },
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
            sections: true,
            reviews: true,
          },
        },
      },
    });

    if (course.status === "PUBLISHED" && course._count.enrollments > 0) {
      const enrolledStudents = await prisma.enrollment.findMany({
        where: {
          courseId,
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
              type: "COURSE_ARCHIVED",
              title: "Course Archived",
              message: `The course "${course.title}" has been archived. You can still access your enrolled content.`,
              userId: enrollment.student.user.id,
              priority: "NORMAL",
              data: {
                courseId: course.id,
                courseTitle: course.title,
                archivedAt: updatedCourse.archivedAt,
              },
            },
          })
          .catch((error) => {
            educademyLogger.error(
              "Failed to create archive notification",
              error,
              {
                userId: enrollment.student.user.id,
                courseId,
              }
            );
          })
      );

      await Promise.allSettled(notificationPromises);

      try {
        const emailPromises = enrolledStudents.slice(0, 50).map((enrollment) =>
          emailService
            .sendEmail({
              to: enrollment.student.user.email,
              subject: `📚 Course Archived: ${course.title}`,
              html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #366092;">Course Archived</h2>
                <p>Hi ${enrollment.student.user.firstName},</p>
                <p>We wanted to inform you that the course you're enrolled in has been archived:</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #366092; margin-top: 0;">${
                    course.title
                  }</h3>
                  <p><strong>Archived on:</strong> ${updatedCourse.archivedAt.toLocaleDateString()}</p>
                </div>

                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>What this means:</strong></p>
                  <ul style="margin: 10px 0;">
                    <li>You can still access all course content</li>
                    <li>Your progress is preserved</li>
                    <li>The course is no longer available for new enrollments</li>
                    <li>No new content updates will be made</li>
                  </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL}/courses/${courseId}" 
                     style="background: #366092; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                    Continue Learning
                  </a>
                </div>

                <p>Best regards,<br>The Educademy Team</p>
              </div>
            `,
            })
            .catch((error) => {
              educademyLogger.error("Failed to send archive email", error, {
                userId: enrollment.student.user.id,
                courseId,
                email: enrollment.student.user.email,
              });
            })
        );

        await Promise.allSettled(emailPromises);
      } catch (emailError) {
        educademyLogger.error("Failed to send archive emails", emailError, {
          userId: req.userAuthId,
          courseId,
        });
      }
    }

    await prisma.notification.create({
      data: {
        type: "COURSE_ARCHIVED",
        title: "Course Archived",
        message: `Course "${course.title}" has been archived successfully.`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          courseId: course.id,
          courseTitle: course.title,
          previousStatus: course.status,
          archivedAt: updatedCourse.archivedAt,
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "ARCHIVE_COURSE",
      "COURSE",
      courseId,
      "SUCCESS",
      {
        courseTitle: course.title,
        previousStatus: course.status,
        enrollmentCount: course._count.enrollments,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "ARCHIVE_COURSE",
      "COURSE",
      courseId,
      {
        status: course.status,
        lastUpdated: course.lastUpdated,
      },
      {
        status: "ARCHIVED",
        archivedAt: updatedCourse.archivedAt,
        lastUpdated: updatedCourse.lastUpdated,
      },
      req.userAuthId
    );

    educademyLogger.performance("ARCHIVE_COURSE", startTime, {
      userId: req.userAuthId,
      courseId,
      notificationsSent: course._count.enrollments,
    });

    const responseData = {
      course: {
        id: updatedCourse.id,
        title: updatedCourse.title,
        slug: updatedCourse.slug,
        status: updatedCourse.status,
        archivedAt: updatedCourse.archivedAt,
        previousStatus: course.status,
        enrollmentCount: updatedCourse._count.enrollments,
        sectionsCount: updatedCourse._count.sections,
        reviewsCount: updatedCourse._count.reviews,
        lastUpdated: updatedCourse.lastUpdated,
      },
    };

    res.status(200).json({
      success: true,
      message: "Course archived successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Archive course failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "ARCHIVE_COURSE",
        entity: "COURSE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to archive course",
      requestId,
    });
  }
});

export const unarchiveCourse = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CourseController",
    methodName: "unarchiveCourse",
  });

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { userId: true },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.instructor.userId !== req.userAuthId) {
      return res.status(403).json({
        success: false,
        message: "You can only unarchive your own courses",
      });
    }

    if (course.status !== "ARCHIVED") {
      return res.status(400).json({
        success: false,
        message: "Course is not archived",
      });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "DRAFT",
        archivedAt: null,
        lastUpdated: new Date(),
      },
      include: {
        category: {
          select: { name: true },
        },
        _count: {
          select: {
            enrollments: true,
            sections: true,
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        type: "COURSE_UNARCHIVED",
        title: "Course Unarchived",
        message: `Course "${course.title}" has been unarchived and set to draft status.`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          courseId: course.id,
          courseTitle: course.title,
          newStatus: "DRAFT",
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "UNARCHIVE_COURSE",
      "COURSE",
      courseId,
      "SUCCESS",
      {
        courseTitle: course.title,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "UNARCHIVE_COURSE",
      "COURSE",
      courseId,
      {
        status: course.status,
        archivedAt: course.archivedAt,
      },
      {
        status: "DRAFT",
        archivedAt: null,
        lastUpdated: updatedCourse.lastUpdated,
      },
      req.userAuthId
    );

    educademyLogger.performance("UNARCHIVE_COURSE", startTime, {
      userId: req.userAuthId,
      courseId,
    });

    const responseData = {
      course: {
        id: updatedCourse.id,
        title: updatedCourse.title,
        slug: updatedCourse.slug,
        status: updatedCourse.status,
        enrollmentCount: updatedCourse._count.enrollments,
        sectionsCount: updatedCourse._count.sections,
        lastUpdated: updatedCourse.lastUpdated,
      },
    };

    res.status(200).json({
      success: true,
      message:
        "Course unarchived successfully. You can now edit and resubmit for review.",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Unarchive course failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "UNARCHIVE_COURSE",
        entity: "COURSE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to unarchive course",
      requestId,
    });
  }
});

export const duplicateCourse = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CourseController",
    methodName: "duplicateCourse",
  });

  try {
    const { newTitle, includeContent = true } = req.body;

    if (!newTitle?.trim()) {
      return res.status(400).json({
        success: false,
        message: "New course title is required",
      });
    }

    const originalCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { id: true, userId: true },
        },
        sections:
          includeContent === "true" || includeContent === true
            ? {
                include: {
                  lessons: {
                    include: {
                      attachments: true,
                    },
                  },
                  assignments: true,
                  quizzes: {
                    include: {
                      questions: true,
                    },
                  },
                },
                orderBy: { order: "asc" },
              }
            : false,
      },
    });

    if (!originalCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (originalCourse.instructor.userId !== req.userAuthId) {
      return res.status(403).json({
        success: false,
        message: "You can only duplicate your own courses",
      });
    }

    const baseSlug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingCourse = await prisma.course.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existingCourse) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const duplicatedCourseData = {
      title: newTitle.trim(),
      slug,
      description: originalCourse.description,
      shortDescription: originalCourse.shortDescription,
      thumbnail: null,
      previewVideo: null,
      introVideo: null,
      price: originalCourse.price,
      originalPrice: originalCourse.originalPrice,
      duration: originalCourse.duration,
      level: originalCourse.level,
      status: "DRAFT",
      language: originalCourse.language,
      subtitles: originalCourse.subtitles,
      requirements: originalCourse.requirements,
      tags: originalCourse.tags,
      keyPoints: originalCourse.keyPoints,
      learningOutcomes: originalCourse.learningOutcomes,
      targetAudience: originalCourse.targetAudience,
      instructorId: originalCourse.instructor.id,
      categoryId: originalCourse.categoryId,
      subcategoryId: originalCourse.subcategoryId,
      lastUpdated: new Date(),
    };

    const result = await prisma.$transaction(async (tx) => {
      const duplicatedCourse = await tx.course.create({
        data: duplicatedCourseData,
      });

      await tx.courseSettings.create({
        data: {
          courseId: duplicatedCourse.id,
          allowDiscussions: true,
          allowReviews: true,
          requireApproval: false,
          certificateEnabled: true,
          downloadable: false,
          allowPreview: true,
          autoEnrollmentEmail: true,
          sequentialProgress: true,
          passingGrade: 70,
        },
      });

      if (
        (includeContent === "true" || includeContent === true) &&
        originalCourse.sections?.length > 0
      ) {
        for (const section of originalCourse.sections) {
          const duplicatedSection = await tx.section.create({
            data: {
              title: section.title,
              description: section.description,
              order: section.order,
              isPublished: false,
              isRequired: section.isRequired,
              isFree: section.isFree,
              estimatedTime: section.estimatedTime,
              courseId: duplicatedCourse.id,
            },
          });

          for (const lesson of section.lessons || []) {
            const duplicatedLesson = await tx.lesson.create({
              data: {
                title: lesson.title,
                description: lesson.description,
                order: lesson.order,
                duration: lesson.duration,
                isFree: lesson.isFree,
                isPreview: lesson.isPreview,
                type: lesson.type,
                content: lesson.content,
                videoUrl: null,
                resources: lesson.resources,
                sectionId: duplicatedSection.id,
              },
            });

            if (lesson.attachments?.length > 0) {
              const attachmentPromises = lesson.attachments.map((attachment) =>
                tx.attachment.create({
                  data: {
                    name: attachment.name,
                    fileUrl: null,
                    fileSize: attachment.fileSize,
                    fileType: attachment.fileType,
                    lessonId: duplicatedLesson.id,
                  },
                })
              );
              await Promise.all(attachmentPromises);
            }
          }

          for (const assignment of section.assignments || []) {
            await tx.assignment.create({
              data: {
                title: assignment.title,
                description: assignment.description,
                instructions: assignment.instructions,
                dueDate: null,
                totalPoints: assignment.totalPoints,
                order: assignment.order,
                allowLateSubmission: assignment.allowLateSubmission,
                latePenalty: assignment.latePenalty,
                resources: assignment.resources,
                rubric: assignment.rubric,
                sectionId: duplicatedSection.id,
              },
            });
          }

          for (const quiz of section.quizzes || []) {
            const duplicatedQuiz = await tx.quiz.create({
              data: {
                title: quiz.title,
                description: quiz.description,
                instructions: quiz.instructions,
                duration: quiz.duration,
                passingScore: quiz.passingScore,
                maxAttempts: quiz.maxAttempts,
                order: quiz.order,
                isRequired: quiz.isRequired,
                isRandomized: quiz.isRandomized,
                showResults: quiz.showResults,
                allowReview: quiz.allowReview,
                sectionId: duplicatedSection.id,
              },
            });

            if (quiz.questions?.length > 0) {
              const questionPromises = quiz.questions.map((question) =>
                tx.question.create({
                  data: {
                    content: question.content,
                    type: question.type,
                    points: question.points,
                    order: question.order,
                    options: question.options,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation,
                    hints: question.hints,
                    difficulty: question.difficulty,
                    tags: question.tags,
                    quizId: duplicatedQuiz.id,
                  },
                })
              );
              await Promise.all(questionPromises);
            }
          }
        }
      }

      return duplicatedCourse;
    });

    await prisma.instructor.update({
      where: { id: originalCourse.instructor.id },
      data: {
        totalCourses: { increment: 1 },
      },
    });

    const duplicatedCourse = await prisma.course.findUnique({
      where: { id: result.id },
      include: {
        instructor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        category: {
          select: { name: true },
        },
        subcategory: {
          select: { name: true },
        },
        _count: {
          select: {
            sections: true,
            enrollments: true,
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        type: "COURSE_DUPLICATED",
        title: "Course Duplicated",
        message: `Course "${newTitle}" has been created as a copy of "${originalCourse.title}".`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          originalCourseId: originalCourse.id,
          originalCourseTitle: originalCourse.title,
          duplicatedCourseId: duplicatedCourse.id,
          duplicatedCourseTitle: newTitle,
          includeContent: includeContent === "true" || includeContent === true,
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "DUPLICATE_COURSE",
      "COURSE",
      duplicatedCourse.id,
      "SUCCESS",
      {
        originalCourseId: originalCourse.id,
        originalCourseTitle: originalCourse.title,
        duplicatedCourseTitle: newTitle,
        includeContent: includeContent === "true" || includeContent === true,
        sectionsCount: duplicatedCourse._count.sections,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("DUPLICATE_COURSE", startTime, {
      userId: req.userAuthId,
      originalCourseId: originalCourse.id,
      duplicatedCourseId: duplicatedCourse.id,
      includeContent: includeContent === "true" || includeContent === true,
    });

    const responseData = {
      course: {
        id: duplicatedCourse.id,
        title: duplicatedCourse.title,
        slug: duplicatedCourse.slug,
        status: duplicatedCourse.status,
        thumbnail: duplicatedCourse.thumbnail,
        previewVideo: duplicatedCourse.previewVideo,
        price: duplicatedCourse.price,
        originalPrice: duplicatedCourse.originalPrice,
        level: duplicatedCourse.level,
        category: duplicatedCourse.category.name,
        subcategory: duplicatedCourse.subcategory?.name,
        sectionsCount: duplicatedCourse._count.sections,
        enrollmentCount: duplicatedCourse._count.enrollments,
        createdAt: duplicatedCourse.createdAt,
        lastUpdated: duplicatedCourse.lastUpdated,
      },
      duplicationSummary: {
        originalCourse: {
          id: originalCourse.id,
          title: originalCourse.title,
        },
        contentIncluded: includeContent === "true" || includeContent === true,
        sectionsCreated: duplicatedCourse._count.sections,
      },
      nextSteps: [
        "Review and update course content",
        "Upload new thumbnail and videos",
        "Modify course details as needed",
        "Submit for review when ready",
      ],
    };

    res.status(201).json({
      success: true,
      message: "Course duplicated successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Duplicate course failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "DUPLICATE_COURSE",
        entity: "COURSE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to duplicate course",
      requestId,
    });
  }
});

export const submitCourseForReview = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CourseController",
    methodName: "submitCourseForReview",
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
                isActive: true,
                isVerified: true,
              },
            },
          },
        },
        sections: {
          include: {
            _count: {
              select: {
                lessons: true,
                assignments: true,
                quizzes: true,
              },
            },
          },
        },
        _count: {
          select: {
            sections: true,
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

    if (course.instructor.user.id !== req.userAuthId) {
      return res.status(403).json({
        success: false,
        message: "You can only submit your own courses for review",
      });
    }

    if (!course.instructor.user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is not active. Please contact support.",
      });
    }

    if (!course.instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can submit courses for review",
      });
    }

    if (course.status !== "DRAFT" && course.status !== "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "Only draft or rejected courses can be submitted for review",
        currentStatus: course.status,
      });
    }

    const validationErrors = [];

    if (!course.title?.trim()) {
      validationErrors.push("Course title is required");
    }

    if (!course.description?.trim()) {
      validationErrors.push("Course description is required");
    }

    if (!course.shortDescription?.trim()) {
      validationErrors.push("Course short description is required");
    }

    if (!course.thumbnail) {
      validationErrors.push("Course thumbnail is required");
    }

    if (!course.price || course.price <= 0) {
      validationErrors.push("Valid course price is required");
    }

    if (!course.categoryId) {
      validationErrors.push("Course category is required");
    }

    if (!course.level) {
      validationErrors.push("Course level is required");
    }

    if (course._count.sections === 0) {
      validationErrors.push("At least one section is required");
    }

    const hasContent = course.sections.some(
      (section) =>
        section._count.lessons > 0 ||
        section._count.assignments > 0 ||
        section._count.quizzes > 0
    );

    if (!hasContent) {
      validationErrors.push(
        "At least one lesson, assignment, or quiz is required"
      );
    }

    if (!course.learningOutcomes || course.learningOutcomes.length === 0) {
      validationErrors.push("Learning outcomes are required");
    }

    if (!course.requirements || course.requirements.length === 0) {
      validationErrors.push("Course requirements are required");
    }

    if (!course.targetAudience || course.targetAudience.length === 0) {
      validationErrors.push("Target audience is required");
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Course does not meet submission requirements",
        validationErrors,
        completionStatus: {
          hasTitle: !!course.title?.trim(),
          hasDescription: !!course.description?.trim(),
          hasShortDescription: !!course.shortDescription?.trim(),
          hasThumbnail: !!course.thumbnail,
          hasValidPrice: course.price > 0,
          hasCategory: !!course.categoryId,
          hasLevel: !!course.level,
          hasSections: course._count.sections > 0,
          hasContent,
          hasLearningOutcomes: course.learningOutcomes?.length > 0,
          hasRequirements: course.requirements?.length > 0,
          hasTargetAudience: course.targetAudience?.length > 0,
        },
      });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "UNDER_REVIEW",
        reviewSubmittedAt: new Date(),
        lastUpdated: new Date(),
      },
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
        subcategory: {
          select: { name: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        type: "COURSE_SUBMITTED_FOR_REVIEW",
        title: "Course Submitted for Review",
        message: `Your course "${course.title}" has been submitted for review. You'll be notified once the review is complete.`,
        userId: req.userAuthId,
        priority: "HIGH",
        data: {
          courseId: course.id,
          courseTitle: course.title,
          submittedAt: updatedCourse.reviewSubmittedAt,
          estimatedReviewTime: "3-5 business days",
        },
      },
    });

    try {
      await emailService.sendCourseSubmittedForReview({
        email: course.instructor.user.email,
        firstName: course.instructor.user.firstName,
        courseTitle: course.title,
        instructorName: `${course.instructor.user.firstName} ${course.instructor.user.lastName}`,
        submissionDate: updatedCourse.reviewSubmittedAt,
        reviewDashboardUrl: `${process.env.FRONTEND_URL}/instructor/courses/${course.id}`,
      });
    } catch (emailError) {
      educademyLogger.error(
        "Failed to send review submission email",
        emailError,
        {
          userId: req.userAuthId,
          courseId: course.id,
          email: course.instructor.user.email,
        }
      );
    }

    educademyLogger.logBusinessOperation(
      "SUBMIT_COURSE_FOR_REVIEW",
      "COURSE",
      courseId,
      "SUCCESS",
      {
        courseTitle: course.title,
        previousStatus: course.status,
        sectionsCount: course._count.sections,
        hasContent,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "SUBMIT_COURSE_FOR_REVIEW",
      "COURSE",
      courseId,
      {
        status: course.status,
        reviewSubmittedAt: course.reviewSubmittedAt,
      },
      {
        status: "UNDER_REVIEW",
        reviewSubmittedAt: updatedCourse.reviewSubmittedAt,
        lastUpdated: updatedCourse.lastUpdated,
      },
      req.userAuthId
    );

    educademyLogger.performance("SUBMIT_COURSE_FOR_REVIEW", startTime, {
      userId: req.userAuthId,
      courseId,
      sectionsCount: course._count.sections,
    });

    const responseData = {
      course: {
        id: updatedCourse.id,
        title: updatedCourse.title,
        slug: updatedCourse.slug,
        status: updatedCourse.status,
        reviewSubmittedAt: updatedCourse.reviewSubmittedAt,
        category: updatedCourse.category.name,
        subcategory: updatedCourse.subcategory?.name,
        lastUpdated: updatedCourse.lastUpdated,
      },
      reviewProcess: {
        estimatedTime: "3-5 business days",
        nextSteps: [
          "Admin team will review your course",
          "You'll receive email notification of the decision",
          "If approved, your course will be published",
          "If changes needed, you'll receive detailed feedback",
        ],
      },
    };

    res.status(200).json({
      success: true,
      message: "Course submitted for review successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Submit course for review failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "SUBMIT_COURSE_FOR_REVIEW",
        entity: "COURSE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to submit course for review",
      requestId,
    });
  }
});

export const bulkUpdateCourses = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CourseController",
    methodName: "bulkUpdateCourses",
  });

  try {
    const { courseIds, updates } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Course IDs array is required",
      });
    }

    if (courseIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Cannot update more than 50 courses at once",
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates object is required",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
      });
    }

    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        instructorId: instructor.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (courses.length !== courseIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some courses do not exist or do not belong to you",
      });
    }

    const publishedCoursesWithEnrollments = courses.filter(
      (course) => course.status === "PUBLISHED" && course._count.enrollments > 0
    );

    const restrictedUpdates = ["price", "level"];
    const hasRestrictedUpdates = restrictedUpdates.some(
      (field) => updates[field] !== undefined
    );

    if (hasRestrictedUpdates && publishedCoursesWithEnrollments.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot update price or level for published courses with enrollments",
        restrictedCourses: publishedCoursesWithEnrollments.map((course) => ({
          id: course.id,
          title: course.title,
          enrollments: course._count.enrollments,
        })),
      });
    }

    const allowedUpdates = [
      "description",
      "shortDescription",
      "tags",
      "keyPoints",
      "learningOutcomes",
      "targetAudience",
      "requirements",
      "language",
      "subtitles",
    ];

    const updateData = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: `No valid update fields provided. Allowed fields: ${allowedUpdates.join(
          ", "
        )}`,
      });
    }

    updateData.lastUpdated = new Date();

    const updatedCourses = await prisma.course.updateMany({
      where: {
        id: { in: courseIds },
        instructorId: instructor.id,
      },
      data: updateData,
    });

    const courseDetails = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        instructorId: instructor.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        lastUpdated: true,
      },
    });

    await prisma.notification.create({
      data: {
        type: "COURSES_BULK_UPDATED",
        title: "Courses Updated",
        message: `${updatedCourses.count} course(s) have been updated successfully.`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          coursesCount: updatedCourses.count,
          updatedFields: Object.keys(updateData).filter(
            (key) => key !== "lastUpdated"
          ),
          courseIds,
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "BULK_UPDATE_COURSES",
      "COURSE",
      instructor.id,
      "SUCCESS",
      {
        coursesUpdated: updatedCourses.count,
        updatedFields: Object.keys(updateData),
        courseIds,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("BULK_UPDATE_COURSES", startTime, {
      userId: req.userAuthId,
      coursesCount: updatedCourses.count,
      fieldsCount: Object.keys(updateData).length,
    });

    const responseData = {
      summary: {
        totalCoursesUpdated: updatedCourses.count,
        fieldsUpdated: Object.keys(updateData).filter(
          (key) => key !== "lastUpdated"
        ),
      },
      courses: courseDetails,
      updates: updateData,
    };

    res.status(200).json({
      success: true,
      message: `${updatedCourses.count} course(s) updated successfully`,
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Bulk update courses failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "BULK_UPDATE_COURSES",
        entity: "COURSE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to bulk update courses",
      requestId,
    });
  }
});

export const getCourseById = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CourseController",
    methodName: "getCourseById",
  });

  try {
    const { includeContent = false, includeStats = false } = req.query;

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
                profileImage: true,
              },
            },
          },
        },
        category: {
          select: { id: true, name: true },
        },
        subcategory: {
          select: { id: true, name: true },
        },
        settings: true,
        sections:
          includeContent === "true"
            ? {
                include: {
                  lessons: {
                    orderBy: { order: "asc" },
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      order: true,
                      duration: true,
                      isFree: true,
                      isPreview: true,
                      type: true,
                    },
                  },
                  assignments: {
                    orderBy: { order: "asc" },
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      order: true,
                      totalPoints: true,
                      dueDate: true,
                    },
                  },
                  quizzes: {
                    orderBy: { order: "asc" },
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      order: true,
                      duration: true,
                      passingScore: true,
                      maxAttempts: true,
                    },
                  },
                  _count: {
                    select: {
                      lessons: true,
                      assignments: true,
                      quizzes: true,
                    },
                  },
                },
                orderBy: { order: "asc" },
              }
            : {
                select: {
                  id: true,
                  title: true,
                  order: true,
                  isPublished: true,
                  _count: {
                    select: {
                      lessons: true,
                      assignments: true,
                      quizzes: true,
                    },
                  },
                },
                orderBy: { order: "asc" },
              },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
            sections: true,
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

    if (course.instructor.user.id !== req.userAuthId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own courses",
      });
    }

    let stats = null;
    if (includeStats === "true") {
      const [enrollmentStats, reviewStats, recentActivity] = await Promise.all([
        prisma.enrollment.groupBy({
          by: ["status"],
          where: { courseId },
          _count: { id: true },
        }),

        prisma.review.aggregate({
          where: { courseId },
          _count: { id: true },
          _avg: { rating: true },
        }),

        prisma.enrollment.findMany({
          where: { courseId },
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
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

      const enrollmentBreakdown = enrollmentStats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count.id;
        return acc;
      }, {});

      stats = {
        enrollments: {
          total: course._count.enrollments,
          breakdown: enrollmentBreakdown,
        },
        reviews: {
          total: reviewStats._count.id,
          averageRating: parseFloat(reviewStats._avg.rating?.toFixed(2)) || 0,
        },
        content: {
          totalSections: course._count.sections,
          totalLessons: course.sections.reduce(
            (sum, section) => sum + section._count.lessons,
            0
          ),
          totalAssignments: course.sections.reduce(
            (sum, section) => sum + section._count.assignments,
            0
          ),
          totalQuizzes: course.sections.reduce(
            (sum, section) => sum + section._count.quizzes,
            0
          ),
        },
        recentActivity: recentActivity.map((enrollment) => ({
          id: enrollment.id,
          student: {
            name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
            profileImage: enrollment.student.user.profileImage,
          },
          enrolledAt: enrollment.createdAt,
          progress: enrollment.progress,
          status: enrollment.status,
        })),
      };
    }

    educademyLogger.logBusinessOperation(
      "GET_COURSE_BY_ID",
      "COURSE",
      courseId,
      "SUCCESS",
      {
        courseTitle: course.title,
        courseStatus: course.status,
        includeContent: includeContent === "true",
        includeStats: includeStats === "true",
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_COURSE_BY_ID", startTime, {
      userId: req.userAuthId,
      courseId,
      includeContent: includeContent === "true",
      includeStats: includeStats === "true",
    });

    const responseData = {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        shortDescription: course.shortDescription,
        thumbnail: course.thumbnail,
        previewVideo: course.previewVideo,
        introVideo: course.introVideo,
        price: course.price,
        originalPrice: course.originalPrice,
        duration: course.duration,
        level: course.level,
        status: course.status,
        language: course.language,
        subtitles: course.subtitles,
        requirements: course.requirements,
        tags: course.tags,
        keyPoints: course.keyPoints,
        learningOutcomes: course.learningOutcomes,
        targetAudience: course.targetAudience,
        averageRating: course.averageRating,
        totalEnrollments: course.totalEnrollments,
        totalRevenue: parseFloat(course.totalRevenue || 0),
        publishedAt: course.publishedAt,
        reviewSubmittedAt: course.reviewSubmittedAt,
        archivedAt: course.archivedAt,
        lastUpdated: course.lastUpdated,
        instructor: {
          id: course.instructor.id,
          name: `${course.instructor.user.firstName} ${course.instructor.user.lastName}`,
          email: course.instructor.user.email,
          profileImage: course.instructor.user.profileImage,
          isVerified: course.instructor.isVerified,
        },
        category: course.category,
        subcategory: course.subcategory,
        sections: course.sections,
        settings: course.settings,
        counts: {
          enrollments: course._count.enrollments,
          reviews: course._count.reviews,
          sections: course._count.sections,
        },
        stats,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      },
    };

    res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get course by ID failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "GET_COURSE_BY_ID",
        entity: "COURSE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch course",
      requestId,
    });
  }
});
