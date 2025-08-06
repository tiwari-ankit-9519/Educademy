import { PrismaClient } from "@prisma/client";
import asyncHandler from "express-async-handler";
import redisService from "../utils/redis.js";
import emailService from "../utils/emailService.js";
import notificationService from "../utils/notificationservice.js";
import { Decimal } from "@prisma/client/runtime/library.js";
// import {
//   calculateGrowthRate,
//   formatCurrency,
//   generateEarningsCSV,
//   validateMinPayoutAmount,
//   generatePayoutReference,
//   getEarningsMetrics,
//   generateTaxDocument,
//   schedulePayoutReminder,
// } from "../helper/payoutHelperFunctions.js";

const prisma = new PrismaClient();

export const calculateGrowthRate = (current, previous) => {
  if (previous === 0 || previous === null || previous === undefined) {
    return current > 0 ? 100 : 0;
  }

  if (current === null || current === undefined) {
    return -100;
  }

  const growthRate = ((current - previous) / Math.abs(previous)) * 100;
  return Math.round(growthRate * 100) / 100;
};

export const formatCurrency = (amount, currency = "INR") => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(0);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
  }).format(Number(amount));
};

export const generateEarningsCSV = (earnings, includeDetails = false) => {
  if (!earnings || earnings.length === 0) {
    return "No data available";
  }

  let headers = [
    "Date",
    "Amount",
    "Commission",
    "Platform Fee",
    "Currency",
    "Status",
    "Payment ID",
  ];

  if (includeDetails) {
    headers.push(
      "Course Title",
      "Student Name",
      "Student Country",
      "Transaction ID"
    );
  }

  const csvRows = [headers.join(",")];

  earnings.forEach((earning) => {
    let row = [
      new Date(earning.createdAt).toLocaleDateString(),
      earning.amount,
      earning.commission,
      earning.platformFee,
      earning.currency,
      earning.status,
      earning.paymentId,
    ];

    if (includeDetails && earning.payment) {
      const courseTitle =
        earning.payment.enrollments?.[0]?.course?.title || "N/A";
      const studentName = earning.payment.enrollments?.[0]?.student
        ? `${earning.payment.enrollments[0].student.user.firstName} ${earning.payment.enrollments[0].student.user.lastName}`
        : "N/A";
      const studentCountry =
        earning.payment.enrollments?.[0]?.student?.user?.country || "N/A";
      const transactionId = earning.payment.transactionId || "N/A";

      row.push(courseTitle, studentName, studentCountry, transactionId);
    }

    row = row.map((field) => {
      const stringField = String(field);
      if (
        stringField.includes(",") ||
        stringField.includes('"') ||
        stringField.includes("\n")
      ) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    });

    csvRows.push(row.join(","));
  });

  return csvRows.join("\n");
};

export const validateMinPayoutAmount = (amount, currency = "INR") => {
  const minimumAmounts = {
    INR: 100,
    USD: 10,
    EUR: 10,
    GBP: 8,
    AUD: 15,
    CAD: 13,
  };

  const minAmount = minimumAmounts[currency] || minimumAmounts["INR"];
  return amount >= minAmount;
};

