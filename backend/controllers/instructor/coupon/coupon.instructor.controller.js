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

export const createCoupon = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CouponController",
    methodName: "createCoupon",
  });

  educademyLogger.logMethodEntry("CouponController", "createCoupon", {
    userId: req.userAuthId,
    code: req.body.code,
    discountType: req.body.discountType,
  });

  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      perUserLimit = 1,
      applicableCourses = [],
      isActive = true,
    } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Coupon name is required",
      });
    }

    if (!discountType) {
      return res.status(400).json({
        success: false,
        message: "Discount type is required",
      });
    }

    const validDiscountTypes = ["PERCENTAGE", "FIXED_AMOUNT"];
    if (!validDiscountTypes.includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid discount type. Must be one of: ${validDiscountTypes.join(
          ", "
        )}`,
      });
    }

    if (!discountValue || discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than 0",
      });
    }

    if (discountType === "PERCENTAGE" && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    if (minOrderValue && minOrderValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Minimum order value cannot be negative",
      });
    }

    if (maxDiscount && maxDiscount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Maximum discount must be greater than 0",
      });
    }

    if (usageLimit && usageLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Usage limit must be greater than 0",
      });
    }

    if (perUserLimit && perUserLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Per user limit must be greater than 0",
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

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
      });
    }

    if (!instructor.user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is not active. Please contact support.",
      });
    }

    if (!instructor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified instructors can create coupons",
      });
    }

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    let parsedValidFrom = null;
    let parsedValidUntil = null;

    if (validFrom) {
      parsedValidFrom = new Date(validFrom);
      if (isNaN(parsedValidFrom.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid validFrom date format",
        });
      }
    }

    if (validUntil) {
      parsedValidUntil = new Date(validUntil);
      if (isNaN(parsedValidUntil.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid validUntil date format",
        });
      }
    }

    if (
      parsedValidFrom &&
      parsedValidUntil &&
      parsedValidFrom >= parsedValidUntil
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid from date must be before valid until date",
      });
    }

    let courseIds = [];
    if (applicableCourses && applicableCourses.length > 0) {
      const courses = await prisma.course.findMany({
        where: {
          id: { in: applicableCourses },
          instructorId: instructor.id,
        },
        select: { id: true },
      });

      if (courses.length !== applicableCourses.length) {
        return res.status(400).json({
          success: false,
          message: "Some courses do not exist or do not belong to you",
        });
      }

      courseIds = courses.map((course) => course.id);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim(),
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        validFrom: parsedValidFrom,
        validUntil: parsedValidUntil,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        perUserLimit: parseInt(perUserLimit),
        isActive: isActive === "true" || isActive === true,
        instructorId: instructor.id,
      },
      include: {
        instructor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: {
            usage: true,
          },
        },
      },
    });

    if (courseIds.length > 0) {
      const couponCoursePromises = courseIds.map((courseId) =>
        prisma.couponCourse.create({
          data: {
            couponId: coupon.id,
            courseId,
          },
        })
      );
      await Promise.all(couponCoursePromises);
    }

    await prisma.notification.create({
      data: {
        type: "COUPON_CREATED",
        title: "Coupon Created",
        message: `Coupon "${name}" (${code}) has been created successfully.`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          couponId: coupon.id,
          couponCode: code,
          couponName: name,
          discountType,
          discountValue: parseFloat(discountValue),
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "CREATE_COUPON",
      "COUPON",
      coupon.id,
      "SUCCESS",
      {
        couponCode: code,
        couponName: name,
        discountType,
        discountValue: parseFloat(discountValue),
        applicableCoursesCount: courseIds.length,
        instructorId: instructor.id,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("CREATE_COUPON", startTime, {
      userId: req.userAuthId,
      couponId: coupon.id,
    });

    educademyLogger.logMethodExit(
      "CouponController",
      "createCoupon",
      true,
      performance.now() - startTime
    );

    const responseData = {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        usageLimit: coupon.usageLimit,
        usageCount: coupon._count.usage,
        perUserLimit: coupon.perUserLimit,
        isActive: coupon.isActive,
        applicableCourses: courseIds,
        instructor: {
          name: `${coupon.instructor.user.firstName} ${coupon.instructor.user.lastName}`,
        },
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
      },
    };

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Create coupon failed", error, {
      userId: req.userAuthId,
      code: req.body.code,
      business: {
        operation: "CREATE_COUPON",
        entity: "COUPON",
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "CouponController",
      "createCoupon",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      requestId,
    });
  }
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { couponId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CouponController",
    methodName: "updateCoupon",
  });

  try {
    const {
      name,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      perUserLimit,
      applicableCourses,
      isActive,
    } = req.body;

    const currentCoupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        instructor: {
          select: { userId: true },
        },
        courses: {
          select: { courseId: true },
        },
        usage: {
          select: { id: true },
        },
      },
    });

    if (!currentCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (currentCoupon.instructor.userId !== req.userAuthId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own coupons",
      });
    }

    const hasUsage = currentCoupon.usage.length > 0;

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Coupon name cannot be empty",
        });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim();
    }

    if (discountType !== undefined) {
      if (hasUsage && discountType !== currentCoupon.discountType) {
        return res.status(400).json({
          success: false,
          message: "Cannot change discount type for coupon that has been used",
        });
      }

      const validDiscountTypes = ["PERCENTAGE", "FIXED_AMOUNT"];
      if (!validDiscountTypes.includes(discountType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid discount type. Must be one of: ${validDiscountTypes.join(
            ", "
          )}`,
        });
      }
      updateData.discountType = discountType;
    }

    if (discountValue !== undefined) {
      if (hasUsage && parseFloat(discountValue) < currentCoupon.discountValue) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot decrease discount value for coupon that has been used",
        });
      }

      if (discountValue <= 0) {
        return res.status(400).json({
          success: false,
          message: "Discount value must be greater than 0",
        });
      }

      const finalDiscountType = discountType || currentCoupon.discountType;
      if (finalDiscountType === "PERCENTAGE" && discountValue > 100) {
        return res.status(400).json({
          success: false,
          message: "Percentage discount cannot exceed 100%",
        });
      }

      updateData.discountValue = parseFloat(discountValue);
    }

    if (minOrderValue !== undefined) {
      if (minOrderValue !== null && minOrderValue < 0) {
        return res.status(400).json({
          success: false,
          message: "Minimum order value cannot be negative",
        });
      }
      updateData.minOrderValue = minOrderValue
        ? parseFloat(minOrderValue)
        : null;
    }

    if (maxDiscount !== undefined) {
      if (maxDiscount !== null && maxDiscount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Maximum discount must be greater than 0",
        });
      }
      updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    }

    if (validFrom !== undefined) {
      if (validFrom) {
        const parsedValidFrom = new Date(validFrom);
        if (isNaN(parsedValidFrom.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid validFrom date format",
          });
        }
        updateData.validFrom = parsedValidFrom;
      } else {
        updateData.validFrom = null;
      }
    }

    if (validUntil !== undefined) {
      if (validUntil) {
        const parsedValidUntil = new Date(validUntil);
        if (isNaN(parsedValidUntil.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid validUntil date format",
          });
        }
        updateData.validUntil = parsedValidUntil;
      } else {
        updateData.validUntil = null;
      }
    }

    const finalValidFrom =
      updateData.validFrom !== undefined
        ? updateData.validFrom
        : currentCoupon.validFrom;
    const finalValidUntil =
      updateData.validUntil !== undefined
        ? updateData.validUntil
        : currentCoupon.validUntil;

    if (
      finalValidFrom &&
      finalValidUntil &&
      finalValidFrom >= finalValidUntil
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid from date must be before valid until date",
      });
    }

    if (usageLimit !== undefined) {
      if (usageLimit !== null) {
        if (usageLimit <= 0) {
          return res.status(400).json({
            success: false,
            message: "Usage limit must be greater than 0",
          });
        }
        if (hasUsage && usageLimit < currentCoupon.usage.length) {
          return res.status(400).json({
            success: false,
            message: "Cannot set usage limit below current usage count",
          });
        }
      }
      updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    }

    if (perUserLimit !== undefined) {
      if (perUserLimit <= 0) {
        return res.status(400).json({
          success: false,
          message: "Per user limit must be greater than 0",
        });
      }
      updateData.perUserLimit = parseInt(perUserLimit);
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive === "true" || isActive === true;
    }

    updateData.updatedAt = new Date();

    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: updateData,
      include: {
        instructor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        courses: {
          include: {
            course: {
              select: { id: true, title: true },
            },
          },
        },
        _count: {
          select: {
            usage: true,
          },
        },
      },
    });

    if (applicableCourses !== undefined) {
      const instructor = await prisma.instructor.findUnique({
        where: { userId: req.userAuthId },
        select: { id: true },
      });

      let courseIds = [];
      if (applicableCourses && applicableCourses.length > 0) {
        const courses = await prisma.course.findMany({
          where: {
            id: { in: applicableCourses },
            instructorId: instructor.id,
          },
          select: { id: true },
        });

        if (courses.length !== applicableCourses.length) {
          return res.status(400).json({
            success: false,
            message: "Some courses do not exist or do not belong to you",
          });
        }

        courseIds = courses.map((course) => course.id);
      }

      await prisma.couponCourse.deleteMany({
        where: { couponId },
      });

      if (courseIds.length > 0) {
        const couponCoursePromises = courseIds.map((courseId) =>
          prisma.couponCourse.create({
            data: {
              couponId,
              courseId,
            },
          })
        );
        await Promise.all(couponCoursePromises);
      }
    }

    await prisma.notification.create({
      data: {
        type: "COUPON_UPDATED",
        title: "Coupon Updated",
        message: `Coupon "${updatedCoupon.name}" has been updated successfully.`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          couponId: updatedCoupon.id,
          couponCode: updatedCoupon.code,
          couponName: updatedCoupon.name,
          changedFields: Object.keys(updateData),
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "UPDATE_COUPON",
      "COUPON",
      couponId,
      "SUCCESS",
      {
        couponCode: updatedCoupon.code,
        couponName: updatedCoupon.name,
        changedFields: Object.keys(updateData),
        hasUsage,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "UPDATE_COUPON",
      "COUPON",
      couponId,
      {
        name: currentCoupon.name,
        discountType: currentCoupon.discountType,
        discountValue: currentCoupon.discountValue,
        isActive: currentCoupon.isActive,
      },
      updateData,
      req.userAuthId
    );

    educademyLogger.performance("UPDATE_COUPON", startTime, {
      userId: req.userAuthId,
      couponId,
      changedFields: Object.keys(updateData).length,
    });

    const responseData = {
      coupon: {
        id: updatedCoupon.id,
        code: updatedCoupon.code,
        name: updatedCoupon.name,
        description: updatedCoupon.description,
        discountType: updatedCoupon.discountType,
        discountValue: updatedCoupon.discountValue,
        minOrderValue: updatedCoupon.minOrderValue,
        maxDiscount: updatedCoupon.maxDiscount,
        validFrom: updatedCoupon.validFrom,
        validUntil: updatedCoupon.validUntil,
        usageLimit: updatedCoupon.usageLimit,
        usageCount: updatedCoupon._count.usage,
        perUserLimit: updatedCoupon.perUserLimit,
        isActive: updatedCoupon.isActive,
        applicableCourses: updatedCoupon.courses.map((cc) => cc.course),
        instructor: {
          name: `${updatedCoupon.instructor.user.firstName} ${updatedCoupon.instructor.user.lastName}`,
        },
        createdAt: updatedCoupon.createdAt,
        updatedAt: updatedCoupon.updatedAt,
      },
      changes: {
        fieldsUpdated: Object.keys(updateData),
        coursesUpdated: applicableCourses !== undefined,
      },
    };

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Update coupon failed", error, {
      userId: req.userAuthId,
      couponId,
      business: {
        operation: "UPDATE_COUPON",
        entity: "COUPON",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to update coupon",
      requestId,
    });
  }
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { couponId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CouponController",
    methodName: "deleteCoupon",
  });

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        instructor: {
          select: { userId: true },
        },
        usage: {
          select: { id: true },
        },
        courses: {
          select: { courseId: true },
        },
      },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (coupon.instructor.userId !== req.userAuthId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own coupons",
      });
    }

    const hasUsage = coupon.usage.length > 0;

    if (hasUsage) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete coupon that has been used. Consider deactivating instead.",
        details: {
          usageCount: coupon.usage.length,
        },
      });
    }

    await prisma.coupon.delete({
      where: { id: couponId },
    });

    await prisma.notification.create({
      data: {
        type: "COUPON_DELETED",
        title: "Coupon Deleted",
        message: `Coupon "${coupon.name}" (${coupon.code}) has been deleted.`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          couponId: coupon.id,
          couponCode: coupon.code,
          couponName: coupon.name,
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "DELETE_COUPON",
      "COUPON",
      couponId,
      "SUCCESS",
      {
        couponCode: coupon.code,
        couponName: coupon.name,
        hadUsage: hasUsage,
        userId: req.userAuthId,
      }
    );

    educademyLogger.logAuditTrail(
      "DELETE_COUPON",
      "COUPON",
      couponId,
      {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        isActive: coupon.isActive,
      },
      null,
      req.userAuthId
    );

    educademyLogger.performance("DELETE_COUPON", startTime, {
      userId: req.userAuthId,
      couponId,
    });

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
      data: {
        deletedCouponId: couponId,
        couponCode: coupon.code,
        couponName: coupon.name,
      },
    });
  } catch (error) {
    educademyLogger.error("Delete coupon failed", error, {
      userId: req.userAuthId,
      couponId,
      business: {
        operation: "DELETE_COUPON",
        entity: "COUPON",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      requestId,
    });
  }
});

