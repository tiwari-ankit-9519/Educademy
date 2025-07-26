import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import redisService from "../../utils/redis.js";
import emailService from "../../utils/emailService.js";
import notificationService from "../../utils/notificationservice.js";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

const generatePayoutId = () => {
  return `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const formatCurrency = (amount, currency = "INR") => {
  const symbol = currency === "INR" ? "₹" : "$";
  return `${symbol}${parseFloat(amount || 0).toLocaleString()}`;
};

const safeNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return isNaN(value) ? 0 : value;

  // Handle Prisma Decimal objects - try toNumber() method first
  if (typeof value === "object" && value !== null) {
    // Check if it's a Prisma Decimal with toNumber method
    if (typeof value.toNumber === "function") {
      try {
        const result = value.toNumber();
        return isNaN(result) ? 0 : result;
      } catch (error) {
        console.error("Error calling toNumber():", error);
      }
    }

    // Check if it's a serialized decimal object
    if ("s" in value && "e" in value && "d" in value) {
      try {
        const decimal = new Decimal(value);
        const result = decimal.toNumber();
        return isNaN(result) ? 0 : result;
      } catch (error) {
        console.error("Error converting with Decimal:", error);

        // Fallback: manual parsing
        const sign = value.s === -1 ? -1 : 1;
        const digits = value.d || [];

        if (digits.length === 0) return 0;

        let mainPart = digits[0] || 0;

        if (digits.length > 1) {
          const fractionalPart = digits[1];
          const fractionalStr = fractionalPart.toString();
          const cents = fractionalStr.substring(0, 2).padEnd(2, "0");
          const result = sign * (mainPart + parseInt(cents) / 100);
          return isNaN(result) ? 0 : result;
        }

        return sign * mainPart;
      }
    }
  }

  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const convertBigIntToNumber = (obj) => {
  if (obj === null || obj === undefined) {
    return 0;
  }

  if (typeof obj === "bigint") {
    return Number(obj);
  }

  if (typeof obj === "number") {
    return isNaN(obj) ? 0 : obj;
  }

  if (typeof obj === "string") {
    const parsed = parseFloat(obj);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Handle Prisma Decimal objects
  if (
    typeof obj === "object" &&
    obj !== null &&
    "s" in obj &&
    "e" in obj &&
    "d" in obj
  ) {
    return safeNumber(obj);
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }

  if (typeof obj === "object") {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }

  return obj;
};

export const getAllTransactions = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const {
      page = 1,
      limit = 20,
      status,
      method,
      gateway,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageSize = Math.min(parseInt(limit), 100);
    const pageNumber = Math.max(parseInt(page), 1);
    const skip = (pageNumber - 1) * pageSize;

    const cacheKey = `admin_transactions:${JSON.stringify({
      page: pageNumber,
      limit: pageSize,
      status,
      method,
      gateway,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      search,
      sortBy,
      sortOrder,
    })}`;

    let cachedResult = await redisService.getJSON(cacheKey);
    if (cachedResult) {
      return res.status(200).json({
        success: true,
        message: "Transactions retrieved successfully",
        data: cachedResult,
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const where = {};

    if (status) where.status = status;
    if (method) where.method = method;
    if (gateway) where.gateway = gateway;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    if (search) {
      where.OR = [
        { transactionId: { contains: search, mode: "insensitive" } },
        {
          enrollments: {
            some: {
              student: {
                user: { email: { contains: search, mode: "insensitive" } },
              },
            },
          },
        },
      ];
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [transactions, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          enrollments: {
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
              course: {
                select: {
                  title: true,
                  instructor: {
                    include: {
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          couponUsages: {
            include: {
              coupon: {
                select: {
                  code: true,
                  type: true,
                  value: true,
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const transactionsData = transactions.map((payment) => ({
      id: payment.id,
      transactionId: payment.transactionId,
      amount: safeNumber(payment.amount),
      originalAmount: safeNumber(payment.originalAmount),
      discountAmount: safeNumber(payment.discountAmount),
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      gateway: payment.gateway,
      createdAt: payment.createdAt,
      student: payment.enrollments[0]?.student
        ? {
            name: `${payment.enrollments[0].student.user.firstName} ${payment.enrollments[0].student.user.lastName}`,
            email: payment.enrollments[0].student.user.email,
          }
        : null,
      courses: payment.enrollments.map((enrollment) => ({
        title: enrollment.course.title,
        instructor: `${enrollment.course.instructor.user.firstName} ${enrollment.course.instructor.user.lastName}`,
      })),
      coupon: payment.couponUsages[0]?.coupon
        ? {
            code: payment.couponUsages[0].coupon.code,
            discount: safeNumber(payment.couponUsages[0].discount),
          }
        : null,
      refundAmount: safeNumber(payment.refundAmount),
      refundedAt: payment.refundedAt,
    }));

    const result = {
      transactions: transactionsData,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: skip + pageSize < total,
        hasPrev: pageNumber > 1,
      },
      filters: {
        status,
        method,
        gateway,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        search,
      },
      sort: {
        sortBy,
        sortOrder,
      },
    };

    await redisService.setJSON(cacheKey, result, { ex: 300 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Transactions retrieved successfully",
      data: result,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get all transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve transactions",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const getTransactionDetails = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { transactionId } = req.params;

    const cacheKey = `transaction_details:${transactionId}`;
    let cachedTransaction = await redisService.getJSON(cacheKey);

    if (cachedTransaction) {
      return res.status(200).json({
        success: true,
        message: "Transaction details retrieved successfully",
        data: cachedTransaction,
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const transaction = await prisma.payment.findUnique({
      where: { id: transactionId },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phoneNumber: true,
                  },
                },
              },
            },
            course: {
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
            },
          },
        },
        earnings: {
          include: {
            instructor: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        couponUsages: {
          include: {
            coupon: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
        code: "TRANSACTION_NOT_FOUND",
      });
    }

    const transactionDetails = {
      id: transaction.id,
      transactionId: transaction.transactionId,
      amount: safeNumber(transaction.amount),
      originalAmount: safeNumber(transaction.originalAmount),
      discountAmount: safeNumber(transaction.discountAmount),
      tax: safeNumber(transaction.tax),
      currency: transaction.currency,
      status: transaction.status,
      method: transaction.method,
      gateway: transaction.gateway,
      gatewayResponse: transaction.gatewayResponse,
      metadata: transaction.metadata,
      refundAmount: safeNumber(transaction.refundAmount),
      refundReason: transaction.refundReason,
      refundedAt: transaction.refundedAt,
      invoiceUrl: transaction.invoiceUrl,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      student: transaction.enrollments[0]?.student
        ? {
            id: transaction.enrollments[0].student.user.id,
            name: `${transaction.enrollments[0].student.user.firstName} ${transaction.enrollments[0].student.user.lastName}`,
            email: transaction.enrollments[0].student.user.email,
            phoneNumber: transaction.enrollments[0].student.user.phoneNumber,
          }
        : null,
      courses: transaction.enrollments.map((enrollment) => ({
        id: enrollment.course.id,
        title: enrollment.course.title,
        price: safeNumber(enrollment.course.price),
        instructor: {
          name: `${enrollment.course.instructor.user.firstName} ${enrollment.course.instructor.user.lastName}`,
          email: enrollment.course.instructor.user.email,
        },
      })),
      earnings: transaction.earnings.map((earning) => ({
        id: earning.id,
        amount: safeNumber(earning.amount),
        commission: safeNumber(earning.commission),
        platformFee: safeNumber(earning.platformFee),
        status: earning.status,
        instructor: {
          name: `${earning.instructor.user.firstName} ${earning.instructor.user.lastName}`,
        },
      })),
      couponUsage: transaction.couponUsages[0]
        ? {
            couponCode: transaction.couponUsages[0].coupon.code,
            couponType: transaction.couponUsages[0].coupon.type,
            couponValue: safeNumber(transaction.couponUsages[0].coupon.value),
            discountApplied: safeNumber(transaction.couponUsages[0].discount),
            usedBy: `${transaction.couponUsages[0].user.firstName} ${transaction.couponUsages[0].user.lastName}`,
          }
        : null,
    };

    await redisService.setJSON(cacheKey, transactionDetails, { ex: 600 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Transaction details retrieved successfully",
      data: transactionDetails,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get transaction details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve transaction details",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const processRefund = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { transactionId } = req.params;
    const { refundAmount, refundReason, notifyUser = true } = req.body;

    if (!refundAmount || !refundReason) {
      return res.status(400).json({
        success: false,
        message: "Refund amount and reason are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    const transaction = await prisma.payment.findUnique({
      where: { id: transactionId },
      include: {
        enrollments: {
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
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
        code: "TRANSACTION_NOT_FOUND",
      });
    }

    if (transaction.status !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Only completed transactions can be refunded",
        code: "INVALID_TRANSACTION_STATUS",
      });
    }

    const totalRefundable =
      safeNumber(transaction.amount) - safeNumber(transaction.refundAmount);
    if (parseFloat(refundAmount) > totalRefundable) {
      return res.status(400).json({
        success: false,
        message: `Refund amount cannot exceed ${formatCurrency(
          totalRefundable
        )}`,
        code: "REFUND_AMOUNT_EXCEEDED",
      });
    }

    const newRefundAmount =
      safeNumber(transaction.refundAmount) + parseFloat(refundAmount);
    const isFullRefund = newRefundAmount >= safeNumber(transaction.amount);
    const newStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

    const updatedTransaction = await prisma.payment.update({
      where: { id: transactionId },
      data: {
        refundAmount: newRefundAmount,
        refundReason,
        refundedAt: new Date(),
        status: newStatus,
      },
    });

    if (isFullRefund) {
      await prisma.enrollment.updateMany({
        where: { paymentId: transactionId },
        data: { status: "REFUNDED" },
      });
    }

    await prisma.earning.updateMany({
      where: { paymentId: transactionId },
      data: { status: "CANCELLED" },
    });

    if (notifyUser && transaction.enrollments[0]?.student) {
      const student = transaction.enrollments[0].student;
      const courseTitle = transaction.enrollments[0].course.title;

      try {
        await emailService.sendRefundProcessed({
          email: student.user.email,
          firstName: student.user.firstName,
          amount: refundAmount,
          currency: transaction.currency,
          refundId: `REF_${Date.now()}`,
          courseName: courseTitle,
          reason: refundReason,
        });
      } catch (emailError) {
        console.error("Failed to send refund email:", emailError);
      }

      try {
        await notificationService.createNotification({
          userId: student.user.id,
          type: "refund_processed",
          title: "Refund Processed",
          message: `Your refund of ${formatCurrency(
            refundAmount
          )} has been processed successfully.`,
          priority: "HIGH",
          data: {
            transactionId,
            refundAmount,
            refundReason,
            courseTitle,
            processedAt: new Date().toISOString(),
          },
          actionUrl: "/student/purchases",
        });
      } catch (notificationError) {
        console.error(
          "Failed to create refund notification:",
          notificationError
        );
      }
    }

    await redisService.del(`transaction_details:${transactionId}`);
    await redisService.delPattern("admin_transactions:*");
    await redisService.delPattern("revenue_overview:*");
    await redisService.delPattern("financial_analytics:*");

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: {
        transactionId: updatedTransaction.id,
        refundAmount: parseFloat(refundAmount),
        totalRefunded: newRefundAmount,
        status: newStatus,
        refundedAt: updatedTransaction.refundedAt,
        refundReason,
      },
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Process refund error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process refund",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const getAllPayouts = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const {
      page = 1,
      limit = 20,
      status,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      instructorId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageSize = Math.min(parseInt(limit), 100);
    const pageNumber = Math.max(parseInt(page), 1);
    const skip = (pageNumber - 1) * pageSize;

    const cacheKey = `admin_payouts:${JSON.stringify({
      page: pageNumber,
      limit: pageSize,
      status,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      instructorId,
      sortBy,
      sortOrder,
    })}`;

    let cachedResult = await redisService.getJSON(cacheKey);
    if (cachedResult) {
      return res.status(200).json({
        success: true,
        message: "Payouts retrieved successfully",
        data: cachedResult,
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const where = {};

    if (status) where.status = status;
    if (instructorId) where.instructorId = instructorId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
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
      }),
      prisma.payout.count({ where }),
    ]);

    const payoutsData = payouts.map((payout) => ({
      id: payout.id,
      amount: safeNumber(payout.amount),
      currency: payout.currency,
      status: payout.status,
      requestedAt: payout.requestedAt,
      processedAt: payout.processedAt,
      gatewayId: payout.gatewayId,
      instructor: {
        id: payout.instructor.id,
        name: `${payout.instructor.user.firstName} ${payout.instructor.user.lastName}`,
        email: payout.instructor.user.email,
      },
    }));

    const result = {
      payouts: payoutsData,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: skip + pageSize < total,
        hasPrev: pageNumber > 1,
      },
      filters: {
        status,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        instructorId,
      },
      sort: {
        sortBy,
        sortOrder,
      },
    };

    await redisService.setJSON(cacheKey, result, { ex: 300 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Payouts retrieved successfully",
      data: result,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get all payouts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payouts",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const processPayout = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { payoutId } = req.params;

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
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

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found",
        code: "PAYOUT_NOT_FOUND",
      });
    }

    if (payout.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Payout is already ${payout.status.toLowerCase()}`,
        code: "INVALID_PAYOUT_STATUS",
      });
    }

    const gatewayId = generatePayoutId();

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
        gatewayId,
        gatewayResponse: {
          processed_by: "admin",
          processed_at: new Date().toISOString(),
          gateway_reference: gatewayId,
        },
      },
    });

    await prisma.earning.updateMany({
      where: {
        instructorId: payout.instructorId,
        status: "PENDING",
      },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    try {
      await emailService.sendInstructorPayout({
        email: payout.instructor.user.email,
        firstName: payout.instructor.user.firstName,
        amount: payout.amount,
        currency: payout.currency,
        payoutId: gatewayId,
        period: new Date().toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        studentCount: 0,
      });
    } catch (emailError) {
      console.error("Failed to send payout email:", emailError);
    }

    try {
      await notificationService.createNotification({
        userId: payout.instructor.userId,
        type: "payout_processed",
        title: "Payout Processed",
        message: `Your payout of ${formatCurrency(
          payout.amount
        )} has been processed successfully.`,
        priority: "HIGH",
        data: {
          payoutId: updatedPayout.id,
          amount: payout.amount,
          currency: payout.currency,
          gatewayId,
          processedAt: updatedPayout.processedAt,
        },
        actionUrl: "/instructor/earnings",
      });
    } catch (notificationError) {
      console.error("Failed to create payout notification:", notificationError);
    }

    await redisService.delPattern("admin_payouts:*");
    await redisService.delPattern("revenue_overview:*");
    await redisService.delPattern("financial_analytics:*");

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Payout processed successfully",
      data: {
        payoutId: updatedPayout.id,
        amount: safeNumber(updatedPayout.amount),
        currency: updatedPayout.currency,
        status: updatedPayout.status,
        processedAt: updatedPayout.processedAt,
        gatewayId: updatedPayout.gatewayId,
      },
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Process payout error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process payout",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const getRevenueOverview = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { period = "30", currency = "INR" } = req.query;

    const cacheKey = `revenue_overview:${period}:${currency}`;
    let cachedOverview = await redisService.getJSON(cacheKey);

    if (cachedOverview) {
      return res.status(200).json({
        success: true,
        message: "Revenue overview retrieved successfully",
        data: cachedOverview,
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const [
      totalRevenue,
      periodRevenue,
      totalTransactions,
      periodTransactions,
      refundData,
      payoutData,
      topCourses,
      topInstructors,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          currency,
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          currency,
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.count({
        where: { status: "COMPLETED" },
      }),
      prisma.payment.count({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] },
          currency,
          refundedAt: { gte: startDate },
        },
        _sum: { refundAmount: true },
        _count: true,
      }),
      prisma.payout.aggregate({
        where: {
          status: "COMPLETED",
          currency,
          processedAt: { gte: startDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.enrollment.groupBy({
        by: ["courseId"],
        where: {
          createdAt: { gte: startDate },
          payment: { status: "COMPLETED" },
        },
        _count: { courseId: true },
        orderBy: { _count: { courseId: "desc" } },
        take: 5,
      }),
      prisma.earning.groupBy({
        by: ["instructorId"],
        where: {
          createdAt: { gte: startDate },
          status: { in: ["PENDING", "PAID"] },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
    ]);

    const courseIds = topCourses.map((item) => item.courseId);
    const instructorIds = topInstructors.map((item) => item.instructorId);

    let courseRevenues = [];
    if (courseIds.length > 0) {
      courseRevenues = await prisma.$queryRaw`
        SELECT 
          e."courseId",
          SUM(p.amount) as total_revenue
        FROM "Enrollment" e
        JOIN "Payment" p ON e."paymentId" = p.id
        WHERE e."courseId" = ANY(${courseIds})
          AND p.status = 'COMPLETED'
          AND p.currency = ${currency}
          AND p."createdAt" >= ${startDate}
        GROUP BY e."courseId"
      `;
    }

    const [courseDetails, instructorDetails] = await Promise.all([
      prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, title: true },
      }),
      prisma.instructor.findMany({
        where: { id: { in: instructorIds } },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    const overview = {
      summary: {
        totalRevenue: safeNumber(totalRevenue._sum.amount),
        periodRevenue: safeNumber(periodRevenue._sum.amount),
        totalTransactions: totalRevenue._count || 0,
        periodTransactions: periodRevenue._count || 0,
        totalRefunds: safeNumber(refundData._sum.refundAmount),
        totalPayouts: safeNumber(payoutData._sum.amount),
        netRevenue:
          safeNumber(periodRevenue._sum.amount) -
          safeNumber(refundData._sum.refundAmount),
        currency,
      },
      growth: {
        revenueGrowth: 0,
        transactionGrowth: 0,
        refundRate:
          (periodRevenue._count || 0) > 0
            ? (
                ((refundData._count || 0) / (periodRevenue._count || 1)) *
                100
              ).toFixed(2)
            : "0",
      },
      topPerformers: {
        courses: topCourses.map((item) => {
          const course = courseDetails.find((c) => c.id === item.courseId);
          return {
            courseId: item.courseId,
            title: course?.title || "Unknown Course",
            enrollments: item._count.courseId || 0,
            revenue: safeNumber(item._sum?.payment?.amount),
          };
        }),
        instructors: topInstructors.map((item) => {
          const instructor = instructorDetails.find(
            (i) => i.id === item.instructorId
          );
          return {
            instructorId: item.instructorId,
            name: instructor
              ? `${instructor.user.firstName} ${instructor.user.lastName}`
              : "Unknown Instructor",
            earnings: safeNumber(item._sum.amount),
          };
        }),
      },
      metrics: {
        averageTransactionValue:
          (periodRevenue._count || 0) > 0
            ? (
                safeNumber(periodRevenue._sum.amount) /
                (periodRevenue._count || 1)
              ).toFixed(2)
            : "0",
        payoutRatio:
          safeNumber(periodRevenue._sum.amount) > 0
            ? (
                (safeNumber(payoutData._sum.amount) /
                  safeNumber(periodRevenue._sum.amount)) *
                100
              ).toFixed(2)
            : "0",
        platformRevenue:
          safeNumber(periodRevenue._sum.amount) -
          safeNumber(payoutData._sum.amount),
      },
    };

    await redisService.setJSON(cacheKey, overview, { ex: 1800 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Revenue overview retrieved successfully",
      data: overview,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get revenue overview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve revenue overview",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const getFinancialAnalytics = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const {
      period = "12",
      granularity = "month",
      currency = "INR",
    } = req.query;

    const cacheKey = `financial_analytics:${period}:${granularity}:${currency}`;
    let cachedAnalytics = await redisService.getJSON(cacheKey);

    if (cachedAnalytics) {
      return res.status(200).json({
        success: true,
        message: "Financial analytics retrieved successfully",
        data: cachedAnalytics,
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const periodMonths = parseInt(period);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - periodMonths);

    const [
      revenueByMethod,
      revenueByGateway,
      revenueByStatus,
      monthlyTrends,
      instructorEarnings,
      platformMetrics,
    ] = await Promise.all([
      prisma.payment.groupBy({
        by: ["method"],
        where: {
          createdAt: { gte: startDate },
          currency,
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ["gateway"],
        where: {
          createdAt: { gte: startDate },
          currency,
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ["status"],
        where: {
          createdAt: { gte: startDate },
          currency,
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          SUM(amount) as revenue,
          COUNT(*) as transactions
        FROM "Payment"
        WHERE "createdAt" >= ${startDate}
          AND currency = ${currency}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
        LIMIT 12
      `,
      prisma.earning.aggregate({
        where: {
          createdAt: { gte: startDate },
        },
        _sum: {
          amount: true,
          commission: true,
          platformFee: true,
        },
      }),
      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT p.id) as total_transactions,
          SUM(p.amount) as total_revenue,
          AVG(p.amount) as avg_transaction_value,
          COUNT(DISTINCT e.id) as total_enrollments,
          COUNT(DISTINCT c.id) as courses_sold,
          COUNT(DISTINCT i.id) as active_instructors
        FROM "Payment" p
        LEFT JOIN "Enrollment" e ON p.id = e."paymentId"
        LEFT JOIN "Course" c ON e."courseId" = c.id
        LEFT JOIN "Instructor" i ON c."instructorId" = i.id
        WHERE p."createdAt" >= ${startDate}
          AND p.currency = ${currency}
      `,
    ]);

    const analytics = {
      breakdown: {
        byPaymentMethod: revenueByMethod.map((item) => ({
          method: item.method,
          revenue: item._sum.amount ? Number(item._sum.amount.toString()) : 0,
          transactions: item._count || 0,
          percentage: "0",
        })),
        byGateway: revenueByGateway.map((item) => ({
          gateway: item.gateway,
          revenue: item._sum.amount ? Number(item._sum.amount.toString()) : 0,
          transactions: item._count || 0,
          percentage: "0",
        })),
        byStatus: revenueByStatus.map((item) => ({
          status: item.status,
          revenue: item._sum.amount ? Number(item._sum.amount.toString()) : 0,
          transactions: item._count || 0,
          percentage: "0",
        })),
      },
      trends: {
        monthly: monthlyTrends.map((item) => ({
          month: item.month
            ? new Date(item.month).toISOString()
            : new Date().toISOString(),
          revenue: item.revenue ? Number(item.revenue.toString()) : 0,
          transactions: item.transactions
            ? Number(item.transactions.toString())
            : 0,
        })),
      },
      earnings: {
        totalInstructorEarnings: instructorEarnings._sum.amount
          ? Number(instructorEarnings._sum.amount.toString())
          : 0,
        totalCommissions: instructorEarnings._sum.commission
          ? Number(instructorEarnings._sum.commission.toString())
          : 0,
        totalPlatformFees: instructorEarnings._sum.platformFee
          ? Number(instructorEarnings._sum.platformFee.toString())
          : 0,
      },
      metrics: {
        total_transactions: platformMetrics[0]?.total_transactions
          ? Number(platformMetrics[0].total_transactions.toString())
          : 0,
        total_revenue: platformMetrics[0]?.total_revenue
          ? Number(platformMetrics[0].total_revenue.toString())
          : 0,
        avg_transaction_value: platformMetrics[0]?.avg_transaction_value
          ? Number(platformMetrics[0].avg_transaction_value.toString())
          : 0,
        total_enrollments: platformMetrics[0]?.total_enrollments
          ? Number(platformMetrics[0].total_enrollments.toString())
          : 0,
        courses_sold: platformMetrics[0]?.courses_sold
          ? Number(platformMetrics[0].courses_sold.toString())
          : 0,
        active_instructors: platformMetrics[0]?.active_instructors
          ? Number(platformMetrics[0].active_instructors.toString())
          : 0,
      },
    };

    const totalRevenue = analytics.breakdown.byPaymentMethod.reduce(
      (sum, item) => sum + (item.revenue || 0),
      0
    );

    if (totalRevenue > 0) {
      analytics.breakdown.byPaymentMethod.forEach((item) => {
        const percentage = ((item.revenue || 0) / totalRevenue) * 100;
        item.percentage = (isNaN(percentage) ? 0 : percentage).toFixed(2);
      });
      analytics.breakdown.byGateway.forEach((item) => {
        const percentage = ((item.revenue || 0) / totalRevenue) * 100;
        item.percentage = (isNaN(percentage) ? 0 : percentage).toFixed(2);
      });
      analytics.breakdown.byStatus.forEach((item) => {
        const percentage = ((item.revenue || 0) / totalRevenue) * 100;
        item.percentage = (isNaN(percentage) ? 0 : percentage).toFixed(2);
      });
    }

    const convertedAnalytics = convertBigIntToNumber(analytics);

    await redisService.setJSON(cacheKey, convertedAnalytics, { ex: 3600 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Financial analytics retrieved successfully",
      data: convertedAnalytics,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get financial analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve financial analytics",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const getPaymentStats = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const cacheKey = "payment_stats_overview";
    let cachedStats = await redisService.getJSON(cacheKey);

    if (cachedStats) {
      return res.status(200).json({
        success: true,
        message: "Payment statistics retrieved successfully",
        data: cachedStats,
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const [
      totalStats,
      todayStats,
      weekStats,
      monthStats,
      statusDistribution,
      methodDistribution,
      gatewayDistribution,
    ] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ["method"],
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ["gateway"],
        _count: true,
      }),
    ]);

    const stats = {
      overview: {
        totalRevenue: safeNumber(totalStats._sum.amount),
        totalTransactions: totalStats._count || 0,
        averageTransactionValue: safeNumber(totalStats._avg.amount),
        todayRevenue: safeNumber(todayStats._sum.amount),
        todayTransactions: todayStats._count || 0,
        weekRevenue: safeNumber(weekStats._sum.amount),
        weekTransactions: weekStats._count || 0,
        monthRevenue: safeNumber(monthStats._sum.amount),
        monthTransactions: monthStats._count || 0,
      },
      distribution: {
        byStatus: statusDistribution.map((item) => ({
          status: item.status,
          count: item._count || 0,
          percentage:
            (totalStats._count || 0) > 0
              ? (((item._count || 0) / (totalStats._count || 1)) * 100).toFixed(
                  2
                )
              : "0",
        })),
        byMethod: methodDistribution.map((item) => ({
          method: item.method,
          count: item._count || 0,
          percentage:
            (totalStats._count || 0) > 0
              ? (((item._count || 0) / (totalStats._count || 1)) * 100).toFixed(
                  2
                )
              : "0",
        })),
        byGateway: gatewayDistribution.map((item) => ({
          gateway: item.gateway,
          count: item._count || 0,
          percentage:
            (totalStats._count || 0) > 0
              ? (((item._count || 0) / (totalStats._count || 1)) * 100).toFixed(
                  2
                )
              : "0",
        })),
      },
      growth: {
        dailyGrowth: 0,
        weeklyGrowth: 0,
        monthlyGrowth: 0,
      },
    };

    await redisService.setJSON(cacheKey, stats, { ex: 900 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Payment statistics retrieved successfully",
      data: stats,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get payment stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment statistics",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});