export const generatePayoutReference = (instructorId, currency = "INR") => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAYOUT_${currency}_${instructorId.substring(
    0,
    8
  )}_${timestamp}_${random}`;
};

export const getEarningsMetrics = async (instructorId, period = "monthly") => {
  const currentDate = new Date();
  let startDate, endDate, previousStartDate, previousEndDate;

  switch (period) {
    case "daily":
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      previousEndDate = startDate;
      break;
    case "weekly":
      const dayOfWeek = currentDate.getDay();
      startDate = new Date(
        currentDate.getTime() - dayOfWeek * 24 * 60 * 60 * 1000
      );
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(
        startDate.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      previousEndDate = startDate;
      break;
    case "monthly":
    default:
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      previousStartDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      previousEndDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        0
      );
      break;
  }

  try {
    const [currentPeriod, previousPeriod] = await Promise.all([
      prisma.earning.aggregate({
        where: {
          instructorId,
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        _sum: {
          amount: true,
          commission: true,
        },
        _count: true,
      }),
      prisma.earning.aggregate({
        where: {
          instructorId,
          createdAt: {
            gte: previousStartDate,
            lt: previousEndDate,
          },
        },
        _sum: {
          amount: true,
          commission: true,
        },
        _count: true,
      }),
    ]);

    const current = {
      amount: currentPeriod._sum.amount || 0,
      commission: currentPeriod._sum.commission || 0,
      transactions: currentPeriod._count || 0,
    };

    const previous = {
      amount: previousPeriod._sum.amount || 0,
      commission: previousPeriod._sum.commission || 0,
      transactions: previousPeriod._count || 0,
    };

    const growth = {
      earnings: calculateGrowthRate(current.commission, previous.commission),
      transactions: calculateGrowthRate(
        current.transactions,
        previous.transactions
      ),
    };

    return {
      current,
      previous,
      growth,
    };
  } catch (error) {
    console.error("Error fetching earnings metrics:", error);
    return {
      current: { commission: 0, amount: 0, transactions: 0 },
      previous: { commission: 0, amount: 0, transactions: 0 },
      growth: { earnings: 0, transactions: 0 },
    };
  }
};

export const generateTaxDocument = (earnings, year) => {
  const yearEarnings = earnings.filter((earning) => {
    const earningYear = new Date(earning.createdAt).getFullYear();
    return earningYear === year;
  });

  const summary = {
    totalGrossEarnings: yearEarnings.reduce(
      (sum, earning) => sum + Number(earning.amount || 0),
      0
    ),
    totalNetEarnings: yearEarnings.reduce(
      (sum, earning) => sum + Number(earning.commission || 0),
      0
    ),
    totalPlatformFees: yearEarnings.reduce(
      (sum, earning) => sum + Number(earning.platformFee || 0),
      0
    ),
    totalTransactions: yearEarnings.length,
  };

  return {
    year,
    summary,
    currency: yearEarnings[0]?.currency || "INR",
    generatedAt: new Date().toISOString(),
    note: "This is for informational purposes only. Please consult a tax professional for official tax filing.",
  };
};

export const schedulePayoutReminder = async (
  instructorId,
  availableBalance
) => {
  const minReminderAmount = 500;

  if (availableBalance >= minReminderAmount) {
    return {
      shouldRemind: true,
      message: `You have ${formatCurrency(
        availableBalance
      )} available for payout. Consider requesting a payout to receive your earnings.`,
      availableBalance,
      reminderType: "payout_available",
    };
  }

  return {
    shouldRemind: false,
    message: null,
    availableBalance,
    reminderType: null,
  };
};

export const validateDateRange = (startDate, endDate) => {
  const errors = [];

  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push("Invalid start date format");
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push("Invalid end date format");
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      errors.push("Start date cannot be after end date");
    }

    const currentDate = new Date();
    if (start > currentDate) {
      errors.push("Start date cannot be in the future");
    }

    const maxRangeInDays = 365;
    const diffInTime = end.getTime() - start.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);

    if (diffInDays > maxRangeInDays) {
      errors.push(`Date range cannot exceed ${maxRangeInDays} days`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedStartDate: startDate ? new Date(startDate) : null,
    normalizedEndDate: endDate ? new Date(endDate) : null,
  };
};

export const validatePayoutRequest = (req, res, next) => {};

export const validatePaymentDetails = (req, res, next) => {};

const getEarningsOverview = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const cacheKey = `earnings_overview:${instructorId}`;

  try {
    let cachedData = await redisService.getJSON(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Earnings overview retrieved successfully",
        data: cachedData,
        cached: true,
      });
    }

    const currentDate = new Date();
    const currentMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const yearStart = new Date(currentDate.getFullYear(), 0, 1);

    const [summaryData, recentEarnings] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          COALESCE(SUM(e.commission), 0) as total_earnings,
          COALESCE(SUM(CASE WHEN e."createdAt" >= ${yearStart} THEN e.commission ELSE 0 END), 0) as yearly_earnings,
          COALESCE(SUM(CASE WHEN e."createdAt" >= ${currentMonthStart} THEN e.commission ELSE 0 END), 0) as current_month_earnings,
          COUNT(e.id) as total_transactions,
          
          COALESCE(SUM(CASE WHEN p.status = 'PENDING' THEN p.amount ELSE 0 END), 0) as pending_payouts,
          COUNT(CASE WHEN p.status = 'PENDING' THEN 1 END) as pending_count,
          COALESCE(SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0 END), 0) as total_paid_out,
          COUNT(CASE WHEN p.status = 'COMPLETED' THEN 1 END) as total_payouts
        FROM "Instructor" i
        LEFT JOIN "Earning" e ON i.id = e."instructorId"
        LEFT JOIN "Payout" p ON i.id = p."instructorId"
        WHERE i.id = ${instructorId}
      `,

      prisma.earning.findMany({
        where: { instructorId },
        include: {
          payment: {
            include: {
              enrollments: {
                include: {
                  course: {
                    select: { title: true, slug: true },
                  },
                },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const summary = summaryData[0];
    const availableBalance =
      parseFloat(summary.total_earnings || 0) -
      parseFloat(summary.total_paid_out || 0) -
      parseFloat(summary.pending_payouts || 0);

    const payoutReminder = await schedulePayoutReminder(
      instructorId,
      availableBalance
    );

    const overviewData = {
      summary: {
        totalEarnings: formatCurrency(summary.total_earnings || 0),
        totalEarningsRaw: parseFloat(summary.total_earnings || 0),
        availableBalance: formatCurrency(availableBalance),
        availableBalanceRaw: availableBalance,
        currentMonthEarnings: formatCurrency(
          summary.current_month_earnings || 0
        ),
        currentMonthEarningsRaw: parseFloat(
          summary.current_month_earnings || 0
        ),
        yearlyEarnings: formatCurrency(summary.yearly_earnings || 0),
        yearlyEarningsRaw: parseFloat(summary.yearly_earnings || 0),
        monthlyGrowth: 0,
        totalTransactions: parseInt(summary.total_transactions || 0),
      },
      payouts: {
        pendingAmount: formatCurrency(summary.pending_payouts || 0),
        pendingAmountRaw: parseFloat(summary.pending_payouts || 0),
        pendingCount: parseInt(summary.pending_count || 0),
        totalPaidOut: formatCurrency(summary.total_paid_out || 0),
        totalPaidOutRaw: parseFloat(summary.total_paid_out || 0),
        totalPayouts: parseInt(summary.total_payouts || 0),
      },
      recentActivity: recentEarnings.map((earning) => ({
        id: earning.id,
        amount: formatCurrency(earning.commission),
        amountRaw: earning.commission,
        createdAt: earning.createdAt,
        course: earning.payment.enrollments[0]?.course || null,
        status: earning.status,
      })),
      topCourses: [],
      alerts: payoutReminder.shouldRemind
        ? [
            {
              type: "info",
              message: payoutReminder.message,
              action: "request_payout",
            },
          ]
        : [],
    };

    await redisService.setJSON(cacheKey, overviewData, { ex: 300 });

    res.status(200).json({
      success: true,
      message: "Earnings overview retrieved successfully",
      data: overviewData,
    });
  } catch (error) {
    console.error("Get earnings overview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve earnings overview",
      error: error.message,
    });
  }
});

const getEarningsStats = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const { period = "monthly", year = new Date().getFullYear() } = req.query;

  const cacheKey = `earnings_stats:${instructorId}:${period}:${year}`;

  try {
    let cachedData = await redisService.getJSON(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Earnings statistics retrieved successfully",
        data: cachedData,
        cached: true,
      });
    }

    let dateFilter;

    if (period === "daily") {
      const startDate = new Date(year, new Date().getMonth(), 1);
      const endDate = new Date(year, new Date().getMonth() + 1, 0);
      dateFilter = { gte: startDate, lte: endDate };
    } else if (period === "weekly") {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      dateFilter = { gte: startDate, lte: endDate };
    } else {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      dateFilter = { gte: startDate, lte: endDate };
    }

    const [earningsData, payoutsData] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC(${period}, "createdAt") as period,
          SUM(amount) as total_amount,
          SUM(commission) as total_commission,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_amount
        FROM "Earning"
        WHERE "instructorId" = ${instructorId}
          AND "createdAt" >= ${dateFilter.gte}
          AND "createdAt" <= ${dateFilter.lte}
        GROUP BY DATE_TRUNC(${period}, "createdAt")
        ORDER BY period ASC
      `,

      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC(${period}, "createdAt") as period,
          SUM(amount) as payout_amount,
          COUNT(*) as payout_count
        FROM "Payout"
        WHERE "instructorId" = ${instructorId}
          AND "createdAt" >= ${dateFilter.gte}
          AND "createdAt" <= ${dateFilter.lte}
          AND status = 'COMPLETED'
        GROUP BY DATE_TRUNC(${period}, "createdAt")
        ORDER BY period ASC
      `,
    ]);

    const currentTotal = earningsData.reduce(
      (sum, item) => sum + parseFloat(item.total_commission),
      0
    );
    const previousTotal =
      earningsData.length > 1
        ? earningsData
            .slice(0, -1)
            .reduce((sum, item) => sum + parseFloat(item.total_commission), 0)
        : 0;

    const growthRate = calculateGrowthRate(currentTotal, previousTotal);

    const statsData = {
      period,
      year: parseInt(year),
      earnings: earningsData.map((item) => ({
        period: item.period,
        amount: formatCurrency(parseFloat(item.total_commission)),
        amountRaw: parseFloat(item.total_commission),
        grossAmount: formatCurrency(parseFloat(item.total_amount)),
        grossAmountRaw: parseFloat(item.total_amount),
        transactions: parseInt(item.transaction_count),
        averageAmount: formatCurrency(parseFloat(item.avg_amount)),
        averageAmountRaw: parseFloat(item.avg_amount),
      })),
      payouts: payoutsData.map((item) => ({
        period: item.period,
        amount: formatCurrency(parseFloat(item.payout_amount)),
        amountRaw: parseFloat(item.payout_amount),
        count: parseInt(item.payout_count),
      })),
      summary: {
        totalEarnings: formatCurrency(currentTotal),
        totalEarningsRaw: currentTotal,
        totalTransactions: earningsData.reduce(
          (sum, item) => sum + parseInt(item.transaction_count),
          0
        ),
        totalPayouts: formatCurrency(
          payoutsData.reduce(
            (sum, item) => sum + parseFloat(item.payout_amount),
            0
          )
        ),
        averageTransaction: formatCurrency(
          earningsData.length > 0
            ? earningsData.reduce(
                (sum, item) => sum + parseFloat(item.avg_amount),
                0
              ) / earningsData.length
            : 0
        ),
        growthRate: Math.round(growthRate * 100) / 100,
      },
    };

    await redisService.setJSON(cacheKey, statsData, { ex: 600 });

    res.status(200).json({
      success: true,
      message: "Earnings statistics retrieved successfully",
      data: statsData,
    });
  } catch (error) {
    console.error("Get earnings stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve earnings statistics",
      error: error.message,
    });
  }
});

