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

export const createCertificateTemplate = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CertificateController",
    methodName: "createCertificateTemplate",
  });

  educademyLogger.logMethodEntry(
    "CertificateController",
    "createCertificateTemplate",
    {
      userId: req.userAuthId,
      courseId,
      templateName: req.body.templateName,
    }
  );

  try {
    const {
      templateName,
      templateData,
      backgroundColor = "#FFFFFF",
      textColor = "#000000",
      borderStyle = "SIMPLE",
      logoPosition = "TOP_LEFT",
      isActive = true,
    } = req.body;

    // Validation
    if (!templateName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template name is required",
      });
    }

    if (!templateData || typeof templateData !== "object") {
      return res.status(400).json({
        success: false,
        message: "Template data is required and must be an object",
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
        message:
          "You can only create certificate templates for your own courses",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can create certificate templates",
      });
    }

    // Validate template data structure
    const requiredFields = [
      "title",
      "subtitle",
      "studentNamePlaceholder",
      "courseName",
      "instructorName",
      "date",
    ];
    const missingFields = requiredFields.filter(
      (field) => !templateData[field]
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required template fields: ${missingFields.join(
          ", "
        )}`,
      });
    }

    // Check if template name already exists for this course
    const existingTemplate = await prisma.certificateTemplate.findFirst({
      where: {
        courseId,
        templateName: templateName.trim(),
      },
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: "A template with this name already exists for this course",
      });
    }

    // Deactivate other templates if this one is set as active
    if (isActive) {
      await prisma.certificateTemplate.updateMany({
        where: { courseId },
        data: { isActive: false },
      });
    }

    // Create certificate template
    const certificateTemplate = await prisma.certificateTemplate.create({
      data: {
        templateName: templateName.trim(),
        templateData,
        backgroundColor,
        textColor,
        borderStyle: borderStyle.toUpperCase(),
        logoPosition: logoPosition.toUpperCase(),
        isActive: isActive === "true" || isActive === true,
        courseId,
        createdBy: req.userAuthId,
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

    // Create notification for instructor
    await prisma.notification.create({
      data: {
        type: "CERTIFICATE_TEMPLATE_CREATED",
        title: "Certificate Template Created",
        message: `Certificate template "${templateName}" has been created successfully for course "${course.title}".`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          templateId: certificateTemplate.id,
          templateName,
          courseId,
          courseTitle: course.title,
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "CREATE_CERTIFICATE_TEMPLATE",
      "CERTIFICATE_TEMPLATE",
      certificateTemplate.id,
      "SUCCESS",
      {
        templateId: certificateTemplate.id,
        templateName,
        courseId,
        courseTitle: course.title,
        instructorId: instructor.id,
        isActive: certificateTemplate.isActive,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("CREATE_CERTIFICATE_TEMPLATE", startTime, {
      userId: req.userAuthId,
      templateId: certificateTemplate.id,
      courseId,
    });

    educademyLogger.logMethodExit(
      "CertificateController",
      "createCertificateTemplate",
      true,
      performance.now() - startTime
    );

    const responseData = {
      template: {
        id: certificateTemplate.id,
        templateName: certificateTemplate.templateName,
        templateData: certificateTemplate.templateData,
        backgroundColor: certificateTemplate.backgroundColor,
        textColor: certificateTemplate.textColor,
        borderStyle: certificateTemplate.borderStyle,
        logoPosition: certificateTemplate.logoPosition,
        isActive: certificateTemplate.isActive,
        courseId: certificateTemplate.courseId,
        course: certificateTemplate.course,
        createdAt: certificateTemplate.createdAt,
        updatedAt: certificateTemplate.updatedAt,
      },
    };

    res.status(201).json({
      success: true,
      message: "Certificate template created successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Create certificate template failed", error, {
      userId: req.userAuthId,
      courseId,
      templateName: req.body.templateName,
      business: {
        operation: "CREATE_CERTIFICATE_TEMPLATE",
        entity: "CERTIFICATE_TEMPLATE",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "CertificateController",
      "createCertificateTemplate",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to create certificate template",
      requestId,
    });
  }
});

export const updateCertificateTemplate = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId, templateId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CertificateController",
    methodName: "updateCertificateTemplate",
  });

  educademyLogger.logMethodEntry(
    "CertificateController",
    "updateCertificateTemplate",
    {
      userId: req.userAuthId,
      courseId,
      templateId,
    }
  );

  try {
    const {
      templateName,
      templateData,
      backgroundColor,
      textColor,
      borderStyle,
      logoPosition,
      isActive,
    } = req.body;

    // Get current template
    const currentTemplate = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
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

    if (!currentTemplate) {
      return res.status(404).json({
        success: false,
        message: "Certificate template not found",
      });
    }

    if (currentTemplate.courseId !== courseId) {
      return res.status(400).json({
        success: false,
        message: "Template does not belong to this course",
      });
    }

    // Check ownership
    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true, isVerified: true },
    });

    if (!instructor || instructor.id !== currentTemplate.course.instructorId) {
      return res.status(403).json({
        success: false,
        message:
          "You can only update certificate templates for your own courses",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can update certificate templates",
      });
    }

    const updateData = {};

    // Validate and update fields
    if (templateName !== undefined) {
      if (!templateName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Template name cannot be empty",
        });
      }

      // Check for name conflicts
      const existingTemplate = await prisma.certificateTemplate.findFirst({
        where: {
          courseId,
          templateName: templateName.trim(),
          id: { not: templateId },
        },
      });

      if (existingTemplate) {
        return res.status(400).json({
          success: false,
          message: "A template with this name already exists for this course",
        });
      }

      updateData.templateName = templateName.trim();
    }

    if (templateData !== undefined) {
      if (typeof templateData !== "object") {
        return res.status(400).json({
          success: false,
          message: "Template data must be an object",
        });
      }

      // Validate template data structure if provided
      const requiredFields = [
        "title",
        "subtitle",
        "studentNamePlaceholder",
        "courseName",
        "instructorName",
        "date",
      ];
      const missingFields = requiredFields.filter(
        (field) => !templateData[field]
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required template fields: ${missingFields.join(
            ", "
          )}`,
        });
      }

      updateData.templateData = templateData;
    }

    if (backgroundColor !== undefined) {
      updateData.backgroundColor = backgroundColor;
    }

    if (textColor !== undefined) {
      updateData.textColor = textColor;
    }

    if (borderStyle !== undefined) {
      updateData.borderStyle = borderStyle.toUpperCase();
    }

    if (logoPosition !== undefined) {
      updateData.logoPosition = logoPosition.toUpperCase();
    }

    if (isActive !== undefined) {
      const activeStatus = isActive === "true" || isActive === true;

      // If setting this template as active, deactivate others
      if (activeStatus) {
        await prisma.certificateTemplate.updateMany({
          where: {
            courseId,
            id: { not: templateId },
          },
          data: { isActive: false },
        });
      }

      updateData.isActive = activeStatus;
    }

    updateData.updatedAt = new Date();

    // Update template
    const updatedTemplate = await prisma.certificateTemplate.update({
      where: { id: templateId },
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

    educademyLogger.logBusinessOperation(
      "UPDATE_CERTIFICATE_TEMPLATE",
      "CERTIFICATE_TEMPLATE",
      templateId,
      "SUCCESS",
      {
        templateId,
        templateName: updatedTemplate.templateName,
        courseId,
        courseTitle: currentTemplate.course.title,
        changedFields: Object.keys(updateData),
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "UPDATE_CERTIFICATE_TEMPLATE",
      "CERTIFICATE_TEMPLATE",
      templateId,
      {
        templateName: currentTemplate.templateName,
        isActive: currentTemplate.isActive,
        backgroundColor: currentTemplate.backgroundColor,
        textColor: currentTemplate.textColor,
      },
      updateData,
      req.userAuthId
    );

    educademyLogger.performance("UPDATE_CERTIFICATE_TEMPLATE", startTime, {
      userId: req.userAuthId,
      templateId,
      courseId,
      changedFields: Object.keys(updateData).length,
    });

    educademyLogger.logMethodExit(
      "CertificateController",
      "updateCertificateTemplate",
      true,
      performance.now() - startTime
    );

    const responseData = {
      template: {
        id: updatedTemplate.id,
        templateName: updatedTemplate.templateName,
        templateData: updatedTemplate.templateData,
        backgroundColor: updatedTemplate.backgroundColor,
        textColor: updatedTemplate.textColor,
        borderStyle: updatedTemplate.borderStyle,
        logoPosition: updatedTemplate.logoPosition,
        isActive: updatedTemplate.isActive,
        courseId: updatedTemplate.courseId,
        course: updatedTemplate.course,
        createdAt: updatedTemplate.createdAt,
        updatedAt: updatedTemplate.updatedAt,
      },
      changes: {
        fieldsUpdated: Object.keys(updateData),
      },
    };

    res.status(200).json({
      success: true,
      message: "Certificate template updated successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Update certificate template failed", error, {
      userId: req.userAuthId,
      courseId,
      templateId,
      business: {
        operation: "UPDATE_CERTIFICATE_TEMPLATE",
        entity: "CERTIFICATE_TEMPLATE",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "CertificateController",
      "updateCertificateTemplate",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to update certificate template",
      requestId,
    });
  }
});

export const deleteCertificateTemplate = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId, templateId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CertificateController",
    methodName: "deleteCertificateTemplate",
  });

  educademyLogger.logMethodEntry(
    "CertificateController",
    "deleteCertificateTemplate",
    {
      userId: req.userAuthId,
      courseId,
      templateId,
    }
  );

  try {
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
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

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Certificate template not found",
      });
    }

    if (template.courseId !== courseId) {
      return res.status(400).json({
        success: false,
        message: "Template does not belong to this course",
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: { id: true },
    });

    if (!instructor || instructor.id !== template.course.instructorId) {
      return res.status(403).json({
        success: false,
        message:
          "You can only delete certificate templates for your own courses",
      });
    }

    // Check if there are issued certificates using this template
    const issuedCertificatesCount = await prisma.certificate.count({
      where: { templateId },
    });

    if (issuedCertificatesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete template. ${issuedCertificatesCount} certificates have been issued using this template.`,
        data: {
          issuedCertificatesCount,
          templateId,
          templateName: template.templateName,
        },
      });
    }

    // Delete template
    await prisma.certificateTemplate.delete({
      where: { id: templateId },
    });

    educademyLogger.logBusinessOperation(
      "DELETE_CERTIFICATE_TEMPLATE",
      "CERTIFICATE_TEMPLATE",
      templateId,
      "SUCCESS",
      {
        templateId,
        templateName: template.templateName,
        courseId,
        courseTitle: template.course.title,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "DELETE_CERTIFICATE_TEMPLATE",
      "CERTIFICATE_TEMPLATE",
      templateId,
      {
        templateName: template.templateName,
        templateData: template.templateData,
        isActive: template.isActive,
        courseId,
      },
      null,
      req.userAuthId
    );

    educademyLogger.performance("DELETE_CERTIFICATE_TEMPLATE", startTime, {
      userId: req.userAuthId,
      templateId,
      courseId,
    });

    educademyLogger.logMethodExit(
      "CertificateController",
      "deleteCertificateTemplate",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Certificate template deleted successfully",
      data: {
        deletedTemplateId: templateId,
        templateName: template.templateName,
        courseId,
        courseTitle: template.course.title,
      },
    });
  } catch (error) {
    educademyLogger.error("Delete certificate template failed", error, {
      userId: req.userAuthId,
      courseId,
      templateId,
      business: {
        operation: "DELETE_CERTIFICATE_TEMPLATE",
        entity: "CERTIFICATE_TEMPLATE",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "CertificateController",
      "deleteCertificateTemplate",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete certificate template",
      requestId,
    });
  }
});

export const getCertificateTemplates = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { courseId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CertificateController",
    methodName: "getCertificateTemplates",
  });

  educademyLogger.logMethodEntry(
    "CertificateController",
    "getCertificateTemplates",
    {
      userId: req.userAuthId,
      courseId,
    }
  );

  try {
    const {
      page = 1,
      limit = 20,
      isActive,
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
        message: "You can only view certificate templates for your own courses",
      });
    }

    // Build where clause
    const whereClause = {
      courseId,
    };

    if (isActive !== undefined) {
      whereClause.isActive = isActive === "true";
    }

    // Build order by
    const validSortFields = [
      "templateName",
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
    const [templates, totalCount] = await Promise.all([
      prisma.certificateTemplate.findMany({
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

      prisma.certificateTemplate.count({
        where: whereClause,
      }),
    ]);

    // Get usage statistics for each template
    const templatesWithStats = await Promise.all(
      templates.map(async (template) => {
        const certificatesIssued = await prisma.certificate.count({
          where: { templateId: template.id },
        });

        return {
          ...template,
          certificatesIssued,
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limitNum);

    // Calculate summary statistics
    const summary = {
      totalTemplates: totalCount,
      activeTemplates: templates.filter((template) => template.isActive).length,
      inactiveTemplates: templates.filter((template) => !template.isActive)
        .length,
    };

    educademyLogger.logBusinessOperation(
      "GET_CERTIFICATE_TEMPLATES",
      "CERTIFICATE_TEMPLATE",
      courseId,
      "SUCCESS",
      {
        courseId,
        courseTitle: course.title,
        templatesReturned: templates.length,
        totalTemplates: totalCount,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_CERTIFICATE_TEMPLATES", startTime, {
      userId: req.userAuthId,
      courseId,
      templatesCount: templates.length,
    });

    educademyLogger.logMethodExit(
      "CertificateController",
      "getCertificateTemplates",
      true,
      performance.now() - startTime
    );

    const responseData = {
      templates: templatesWithStats.map((template) => ({
        id: template.id,
        templateName: template.templateName,
        templateData: template.templateData,
        backgroundColor: template.backgroundColor,
        textColor: template.textColor,
        borderStyle: template.borderStyle,
        logoPosition: template.logoPosition,
        isActive: template.isActive,
        certificatesIssued: template.certificatesIssued,
        courseId: template.courseId,
        course: template.course,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
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
      message: "Certificate templates fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get certificate templates failed", error, {
      userId: req.userAuthId,
      courseId,
      business: {
        operation: "GET_CERTIFICATE_TEMPLATES",
        entity: "CERTIFICATE_TEMPLATE",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "CertificateController",
      "getCertificateTemplates",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch certificate templates",
      requestId,
    });
  }
});
