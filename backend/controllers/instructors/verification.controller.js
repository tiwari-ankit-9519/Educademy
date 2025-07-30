import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import redisService from "../../utils/redis.js";
import emailService from "../../utils/emailService.js";
import notificationService from "../../utils/notificationservice.js";
import { deleteFromCloudinary } from "../../config/upload.js";

const prisma = new PrismaClient();

const generateRequestId = () => {
  return `verification_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
};

export const requestVerification = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const instructorId = req.userAuthId;
    const {
      qualifications,
      experience,
      portfolio,
      references,
      verificationLevel = "BASIC",
      additionalInfo,
    } = req.body;

    console.log("Files received:", req.files);
    console.log("Body received:", req.body);

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one verification document is required",
        code: "DOCUMENTS_REQUIRED",
        debug: {
          filesReceived: req.files ? req.files.length : 0,
          filesType: typeof req.files,
          filesIsArray: Array.isArray(req.files),
        },
      });
    }

    const documents = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      url: file.path,
      publicId: file.filename,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
    }));

    const instructor = await prisma.instructor.findUnique({
      where: { userId: instructorId },
      select: {
        id: true,
        isVerified: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!instructor) {
      await cleanupUploadedFiles(req.files);
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
        code: "INSTRUCTOR_NOT_FOUND",
      });
    }

    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        instructorId: instructor.id,
        status: {
          in: ["PENDING", "UNDER_REVIEW"],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingRequest) {
      await cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "A verification request is already pending review",
        code: "REQUEST_PENDING",
        data: {
          requestId: existingRequest.requestId,
          submittedAt: existingRequest.submittedAt,
          status: existingRequest.status,
        },
      });
    }

    const requestId = generateRequestId();
    const priority =
      verificationLevel === "PREMIUM" || verificationLevel === "EXPERT"
        ? "HIGH"
        : "NORMAL";

    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        requestId,
        instructorId: instructor.id,
        verificationLevel,
        status: "PENDING",
        priority,
        documents,
        qualifications: qualifications
          ? typeof qualifications === "string"
            ? JSON.parse(qualifications)
            : qualifications
          : [],
        experience: experience
          ? typeof experience === "string"
            ? JSON.parse(experience)
            : experience
          : [],
        portfolio: portfolio
          ? typeof portfolio === "string"
            ? JSON.parse(portfolio)
            : portfolio
          : [],
        references: references
          ? typeof references === "string"
            ? JSON.parse(references)
            : references
          : [],
        additionalInfo: additionalInfo || "",
        submittedAt: new Date(),
      },
    });

    await Promise.all([
      redisService.setJSON(
        `verification_request:${requestId}`,
        {
          ...verificationRequest,
          instructorName: `${instructor.user.firstName} ${instructor.user.lastName}`,
          instructorEmail: instructor.user.email,
        },
        { ex: 7 * 24 * 60 * 60 }
      ),
      redisService.setJSON(
        `verification_request:instructor:${instructor.id}`,
        {
          ...verificationRequest,
          instructorName: `${instructor.user.firstName} ${instructor.user.lastName}`,
          instructorEmail: instructor.user.email,
        },
        { ex: 7 * 24 * 60 * 60 }
      ),
      redisService.zadd("verification_requests:pending", Date.now(), requestId),
      redisService.del(`instructor_profile:${instructorId}`),
      redisService.del(`instructor_verification_requests:${instructor.id}`),
      redisService.delPattern("admin_verification_requests:*"),
    ]);

    setImmediate(async () => {
      try {
        await Promise.all([
          emailService.send({
            to: instructor.user.email,
            subject: "Verification Request Submitted - Educademy",
            template: "verification",
            templateData: {
              userName: instructor.user.firstName,
              title: "Verification Request Submitted",
              subtitle: "Your instructor verification request is under review",
              message:
                "Thank you for submitting your verification request. Our team will review your documents and credentials within 3-5 business days.",
              isSuccess: false,
              actionButton: "Track Request",
              actionUrl: `${process.env.FRONTEND_URL}/instructor/verification`,
              tips: [
                `Request ID: ${requestId}`,
                `Verification Level: ${verificationLevel}`,
                "Review timeline: 3-5 business days",
                "You'll receive updates via email and notifications",
              ],
            },
          }),
          notificationService.createNotification({
            userId: instructorId,
            type: "SYSTEM_ANNOUNCEMENT",
            title: "Verification Request Submitted",
            message: `Your ${verificationLevel.toLowerCase()} verification request has been submitted and is under review.`,
            priority: "NORMAL",
            data: {
              requestId,
              verificationLevel,
              submittedAt: verificationRequest.submittedAt,
              notificationType: "verification_request_submitted",
            },
            actionUrl: "/instructor/verification",
          }),
        ]);
      } catch (error) {
        console.error("Background notification error:", error);
      }
    });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(201).json({
      success: true,
      message: "Verification request submitted successfully",
      data: {
        requestId,
        status: "PENDING",
        verificationLevel,
        submittedAt: verificationRequest.submittedAt,
        estimatedReviewTime: "3-5 business days",
        documentsUploaded: documents.length,
        documents: documents.map((doc) => ({
          filename: doc.originalName,
          size: doc.size,
          type: doc.mimeType,
        })),
      },
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      await cleanupUploadedFiles(req.files);
    }
    console.error("Request verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit verification request",
      code: "INTERNAL_SERVER_ERROR",
      error: error.message,
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

const cleanupUploadedFiles = async (files) => {
  if (!files || files.length === 0) return;

  const cleanupPromises = files.map(async (file) => {
    try {
      if (file.filename) {
        let resourceType = "image";

        if (file.mimetype) {
          if (file.mimetype.startsWith("video/")) {
            resourceType = "video";
          } else if (file.mimetype.startsWith("audio/")) {
            resourceType = "video";
          } else if (
            file.mimetype.startsWith("application/") ||
            file.mimetype.startsWith("text/")
          ) {
            resourceType = "raw";
          }
        }

        console.log(
          `Cleaning up file: ${file.filename} with resource type: ${resourceType}`
        );
        await deleteFromCloudinary(file.filename, resourceType);
      }
    } catch (error) {
      console.error(`Failed to cleanup file ${file.filename}:`, error);
    }
  });

  await Promise.allSettled(cleanupPromises);
};

export const getMyVerificationRequests = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const instructorId = req.userAuthId;

    const instructor = await prisma.instructor.findUnique({
      where: { userId: instructorId },
      select: { id: true, isVerified: true, verificationBadge: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
        code: "INSTRUCTOR_NOT_FOUND",
      });
    }

    const cacheKey = `instructor_verification_requests:${instructor.id}`;
    let cachedRequests = await redisService.getJSON(cacheKey);

    if (cachedRequests) {
      return res.status(200).json({
        success: true,
        message: "Verification requests retrieved successfully",
        data: {
          currentStatus: {
            isVerified: instructor.isVerified,
            verificationBadge: instructor.verificationBadge,
          },
          requests: cachedRequests.requests,
          totalRequests: cachedRequests.totalRequests,
        },
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const allRequests = await prisma.verificationRequest.findMany({
      where: {
        instructorId: instructor.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        requestId: true,
        verificationLevel: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        adminNotes: true,
        rejectionReason: true,
        priority: true,
        documents: true,
        qualifications: true,
        experience: true,
        portfolio: true,
        references: true,
        additionalInfo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const requests = allRequests.map((request) => ({
      requestId: request.requestId,
      verificationLevel: request.verificationLevel,
      status: request.status,
      submittedAt: request.submittedAt,
      reviewedAt: request.reviewedAt,
      adminNotes: request.adminNotes,
      rejectionReason: request.rejectionReason,
      priority: request.priority,
      documents: request.documents,
      qualifications: request.qualifications,
      experience: request.experience,
      portfolio: request.portfolio,
      references: request.references,
      additionalInfo: request.additionalInfo,
      estimatedReviewTime:
        request.status === "PENDING" ? "3-5 business days" : null,
      documentsUploaded: request.documents ? request.documents.length : 0,
    }));

    const responseData = {
      requests,
      totalRequests: requests.length,
    };

    await redisService.setJSON(cacheKey, responseData, { ex: 300 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Verification requests retrieved successfully",
      data: {
        currentStatus: {
          isVerified: instructor.isVerified,
          verificationBadge: instructor.verificationBadge,
        },
        requests: responseData.requests,
        totalRequests: responseData.totalRequests,
      },
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get verification requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve verification requests",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const getVerificationRequest = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { requestId } = req.params;
    const userId = req.userAuthId;
    const userRole = req.userRole;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Request ID is required",
        code: "REQUEST_ID_REQUIRED",
      });
    }

    const cacheKey = `verification_request_details:${requestId}`;
    let requestData = await redisService.getJSON(cacheKey);

    if (!requestData) {
      requestData = await redisService.getJSON(
        `verification_request:${requestId}`
      );

      if (!requestData) {
        const dbRequest = await prisma.verificationRequest.findUnique({
          where: { requestId: requestId },
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
          },
        });

        if (!dbRequest) {
          return res.status(404).json({
            success: false,
            message: "Verification request not found",
            code: "REQUEST_NOT_FOUND",
          });
        }

        requestData = {
          ...dbRequest,
          instructorName: `${dbRequest.instructor.user.firstName} ${dbRequest.instructor.user.lastName}`,
          instructorEmail: dbRequest.instructor.user.email,
        };
      }

      await redisService.setJSON(cacheKey, requestData, { ex: 600 });
    }

    if (userRole === "INSTRUCTOR") {
      const instructor = await prisma.instructor.findUnique({
        where: { userId: userId },
        select: { id: true },
      });

      if (!instructor || requestData.instructorId !== instructor.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only view your own requests",
          code: "ACCESS_DENIED",
        });
      }
    } else if (!["ADMIN", "MODERATOR"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    const responseData = {
      requestId: requestData.requestId,
      instructorName: requestData.instructorName,
      instructorEmail: requestData.instructorEmail,
      verificationLevel: requestData.verificationLevel,
      status: requestData.status,
      submittedAt: requestData.submittedAt,
      reviewedAt: requestData.reviewedAt,
      reviewedBy: requestData.reviewedBy,
      adminNotes: requestData.adminNotes,
      rejectionReason: requestData.rejectionReason,
      priority: requestData.priority,
      documents: requestData.documents || [],
      qualifications: requestData.qualifications || [],
      experience: requestData.experience || [],
      portfolio: requestData.portfolio || [],
      references: requestData.references || [],
      additionalInfo: requestData.additionalInfo || "",
    };

    if (userRole === "INSTRUCTOR") {
      delete responseData.adminNotes;
    }

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Verification request details retrieved successfully",
      data: responseData,
      meta: {
        cached: !!requestData,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get verification request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve verification request",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const updateVerificationRequest = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { requestId } = req.params;
    const instructorId = req.userAuthId;
    const {
      documents,
      qualifications,
      experience,
      portfolio,
      references,
      additionalInfo,
    } = req.body;

    const instructor = await prisma.instructor.findUnique({
      where: { userId: instructorId },
      select: { id: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
        code: "INSTRUCTOR_NOT_FOUND",
      });
    }

    const requestData = await prisma.verificationRequest.findUnique({
      where: { requestId: requestId },
    });

    if (!requestData) {
      return res.status(404).json({
        success: false,
        message: "Verification request not found",
        code: "REQUEST_NOT_FOUND",
      });
    }

    if (requestData.instructorId !== instructor.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own requests",
        code: "ACCESS_DENIED",
      });
    }

    if (requestData.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${requestData.status.toLowerCase()} verification request`,
        code: "INVALID_STATUS",
      });
    }

    const updatedRequest = await prisma.verificationRequest.update({
      where: { requestId: requestId },
      data: {
        documents: documents || requestData.documents,
        qualifications: qualifications || requestData.qualifications,
        experience: experience || requestData.experience,
        portfolio: portfolio || requestData.portfolio,
        references: references || requestData.references,
        additionalInfo: additionalInfo || requestData.additionalInfo,
        updatedAt: new Date(),
      },
    });

    await Promise.all([
      redisService.del(`instructor_verification_requests:${instructor.id}`),
      redisService.del(`verification_request_details:${requestId}`),
      redisService.del(`verification_request:${requestId}`),
      redisService.del(`verification_request:instructor:${instructor.id}`),
    ]);

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Verification request updated successfully",
      data: {
        requestId: updatedRequest.requestId,
        status: updatedRequest.status,
        updatedAt: updatedRequest.updatedAt,
      },
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Update verification request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update verification request",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const cancelVerificationRequest = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { requestId } = req.params;
    const instructorId = req.userAuthId;

    const instructor = await prisma.instructor.findUnique({
      where: { userId: instructorId },
      select: { id: true },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
        code: "INSTRUCTOR_NOT_FOUND",
      });
    }

    const requestData = await prisma.verificationRequest.findUnique({
      where: { requestId: requestId },
    });

    if (!requestData) {
      return res.status(404).json({
        success: false,
        message: "Verification request not found",
        code: "REQUEST_NOT_FOUND",
      });
    }

    if (requestData.instructorId !== instructor.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only cancel your own requests",
        code: "ACCESS_DENIED",
      });
    }

    if (requestData.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${requestData.status.toLowerCase()} verification request`,
        code: "INVALID_STATUS",
      });
    }

    const cancelledRequest = await prisma.verificationRequest.update({
      where: { requestId: requestId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: instructor.id,
        updatedAt: new Date(),
      },
    });

    await Promise.all([
      redisService.del(`instructor_verification_requests:${instructor.id}`),
      redisService.del(`verification_request_details:${requestId}`),
      redisService.del(`verification_request:${requestId}`),
      redisService.del(`verification_request:instructor:${instructor.id}`),
      redisService.zrem("verification_requests:pending", requestId),
    ]);

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Verification request cancelled successfully",
      data: {
        requestId: cancelledRequest.requestId,
        status: cancelledRequest.status,
        cancelledAt: cancelledRequest.cancelledAt,
      },
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Cancel verification request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel verification request",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});