const requestPayout = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const { amount, currency = "INR" } = req.body;

  try {
    if (!validateMinPayoutAmount(amount, currency)) {
      return res.status(400).json({
        success: false,
        message: `Minimum payout amount is ${formatCurrency(100, currency)}`,
      });
    }

    const availableBalance = await prisma.earning.aggregate({
      where: {
        instructorId,
        status: "PENDING",
      },
      _sum: { commission: true },
    });

    const pendingPayouts = await prisma.payout.aggregate({
      where: {
        instructorId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      _sum: { amount: true },
    });

    const completedPayouts = await prisma.payout.aggregate({
      where: {
        instructorId,
        status: "COMPLETED",
      },
      _sum: { amount: true },
    });

    const totalAvailable =
      (availableBalance._sum.commission || 0) -
      (pendingPayouts._sum.amount || 0) -
      (completedPayouts._sum.amount || 0);

    if (amount > totalAvailable) {
      return res.status(400).json({
        success: false,
        message: "Insufficient available balance for payout",
        data: {
          requestedAmount: formatCurrency(amount, currency),
          availableBalance: formatCurrency(totalAvailable, currency),
        },
      });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!instructor.paymentDetails) {
      return res.status(400).json({
        success: false,
        message:
          "Payment details not configured. Please update your payment information.",
      });
    }

    const payoutReference = generatePayoutReference(instructorId, currency);

    const payout = await prisma.payout.create({
      data: {
        amount: new Decimal(amount),
        currency,
        status: "PENDING",
        gatewayId: payoutReference,
        instructorId,
      },
    });

    await prisma.earning.updateMany({
      where: {
        instructorId,
        status: "PENDING",
      },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    await notificationService.createNotification({
      userId: instructor.user.id,
      type: "payout_requested",
      title: "Payout Request Submitted",
      message: `Your payout request for ${formatCurrency(
        amount,
        currency
      )} has been submitted and is pending approval.`,
      data: {
        payoutId: payout.id,
        amount,
        currency,
        status: "PENDING",
        reference: payoutReference,
      },
    });

    await emailService.sendInstructorPayout({
      email: instructor.user.email,
      firstName: instructor.user.firstName,
      amount,
      currency,
      payoutId: payout.id,
      period: "Current",
      studentCount: 0,
    });

    await redisService.delPattern(`earnings_overview:${instructorId}`);
    await redisService.delPattern(`detailed_earnings:${instructorId}:*`);
    await redisService.delPattern(`payout_history:${instructorId}:*`);

    res.status(201).json({
      success: true,
      message: "Payout request submitted successfully",
      data: {
        payout: {
          id: payout.id,
          amount: formatCurrency(payout.amount, currency),
          amountRaw: payout.amount,
          currency: payout.currency,
          status: payout.status,
          reference: payoutReference,
          requestedAt: payout.requestedAt,
        },
      },
    });
  } catch (error) {
    console.error("Request payout error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit payout request",
      error: error.message,
    });
  }
});