export const getCoupons = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CouponController",
    methodName: "getCoupons",
  });

  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      discountType,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeUsage = false,
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

    const whereClause = {
      instructorId: instructor.id,
    };

    if (search?.trim()) {
      whereClause.OR = [
        {
          code: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          name: {
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

    if (status) {
      const now = new Date();
      switch (status) {
        case "active":
          whereClause.isActive = true;
          whereClause.OR = [{ validUntil: null }, { validUntil: { gte: now } }];
          break;
        case "inactive":
          whereClause.isActive = false;
          break;
        case "expired":
          whereClause.validUntil = { lt: now };
          break;
        case "upcoming":
          whereClause.validFrom = { gt: now };
          break;
      }
    }

    if (discountType) {
      const validDiscountTypes = ["PERCENTAGE", "FIXED_AMOUNT"];
      if (validDiscountTypes.includes(discountType.toUpperCase())) {
        whereClause.discountType = discountType.toUpperCase();
      }
    }

    const validSortFields = [
      "code",
      "name",
      "discountValue",
      "usageCount",
      "createdAt",
      "updatedAt",
      "validFrom",
      "validUntil",
    ];

    let orderBy = {};
    if (validSortFields.includes(sortBy)) {
      if (sortBy === "usageCount") {
        orderBy = {
          usage: {
            _count: sortOrder.toLowerCase() === "asc" ? "asc" : "desc",
          },
        };
      } else {
        orderBy[sortBy] = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";
      }
    } else {
      orderBy.createdAt = "desc";
    }

    const skip = (pageNum - 1) * limitNum;

    const includeClause = {
      instructor: {
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      },
      courses: {
        include: {
          course: {
            select: { id: true, title: true, thumbnail: true },
          },
        },
      },
      _count: {
        select: {
          usage: true,
          courses: true,
        },
      },
    };

    if (includeUsage === "true") {
      includeClause.usage = {
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { usedAt: "desc" },
        take: 5,
      };
    }

    const [coupons, totalCount, usageStats] = await Promise.all([
      prisma.coupon.findMany({
        where: whereClause,
        include: includeClause,
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.coupon.count({
        where: whereClause,
      }),

      prisma.coupon.groupBy({
        by: ["discountType"],
        where: { instructorId: instructor.id },
        _count: { id: true },
        _sum: { discountValue: true },
      }),
    ]);

    const now = new Date();
    const formattedCoupons = coupons.map((coupon) => {
      const isExpired = coupon.validUntil && coupon.validUntil < now;
      const isUpcoming = coupon.validFrom && coupon.validFrom > now;
      const isUsageLimitReached =
        coupon.usageLimit && coupon._count.usage >= coupon.usageLimit;

      let couponStatus = "active";
      if (!coupon.isActive) {
        couponStatus = "inactive";
      } else if (isExpired) {
        couponStatus = "expired";
      } else if (isUpcoming) {
        couponStatus = "upcoming";
      } else if (isUsageLimitReached) {
        couponStatus = "limit_reached";
      }

      return {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        usageLimit: coupon.usageLimit,
        usageCount: coupon._count.usage,
        perUserLimit: coupon.perUserLimit,
        isActive: coupon.isActive,
        status: couponStatus,
        applicableCourses: coupon.courses.map((cc) => cc.course),
        instructor: {
          name: `${coupon.instructor.user.firstName} ${coupon.instructor.user.lastName}`,
        },
        stats: {
          totalUsage: coupon._count.usage,
          totalCourses: coupon._count.courses,
          usageRate: coupon.usageLimit
            ? Math.round((coupon._count.usage / coupon.usageLimit) * 100)
            : 0,
        },
        recentUsage:
          includeUsage === "true"
            ? coupon.usage?.slice(0, 5).map((usage) => ({
                id: usage.id,
                usedAt: usage.usedAt,
                user: {
                  name: `${usage.user.firstName} ${usage.user.lastName}`,
                },
                orderValue: usage.orderValue,
                discountAmount: usage.discountAmount,
              }))
            : undefined,
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
      };
    });

    const typeBreakdown = usageStats.reduce((acc, stat) => {
      acc[stat.discountType.toLowerCase()] = {
        count: stat._count.id,
        totalValue: stat._sum.discountValue || 0,
      };
      return acc;
    }, {});

    const totalPages = Math.ceil(totalCount / limitNum);

    const summary = {
      totalCoupons: totalCount,
      activeCoupons: formattedCoupons.filter((c) => c.status === "active")
        .length,
      inactiveCoupons: formattedCoupons.filter((c) => c.status === "inactive")
        .length,
      expiredCoupons: formattedCoupons.filter((c) => c.status === "expired")
        .length,
      upcomingCoupons: formattedCoupons.filter((c) => c.status === "upcoming")
        .length,
      totalUsage: formattedCoupons.reduce((sum, c) => sum + c.usageCount, 0),
      typeBreakdown,
    };

    educademyLogger.logBusinessOperation(
      "GET_COUPONS",
      "COUPON",
      instructor.id,
      "SUCCESS",
      {
        instructorId: instructor.id,
        couponsReturned: formattedCoupons.length,
        totalCoupons: totalCount,
        includeUsage: includeUsage === "true",
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_COUPONS", startTime, {
      userId: req.userAuthId,
      couponsCount: formattedCoupons.length,
      includeUsage: includeUsage === "true",
    });

    const responseData = {
      coupons: formattedCoupons,
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
          search: search || null,
          status: status || null,
          discountType: discountType || null,
          sortBy,
          sortOrder,
        },
        available: {
          statuses: ["active", "inactive", "expired", "upcoming"],
          discountTypes: ["PERCENTAGE", "FIXED_AMOUNT"],
          sortFields: validSortFields,
        },
      },
    };

    res.status(200).json({
      success: true,
      message: "Coupons fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get coupons failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_COUPONS",
        entity: "COUPON",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
      requestId,
    });
  }
});

export const getCouponUsage = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { couponId } = req.params;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CouponController",
    methodName: "getCouponUsage",
  });

  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "usedAt",
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

    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        instructor: {
          select: { userId: true },
        },
      },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (coupon.instructor.userId !== req.userAuthId) {
      return res.status(403).json({
        success: false,
        message: "You can only view usage for your own coupons",
      });
    }

    const validSortFields = ["usedAt", "orderValue", "discountAmount"];
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

    const [usageRecords, totalCount, usageStats] = await Promise.all([
      prisma.couponUsage.findMany({
        where: { couponId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
          order: {
            select: {
              id: true,
              totalAmount: true,
              finalAmount: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),

      prisma.couponUsage.count({
        where: { couponId },
      }),

      prisma.couponUsage.aggregate({
        where: { couponId },
        _sum: {
          orderValue: true,
          discountAmount: true,
        },
        _avg: {
          orderValue: true,
          discountAmount: true,
        },
        _count: { id: true },
      }),
    ]);

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUsage = await prisma.couponUsage.count({
      where: {
        couponId,
        usedAt: { gte: last30Days },
      },
    });

    const formattedUsage = usageRecords.map((usage) => ({
      id: usage.id,
      usedAt: usage.usedAt,
      orderValue: usage.orderValue,
      discountAmount: usage.discountAmount,
      discountPercentage:
        usage.orderValue > 0
          ? Math.round((usage.discountAmount / usage.orderValue) * 100)
          : 0,
      user: {
        name: `${usage.user.firstName} ${usage.user.lastName}`,
        email: usage.user.email,
        profileImage: usage.user.profileImage,
      },
      order: usage.order
        ? {
            id: usage.order.id,
            totalAmount: usage.order.totalAmount,
            finalAmount: usage.order.finalAmount,
            status: usage.order.status,
            createdAt: usage.order.createdAt,
          }
        : null,
    }));

    const totalPages = Math.ceil(totalCount / limitNum);

    const responseData = {
      usage: formattedUsage,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        usageLimit: coupon.usageLimit,
      },
      statistics: {
        totalUsage: usageStats._count.id,
        totalOrderValue: parseFloat(usageStats._sum.orderValue || 0),
        totalDiscountGiven: parseFloat(usageStats._sum.discountAmount || 0),
        averageOrderValue: parseFloat(usageStats._avg.orderValue || 0),
        averageDiscountAmount: parseFloat(usageStats._avg.discountAmount || 0),
        usageInLast30Days: recentUsage,
        usageRate: coupon.usageLimit
          ? Math.round((totalCount / coupon.usageLimit) * 100)
          : 0,
      },
    };

    educademyLogger.logBusinessOperation(
      "GET_COUPON_USAGE",
      "COUPON_USAGE",
      couponId,
      "SUCCESS",
      {
        couponId,
        couponCode: coupon.code,
        usageRecordsReturned: formattedUsage.length,
        totalUsage: totalCount,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("GET_COUPON_USAGE", startTime, {
      userId: req.userAuthId,
      couponId,
      usageCount: formattedUsage.length,
    });

    res.status(200).json({
      success: true,
      message: "Coupon usage fetched successfully",
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Get coupon usage failed", error, {
      userId: req.userAuthId,
      couponId,
      business: {
        operation: "GET_COUPON_USAGE",
        entity: "COUPON_USAGE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch coupon usage",
      requestId,
    });
  }
});

export const applyCouponToCourse = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { couponId } = req.params;
  const { courseIds } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "CouponController",
    methodName: "applyCouponToCourse",
  });

  try {
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Course IDs array is required",
      });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        instructor: {
          select: { id: true, userId: true },
        },
        courses: {
          select: { courseId: true },
        },
      },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (coupon.instructor.userId !== req.userAuthId) {
      return res.status(403).json({
        success: false,
        message: "You can only modify your own coupons",
      });
    }

    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        instructorId: coupon.instructor.id,
        status: { in: ["PUBLISHED", "DRAFT"] },
      },
      select: { id: true, title: true, status: true },
    });

    if (courses.length !== courseIds.length) {
      return res.status(400).json({
        success: false,
        message:
          "Some courses do not exist, do not belong to you, or are not in a valid status",
      });
    }

    const existingCourseIds = coupon.courses.map((cc) => cc.courseId);
    const newCourseIds = courseIds.filter(
      (id) => !existingCourseIds.includes(id)
    );

    if (newCourseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "All specified courses are already associated with this coupon",
      });
    }

    const couponCoursePromises = newCourseIds.map((courseId) =>
      prisma.couponCourse.create({
        data: {
          couponId,
          courseId,
        },
      })
    );

    await Promise.all(couponCoursePromises);

    const updatedCoupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        courses: {
          include: {
            course: {
              select: { id: true, title: true, thumbnail: true, status: true },
            },
          },
        },
        _count: {
          select: { courses: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        type: "COUPON_COURSES_UPDATED",
        title: "Coupon Applied to Courses",
        message: `Coupon "${coupon.name}" has been applied to ${newCourseIds.length} additional course(s).`,
        userId: req.userAuthId,
        priority: "NORMAL",
        data: {
          couponId: coupon.id,
          couponCode: coupon.code,
          couponName: coupon.name,
          newCoursesCount: newCourseIds.length,
          totalCoursesCount: updatedCoupon._count.courses,
        },
      },
    });

    educademyLogger.logBusinessOperation(
      "APPLY_COUPON_TO_COURSE",
      "COUPON_COURSE",
      couponId,
      "SUCCESS",
      {
        couponId,
        couponCode: coupon.code,
        newCoursesAdded: newCourseIds.length,
        totalCourses: updatedCoupon._count.courses,
        userId: req.userAuthId,
      }
    );

    educademyLogger.performance("APPLY_COUPON_TO_COURSE", startTime, {
      userId: req.userAuthId,
      couponId,
      coursesAdded: newCourseIds.length,
    });

    const responseData = {
      coupon: {
        id: updatedCoupon.id,
        code: updatedCoupon.code,
        name: updatedCoupon.name,
        applicableCourses: updatedCoupon.courses.map((cc) => cc.course),
        totalCourses: updatedCoupon._count.courses,
      },
      coursesAdded: courses.filter((course) =>
        newCourseIds.includes(course.id)
      ),
      summary: {
        newCoursesAdded: newCourseIds.length,
        totalApplicableCourses: updatedCoupon._count.courses,
      },
    };

    res.status(200).json({
      success: true,
      message: `Coupon applied to ${newCourseIds.length} additional course(s) successfully`,
      data: responseData,
    });
  } catch (error) {
    educademyLogger.error("Apply coupon to course failed", error, {
      userId: req.userAuthId,
      couponId,
      business: {
        operation: "APPLY_COUPON_TO_COURSE",
        entity: "COUPON_COURSE",
        status: "ERROR",
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to apply coupon to courses",
      requestId,
    });
  }
});