const generateFinancialReport = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const {
    type = "monthly",
    startDate,
    endDate,
    format = "json",
    includeDetails = false,
  } = req.query;

  const cacheKey = `financial_report:${instructorId}:${type}:${
    startDate || ""
  }:${endDate || ""}:${format}:${includeDetails}`;

  try {
    let cachedData = await redisService.getJSON(cacheKey);
    if (cachedData && format === "json") {
      return res.status(200).json({
        success: true,
        message: "Financial report generated successfully",
        data: cachedData,
        cached: true,
      });
    }

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = { instructorId };
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            country: true,
          },
        },
      },
    });

    const [earnings, payouts, coursePerformance] = await Promise.all([
      prisma.earning.findMany({
        where,
        include: includeDetails
          ? {
              payment: {
                include: {
                  enrollments: {
                    include: {
                      course: {
                        select: { title: true, price: true },
                      },
                      student: {
                        include: {
                          user: {
                            select: {
                              firstName: true,
                              lastName: true,
                              country: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            }
          : undefined,
        orderBy: { createdAt: "desc" },
      }),

      prisma.payout.findMany({
        where: {
          instructorId,
          ...(Object.keys(dateFilter).length > 0
            ? { requestedAt: dateFilter }
            : {}),
        },
        orderBy: { requestedAt: "desc" },
      }),

      prisma.$queryRaw`
        SELECT 
          c.id,
          c.title,
          c.price,
          COUNT(DISTINCT en.id) as enrollments,
          SUM(e.amount) as total_earnings,
          SUM(e.commission) as instructor_earnings,
          SUM(e."platformFee") as platform_fees,
          AVG(e.amount) as avg_earning_per_sale
        FROM "Course" c
        LEFT JOIN "Enrollment" en ON c.id = en."courseId"
        LEFT JOIN "Payment" p ON en."paymentId" = p.id
        LEFT JOIN "Earning" e ON p.id = e."paymentId"
        WHERE c."instructorId" = ${instructorId}
          ${startDate ? `AND e."createdAt" >= ${new Date(startDate)}` : ""}
          ${endDate ? `AND e."createdAt" <= ${new Date(endDate)}` : ""}
        GROUP BY c.id, c.title, c.price
        ORDER BY total_earnings DESC NULLS LAST
      `,
    ]);

    const totalCommission = earnings.reduce(
      (sum, earning) => sum + Number(earning.commission),
      0
    );

    const taxInfo = generateTaxDocument(earnings, new Date().getFullYear());

    const reportData = {
      reportInfo: {
        generatedAt: new Date().toISOString(),
        instructor: {
          name: `${instructor.user.firstName} ${instructor.user.lastName}`,
          email: instructor.user.email,
          country: instructor.user.country,
          commissionRate: instructor.commissionRate,
        },
        period: {
          type,
          startDate: startDate || earnings[earnings.length - 1]?.createdAt,
          endDate: endDate || earnings[0]?.createdAt,
        },
      },
      summary: {
        totalGrossEarnings: formatCurrency(taxInfo.summary.totalGrossEarnings),
        totalInstructorEarnings: formatCurrency(
          taxInfo.summary.totalNetEarnings
        ),
        totalPlatformFees: formatCurrency(taxInfo.summary.totalPlatformFees),
        totalTransactions: taxInfo.summary.totalTransactions,
        averageTransactionValue: formatCurrency(
          taxInfo.summary.totalTransactions > 0
            ? taxInfo.summary.totalGrossEarnings /
                taxInfo.summary.totalTransactions
            : 0
        ),
      },
      earnings: earnings.map((earning) => ({
        id: earning.id,
        amount: formatCurrency(earning.amount),
        commission: formatCurrency(earning.commission),
        platformFee: formatCurrency(earning.platformFee),
        currency: earning.currency,
        status: earning.status,
        createdAt: earning.createdAt,
        paidAt: earning.paidAt,
        ...(includeDetails && earning.payment
          ? {
              courseTitle: earning.payment.enrollments[0]?.course?.title,
              studentName: earning.payment.enrollments[0]?.student
                ? `${earning.payment.enrollments[0].student.user.firstName} ${earning.payment.enrollments[0].student.user.lastName}`
                : null,
              studentCountry:
                earning.payment.enrollments[0]?.student?.user?.country,
              transactionId: earning.payment.transactionId,
            }
          : {}),
      })),
      payouts: payouts.map((payout) => ({
        id: payout.id,
        amount: formatCurrency(payout.amount),
        currency: payout.currency,
        status: payout.status,
        requestedAt: payout.requestedAt,
        processedAt: payout.processedAt,
        reference: payout.gatewayId,
      })),
      coursePerformance: coursePerformance.map((course) => ({
        id: course.id,
        title: course.title,
        price: formatCurrency(parseFloat(course.price || 0)),
        enrollments: parseInt(course.enrollments || 0),
        totalEarnings: formatCurrency(parseFloat(course.total_earnings || 0)),
        instructorEarnings: formatCurrency(
          parseFloat(course.instructor_earnings || 0)
        ),
        platformFees: formatCurrency(parseFloat(course.platform_fees || 0)),
        averageEarningPerSale: formatCurrency(
          parseFloat(course.avg_earning_per_sale || 0)
        ),
      })),
      taxInformation: taxInfo,
    };

    if (format === "csv") {
      const csvContent = generateEarningsCSV(earnings, includeDetails);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="financial-report-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );
      return res.status(200).send(csvContent);
    }

    await redisService.setJSON(cacheKey, reportData, { ex: 1800 });

    res.status(200).json({
      success: true,
      message: "Financial report generated successfully",
      data: reportData,
    });
  } catch (error) {
    console.error("Generate financial report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate financial report",
      error: error.message,
    });
  }
});

const getDetailedEarnings = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const {
    page = 1,
    limit = 20,
    status,
    startDate,
    endDate,
    courseId,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const pageNumber = Math.max(parseInt(page), 1);
  const pageSize = Math.min(parseInt(limit), 100);
  const skip = (pageNumber - 1) * pageSize;

  const cacheKey = `detailed_earnings:${instructorId}:${page}:${limit}:${
    status || "all"
  }:${startDate || ""}:${endDate || ""}:${
    courseId || ""
  }:${sortBy}:${sortOrder}`;

  try {
    let cachedData = await redisService.getJSON(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Detailed earnings retrieved successfully",
        data: cachedData,
        cached: true,
      });
    }

    const where = { instructorId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (courseId) {
      where.payment = {
        enrollments: {
          some: { courseId },
        },
      };
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [earnings, totalCount, summary] = await Promise.all([
      prisma.earning.findMany({
        where,
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              method: true,
              gateway: true,
              transactionId: true,
              createdAt: true,
              enrollments: {
                select: {
                  id: true,
                  createdAt: true,
                  course: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      thumbnail: true,
                      price: true,
                    },
                  },
                  student: {
                    select: {
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                          email: true,
                          country: true,
                        },
                      },
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),

      prisma.earning.count({ where }),

      prisma.earning.aggregate({
        where,
        _sum: {
          amount: true,
          commission: true,
          platformFee: true,
        },
        _avg: {
          amount: true,
        },
        _count: true,
      }),
    ]);

    const detailedEarnings = earnings.map((earning) => ({
      id: earning.id,
      amount: formatCurrency(earning.amount),
      amountRaw: earning.amount,
      commission: formatCurrency(earning.commission),
      commissionRaw: earning.commission,
      platformFee: formatCurrency(earning.platformFee),
      platformFeeRaw: earning.platformFee,
      currency: earning.currency,
      status: earning.status,
      createdAt: earning.createdAt,
      paidAt: earning.paidAt,
      payment: {
        id: earning.payment.id,
        amount: formatCurrency(earning.payment.amount),
        method: earning.payment.method,
        gateway: earning.payment.gateway,
        transactionId: earning.payment.transactionId,
        createdAt: earning.payment.createdAt,
      },
      enrollments: earning.payment.enrollments.map((enrollment) => ({
        id: enrollment.id,
        course: enrollment.course,
        student: {
          name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
          email: enrollment.student.user.email,
          country: enrollment.student.user.country,
        },
        enrolledAt: enrollment.createdAt,
      })),
    }));

    const result = {
      earnings: detailedEarnings,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNext: skip + pageSize < totalCount,
        hasPrev: pageNumber > 1,
      },
      summary: {
        totalAmount: formatCurrency(summary._sum.amount || 0),
        totalCommission: formatCurrency(summary._sum.commission || 0),
        totalPlatformFee: formatCurrency(summary._sum.platformFee || 0),
        averageAmount: formatCurrency(summary._avg.amount || 0),
        transactionCount: summary._count,
      },
      filters: {
        status,
        startDate,
        endDate,
        courseId,
        sortBy,
        sortOrder,
      },
    };

    await redisService.setJSON(cacheKey, result, { ex: 300 });

    res.status(200).json({
      success: true,
      message: "Detailed earnings retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get detailed earnings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve detailed earnings",
      error: error.message,
    });
  }
});

const getCourseEarnings = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const { courseId } = req.params;
  const { startDate, endDate, page = 1, limit = 20 } = req.query;

  const pageNumber = Math.max(parseInt(page), 1);
  const pageSize = Math.min(parseInt(limit), 50);
  const skip = (pageNumber - 1) * pageSize;

  const cacheKey = `course_earnings:${instructorId}:${courseId}:${
    startDate || ""
  }:${endDate || ""}:${page}:${limit}`;

  try {
    let cachedData = await redisService.getJSON(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Course earnings retrieved successfully",
        data: cachedData,
        cached: true,
      });
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        price: true,
        totalEnrollments: true,
        totalRevenue: true,
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or access denied",
      });
    }

    const where = {
      payment: {
        enrollments: {
          some: { courseId },
        },
      },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [earnings, totalCount, summary, monthlyBreakdown] = await Promise.all(
      [
        prisma.earning.findMany({
          where,
          include: {
            payment: {
              include: {
                enrollments: {
                  where: { courseId },
                  include: {
                    student: {
                      include: {
                        user: {
                          select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            country: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),

        prisma.earning.count({ where }),

        prisma.earning.aggregate({
          where,
          _sum: {
            amount: true,
            commission: true,
            platformFee: true,
          },
          _count: true,
        }),

        prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', e."createdAt") as month,
          SUM(e.amount) as earnings,
          SUM(e.commission) as commission,
          COUNT(*) as transactions
        FROM "Earning" e
        JOIN "Payment" p ON e."paymentId" = p.id
        JOIN "Enrollment" en ON p.id = en."paymentId"
        WHERE en."courseId" = ${courseId}
          AND e."instructorId" = ${instructorId}
          ${startDate ? `AND e."createdAt" >= ${new Date(startDate)}` : ""}
          ${endDate ? `AND e."createdAt" <= ${new Date(endDate)}` : ""}
        GROUP BY DATE_TRUNC('month', e."createdAt")
        ORDER BY month DESC
        LIMIT 12
      `,
      ]
    );

    const result = {
      course: {
        ...course,
        price: formatCurrency(course.price),
        totalRevenue: formatCurrency(course.totalRevenue),
      },
      earnings: earnings.map((earning) => ({
        id: earning.id,
        amount: formatCurrency(earning.amount),
        commission: formatCurrency(earning.commission),
        platformFee: formatCurrency(earning.platformFee),
        createdAt: earning.createdAt,
        student: earning.payment.enrollments[0]
          ? {
              name: `${earning.payment.enrollments[0].student.user.firstName} ${earning.payment.enrollments[0].student.user.lastName}`,
              email: earning.payment.enrollments[0].student.user.email,
              country: earning.payment.enrollments[0].student.user.country,
            }
          : null,
        payment: {
          id: earning.payment.id,
          amount: formatCurrency(earning.payment.amount),
          method: earning.payment.method,
          transactionId: earning.payment.transactionId,
        },
      })),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNext: skip + pageSize < totalCount,
        hasPrev: pageNumber > 1,
      },
      summary: {
        totalEarnings: formatCurrency(summary._sum.amount || 0),
        totalCommission: formatCurrency(summary._sum.commission || 0),
        totalPlatformFee: formatCurrency(summary._sum.platformFee || 0),
        transactionCount: summary._count,
      },
      monthlyBreakdown: monthlyBreakdown.map((item) => ({
        month: item.month,
        earnings: formatCurrency(parseFloat(item.earnings)),
        commission: formatCurrency(parseFloat(item.commission)),
        transactions: parseInt(item.transactions),
      })),
    };

    await redisService.setJSON(cacheKey, result, { ex: 600 });

    res.status(200).json({
      success: true,
      message: "Course earnings retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get course earnings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve course earnings",
      error: error.message,
    });
  }
});

const getPayoutHistory = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const {
    page = 1,
    limit = 20,
    status,
    startDate,
    endDate,
    sortBy = "requestedAt",
    sortOrder = "desc",
  } = req.query;

  const pageNumber = Math.max(parseInt(page), 1);
  const pageSize = Math.min(parseInt(limit), 50);
  const skip = (pageNumber - 1) * pageSize;

  const cacheKey = `payout_history:${instructorId}:${page}:${limit}:${
    status || "all"
  }:${startDate || ""}:${endDate || ""}:${sortBy}:${sortOrder}`;

  try {
    let cachedData = await redisService.getJSON(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Payout history retrieved successfully",
        data: cachedData,
        cached: true,
      });
    }

    const where = { instructorId };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.requestedAt = {};
      if (startDate) where.requestedAt.gte = new Date(startDate);
      if (endDate) where.requestedAt.lte = new Date(endDate);
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [payouts, totalCount, summary] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),

      prisma.payout.count({ where }),

      prisma.payout.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const result = {
      payouts: payouts.map((payout) => ({
        id: payout.id,
        amount: formatCurrency(payout.amount, payout.currency),
        amountRaw: payout.amount,
        currency: payout.currency,
        status: payout.status,
        requestedAt: payout.requestedAt,
        processedAt: payout.processedAt,
        reference: payout.gatewayId,
        gatewayResponse: payout.gatewayResponse,
      })),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNext: skip + pageSize < totalCount,
        hasPrev: pageNumber > 1,
      },
      summary: {
        totalAmount: formatCurrency(summary._sum.amount || 0),
        totalPayouts: summary._count,
      },
      statusBreakdown: await prisma.payout.groupBy({
        by: ["status"],
        where: { instructorId },
        _sum: { amount: true },
        _count: true,
      }),
    };

    await redisService.setJSON(cacheKey, result, { ex: 600 });

    res.status(200).json({
      success: true,
      message: "Payout history retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get payout history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payout history",
      error: error.message,
    });
  }
});

const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const {
    timeframe = "monthly",
    year = new Date().getFullYear(),
    compareToLastYear = false,
  } = req.query;

  const cacheKey = `revenue_analytics:${instructorId}:${timeframe}:${year}:${compareToLastYear}`;

  try {
    let cachedData = await redisService.getJSON(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Revenue analytics retrieved successfully",
        data: cachedData,
        cached: true,
      });
    }

    const currentYearStart = new Date(year, 0, 1);
    const currentYearEnd = new Date(year, 11, 31);

    const [currentYearEarnings, topPerformingCourses] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC(${timeframe}, e."createdAt") as period,
          SUM(e.amount) as earnings,
          SUM(e.commission) as commission,
          SUM(e."platformFee") as platform_fee,
          COUNT(*) as transactions,
          COUNT(DISTINCT p.id) as unique_payments
        FROM "Earning" e
        JOIN "Payment" p ON e."paymentId" = p.id
        WHERE e."instructorId" = ${instructorId}
          AND e."createdAt" >= ${currentYearStart}
          AND e."createdAt" <= ${currentYearEnd}
        GROUP BY DATE_TRUNC(${timeframe}, e."createdAt")
        ORDER BY period ASC
      `,

      prisma.$queryRaw`
        SELECT 
          c.id,
          c.title,
          c.thumbnail,
          c.price,
          SUM(e.commission) as total_earnings,
          COUNT(*) as total_transactions,
          COUNT(DISTINCT en."studentId") as unique_students
        FROM "Earning" e
        JOIN "Payment" p ON e."paymentId" = p.id
        JOIN "Enrollment" en ON p.id = en."paymentId"
        JOIN "Course" c ON en."courseId" = c.id
        WHERE e."instructorId" = ${instructorId}
          AND e."createdAt" >= ${currentYearStart}
          AND e."createdAt" <= ${currentYearEnd}
        GROUP BY c.id, c.title, c.thumbnail, c.price
        ORDER BY total_earnings DESC
        LIMIT 10
      `,
    ]);

    const currentTotal = currentYearEarnings.reduce(
      (sum, item) => sum + parseFloat(item.commission || 0),
      0
    );

    const analyticsData = {
      timeframe,
      year: parseInt(year),
      revenue: {
        current: currentYearEarnings.map((item) => ({
          period: item.period,
          earnings: formatCurrency(parseFloat(item.earnings || 0)),
          commission: formatCurrency(parseFloat(item.commission || 0)),
          platformFee: formatCurrency(parseFloat(item.platform_fee || 0)),
          transactions: parseInt(item.transactions || 0),
          uniquePayments: parseInt(item.unique_payments || 0),
        })),
        previous: [],
      },
      topCourses: topPerformingCourses.map((course) => ({
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        price: formatCurrency(parseFloat(course.price || 0)),
        totalEarnings: formatCurrency(parseFloat(course.total_earnings || 0)),
        totalTransactions: parseInt(course.total_transactions || 0),
        uniqueStudents: parseInt(course.unique_students || 0),
      })),
      geography: [],
      paymentMethods: [],
      summary: {
        totalRevenue: formatCurrency(currentTotal),
        totalTransactions: currentYearEarnings.reduce(
          (sum, item) => sum + parseInt(item.transactions || 0),
          0
        ),
        averageTransactionValue: formatCurrency(
          currentYearEarnings.length > 0
            ? currentTotal /
                currentYearEarnings.reduce(
                  (sum, item) => sum + parseInt(item.transactions || 0),
                  0
                )
            : 0
        ),
        growthRate: 0,
      },
    };

    await redisService.setJSON(cacheKey, analyticsData, { ex: 900 });

    res.status(200).json({
      success: true,
      message: "Revenue analytics retrieved successfully",
      data: analyticsData,
    });
  } catch (error) {
    console.error("Get revenue analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve revenue analytics",
      error: error.message,
    });
  }
});

const getPaymentBreakdown = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const { startDate, endDate, groupBy = "month" } = req.query;

  const cacheKey = `payment_breakdown:${instructorId}:${startDate || ""}:${
    endDate || ""
  }:${groupBy}`;

  try {
    let cachedData = await redisService.getJSON(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Payment breakdown retrieved successfully",
        data: cachedData,
        cached: true,
      });
    }

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = { instructorId };
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    const [
      totalBreakdown,
      statusBreakdown,
      currencyBreakdown,
      commissionAnalysis,
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC(${groupBy}, e."createdAt") as period,
          SUM(e.amount) as gross_earnings,
          SUM(e.commission) as instructor_commission,
          SUM(e."platformFee") as platform_fees,
          COUNT(*) as transaction_count,
          AVG(e.amount) as avg_transaction
        FROM "Earning" e
        WHERE e."instructorId" = ${instructorId}
          ${startDate ? `AND e."createdAt" >= ${new Date(startDate)}` : ""}
          ${endDate ? `AND e."createdAt" <= ${new Date(endDate)}` : ""}
        GROUP BY DATE_TRUNC(${groupBy}, e."createdAt")
        ORDER BY period DESC
      `,

      prisma.earning.groupBy({
        by: ["status"],
        where,
        _sum: {
          amount: true,
          commission: true,
          platformFee: true,
        },
        _count: true,
      }),

      prisma.earning.groupBy({
        by: ["currency"],
        where,
        _sum: {
          amount: true,
          commission: true,
          platformFee: true,
        },
        _count: true,
      }),

      prisma.$queryRaw`
        SELECT 
          i."commissionRate",
          COUNT(*) as transaction_count,
          SUM(e.amount) as total_amount,
          SUM(e.commission) as total_commission,
          AVG(e.commission / e.amount * 100) as avg_commission_rate
        FROM "Earning" e
        JOIN "Instructor" i ON e."instructorId" = i.id
        WHERE e."instructorId" = ${instructorId}
          ${startDate ? `AND e."createdAt" >= ${new Date(startDate)}` : ""}
          ${endDate ? `AND e."createdAt" <= ${new Date(endDate)}` : ""}
        GROUP BY i."commissionRate"
      `,
    ]);

    const breakdownData = {
      timeline: totalBreakdown.map((item) => ({
        period: item.period,
        grossEarnings: formatCurrency(parseFloat(item.gross_earnings || 0)),
        instructorCommission: formatCurrency(
          parseFloat(item.instructor_commission || 0)
        ),
        platformFees: formatCurrency(parseFloat(item.platform_fees || 0)),
        transactionCount: parseInt(item.transaction_count || 0),
        averageTransaction: formatCurrency(
          parseFloat(item.avg_transaction || 0)
        ),
      })),
      byStatus: statusBreakdown.map((item) => ({
        status: item.status,
        amount: formatCurrency(item._sum.amount || 0),
        commission: formatCurrency(item._sum.commission || 0),
        platformFee: formatCurrency(item._sum.platformFee || 0),
        count: item._count,
      })),
      byCurrency: currencyBreakdown.map((item) => ({
        currency: item.currency,
        amount: formatCurrency(item._sum.amount || 0, item.currency),
        commission: formatCurrency(item._sum.commission || 0, item.currency),
        platformFee: formatCurrency(item._sum.platformFee || 0, item.currency),
        count: item._count,
      })),
      commissionAnalysis: commissionAnalysis.map((item) => ({
        commissionRate: parseFloat(item.commissionRate || 0),
        transactionCount: parseInt(item.transaction_count || 0),
        totalAmount: formatCurrency(parseFloat(item.total_amount || 0)),
        totalCommission: formatCurrency(parseFloat(item.total_commission || 0)),
        averageCommissionRate: parseFloat(item.avg_commission_rate || 0),
      })),
      summary: {
        totalGrossEarnings: formatCurrency(
          totalBreakdown.reduce(
            (sum, item) => sum + parseFloat(item.gross_earnings || 0),
            0
          )
        ),
        totalCommission: formatCurrency(
          totalBreakdown.reduce(
            (sum, item) => sum + parseFloat(item.instructor_commission || 0),
            0
          )
        ),
        totalPlatformFees: formatCurrency(
          totalBreakdown.reduce(
            (sum, item) => sum + parseFloat(item.platform_fees || 0),
            0
          )
        ),
        totalTransactions: totalBreakdown.reduce(
          (sum, item) => sum + parseInt(item.transaction_count || 0),
          0
        ),
      },
    };

    await redisService.setJSON(cacheKey, breakdownData, { ex: 600 });

    res.status(200).json({
      success: true,
      message: "Payment breakdown retrieved successfully",
      data: breakdownData,
    });
  } catch (error) {
    console.error("Get payment breakdown error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment breakdown",
      error: error.message,
    });
  }
});

const updatePaymentDetails = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const { paymentDetails } = req.body;

  try {
    if (!paymentDetails || typeof paymentDetails !== "object") {
      return res.status(400).json({
        success: false,
        message: "Valid payment details are required",
      });
    }

    const requiredFields = ["accountType", "accountNumber", "bankName"];
    const missingFields = requiredFields.filter(
      (field) => !paymentDetails[field]
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment details",
        missingFields,
      });
    }

    const updatedInstructor = await prisma.instructor.update({
      where: { id: instructorId },
      data: {
        paymentDetails: {
          ...paymentDetails,
          updatedAt: new Date().toISOString(),
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await notificationService.createNotification({
      userId: updatedInstructor.user.id,
      type: "payment_details_updated",
      title: "Payment Details Updated",
      message: "Your payment details have been successfully updated.",
      data: {
        updatedAt: new Date().toISOString(),
      },
    });

    await redisService.delPattern(`earnings_overview:${instructorId}`);

    res.status(200).json({
      success: true,
      message: "Payment details updated successfully",
      data: {
        paymentDetails: updatedInstructor.paymentDetails,
      },
    });
  } catch (error) {
    console.error("Update payment details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment details",
      error: error.message,
    });
  }
});

const getFinancialDashboard = asyncHandler(async (req, res) => {
  const instructorId = req.instructorProfile.id;
  const cacheKey = `financial_dashboard:${instructorId}`;

  try {
    let cachedData = await redisService.getJSON(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Financial dashboard retrieved successfully",
        data: cachedData,
        cached: true,
      });
    }

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [dashboardData, upcomingPayouts, recentTransactions] =
      await Promise.all([
        prisma.$queryRaw`
        SELECT 
          COALESCE(SUM(CASE WHEN e."createdAt" >= ${last30Days} THEN e.commission ELSE 0 END), 0) as last_30_days_earnings,
          COUNT(CASE WHEN e."createdAt" >= ${last30Days} THEN 1 END) as last_30_days_transactions,
          COALESCE(SUM(CASE WHEN e."createdAt" >= ${last7Days} THEN e.commission ELSE 0 END), 0) as last_7_days_earnings,
          COUNT(DISTINCT en."studentId") as total_students,
          COUNT(DISTINCT c.id) as active_courses,
          COALESCE(AVG(e.commission), 0) as avg_transaction_value,
          COUNT(CASE WHEN e."createdAt" >= ${last30Days} THEN 1 END) as recent_sales
        FROM "Earning" e
        LEFT JOIN "Payment" p ON e."paymentId" = p.id
        LEFT JOIN "Enrollment" en ON p.id = en."paymentId"
        LEFT JOIN "Course" c ON en."courseId" = c.id
        WHERE e."instructorId" = ${instructorId}
      `,

        prisma.payout.findMany({
          where: {
            instructorId,
            status: { in: ["PENDING", "PROCESSING"] },
          },
          orderBy: { requestedAt: "desc" },
          take: 5,
        }),

        prisma.earning.findMany({
          where: { instructorId },
          include: {
            payment: {
              include: {
                enrollments: {
                  include: {
                    course: {
                      select: { title: true, thumbnail: true },
                    },
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

    const stats = dashboardData[0];
    const last30DaysEarnings = parseFloat(stats.last_30_days_earnings || 0);

    const dashboardResponse = {
      quickStats: {
        last30DaysEarnings: formatCurrency(last30DaysEarnings),
        last30DaysEarningsRaw: last30DaysEarnings,
        last30DaysTransactions: parseInt(stats.last_30_days_transactions || 0),
        last7DaysEarnings: formatCurrency(stats.last_7_days_earnings || 0),
        last7DaysEarningsRaw: parseFloat(stats.last_7_days_earnings || 0),
        earningsGrowth: 0,
        transactionGrowth: 0,
        totalStudents: parseInt(stats.total_students || 0),
        activeCourses: parseInt(stats.active_courses || 0),
        averageTransactionValue: formatCurrency(
          stats.avg_transaction_value || 0
        ),
        recentSales: parseInt(stats.recent_sales || 0),
      },
      upcomingPayouts: upcomingPayouts.map((payout) => ({
        id: payout.id,
        amount: formatCurrency(payout.amount, payout.currency),
        currency: payout.currency,
        status: payout.status,
        requestedAt: payout.requestedAt,
        reference: payout.gatewayId,
        estimatedProcessingTime:
          payout.status === "PENDING" ? "2-3 business days" : "Processing",
      })),
      recentActivity: recentTransactions.map((earning) => ({
        id: earning.id,
        amount: formatCurrency(earning.commission),
        course: earning.payment.enrollments[0]?.course || null,
        createdAt: earning.createdAt,
        type: "earning",
      })),
      alerts: [],
    };

    if (upcomingPayouts.length === 0 && last30DaysEarnings > 100) {
      dashboardResponse.alerts.push({
        type: "info",
        message: `You have ${formatCurrency(
          last30DaysEarnings
        )} available for payout. Consider requesting a payout.`,
        action: "request_payout",
      });
    }

    if (parseInt(stats.last_30_days_transactions || 0) === 0) {
      dashboardResponse.alerts.push({
        type: "warning",
        message:
          "No sales in the last 30 days. Consider promoting your courses.",
        action: "view_analytics",
      });
    }

    await redisService.setJSON(cacheKey, dashboardResponse, { ex: 600 });

    res.status(200).json({
      success: true,
      message: "Financial dashboard retrieved successfully",
      data: dashboardResponse,
    });
  } catch (error) {
    console.error("Get financial dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve financial dashboard",
      error: error.message,
    });
  }
});

export {
  getEarningsOverview,
  getEarningsStats,
  getDetailedEarnings,
  getCourseEarnings,
  requestPayout,
  getPayoutHistory,
  getRevenueAnalytics,
  getPaymentBreakdown,
  generateFinancialReport,
  updatePaymentDetails,
  getFinancialDashboard,
};
