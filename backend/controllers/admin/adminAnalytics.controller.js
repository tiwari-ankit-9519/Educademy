import asyncHandler from "express-async-handler";
import redisService from "../../utils/redis.js";
import prisma from "../../utils/prisma.js";

const getDateRange = (period) => {
  const now = new Date();
  let fromDate;

  switch (period) {
    case "7d":
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return fromDate;
};

const calculateGrowthRate = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

const generateAnalyticsId = () => {
  return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculatePercentile = (arr, percentile) => {
  const sorted = arr.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
};

export const getDashboardOverview = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { period = "30d", refresh = "false" } = req.query;
    const cacheKey = `dashboard_overview:${period}`;

    if (refresh !== "true") {
      const cachedData = await redisService.getJSON(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          success: true,
          message: "Dashboard overview retrieved successfully",
          data: cachedData,
          meta: {
            cached: true,
            executionTime: Math.round(performance.now() - startTime),
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    const fromDate = getDateRange(period);
    const previousPeriodDate = new Date(
      fromDate.getTime() - (Date.now() - fromDate.getTime())
    );
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const lastYear = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalCourses,
      totalRevenue,
      totalEnrollments,
      activeUsers,
      recentSignups,
      coursesThisPeriod,
      revenueThisPeriod,
      enrollmentsThisPeriod,
      previousPeriodUsers,
      previousPeriodCourses,
      previousPeriodRevenue,
      previousPeriodEnrollments,
      topInstructors,
      courseStatusDistribution,
      revenueByCategory,
      userGrowthTrend,
      conversionMetrics,
      engagementMetrics,
      systemHealth,
      userRetentionMetrics,
      courseCompletionAnalytics,
      revenueAnalytics,
      instructorPerformanceMetrics,
      studentEngagementPatterns,
      geographicDistribution,
      deviceAnalytics,
      peakUsageAnalytics,
      churnAnalysis,
      customerLifetimeValue,
      supportTicketAnalytics,
      contentPerformanceMetrics,
      moderationStats,
      advancedFinancialMetrics,
      cohortAnalysis,
      courseCategoryPerformance,
      userBehaviorAnalytics,
      marketingMetrics,
      operationalMetrics,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.course.count({
        where: { status: "PUBLISHED" },
      }),

      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),

      prisma.enrollment.count(),

      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.user.count({
        where: { createdAt: { gte: fromDate } },
      }),

      prisma.course.count({
        where: {
          createdAt: { gte: fromDate },
          status: "PUBLISHED",
        },
      }),

      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          createdAt: { gte: fromDate },
        },
      }),

      prisma.enrollment.count({
        where: { createdAt: { gte: fromDate } },
      }),

      prisma.user.count({
        where: {
          createdAt: {
            gte: previousPeriodDate,
            lt: fromDate,
          },
        },
      }),

      prisma.course.count({
        where: {
          createdAt: {
            gte: previousPeriodDate,
            lt: fromDate,
          },
          status: "PUBLISHED",
        },
      }),

      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: previousPeriodDate,
            lt: fromDate,
          },
        },
      }),

      prisma.enrollment.count({
        where: {
          createdAt: {
            gte: previousPeriodDate,
            lt: fromDate,
          },
        },
      }),

      prisma.instructor.findMany({
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          totalRevenue: true,
          totalStudents: true,
          totalCourses: true,
          rating: true,
        },
        orderBy: { totalRevenue: "desc" },
        take: 10,
      }),

      prisma.course.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      prisma.$queryRaw`
        SELECT 
          c.name as category,
          SUM(p.amount) as revenue,
          COUNT(DISTINCT e.id) as enrollments,
          AVG(co."averageRating") as avg_rating,
          COUNT(DISTINCT co.id) as total_courses,
          SUM(co."totalEnrollments") as total_enrollments
        FROM "Payment" p
        JOIN "Enrollment" e ON p.id = e."paymentId"
        JOIN "Course" co ON e."courseId" = co.id
        JOIN "Category" c ON co."categoryId" = c.id
        WHERE p.status = 'COMPLETED'
        AND p."createdAt" >= ${fromDate}
        GROUP BY c.name
        ORDER BY revenue DESC
        LIMIT 15
      `,

      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "createdAt") as date,
          COUNT(*) as users,
          COUNT(CASE WHEN role = 'STUDENT' THEN 1 END) as students,
          COUNT(CASE WHEN role = 'INSTRUCTOR' THEN 1 END) as instructors,
          COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins
        FROM "User"
        WHERE "createdAt" >= ${fromDate}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date
      `,

      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT ci.id) as cart_items,
          COUNT(DISTINCT p.id) as payments_initiated,
          COUNT(DISTINCT CASE WHEN p.status = 'COMPLETED' THEN p.id END) as payments_completed,
          COUNT(DISTINCT e.id) as enrollments_created,
          AVG(p.amount) as avg_payment_amount
        FROM "CartItem" ci
        LEFT JOIN "Payment" p ON ci."studentId" = p.id
        LEFT JOIN "Enrollment" e ON p.id = e."paymentId"
        WHERE ci."createdAt" >= ${fromDate}
      `,

      prisma.$queryRaw`
        SELECT 
          AVG(CASE WHEN lc."lessonId" IS NOT NULL THEN 1 ELSE 0 END) as lesson_completion_rate,
          AVG(CASE WHEN qa."quizId" IS NOT NULL THEN qa.percentage ELSE 0 END) as avg_quiz_score,
          COUNT(DISTINCT r.id) as total_reviews,
          AVG(r.rating) as avg_rating,
          COUNT(DISTINCT n.id) as total_notes,
          COUNT(DISTINCT b.id) as total_bookmarks
        FROM "Enrollment" e
        LEFT JOIN "LessonCompletion" lc ON e."studentId" = lc."studentId"
        LEFT JOIN "QuizAttempt" qa ON e."studentId" = qa."studentId" AND qa.status = 'GRADED'
        LEFT JOIN "Review" r ON e."courseId" = r."courseId"
        LEFT JOIN "Note" n ON e."studentId" = n."userId"
        LEFT JOIN "Bookmark" b ON e."studentId" = b."userId"
        WHERE e."createdAt" >= ${fromDate}
      `,

      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT CASE WHEN s."isActive" = true THEN s.id END) as active_sessions,
          AVG(s."sessionDuration") as avg_session_duration,
          COUNT(DISTINCT CASE WHEN u."lastLogin" >= ${new Date(
            Date.now() - 24 * 60 * 60 * 1000
          )} THEN u.id END) as daily_active_users,
          COUNT(DISTINCT CASE WHEN u."lastLogin" >= ${last7Days} THEN u.id END) as weekly_active_users,
          COUNT(DISTINCT CASE WHEN u."lastLogin" >= ${last30Days} THEN u.id END) as monthly_active_users
        FROM "Session" s
        JOIN "User" u ON s."userId" = u.id
        WHERE s."createdAt" >= ${fromDate}
      `,

      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT CASE WHEN u."lastLogin" >= ${last7Days} THEN u.id END) as active_7d,
          COUNT(DISTINCT CASE WHEN u."lastLogin" >= ${last30Days} THEN u.id END) as active_30d,
          COUNT(DISTINCT CASE WHEN u."lastLogin" >= ${last90Days} THEN u.id END) as active_90d,
          COUNT(DISTINCT CASE WHEN u."createdAt" >= ${last30Days} AND u."lastLogin" >= ${last7Days} THEN u.id END) as new_user_retention_7d,
          COUNT(DISTINCT CASE WHEN u."createdAt" >= ${last90Days} AND u."lastLogin" >= ${last30Days} THEN u.id END) as new_user_retention_30d
        FROM "User" u
        WHERE u."createdAt" <= ${new Date()}
      `,

      prisma.$queryRaw`
        SELECT 
          c.name as category,
          COUNT(DISTINCT e.id) as total_enrollments,
          COUNT(DISTINCT CASE WHEN e.status = 'COMPLETED' THEN e.id END) as completed_enrollments,
          AVG(e.progress) as avg_progress,
          AVG(co."averageRating") as avg_rating,
          COUNT(DISTINCT co.id) as course_count
        FROM "Course" co
        JOIN "Category" c ON co."categoryId" = c.id
        LEFT JOIN "Enrollment" e ON co.id = e."courseId"
        WHERE co.status = 'PUBLISHED'
        GROUP BY c.name
        ORDER BY total_enrollments DESC
      `,

      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('week', p."createdAt") as week,
          SUM(p.amount) as revenue,
          COUNT(DISTINCT p.id) as transaction_count,
          AVG(p.amount) as avg_transaction_value,
          COUNT(DISTINCT e."studentId") as unique_customers
        FROM "Payment" p
        JOIN "Enrollment" e ON p.id = e."paymentId"
        WHERE p.status = 'COMPLETED'
        AND p."createdAt" >= ${last90Days}
        GROUP BY DATE_TRUNC('week', p."createdAt")
        ORDER BY week DESC
        LIMIT 12
      `,

      prisma.$queryRaw`
        SELECT 
          i.id,
          i."totalRevenue",
          i."totalStudents",
          i."totalCourses",
          i."rating",
          AVG(co."averageRating") as avg_course_rating,
          COUNT(DISTINCT r.id) as total_reviews,
          AVG(e.progress) as avg_student_progress,
          COUNT(DISTINCT CASE WHEN e.status = 'COMPLETED' THEN e.id END) as completed_enrollments
        FROM "Instructor" i
        LEFT JOIN "Course" co ON i.id = co."instructorId"
        LEFT JOIN "Enrollment" e ON co.id = e."courseId"
        LEFT JOIN "Review" r ON co.id = r."courseId"
        WHERE co.status = 'PUBLISHED'
        GROUP BY i.id, i."totalRevenue", i."totalStudents", i."totalCourses", i."rating"
        ORDER BY i."totalRevenue" DESC
        LIMIT 15
      `,

      prisma.$queryRaw`
        SELECT 
          EXTRACT(hour FROM ua."createdAt") as hour_of_day,
          COUNT(*) as activity_count,
          COUNT(DISTINCT ua."userId") as unique_users,
          AVG(ua."sessionTime") as avg_session_time
        FROM "UserActivity" ua
        WHERE ua."createdAt" >= ${last30Days}
        GROUP BY EXTRACT(hour FROM ua."createdAt")
        ORDER BY hour_of_day
      `,

      prisma.$queryRaw`
        SELECT 
          u.country,
          COUNT(DISTINCT u.id) as user_count,
          SUM(CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END) as enrollments,
          SUM(p.amount) as revenue
        FROM "User" u
        LEFT JOIN "Student" s ON u.id = s."userId"
        LEFT JOIN "Enrollment" e ON s.id = e."studentId"
        LEFT JOIN "Payment" p ON e."paymentId" = p.id AND p.status = 'COMPLETED'
        WHERE u.country IS NOT NULL
        AND u."createdAt" >= ${fromDate}
        GROUP BY u.country
        ORDER BY user_count DESC
        LIMIT 20
      `,

      prisma.$queryRaw`
        SELECT 
          s."deviceType",
          s."operatingSystem",
          s."browser",
          COUNT(*) as session_count,
          COUNT(DISTINCT s."userId") as unique_users,
          AVG(s."sessionDuration") as avg_duration
        FROM "Session" s
        WHERE s."createdAt" >= ${last30Days}
        AND s."deviceType" IS NOT NULL
        GROUP BY s."deviceType", s."operatingSystem", s."browser"
        ORDER BY session_count DESC
        LIMIT 20
      `,

      prisma.$queryRaw`
        SELECT 
          EXTRACT(hour FROM s."createdAt") as hour,
          EXTRACT(dow FROM s."createdAt") as day_of_week,
          COUNT(*) as session_count,
          COUNT(DISTINCT s."userId") as unique_users
        FROM "Session" s
        WHERE s."createdAt" >= ${last30Days}
        GROUP BY EXTRACT(hour FROM s."createdAt"), EXTRACT(dow FROM s."createdAt")
        ORDER BY session_count DESC
      `,

      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT CASE WHEN u."lastLogin" < ${last30Days} AND u."createdAt" < ${last30Days} THEN u.id END) as churned_users,
          COUNT(DISTINCT CASE WHEN u."lastLogin" >= ${last30Days} THEN u.id END) as active_users,
          COUNT(DISTINCT CASE WHEN u."createdAt" >= ${last30Days} THEN u.id END) as new_users,
          AVG(EXTRACT(days FROM (COALESCE(u."lastLogin", NOW()) - u."createdAt"))) as avg_user_lifespan
        FROM "User" u
        WHERE u.role = 'STUDENT'
      `,

      prisma.$queryRaw`
        SELECT 
          AVG(user_total_spent.total_spent) as avg_clv,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY user_total_spent.total_spent) as median_clv,
          MAX(user_total_spent.total_spent) as max_clv,
          MIN(user_total_spent.total_spent) as min_clv
        FROM (
          SELECT 
            e."studentId",
            SUM(p.amount) as total_spent
          FROM "Enrollment" e
          JOIN "Payment" p ON e."paymentId" = p.id
          WHERE p.status = 'COMPLETED'
          GROUP BY e."studentId"
        ) as user_total_spent
      `,

      prisma.$queryRaw`
        SELECT 
          st.status,
          st.priority,
          st.category,
          COUNT(*) as ticket_count,
          AVG(EXTRACT(days FROM (COALESCE(st."resolvedAt", NOW()) - st."createdAt"))) as avg_resolution_days
        FROM "SupportTicket" st
        WHERE st."createdAt" >= ${fromDate}
        GROUP BY st.status, st.priority, st.category
        ORDER BY ticket_count DESC
      `,

      prisma.$queryRaw`
        SELECT 
          co.id,
          co.title,
          co."totalEnrollments",
          co."averageRating",
          COUNT(DISTINCT lc.id) as lesson_completions,
          COUNT(DISTINCT qa.id) as quiz_attempts,
          AVG(qa.percentage) as avg_quiz_score,
          COUNT(DISTINCT r.id) as review_count
        FROM "Course" co
        LEFT JOIN "Enrollment" e ON co.id = e."courseId"
        LEFT JOIN "Student" s ON e."studentId" = s.id
        LEFT JOIN "LessonCompletion" lc ON s.id = lc."studentId"
        LEFT JOIN "QuizAttempt" qa ON s.id = qa."studentId"
        LEFT JOIN "Review" r ON co.id = r."courseId"
        WHERE co.status = 'PUBLISHED'
        AND co."createdAt" >= ${fromDate}
        GROUP BY co.id, co.title, co."totalEnrollments", co."averageRating"
        ORDER BY co."totalEnrollments" DESC
        LIMIT 20
      `,

      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT cr.id) as total_reports,
          cr."contentType",
          cr.status,
          COUNT(*) as report_count
        FROM "ContentReport" cr
        WHERE cr."createdAt" >= ${fromDate}
        GROUP BY cr."contentType", cr.status
        ORDER BY report_count DESC
      `,

      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', p."createdAt") as month,
          SUM(p.amount) as mrr,
          COUNT(DISTINCT e."studentId") as subscribers,
          SUM(p.amount) / COUNT(DISTINCT e."studentId") as arpu,
          COUNT(DISTINCT p.id) as transactions
        FROM "Payment" p
        JOIN "Enrollment" e ON p.id = e."paymentId"
        WHERE p.status = 'COMPLETED'
        AND p."createdAt" >= ${lastYear}
        GROUP BY DATE_TRUNC('month', p."createdAt")
        ORDER BY month DESC
        LIMIT 12
      `,

      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('week', u."createdAt") as cohort_week,
          COUNT(DISTINCT u.id) as cohort_size,
          COUNT(DISTINCT CASE WHEN u."lastLogin" >= ${last7Days} THEN u.id END) as retained_users,
          (COUNT(DISTINCT CASE WHEN u."lastLogin" >= ${last7Days} THEN u.id END)::float / COUNT(DISTINCT u.id)) * 100 as retention_rate
        FROM "User" u
        WHERE u."createdAt" >= ${last90Days}
        AND u.role = 'STUDENT'
        GROUP BY DATE_TRUNC('week', u."createdAt")
        ORDER BY cohort_week DESC
        LIMIT 12
      `,

      prisma.$queryRaw`
        SELECT 
          c.name as category,
          COUNT(DISTINCT co.id) as course_count,
          AVG(co."averageRating") as avg_rating,
          SUM(co."totalEnrollments") as total_enrollments,
          SUM(co."totalRevenue") as total_revenue,
          AVG(co.price) as avg_price
        FROM "Category" c
        JOIN "Course" co ON c.id = co."categoryId"
        WHERE co.status = 'PUBLISHED'
        GROUP BY c.name
        ORDER BY total_revenue DESC
      `,

      prisma.$queryRaw`
        SELECT 
          ua.action,
          COUNT(*) as action_count,
          COUNT(DISTINCT ua."userId") as unique_users,
          AVG(ua."sessionTime") as avg_session_time
        FROM "UserActivity" ua
        WHERE ua."createdAt" >= ${fromDate}
        GROUP BY ua.action
        ORDER BY action_count DESC
        LIMIT 20
      `,

      prisma.$queryRaw`
        SELECT 
          c.name as source_category,
          COUNT(DISTINCT wi."studentId") as wishlist_adds,
          COUNT(DISTINCT ci."studentId") as cart_adds,
          COUNT(DISTINCT e."studentId") as enrollments,
          (COUNT(DISTINCT e."studentId")::float / NULLIF(COUNT(DISTINCT wi."studentId"), 0)) * 100 as wishlist_conversion,
          (COUNT(DISTINCT e."studentId")::float / NULLIF(COUNT(DISTINCT ci."studentId"), 0)) * 100 as cart_conversion
        FROM "Category" c
        JOIN "Course" co ON c.id = co."categoryId"
        LEFT JOIN "WishlistItem" wi ON co.id = wi."courseId"
        LEFT JOIN "CartItem" ci ON co.id = ci."courseId"
        LEFT JOIN "Enrollment" e ON co.id = e."courseId"
        WHERE co.status = 'PUBLISHED'
        GROUP BY c.name
        ORDER BY enrollments DESC
      `,

      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT CASE WHEN n.type = 'SYSTEM_ANNOUNCEMENT' THEN n.id END) as system_notifications,
          COUNT(DISTINCT CASE WHEN st.status = 'OPEN' THEN st.id END) as open_tickets,
          COUNT(DISTINCT CASE WHEN u."isBanned" = true THEN u.id END) as banned_users,
          COUNT(DISTINCT CASE WHEN s."isActive" = true THEN s.id END) as active_sessions,
          AVG(s."sessionDuration") as avg_session_duration
        FROM "Notification" n
        CROSS JOIN "SupportTicket" st
        CROSS JOIN "User" u
        CROSS JOIN "Session" s
        WHERE n."createdAt" >= ${fromDate}
        AND st."createdAt" >= ${fromDate}
        AND s."isActive" = true
      `,
    ]);

    const safeBigIntToNumber = (value) => {
      if (typeof value === "bigint") {
        return Number(value);
      }
      return value;
    };

    const overview = {
      summary: {
        totalUsers: safeBigIntToNumber(totalUsers),
        totalCourses: safeBigIntToNumber(totalCourses),
        totalRevenue: Number(totalRevenue._sum?.amount || 0),
        totalEnrollments: safeBigIntToNumber(totalEnrollments),
        activeUsers: safeBigIntToNumber(activeUsers),
        growth: {
          users: calculateGrowthRate(
            safeBigIntToNumber(recentSignups),
            safeBigIntToNumber(previousPeriodUsers)
          ),
          courses: calculateGrowthRate(
            safeBigIntToNumber(coursesThisPeriod),
            safeBigIntToNumber(previousPeriodCourses)
          ),
          revenue: calculateGrowthRate(
            Number(revenueThisPeriod._sum?.amount || 0),
            Number(previousPeriodRevenue._sum?.amount || 0)
          ),
          enrollments: calculateGrowthRate(
            safeBigIntToNumber(enrollmentsThisPeriod),
            safeBigIntToNumber(previousPeriodEnrollments)
          ),
        },
      },

      userAnalytics: {
        retention: {
          daily: safeBigIntToNumber(systemHealth[0]?.daily_active_users || 0),
          weekly: safeBigIntToNumber(systemHealth[0]?.weekly_active_users || 0),
          monthly: safeBigIntToNumber(
            systemHealth[0]?.monthly_active_users || 0
          ),
          newUserRetention7d: safeBigIntToNumber(
            userRetentionMetrics[0]?.new_user_retention_7d || 0
          ),
          newUserRetention30d: safeBigIntToNumber(
            userRetentionMetrics[0]?.new_user_retention_30d || 0
          ),
        },
        churn: {
          churned: safeBigIntToNumber(churnAnalysis[0]?.churned_users || 0),
          active: safeBigIntToNumber(churnAnalysis[0]?.active_users || 0),
          churnRate:
            churnAnalysis[0]?.churned_users > 0
              ? (
                  (safeBigIntToNumber(churnAnalysis[0]?.churned_users) /
                    (safeBigIntToNumber(churnAnalysis[0]?.churned_users) +
                      safeBigIntToNumber(churnAnalysis[0]?.active_users))) *
                  100
                ).toFixed(2)
              : 0,
          avgUserLifespan: Number(
            churnAnalysis[0]?.avg_user_lifespan || 0
          ).toFixed(1),
        },
        cohortAnalysis: cohortAnalysis.map((item) => ({
          week: item.cohort_week,
          cohortSize: safeBigIntToNumber(item.cohort_size),
          retainedUsers: safeBigIntToNumber(item.retained_users),
          retentionRate: Number(item.retention_rate || 0).toFixed(2),
        })),
      },

      financialMetrics: {
        clv: {
          average: Number(customerLifetimeValue[0]?.avg_clv || 0).toFixed(2),
          median: Number(customerLifetimeValue[0]?.median_clv || 0).toFixed(2),
          max: Number(customerLifetimeValue[0]?.max_clv || 0).toFixed(2),
          min: Number(customerLifetimeValue[0]?.min_clv || 0).toFixed(2),
        },
        revenueAnalytics: revenueAnalytics.map((item) => ({
          week: item.week,
          revenue: Number(item.revenue || 0),
          transactionCount: safeBigIntToNumber(item.transaction_count || 0),
          avgTransactionValue: Number(item.avg_transaction_value || 0).toFixed(
            2
          ),
          uniqueCustomers: safeBigIntToNumber(item.unique_customers || 0),
        })),
        monthlyMetrics: advancedFinancialMetrics.map((item) => ({
          month: item.month,
          mrr: Number(item.mrr || 0),
          subscribers: safeBigIntToNumber(item.subscribers || 0),
          arpu: Number(item.arpu || 0).toFixed(2),
          transactions: safeBigIntToNumber(item.transactions || 0),
        })),
      },

      topInstructors: topInstructors.map((instructor) => ({
        id: instructor.id,
        name: `${instructor.user.firstName} ${instructor.user.lastName}`,
        profileImage: instructor.user.profileImage,
        totalRevenue: Number(instructor.totalRevenue || 0),
        totalStudents: safeBigIntToNumber(instructor.totalStudents || 0),
        totalCourses: safeBigIntToNumber(instructor.totalCourses || 0),
        rating: Number(instructor.rating || 0).toFixed(1),
        revenuePerStudent:
          instructor.totalStudents > 0
            ? (
                Number(instructor.totalRevenue || 0) /
                safeBigIntToNumber(instructor.totalStudents)
              ).toFixed(2)
            : 0,
      })),

      instructorPerformance: instructorPerformanceMetrics.map((item) => ({
        id: item.id,
        totalRevenue: Number(item.totalRevenue || 0),
        totalStudents: safeBigIntToNumber(item.totalStudents || 0),
        totalCourses: safeBigIntToNumber(item.totalCourses || 0),
        rating: Number(item.rating || 0).toFixed(1),
        avgCourseRating: Number(item.avg_course_rating || 0).toFixed(1),
        totalReviews: safeBigIntToNumber(item.total_reviews || 0),
        avgStudentProgress: Number(item.avg_student_progress || 0).toFixed(1),
        completedEnrollments: safeBigIntToNumber(
          item.completed_enrollments || 0
        ),
      })),

      courseAnalytics: {
        statusDistribution: courseStatusDistribution.map((item) => ({
          status: item.status,
          count: safeBigIntToNumber(item._count.status),
          percentage:
            totalCourses > 0
              ? (
                  (safeBigIntToNumber(item._count.status) /
                    safeBigIntToNumber(totalCourses)) *
                  100
                ).toFixed(1)
              : 0,
        })),
        categoryPerformance: courseCategoryPerformance.map((item) => ({
          category: item.category,
          courseCount: safeBigIntToNumber(item.course_count || 0),
          avgRating: Number(item.avg_rating || 0).toFixed(1),
          totalEnrollments: safeBigIntToNumber(item.total_enrollments || 0),
          totalRevenue: Number(item.total_revenue || 0),
          avgPrice: Number(item.avg_price || 0).toFixed(2),
        })),
        completionAnalytics: courseCompletionAnalytics.map((item) => ({
          category: item.category,
          totalEnrollments: safeBigIntToNumber(item.total_enrollments || 0),
          completedEnrollments: safeBigIntToNumber(
            item.completed_enrollments || 0
          ),
          completionRate:
            item.total_enrollments > 0
              ? (
                  (safeBigIntToNumber(item.completed_enrollments || 0) /
                    safeBigIntToNumber(item.total_enrollments)) *
                  100
                ).toFixed(2)
              : 0,
          avgProgress: Number(item.avg_progress || 0).toFixed(1),
          avgRating: Number(item.avg_rating || 0).toFixed(1),
          courseCount: safeBigIntToNumber(item.course_count || 0),
        })),
        topPerforming: contentPerformanceMetrics.map((item) => ({
          id: item.id,
          title: item.title,
          totalEnrollments: safeBigIntToNumber(item.totalEnrollments || 0),
          averageRating: Number(item.averageRating || 0).toFixed(1),
          lessonCompletions: safeBigIntToNumber(item.lesson_completions || 0),
          quizAttempts: safeBigIntToNumber(item.quiz_attempts || 0),
          avgQuizScore: Number(item.avg_quiz_score || 0).toFixed(1),
          reviewCount: safeBigIntToNumber(item.review_count || 0),
        })),
      },

      revenueByCategory: revenueByCategory.map((item) => ({
        category: item.category,
        revenue: Number(item.revenue || 0),
        enrollments: safeBigIntToNumber(item.enrollments || 0),
        avgRating: Number(item.avg_rating || 0).toFixed(1),
        totalCourses: safeBigIntToNumber(item.total_courses || 0),
        totalEnrollments: safeBigIntToNumber(item.total_enrollments || 0),
        avgRevenuePerEnrollment:
          Number(item.enrollments) > 0
            ? (
                Number(item.revenue || 0) / safeBigIntToNumber(item.enrollments)
              ).toFixed(2)
            : 0,
      })),

      userGrowthTrend: userGrowthTrend.map((item) => ({
        date: item.date,
        totalUsers: safeBigIntToNumber(item.users || 0),
        students: safeBigIntToNumber(item.students || 0),
        instructors: safeBigIntToNumber(item.instructors || 0),
        admins: safeBigIntToNumber(item.admins || 0),
      })),

      conversionFunnel: {
        cartToPayment:
          conversionMetrics[0]?.cart_items > 0
            ? (
                (safeBigIntToNumber(
                  conversionMetrics[0]?.payments_initiated || 0
                ) /
                  safeBigIntToNumber(conversionMetrics[0]?.cart_items)) *
                100
              ).toFixed(2)
            : 0,
        paymentToCompletion:
          conversionMetrics[0]?.payments_initiated > 0
            ? (
                (safeBigIntToNumber(
                  conversionMetrics[0]?.payments_completed || 0
                ) /
                  safeBigIntToNumber(
                    conversionMetrics[0]?.payments_initiated
                  )) *
                100
              ).toFixed(2)
            : 0,
        overallConversion:
          conversionMetrics[0]?.cart_items > 0
            ? (
                (safeBigIntToNumber(
                  conversionMetrics[0]?.enrollments_created || 0
                ) /
                  safeBigIntToNumber(conversionMetrics[0]?.cart_items)) *
                100
              ).toFixed(2)
            : 0,
        avgPaymentAmount: Number(
          conversionMetrics[0]?.avg_payment_amount || 0
        ).toFixed(2),
      },

      engagement: {
        lessonCompletionRate: Number(
          engagementMetrics[0]?.lesson_completion_rate || 0
        ).toFixed(2),
        avgQuizScore: Number(engagementMetrics[0]?.avg_quiz_score || 0).toFixed(
          1
        ),
        totalReviews: safeBigIntToNumber(
          engagementMetrics[0]?.total_reviews || 0
        ),
        avgRating: Number(engagementMetrics[0]?.avg_rating || 0).toFixed(1),
        totalNotes: safeBigIntToNumber(engagementMetrics[0]?.total_notes || 0),
        totalBookmarks: safeBigIntToNumber(
          engagementMetrics[0]?.total_bookmarks || 0
        ),
        behaviorAnalytics: userBehaviorAnalytics.map((item) => ({
          action: item.action,
          count: safeBigIntToNumber(item.action_count || 0),
          uniqueUsers: safeBigIntToNumber(item.unique_users || 0),
          avgSessionTime: Number(item.avg_session_time || 0).toFixed(1),
        })),
      },

      systemHealth: {
        activeSessions: safeBigIntToNumber(
          systemHealth[0]?.active_sessions || 0
        ),
        avgSessionDuration: Math.round(
          Number(systemHealth[0]?.avg_session_duration || 0) / 60
        ),
        dailyActiveUsers: safeBigIntToNumber(
          systemHealth[0]?.daily_active_users || 0
        ),
        weeklyActiveUsers: safeBigIntToNumber(
          systemHealth[0]?.weekly_active_users || 0
        ),
        monthlyActiveUsers: safeBigIntToNumber(
          systemHealth[0]?.monthly_active_users || 0
        ),
      },

      geographicAnalytics: {
        distribution: geographicDistribution.map((item) => ({
          country: item.country,
          userCount: safeBigIntToNumber(item.user_count || 0),
          enrollments: safeBigIntToNumber(item.enrollments || 0),
          revenue: Number(item.revenue || 0),
        })),
      },

      deviceAnalytics: deviceAnalytics.map((item) => ({
        deviceType: item.deviceType,
        operatingSystem: item.operatingSystem,
        browser: item.browser,
        sessionCount: safeBigIntToNumber(item.session_count || 0),
        uniqueUsers: safeBigIntToNumber(item.unique_users || 0),
        avgDuration: Number(item.avg_duration || 0).toFixed(1),
      })),

      usagePatterns: {
        hourlyActivity: studentEngagementPatterns.map((item) => ({
          hour: Number(item.hour_of_day || 0),
          activityCount: safeBigIntToNumber(item.activity_count || 0),
          uniqueUsers: safeBigIntToNumber(item.unique_users || 0),
          avgSessionTime: Number(item.avg_session_time || 0).toFixed(1),
        })),
        peakUsage: peakUsageAnalytics.map((item) => ({
          hour: Number(item.hour || 0),
          dayOfWeek: Number(item.day_of_week || 0),
          sessionCount: safeBigIntToNumber(item.session_count || 0),
          uniqueUsers: safeBigIntToNumber(item.unique_users || 0),
        })),
      },

      supportAnalytics: {
        ticketStats: supportTicketAnalytics.map((item) => ({
          status: item.status,
          priority: item.priority,
          category: item.category,
          count: safeBigIntToNumber(item.ticket_count || 0),
          avgResolutionDays: Number(item.avg_resolution_days || 0).toFixed(1),
        })),
      },

      moderationStats: moderationStats.map((item) => ({
        contentType: item.contentType,
        status: item.status,
        reportCount: safeBigIntToNumber(item.report_count || 0),
      })),

      marketingMetrics: marketingMetrics.map((item) => ({
        category: item.source_category,
        wishlistAdds: safeBigIntToNumber(item.wishlist_adds || 0),
        cartAdds: safeBigIntToNumber(item.cart_adds || 0),
        enrollments: safeBigIntToNumber(item.enrollments || 0),
        wishlistConversion: Number(item.wishlist_conversion || 0).toFixed(2),
        cartConversion: Number(item.cart_conversion || 0).toFixed(2),
      })),

      operationalMetrics: {
        systemNotifications: safeBigIntToNumber(
          operationalMetrics[0]?.system_notifications || 0
        ),
        openTickets: safeBigIntToNumber(
          operationalMetrics[0]?.open_tickets || 0
        ),
        bannedUsers: safeBigIntToNumber(
          operationalMetrics[0]?.banned_users || 0
        ),
        activeSessions: safeBigIntToNumber(
          operationalMetrics[0]?.active_sessions || 0
        ),
        avgSessionDuration: Math.round(
          Number(operationalMetrics[0]?.avg_session_duration || 0) / 60
        ),
      },

      period,
      lastUpdated: new Date().toISOString(),
    };

    await redisService.setJSON(cacheKey, overview, { ex: 1800 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Enhanced dashboard overview retrieved successfully",
      data: overview,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard overview",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const getUserAnalytics = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { period = "30d", groupBy = "day", segment = "all" } = req.query;

    const cacheKey = `user_analytics:${period}:${groupBy}:${segment}`;
    const cachedData = await redisService.getJSON(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "User analytics retrieved successfully",
        data: cachedData,
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const fromDate = getDateRange(period);
    const validGroupBy = ["day", "week", "month", "year"].includes(groupBy)
      ? groupBy
      : "day";

    let userGrowthQuery;
    switch (validGroupBy) {
      case "day":
        userGrowthQuery = prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('day', "createdAt") as date,
            COUNT(*)::int as count,
            COUNT(CASE WHEN role = 'STUDENT' THEN 1 END)::int as students,
            COUNT(CASE WHEN role = 'INSTRUCTOR' THEN 1 END)::int as instructors,
            COUNT(CASE WHEN role = 'ADMIN' THEN 1 END)::int as admins,
            COUNT(CASE WHEN "isVerified" = true THEN 1 END)::int as verified_users
          FROM "User"
          WHERE "createdAt" >= ${fromDate}
          GROUP BY DATE_TRUNC('day', "createdAt")
          ORDER BY date
        `;
        break;
      default:
        userGrowthQuery = prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('${validGroupBy}', "createdAt") as date,
            COUNT(*)::int as count,
            COUNT(CASE WHEN role = 'STUDENT' THEN 1 END)::int as students,
            COUNT(CASE WHEN role = 'INSTRUCTOR' THEN 1 END)::int as instructors,
            COUNT(CASE WHEN role = 'ADMIN' THEN 1 END)::int as admins,
            COUNT(CASE WHEN "isVerified" = true THEN 1 END)::int as verified_users
          FROM "User"
          WHERE "createdAt" >= ${fromDate}
          GROUP BY DATE_TRUNC('${validGroupBy}', "createdAt")
          ORDER BY date
        `;
    }

    const [
      userGrowth,
      userLifecycle,
      geographicDistribution,
      userEngagement,
      cohortAnalysis,
      userSegmentation,
      retentionAnalysis,
      acquisitionChannels,
      userJourney,
      churnAnalysis,
    ] = await Promise.all([
      userGrowthQuery,

      prisma.$queryRaw`
        SELECT 
          u.id,
          u."createdAt" as signup_date,
          MIN(e."createdAt") as first_enrollment,
          MAX(e."createdAt") as last_enrollment,
          COUNT(e.id) as total_enrollments,
          SUM(p.amount) as total_spent,
          MAX(u."lastLogin") as last_activity,
          EXTRACT(EPOCH FROM (MIN(e."createdAt") - u."createdAt")) / 86400 as days_to_first_purchase
        FROM "User" u
        LEFT JOIN "Student" s ON u.id = s."userId"
        LEFT JOIN "Enrollment" e ON s.id = e."studentId"
        LEFT JOIN "Payment" p ON e."paymentId" = p.id AND p.status = 'COMPLETED'
        WHERE u."createdAt" >= ${fromDate}
        AND u.role = 'STUDENT'
        GROUP BY u.id, u."createdAt"
        ORDER BY u."createdAt"
      `,

      prisma.$queryRaw`
        SELECT 
          country,
          COUNT(*) as user_count,
          COUNT(CASE WHEN role = 'STUDENT' THEN 1 END) as students,
          COUNT(CASE WHEN role = 'INSTRUCTOR' THEN 1 END) as instructors,
          AVG(CASE WHEN role = 'STUDENT' THEN (
            SELECT COUNT(*) FROM "Student" st 
            JOIN "Enrollment" en ON st.id = en."studentId" 
            WHERE st."userId" = "User".id
          ) END) as avg_enrollments_per_student
        FROM "User"
        WHERE "createdAt" >= ${fromDate}
        AND country IS NOT NULL
        GROUP BY country
        ORDER BY user_count DESC
        LIMIT 20
      `,

      prisma.$queryRaw`
        SELECT 
          u.role,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT s.id) as active_sessions,
          AVG(s."sessionDuration") as avg_session_duration,
          COUNT(DISTINCT ua.id) as total_activities,
          COUNT(DISTINCT CASE WHEN ua."createdAt" >= ${new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          )} THEN u.id END) as weekly_active
        FROM "User" u
        LEFT JOIN "Session" s ON u.id = s."userId" AND s."createdAt" >= ${fromDate}
        LEFT JOIN "UserActivity" ua ON u.id = ua."userId" AND ua."createdAt" >= ${fromDate}
        WHERE u."createdAt" >= ${fromDate}
        GROUP BY u.role
      `,

      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as cohort_month,
          COUNT(*) as cohort_size,
          COUNT(CASE WHEN "lastLogin" >= ${new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          )} THEN 1 END) as active_users,
          AVG(CASE WHEN role = 'STUDENT' THEN (
            SELECT COUNT(*) FROM "Student" st 
            JOIN "Enrollment" en ON st.id = en."studentId" 
            WHERE st."userId" = "User".id
          ) END) as avg_enrollments
        FROM "User"
        WHERE "createdAt" >= ${fromDate}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY cohort_month
      `,

      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN enrollment_count = 0 THEN 'Inactive'
            WHEN enrollment_count = 1 THEN 'New Learner'
            WHEN enrollment_count BETWEEN 2 AND 5 THEN 'Regular Learner'
            WHEN enrollment_count > 5 THEN 'Power Learner'
          END as segment,
          COUNT(*) as user_count,
          AVG(total_spent) as avg_spending,
          AVG(avg_progress) as avg_progress
        FROM (
          SELECT 
            u.id,
            COUNT(e.id) as enrollment_count,
            COALESCE(SUM(p.amount), 0) as total_spent,
            COALESCE(AVG(e.progress), 0) as avg_progress
          FROM "User" u
          LEFT JOIN "Student" s ON u.id = s."userId"
          LEFT JOIN "Enrollment" e ON s.id = e."studentId"
          LEFT JOIN "Payment" p ON e."paymentId" = p.id AND p.status = 'COMPLETED'
          WHERE u.role = 'STUDENT'
          AND u."createdAt" >= ${fromDate}
          GROUP BY u.id
        ) user_stats
        GROUP BY segment
      `,

      prisma.$queryRaw`
        SELECT 
          signup_week,
          cohort_size,
          week_1_retention,
          week_4_retention,
          week_12_retention
        FROM (
          SELECT 
            DATE_TRUNC('week', u."createdAt") as signup_week,
            COUNT(u.id) as cohort_size,
            COUNT(CASE WHEN u."lastLogin" >= u."createdAt" + INTERVAL '1 week' THEN 1 END)::float / COUNT(u.id) * 100 as week_1_retention,
            COUNT(CASE WHEN u."lastLogin" >= u."createdAt" + INTERVAL '4 weeks' THEN 1 END)::float / COUNT(u.id) * 100 as week_4_retention,
            COUNT(CASE WHEN u."lastLogin" >= u."createdAt" + INTERVAL '12 weeks' THEN 1 END)::float / COUNT(u.id) * 100 as week_12_retention
          FROM "User" u
          WHERE u."createdAt" >= ${fromDate}
          AND u.role = 'STUDENT'
          GROUP BY DATE_TRUNC('week', u."createdAt")
          HAVING COUNT(u.id) >= 10
        ) retention_data
        ORDER BY signup_week
      `,

      prisma.enrollment.groupBy({
        by: ["enrollmentSource"],
        _count: { enrollmentSource: true },
        where: {
          createdAt: { gte: fromDate },
          enrollmentSource: { not: null },
        },
        orderBy: { _count: { enrollmentSource: "desc" } },
      }),

      prisma.$queryRaw`
        SELECT 
          stage,
          COUNT(*) as count,
          AVG(days_between) as avg_days
        FROM (
          SELECT 
            'signup_to_first_login' as stage,
            EXTRACT(EPOCH FROM ("lastLogin" - "createdAt")) / 86400 as days_between
          FROM "User"
          WHERE "createdAt" >= ${fromDate}
          AND "lastLogin" IS NOT NULL
          
          UNION ALL
          
          SELECT 
            'signup_to_first_enrollment' as stage,
            EXTRACT(EPOCH FROM (e."createdAt" - u."createdAt")) / 86400 as days_between
          FROM "User" u
          JOIN "Student" s ON u.id = s."userId"
          JOIN "Enrollment" e ON s.id = e."studentId"
          WHERE u."createdAt" >= ${fromDate}
          AND u.role = 'STUDENT'
        ) journey_data
        GROUP BY stage
      `,

      prisma.$queryRaw`
        SELECT 
          churn_risk,
          COUNT(*) as user_count,
          AVG(days_inactive) as avg_days_inactive
        FROM (
          SELECT 
            u.id,
            EXTRACT(EPOCH FROM (NOW() - COALESCE(u."lastLogin", u."createdAt"))) / 86400 as days_inactive,
            CASE 
              WHEN EXTRACT(EPOCH FROM (NOW() - COALESCE(u."lastLogin", u."createdAt"))) / 86400 > 90 THEN 'High'
              WHEN EXTRACT(EPOCH FROM (NOW() - COALESCE(u."lastLogin", u."createdAt"))) / 86400 > 30 THEN 'Medium'
              ELSE 'Low'
            END as churn_risk
          FROM "User" u
          WHERE u."createdAt" >= ${fromDate}
          AND u.role = 'STUDENT'
        ) churn_data
        GROUP BY churn_risk
      `,
    ]);

    const analytics = {
      growth: userGrowth.map((item) => ({
        date: item.date,
        total: Number(item.count),
        students: Number(item.students),
        instructors: Number(item.instructors),
        admins: Number(item.admins),
        verifiedUsers: Number(item.verified_users),
      })),
      lifecycle: {
        averageDaysToFirstPurchase:
          userLifecycle.length > 0
            ? userLifecycle
                .filter((u) => u.days_to_first_purchase !== null)
                .reduce((sum, u) => sum + Number(u.days_to_first_purchase), 0) /
              userLifecycle.filter((u) => u.days_to_first_purchase !== null)
                .length
            : 0,
        conversionRate:
          userLifecycle.length > 0
            ? (
                (userLifecycle.filter((u) => u.total_enrollments > 0).length /
                  userLifecycle.length) *
                100
              ).toFixed(2)
            : 0,
        averageEnrollmentsPerUser:
          userLifecycle.length > 0
            ? (
                userLifecycle.reduce(
                  (sum, u) => sum + Number(u.total_enrollments),
                  0
                ) / userLifecycle.length
              ).toFixed(2)
            : 0,
        averageSpendingPerUser:
          userLifecycle.length > 0
            ? (
                userLifecycle.reduce(
                  (sum, u) => sum + Number(u.total_spent || 0),
                  0
                ) / userLifecycle.length
              ).toFixed(2)
            : 0,
      },
      geographic: geographicDistribution.map((item) => ({
        country: item.country,
        totalUsers: Number(item.user_count),
        students: Number(item.students),
        instructors: Number(item.instructors),
        avgEnrollmentsPerStudent: Number(
          item.avg_enrollments_per_student || 0
        ).toFixed(2),
      })),
      engagement: userEngagement.map((item) => ({
        role: item.role,
        totalUsers: Number(item.total_users),
        activeSessions: Number(item.active_sessions),
        avgSessionDuration: Math.round(
          Number(item.avg_session_duration || 0) / 60
        ),
        totalActivities: Number(item.total_activities),
        weeklyActiveUsers: Number(item.weekly_active),
        engagementRate:
          Number(item.total_users) > 0
            ? (
                (Number(item.weekly_active) / Number(item.total_users)) *
                100
              ).toFixed(2)
            : 0,
      })),
      cohorts: cohortAnalysis.map((item) => ({
        cohortMonth: item.cohort_month,
        cohortSize: Number(item.cohort_size),
        activeUsers: Number(item.active_users),
        retentionRate:
          Number(item.cohort_size) > 0
            ? (
                (Number(item.active_users) / Number(item.cohort_size)) *
                100
              ).toFixed(2)
            : 0,
        avgEnrollments: Number(item.avg_enrollments || 0).toFixed(2),
      })),
      segmentation: userSegmentation.map((item) => ({
        segment: item.segment,
        userCount: Number(item.user_count),
        avgSpending: Number(item.avg_spending || 0).toFixed(2),
        avgProgress: Number(item.avg_progress || 0).toFixed(2),
      })),
      retention: retentionAnalysis.map((item) => ({
        cohortWeek: item.signup_week,
        cohortSize: Number(item.cohort_size),
        week1Retention: Number(item.week_1_retention || 0).toFixed(2),
        week4Retention: Number(item.week_4_retention || 0).toFixed(2),
        week12Retention: Number(item.week_12_retention || 0).toFixed(2),
      })),
      acquisition: acquisitionChannels.map((item) => ({
        source: item.enrollmentSource,
        count: item._count.enrollmentSource,
      })),
      journey: userJourney.map((item) => ({
        stage: item.stage,
        userCount: Number(item.count),
        averageDays: Number(item.avg_days || 0).toFixed(1),
      })),
      churnAnalysis: churnAnalysis.map((item) => ({
        risk: item.churn_risk,
        userCount: Number(item.user_count),
        avgDaysInactive: Number(item.avg_days_inactive || 0).toFixed(1),
      })),
      period,
      groupBy: validGroupBy,
      segment,
      lastUpdated: new Date().toISOString(),
    };

    await redisService.setJSON(cacheKey, analytics, { ex: 3600 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "User analytics retrieved successfully",
      data: analytics,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("User analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user analytics",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const getCourseAnalytics = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { period = "30d", groupBy = "day", categoryId = null } = req.query;

    const cacheKey = `course_analytics:${period}:${groupBy}:${categoryId}`;
    const cachedData = await redisService.getJSON(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Course analytics retrieved successfully",
        data: cachedData,
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const fromDate = getDateRange(period);
    const validGroupBy = ["day", "week", "month", "year"].includes(groupBy)
      ? groupBy
      : "day";

    let coursePerformanceQuery;
    if (categoryId) {
      coursePerformanceQuery = prisma.$queryRaw`
        SELECT 
          c.id,
          c.title,
          c.level,
          c.price,
          c."averageRating",
          c."totalEnrollments",
          c."totalRevenue",
          c."completionRate",
          cat.name as category,
          u."firstName" || ' ' || u."lastName" as instructor_name,
          COUNT(r.id) as review_count,
          AVG(r.rating) as avg_review_rating,
          COUNT(DISTINCT e.id) as unique_enrollments,
          AVG(e.progress) as avg_progress
        FROM "Course" c
        JOIN "Category" cat ON c."categoryId" = cat.id
        JOIN "Instructor" i ON c."instructorId" = i.id
        JOIN "User" u ON i."userId" = u.id
        LEFT JOIN "Review" r ON c.id = r."courseId"
        LEFT JOIN "Enrollment" e ON c.id = e."courseId"
        WHERE c."createdAt" >= ${fromDate}
        AND c."categoryId" = ${categoryId}
        GROUP BY c.id, cat.name, u."firstName", u."lastName"
        ORDER BY c."totalRevenue" DESC
        LIMIT 50
      `;
    } else {
      coursePerformanceQuery = prisma.$queryRaw`
        SELECT 
          c.id,
          c.title,
          c.level,
          c.price,
          c."averageRating",
          c."totalEnrollments",
          c."totalRevenue",
          c."completionRate",
          cat.name as category,
          u."firstName" || ' ' || u."lastName" as instructor_name,
          COUNT(r.id) as review_count,
          AVG(r.rating) as avg_review_rating,
          COUNT(DISTINCT e.id) as unique_enrollments,
          AVG(e.progress) as avg_progress
        FROM "Course" c
        JOIN "Category" cat ON c."categoryId" = cat.id
        JOIN "Instructor" i ON c."instructorId" = i.id
        JOIN "User" u ON i."userId" = u.id
        LEFT JOIN "Review" r ON c.id = r."courseId"
        LEFT JOIN "Enrollment" e ON c.id = e."courseId"
        WHERE c."createdAt" >= ${fromDate}
        GROUP BY c.id, cat.name, u."firstName", u."lastName"
        ORDER BY c."totalRevenue" DESC
        LIMIT 50
      `;
    }

    const [
      coursePerformance,
      categoryAnalysis,
      instructorPerformance,
      contentAnalysis,
      pricingAnalysis,
      completionFunnel,
      difficultyAnalysis,
      seasonalTrends,
      competitiveAnalysis,
      courseFeedback,
    ] = await Promise.all([
      coursePerformanceQuery,

      prisma.$queryRaw`
        SELECT 
          cat.name as category,
          COUNT(c.id) as course_count,
          AVG(c.price) as avg_price,
          SUM(c."totalEnrollments") as total_enrollments,
          SUM(c."totalRevenue") as total_revenue,
          AVG(c."averageRating") as avg_rating,
          AVG(c."completionRate") as avg_completion_rate
        FROM "Course" c
        JOIN "Category" cat ON c."categoryId" = cat.id
        WHERE c."createdAt" >= ${fromDate}
        AND c.status = 'PUBLISHED'
        GROUP BY cat.name
        ORDER BY total_revenue DESC
      `,

      prisma.$queryRaw`
        SELECT 
          i.id,
          u."firstName" || ' ' || u."lastName" as instructor_name,
          COUNT(c.id) as course_count,
          SUM(c."totalEnrollments") as total_enrollments,
          SUM(c."totalRevenue") as total_revenue,
          AVG(c."averageRating") as avg_rating,
          AVG(c."completionRate") as avg_completion_rate,
          i.rating as instructor_rating
        FROM "Instructor" i
        JOIN "User" u ON i."userId" = u.id
        JOIN "Course" c ON i.id = c."instructorId"
        WHERE c."createdAt" >= ${fromDate}
        AND c.status = 'PUBLISHED'
        GROUP BY i.id, u."firstName", u."lastName", i.rating
        ORDER BY total_revenue DESC
        LIMIT 20
      `,

      prisma.$queryRaw`
        SELECT 
          c.id,
          c.title,
          c."totalLessons",
          c."totalQuizzes",
          c."totalAssignments",
          COUNT(DISTINCT l.id) as actual_lessons,
          COUNT(DISTINCT q.id) as actual_quizzes,
          COUNT(DISTINCT a.id) as actual_assignments,
          AVG(l.duration) as avg_lesson_duration,
          COUNT(DISTINCT lc.id) as lesson_completions,
          AVG(qa.percentage) as avg_quiz_score
        FROM "Course" c
        LEFT JOIN "Section" s ON c.id = s."courseId"
        LEFT JOIN "Lesson" l ON s.id = l."sectionId"
        LEFT JOIN "Quiz" q ON s.id = q."sectionId"
        LEFT JOIN "Assignment" a ON s.id = a."sectionId"
        LEFT JOIN "LessonCompletion" lc ON l.id = lc."lessonId"
        LEFT JOIN "QuizAttempt" qa ON q.id = qa."quizId" AND qa.status = 'GRADED'
        WHERE c."createdAt" >= ${fromDate}
        AND c.status = 'PUBLISHED'
        GROUP BY c.id, c.title, c."totalLessons", c."totalQuizzes", c."totalAssignments"
        ORDER BY c."totalEnrollments" DESC
        LIMIT 30
      `,

      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN price < 1000 THEN 'Under ₹1000'
            WHEN price BETWEEN 1000 AND 5000 THEN '₹1000-₹5000'
            WHEN price BETWEEN 5000 AND 15000 THEN '₹5000-₹15000'
            WHEN price > 15000 THEN 'Above ₹15000'
          END as price_range,
          COUNT(*) as course_count,
          AVG("totalEnrollments") as avg_enrollments,
          AVG("averageRating") as avg_rating,
          SUM("totalRevenue") as total_revenue
        FROM "Course"
        WHERE "createdAt" >= ${fromDate}
        AND status = 'PUBLISHED'
        GROUP BY 
          CASE 
            WHEN price < 1000 THEN 'Under ₹1000'
            WHEN price BETWEEN 1000 AND 5000 THEN '₹1000-₹5000'
            WHEN price BETWEEN 5000 AND 15000 THEN '₹5000-₹15000'
            WHEN price > 15000 THEN 'Above ₹15000'
          END
        ORDER BY 
          CASE 
            WHEN CASE 
              WHEN price < 1000 THEN 'Under ₹1000'
              WHEN price BETWEEN 1000 AND 5000 THEN '₹1000-₹5000'
              WHEN price BETWEEN 5000 AND 15000 THEN '₹5000-₹15000'
              WHEN price > 15000 THEN 'Above ₹15000'
            END = 'Under ₹1000' THEN 1
            WHEN CASE 
              WHEN price < 1000 THEN 'Under ₹1000'
              WHEN price BETWEEN 1000 AND 5000 THEN '₹1000-₹5000'
              WHEN price BETWEEN 5000 AND 15000 THEN '₹5000-₹15000'
              WHEN price > 15000 THEN 'Above ₹15000'
            END = '₹1000-₹5000' THEN 2
            WHEN CASE 
              WHEN price < 1000 THEN 'Under ₹1000'
              WHEN price BETWEEN 1000 AND 5000 THEN '₹1000-₹5000'
              WHEN price BETWEEN 5000 AND 15000 THEN '₹5000-₹15000'
              WHEN price > 15000 THEN 'Above ₹15000'
            END = '₹5000-₹15000' THEN 3
            WHEN CASE 
              WHEN price < 1000 THEN 'Under ₹1000'
              WHEN price BETWEEN 1000 AND 5000 THEN '₹1000-₹5000'
              WHEN price BETWEEN 5000 AND 15000 THEN '₹5000-₹15000'
              WHEN price > 15000 THEN 'Above ₹15000'
            END = 'Above ₹15000' THEN 4
          END
      `,

      prisma.$queryRaw`
        SELECT 
          c.id,
          c.title,
          COUNT(DISTINCT e.id) as enrollments,
          COUNT(DISTINCT CASE WHEN e.progress > 0 THEN e.id END) as started,
          COUNT(DISTINCT CASE WHEN e.progress >= 25 THEN e.id END) as quarter_complete,
          COUNT(DISTINCT CASE WHEN e.progress >= 50 THEN e.id END) as half_complete,
          COUNT(DISTINCT CASE WHEN e.progress >= 75 THEN e.id END) as three_quarter_complete,
          COUNT(DISTINCT CASE WHEN e.status = 'COMPLETED' THEN e.id END) as completed
        FROM "Course" c
        LEFT JOIN "Enrollment" e ON c.id = e."courseId"
        WHERE c."createdAt" >= ${fromDate}
        AND c.status = 'PUBLISHED'
        GROUP BY c.id, c.title
        HAVING COUNT(DISTINCT e.id) > 0
        ORDER BY enrollments DESC
        LIMIT 20
      `,

      prisma.course.groupBy({
        by: ["level"],
        _count: { level: true },
        _avg: {
          averageRating: true,
          totalEnrollments: true,
          completionRate: true,
          price: true,
        },
        where: {
          createdAt: { gte: fromDate },
          status: "PUBLISHED",
        },
      }),

      prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM c."createdAt") as month,
          EXTRACT(YEAR FROM c."createdAt") as year,
          COUNT(c.id) as courses_created,
          COUNT(e.id) as enrollments,
          cat.name as top_category
        FROM "Course" c
        LEFT JOIN "Enrollment" e ON c.id = e."courseId"
        LEFT JOIN "Category" cat ON c."categoryId" = cat.id
        WHERE c."createdAt" >= ${fromDate}
        GROUP BY EXTRACT(MONTH FROM c."createdAt"), EXTRACT(YEAR FROM c."createdAt"), cat.name
        ORDER BY year, month, enrollments DESC
      `,

      prisma.$queryRaw`
        SELECT 
          c1.id as course_id,
          c1.title,
          c1.price,
          c1."averageRating",
          c1."totalEnrollments",
          (
            SELECT AVG(c2.price)
            FROM "Course" c2
            WHERE c2."categoryId" = c1."categoryId"
            AND c2.id != c1.id
            AND c2.status = 'PUBLISHED'
          ) as category_avg_price,
          (
            SELECT AVG(c2."averageRating")
            FROM "Course" c2
            WHERE c2."categoryId" = c1."categoryId"
            AND c2.id != c1.id
            AND c2.status = 'PUBLISHED'
          ) as category_avg_rating
        FROM "Course" c1
        WHERE c1."createdAt" >= ${fromDate}
        AND c1.status = 'PUBLISHED'
        AND c1."totalEnrollments" > 0
        ORDER BY c1."totalEnrollments" DESC
        LIMIT 20
      `,

      prisma.$queryRaw`
        SELECT 
          c.id,
          c.title,
          COUNT(r.id) as review_count,
          AVG(r.rating) as avg_rating,
          COUNT(CASE WHEN r.rating >= 4 THEN 1 END)::float / NULLIF(COUNT(r.id), 0) * 100 as positive_feedback_rate
        FROM "Course" c
        LEFT JOIN "Review" r ON c.id = r."courseId"
        WHERE c."createdAt" >= ${fromDate}
        AND c.status = 'PUBLISHED'
        GROUP BY c.id, c.title
        HAVING COUNT(r.id) >= 5
        ORDER BY avg_rating DESC, review_count DESC
        LIMIT 15
      `,
    ]);

    const analytics = {
      performance: coursePerformance.map((course) => ({
        id: course.id,
        title: course.title,
        level: course.level,
        price: Number(course.price),
        rating: Number(course.averageRating || 0).toFixed(1),
        enrollments: Number(course.totalEnrollments),
        revenue: Number(course.totalRevenue),
        completionRate: Number(course.completionRate || 0).toFixed(2),
        category: course.category,
        instructor: course.instructor_name,
        reviewCount: Number(course.review_count),
        avgProgress: Number(course.avg_progress || 0).toFixed(2),
        revenuePerEnrollment:
          Number(course.totalEnrollments) > 0
            ? (
                Number(course.totalRevenue) / Number(course.totalEnrollments)
              ).toFixed(2)
            : 0,
      })),
      categoryAnalysis: categoryAnalysis.map((category) => ({
        category: category.category,
        courseCount: Number(category.course_count),
        avgPrice: Number(category.avg_price || 0).toFixed(2),
        totalEnrollments: Number(category.total_enrollments),
        totalRevenue: Number(category.total_revenue),
        avgRating: Number(category.avg_rating || 0).toFixed(1),
        avgCompletionRate: Number(category.avg_completion_rate || 0).toFixed(2),
        revenuePerCourse:
          Number(category.course_count) > 0
            ? (
                Number(category.total_revenue) / Number(category.course_count)
              ).toFixed(2)
            : 0,
      })),
      instructorAnalysis: instructorPerformance.map((instructor) => ({
        id: instructor.id,
        name: instructor.instructor_name,
        courseCount: Number(instructor.course_count),
        totalEnrollments: Number(instructor.total_enrollments),
        totalRevenue: Number(instructor.total_revenue),
        avgRating: Number(instructor.avg_rating || 0).toFixed(1),
        avgCompletionRate: Number(instructor.avg_completion_rate || 0).toFixed(
          2
        ),
        instructorRating: Number(instructor.instructor_rating || 0).toFixed(1),
        revenuePerCourse:
          Number(instructor.course_count) > 0
            ? (
                Number(instructor.total_revenue) /
                Number(instructor.course_count)
              ).toFixed(2)
            : 0,
      })),
      contentAnalysis: contentAnalysis.map((course) => ({
        id: course.id,
        title: course.title,
        plannedContent: {
          lessons: Number(course.totalLessons),
          quizzes: Number(course.totalQuizzes),
          assignments: Number(course.totalAssignments),
        },
        actualContent: {
          lessons: Number(course.actual_lessons),
          quizzes: Number(course.actual_quizzes),
          assignments: Number(course.actual_assignments),
        },
        avgLessonDuration: Number(course.avg_lesson_duration || 0),
        lessonCompletions: Number(course.lesson_completions),
        avgQuizScore: Number(course.avg_quiz_score || 0).toFixed(1),
        contentCompleteness: {
          lessons:
            Number(course.totalLessons) > 0
              ? (
                  (Number(course.actual_lessons) /
                    Number(course.totalLessons)) *
                  100
                ).toFixed(1)
              : 0,
          quizzes:
            Number(course.totalQuizzes) > 0
              ? (
                  (Number(course.actual_quizzes) /
                    Number(course.totalQuizzes)) *
                  100
                ).toFixed(1)
              : 0,
          assignments:
            Number(course.totalAssignments) > 0
              ? (
                  (Number(course.actual_assignments) /
                    Number(course.totalAssignments)) *
                  100
                ).toFixed(1)
              : 0,
        },
      })),
      pricingAnalysis: pricingAnalysis.map((range) => ({
        priceRange: range.price_range,
        courseCount: Number(range.course_count),
        avgEnrollments: Number(range.avg_enrollments || 0).toFixed(0),
        avgRating: Number(range.avg_rating || 0).toFixed(1),
        totalRevenue: Number(range.total_revenue),
        revenuePerCourse:
          Number(range.course_count) > 0
            ? (
                Number(range.total_revenue) / Number(range.course_count)
              ).toFixed(2)
            : 0,
      })),
      completionFunnel: completionFunnel.map((course) => ({
        id: course.id,
        title: course.title,
        funnel: {
          enrolled: Number(course.enrollments),
          started: Number(course.started),
          quarterComplete: Number(course.quarter_complete),
          halfComplete: Number(course.half_complete),
          threeQuarterComplete: Number(course.three_quarter_complete),
          completed: Number(course.completed),
        },
        conversionRates: {
          startRate:
            Number(course.enrollments) > 0
              ? (
                  (Number(course.started) / Number(course.enrollments)) *
                  100
                ).toFixed(1)
              : 0,
          completionRate:
            Number(course.enrollments) > 0
              ? (
                  (Number(course.completed) / Number(course.enrollments)) *
                  100
                ).toFixed(1)
              : 0,
        },
      })),
      difficultyAnalysis: difficultyAnalysis.map((level) => ({
        level: level.level,
        courseCount: level._count.level,
        avgRating: Number(level._avg.averageRating || 0).toFixed(1),
        avgEnrollments: Number(level._avg.totalEnrollments || 0).toFixed(0),
        avgCompletionRate: Number(level._avg.completionRate || 0).toFixed(2),
        avgPrice: Number(level._avg.price || 0).toFixed(2),
      })),
      seasonalTrends: seasonalTrends.map((trend) => ({
        month: Number(trend.month),
        year: Number(trend.year),
        coursesCreated: Number(trend.courses_created),
        enrollments: Number(trend.enrollments),
        topCategory: trend.top_category,
      })),
      competitiveAnalysis: competitiveAnalysis.map((course) => ({
        id: course.course_id,
        title: course.title,
        price: Number(course.price),
        rating: Number(course.averageRating || 0).toFixed(1),
        enrollments: Number(course.totalEnrollments),
        categoryAvgPrice: Number(course.category_avg_price || 0).toFixed(2),
        categoryAvgRating: Number(course.category_avg_rating || 0).toFixed(1),
        competitivePosition: {
          priceAdvantage:
            Number(course.category_avg_price) > 0
              ? (
                  ((Number(course.category_avg_price) - Number(course.price)) /
                    Number(course.category_avg_price)) *
                  100
                ).toFixed(1)
              : 0,
          ratingAdvantage:
            Number(course.category_avg_rating) > 0
              ? (
                  Number(course.averageRating) -
                  Number(course.category_avg_rating)
                ).toFixed(2)
              : 0,
        },
      })),
      feedback: courseFeedback.map((course) => ({
        id: course.id,
        title: course.title,
        reviewCount: Number(course.review_count),
        avgRating: Number(course.avg_rating || 0).toFixed(1),
        positiveFeedbackRate: Number(
          course.positive_feedback_rate || 0
        ).toFixed(1),
        topPros: "",
        topCons: "",
      })),
      period,
      groupBy: validGroupBy,
      categoryFilter: categoryId,
      lastUpdated: new Date().toISOString(),
    };

    await redisService.setJSON(cacheKey, analytics, { ex: 3600 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Course analytics retrieved successfully",
      data: analytics,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Course analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve course analytics",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { period = "30d", groupBy = "day", currency = "INR" } = req.query;

    const cacheKey = `revenue_analytics:${period}:${groupBy}:${currency}`;
    const cachedData = await redisService.getJSON(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Revenue analytics retrieved successfully",
        data: cachedData,
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const fromDate = getDateRange(period);
    const validGroupBy = ["day", "week", "month", "year"].includes(groupBy)
      ? groupBy
      : "day";

    let revenueTrendsQuery;
    switch (validGroupBy) {
      case "day":
        revenueTrendsQuery = prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('day', p."createdAt") as date,
            SUM(p.amount) as total_revenue,
            SUM(p."originalAmount") as gross_revenue,
            SUM(p."discountAmount") as total_discounts,
            SUM(p.tax) as total_tax,
            COUNT(p.id) as transaction_count,
            COUNT(DISTINCT e."courseId") as unique_courses,
            AVG(p.amount) as avg_transaction_value
          FROM "Payment" p
          LEFT JOIN "Enrollment" e ON p.id = e."paymentId"
          WHERE p."createdAt" >= ${fromDate}
          AND p.status = 'COMPLETED'
          AND p.currency = ${currency}
          GROUP BY DATE_TRUNC('day', p."createdAt")
          ORDER BY date
        `;
        break;
      case "week":
        revenueTrendsQuery = prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('week', p."createdAt") as date,
            SUM(p.amount) as total_revenue,
            SUM(p."originalAmount") as gross_revenue,
            SUM(p."discountAmount") as total_discounts,
            SUM(p.tax) as total_tax,
            COUNT(p.id) as transaction_count,
            COUNT(DISTINCT e."courseId") as unique_courses,
            AVG(p.amount) as avg_transaction_value
          FROM "Payment" p
          LEFT JOIN "Enrollment" e ON p.id = e."paymentId"
          WHERE p."createdAt" >= ${fromDate}
          AND p.status = 'COMPLETED'
          AND p.currency = ${currency}
          GROUP BY DATE_TRUNC('week', p."createdAt")
          ORDER BY date
        `;
        break;
      case "month":
        revenueTrendsQuery = prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', p."createdAt") as date,
            SUM(p.amount) as total_revenue,
            SUM(p."originalAmount") as gross_revenue,
            SUM(p."discountAmount") as total_discounts,
            SUM(p.tax) as total_tax,
            COUNT(p.id) as transaction_count,
            COUNT(DISTINCT e."courseId") as unique_courses,
            AVG(p.amount) as avg_transaction_value
          FROM "Payment" p
          LEFT JOIN "Enrollment" e ON p.id = e."paymentId"
          WHERE p."createdAt" >= ${fromDate}
          AND p.status = 'COMPLETED'
          AND p.currency = ${currency}
          GROUP BY DATE_TRUNC('month', p."createdAt")
          ORDER BY date
        `;
        break;
      case "year":
        revenueTrendsQuery = prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('year', p."createdAt") as date,
            SUM(p.amount) as total_revenue,
            SUM(p."originalAmount") as gross_revenue,
            SUM(p."discountAmount") as total_discounts,
            SUM(p.tax) as total_tax,
            COUNT(p.id) as transaction_count,
            COUNT(DISTINCT e."courseId") as unique_courses,
            AVG(p.amount) as avg_transaction_value
          FROM "Payment" p
          LEFT JOIN "Enrollment" e ON p.id = e."paymentId"
          WHERE p."createdAt" >= ${fromDate}
          AND p.status = 'COMPLETED'
          AND p.currency = ${currency}
          GROUP BY DATE_TRUNC('year', p."createdAt")
          ORDER BY date
        `;
        break;
      default:
        revenueTrendsQuery = prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('day', p."createdAt") as date,
            SUM(p.amount) as total_revenue,
            SUM(p."originalAmount") as gross_revenue,
            SUM(p."discountAmount") as total_discounts,
            SUM(p.tax) as total_tax,
            COUNT(p.id) as transaction_count,
            COUNT(DISTINCT e."courseId") as unique_courses,
            AVG(p.amount) as avg_transaction_value
          FROM "Payment" p
          LEFT JOIN "Enrollment" e ON p.id = e."paymentId"
          WHERE p."createdAt" >= ${fromDate}
          AND p.status = 'COMPLETED'
          AND p.currency = ${currency}
          GROUP BY DATE_TRUNC('day', p."createdAt")
          ORDER BY date
        `;
    }

    const [
      revenueTrends,
      revenueBreakdown,
      customerLifetimeValue,
      revenueByInstructor,
      paymentMethodAnalysis,
      refundAnalysis,
      commissionAnalysis,
      geographicRevenue,
      seasonalityAnalysis,
      forecastingData,
    ] = await Promise.all([
      revenueTrendsQuery,

      prisma.$queryRaw`
        SELECT 
          cat.name as category,
          SUM(p.amount) as revenue,
          COUNT(p.id) as transactions,
          AVG(p.amount) as avg_transaction,
          SUM(p."discountAmount") as total_discounts,
          COUNT(DISTINCT i.id) as unique_instructors
        FROM "Payment" p
        JOIN "Enrollment" e ON p.id = e."paymentId"
        JOIN "Course" c ON e."courseId" = c.id
        JOIN "Category" cat ON c."categoryId" = cat.id
        JOIN "Instructor" i ON c."instructorId" = i.id
        WHERE p."createdAt" >= ${fromDate}
        AND p.status = 'COMPLETED'
        AND p.currency = ${currency}
        GROUP BY cat.name
        ORDER BY revenue DESC
      `,

      prisma.$queryRaw`
        SELECT 
          e."studentId" as student_id,
          MIN(p."createdAt") as first_purchase_date,
          SUM(p.amount) as total_spent,
          COUNT(p.id) as purchase_count,
          SUM(p.amount) * 1.5 as predicted_ltv
        FROM "Payment" p
        JOIN "Enrollment" e ON p.id = e."paymentId"
        WHERE p."createdAt" >= ${fromDate}
        AND p.status = 'COMPLETED'
        GROUP BY e."studentId"
        ORDER BY total_spent DESC
        LIMIT 100
      `,

      prisma.$queryRaw`
        SELECT 
          i.id,
          u."firstName" || ' ' || u."lastName" as instructor_name,
          SUM(p.amount) as gross_revenue,
          SUM(earn.amount) as instructor_earnings,
          SUM(earn.commission) as total_commission,
          COUNT(DISTINCT p.id) as transactions,
          COUNT(DISTINCT c.id) as courses_sold,
          AVG(p.amount) as avg_sale_amount
        FROM "Instructor" i
        JOIN "User" u ON i."userId" = u.id
        JOIN "Course" c ON i.id = c."instructorId"
        JOIN "Enrollment" e ON c.id = e."courseId"
        JOIN "Payment" p ON e."paymentId" = p.id
        LEFT JOIN "Earning" earn ON i.id = earn."instructorId" AND earn."paymentId" = p.id
        WHERE p."createdAt" >= ${fromDate}
        AND p.status = 'COMPLETED'
        GROUP BY i.id, u."firstName", u."lastName"
        ORDER BY gross_revenue DESC
        LIMIT 20
      `,

      prisma.$queryRaw`
        SELECT 
          method,
          gateway,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_count,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::float / COUNT(*) * 100 as success_rate
        FROM "Payment"
        WHERE "createdAt" >= ${fromDate}
        AND currency = ${currency}
        GROUP BY method, gateway
        ORDER BY total_amount DESC
      `,

      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_refunds,
          SUM("refundAmount") as total_refund_amount,
          AVG("refundAmount") as avg_refund_amount,
          COUNT(*)::float / (
            SELECT COUNT(*) FROM "Payment" 
            WHERE status = 'COMPLETED' 
            AND "createdAt" >= ${fromDate}
          ) * 100 as refund_rate,
          STRING_AGG(DISTINCT "refundReason", ', ') as top_refund_reasons
        FROM "Payment"
        WHERE status IN ('REFUNDED', 'PARTIALLY_REFUNDED')
        AND "createdAt" >= ${fromDate}
        AND currency = ${currency}
      `,

      prisma.$queryRaw`
        SELECT 
          SUM(amount) as total_instructor_earnings,
          SUM(commission) as total_platform_commission,
          SUM("platformFee") as total_platform_fees,
          AVG(commission) as avg_commission_per_sale,
          COUNT(*) as total_payouts
        FROM "Earning"
        WHERE "createdAt" >= ${fromDate}
        AND currency = ${currency}
      `,

      prisma.$queryRaw`
        SELECT 
          u.country,
          SUM(p.amount) as revenue,
          COUNT(p.id) as transactions,
          COUNT(DISTINCT e."studentId") as unique_customers,
          AVG(p.amount) as avg_transaction_value
        FROM "Payment" p
        JOIN "Enrollment" e ON p.id = e."paymentId"
        JOIN "Student" s ON e."studentId" = s.id
        JOIN "User" u ON s."userId" = u.id
        WHERE p."createdAt" >= ${fromDate}
        AND p.status = 'COMPLETED'
        AND u.country IS NOT NULL
        GROUP BY u.country
        ORDER BY revenue DESC
        LIMIT 15
      `,

      prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM "createdAt") as month,
          EXTRACT(YEAR FROM "createdAt") as year,
          SUM(amount) as revenue,
          COUNT(*) as transactions,
          AVG(amount) as avg_transaction
        FROM "Payment"
        WHERE "createdAt" >= ${fromDate}
        AND status = 'COMPLETED'
        AND currency = ${currency}
        GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(MONTH FROM "createdAt")
        ORDER BY year, month
      `,

      prisma.$queryRaw`
        WITH daily_revenue AS (
          SELECT 
            DATE_TRUNC('day', "createdAt") as revenue_date,
            SUM(amount) as actual_revenue
          FROM "Payment"
          WHERE "createdAt" >= ${new Date(
            fromDate.getTime() - 90 * 24 * 60 * 60 * 1000
          )}
          AND status = 'COMPLETED'
          AND currency = ${currency}
          GROUP BY DATE_TRUNC('day', "createdAt")
        )
        SELECT 
          revenue_date,
          actual_revenue,
          LAG(actual_revenue, 7) OVER (ORDER BY revenue_date) as prev_week_revenue,
          LAG(actual_revenue, 30) OVER (ORDER BY revenue_date) as prev_month_revenue
        FROM daily_revenue
        ORDER BY revenue_date DESC
        LIMIT 30
      `,
    ]);

    const analytics = {
      overview: {
        totalRevenue: revenueTrends.reduce(
          (sum, item) => sum + Number(item.total_revenue),
          0
        ),
        grossRevenue: revenueTrends.reduce(
          (sum, item) => sum + Number(item.gross_revenue || 0),
          0
        ),
        totalDiscounts: revenueTrends.reduce(
          (sum, item) => sum + Number(item.total_discounts || 0),
          0
        ),
        totalTransactions: revenueTrends.reduce(
          (sum, item) => sum + Number(item.transaction_count),
          0
        ),
        avgTransactionValue:
          revenueTrends.length > 0
            ? (
                revenueTrends.reduce(
                  (sum, item) => sum + Number(item.avg_transaction_value),
                  0
                ) / revenueTrends.length
              ).toFixed(2)
            : 0,
      },
      trends: revenueTrends.map((item) => ({
        date: item.date,
        totalRevenue: Number(item.total_revenue),
        grossRevenue: Number(item.gross_revenue || 0),
        discounts: Number(item.total_discounts || 0),
        transactions: Number(item.transaction_count),
        uniqueCourses: Number(item.unique_courses),
        avgTransactionValue: Number(item.avg_transaction_value).toFixed(2),
      })),
      categoryBreakdown: revenueBreakdown.map((item) => ({
        category: item.category,
        revenue: Number(item.revenue),
        transactions: Number(item.transactions),
        avgTransaction: Number(item.avg_transaction).toFixed(2),
        discounts: Number(item.total_discounts || 0),
        uniqueInstructors: Number(item.unique_instructors),
        discountRate:
          Number(item.revenue) > 0
            ? (
                (Number(item.total_discounts || 0) / Number(item.revenue)) *
                100
              ).toFixed(2)
            : 0,
      })),
      customerLifetimeValue: {
        overview: {
          avgLifetimeValue:
            customerLifetimeValue.length > 0
              ? (
                  customerLifetimeValue.reduce(
                    (sum, c) => sum + Number(c.total_spent),
                    0
                  ) / customerLifetimeValue.length
                ).toFixed(2)
              : 0,
          avgPurchaseCount:
            customerLifetimeValue.length > 0
              ? (
                  customerLifetimeValue.reduce(
                    (sum, c) => sum + Number(c.purchase_count),
                    0
                  ) / customerLifetimeValue.length
                ).toFixed(1)
              : 0,
          avgDaysBetweenPurchases: 0,
        },
        segments: [
          {
            segment: "High Value",
            customers: customerLifetimeValue.filter(
              (c) => Number(c.total_spent) > 10000
            ).length,
            avgSpent:
              customerLifetimeValue.filter((c) => Number(c.total_spent) > 10000)
                .length > 0
                ? (
                    customerLifetimeValue
                      .filter((c) => Number(c.total_spent) > 10000)
                      .reduce((sum, c) => sum + Number(c.total_spent), 0) /
                    customerLifetimeValue.filter(
                      (c) => Number(c.total_spent) > 10000
                    ).length
                  ).toFixed(2)
                : 0,
          },
          {
            segment: "Medium Value",
            customers: customerLifetimeValue.filter(
              (c) =>
                Number(c.total_spent) >= 2000 && Number(c.total_spent) <= 10000
            ).length,
            avgSpent:
              customerLifetimeValue.filter(
                (c) =>
                  Number(c.total_spent) >= 2000 &&
                  Number(c.total_spent) <= 10000
              ).length > 0
                ? (
                    customerLifetimeValue
                      .filter(
                        (c) =>
                          Number(c.total_spent) >= 2000 &&
                          Number(c.total_spent) <= 10000
                      )
                      .reduce((sum, c) => sum + Number(c.total_spent), 0) /
                    customerLifetimeValue.filter(
                      (c) =>
                        Number(c.total_spent) >= 2000 &&
                        Number(c.total_spent) <= 10000
                    ).length
                  ).toFixed(2)
                : 0,
          },
          {
            segment: "Low Value",
            customers: customerLifetimeValue.filter(
              (c) => Number(c.total_spent) < 2000
            ).length,
            avgSpent:
              customerLifetimeValue.filter((c) => Number(c.total_spent) < 2000)
                .length > 0
                ? (
                    customerLifetimeValue
                      .filter((c) => Number(c.total_spent) < 2000)
                      .reduce((sum, c) => sum + Number(c.total_spent), 0) /
                    customerLifetimeValue.filter(
                      (c) => Number(c.total_spent) < 2000
                    ).length
                  ).toFixed(2)
                : 0,
          },
        ],
      },
      instructorRevenue: revenueByInstructor.map((instructor) => ({
        id: instructor.id,
        name: instructor.instructor_name,
        grossRevenue: Number(instructor.gross_revenue),
        instructorEarnings: Number(instructor.instructor_earnings || 0),
        commission: Number(instructor.total_commission || 0),
        transactions: Number(instructor.transactions),
        coursesSold: Number(instructor.courses_sold),
        avgSaleAmount: Number(instructor.avg_sale_amount).toFixed(2),
        commissionRate:
          Number(instructor.gross_revenue) > 0
            ? (
                (Number(instructor.total_commission || 0) /
                  Number(instructor.gross_revenue)) *
                100
              ).toFixed(2)
            : 0,
      })),
      paymentMethods: paymentMethodAnalysis.map((method) => ({
        method: method.method,
        gateway: method.gateway,
        transactions: Number(method.transaction_count),
        totalAmount: Number(method.total_amount),
        avgAmount: Number(method.avg_amount).toFixed(2),
        failedTransactions: Number(method.failed_count),
        successRate: Number(method.success_rate).toFixed(2),
      })),
      refunds: {
        totalRefunds: Number(refundAnalysis[0]?.total_refunds || 0),
        totalRefundAmount: Number(refundAnalysis[0]?.total_refund_amount || 0),
        avgRefundAmount: Number(
          refundAnalysis[0]?.avg_refund_amount || 0
        ).toFixed(2),
        refundRate: Number(refundAnalysis[0]?.refund_rate || 0).toFixed(2),
        topReasons: refundAnalysis[0]?.top_refund_reasons || "",
      },
      commissions: {
        totalInstructorEarnings: Number(
          commissionAnalysis[0]?.total_instructor_earnings || 0
        ),
        totalPlatformCommission: Number(
          commissionAnalysis[0]?.total_platform_commission || 0
        ),
        totalPlatformFees: Number(
          commissionAnalysis[0]?.total_platform_fees || 0
        ),
        avgCommissionPerSale: Number(
          commissionAnalysis[0]?.avg_commission_per_sale || 0
        ).toFixed(2),
        totalPayouts: Number(commissionAnalysis[0]?.total_payouts || 0),
      },
      geographic: geographicRevenue.map((geo) => ({
        country: geo.country,
        revenue: Number(geo.revenue),
        transactions: Number(geo.transactions),
        uniqueCustomers: Number(geo.unique_customers),
        avgTransactionValue: Number(geo.avg_transaction_value).toFixed(2),
        revenuePerCustomer:
          Number(geo.unique_customers) > 0
            ? (Number(geo.revenue) / Number(geo.unique_customers)).toFixed(2)
            : 0,
      })),
      seasonality: seasonalityAnalysis.map((season) => ({
        month: Number(season.month),
        year: Number(season.year),
        revenue: Number(season.revenue),
        transactions: Number(season.transactions),
        avgTransaction: Number(season.avg_transaction).toFixed(2),
      })),
      forecasting: {
        recentTrends: forecastingData.slice(0, 7).map((item) => ({
          date: item.revenue_date,
          revenue: Number(item.actual_revenue),
          weekOverWeekGrowth: item.prev_week_revenue
            ? (
                ((Number(item.actual_revenue) -
                  Number(item.prev_week_revenue)) /
                  Number(item.prev_week_revenue)) *
                100
              ).toFixed(2)
            : null,
          monthOverMonthGrowth: item.prev_month_revenue
            ? (
                ((Number(item.actual_revenue) -
                  Number(item.prev_month_revenue)) /
                  Number(item.prev_month_revenue)) *
                100
              ).toFixed(2)
            : null,
        })),
      },
      currency,
      period,
      groupBy: validGroupBy,
      lastUpdated: new Date().toISOString(),
    };

    await redisService.setJSON(cacheKey, analytics, { ex: 3600 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Revenue analytics retrieved successfully",
      data: analytics,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Revenue analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve revenue analytics",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const getRealtimeStats = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const cacheKey = "realtime_stats";
    const cachedData = await redisService.getJSON(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Real-time statistics retrieved successfully",
        data: cachedData,
        meta: {
          cached: true,
          executionTime: Math.round(performance.now() - startTime),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);

    const [
      activeUsers,
      activeSessions,
      recentSignups,
      recentEnrollments,
      paymentsToday,
      recentActivity,
      systemHealth,
      onlineInstructors,
      liveNotifications,
      performanceMetrics,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          lastLogin: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
      }),

      prisma.session.count({
        where: {
          isActive: true,
          lastActivity: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
      }),

      prisma.user.count({
        where: { createdAt: { gte: last24Hours } },
      }),

      prisma.enrollment.count({
        where: { createdAt: { gte: last24Hours } },
      }),

      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: "COMPLETED",
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),

      prisma.userActivity.findMany({
        select: {
          action: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        where: { createdAt: { gte: last15Minutes } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),

      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT s.id) as active_sessions,
          AVG(s."sessionDuration") as avg_session_duration,
          COUNT(DISTINCT CASE WHEN s."lastActivity" >= ${new Date(
            Date.now() - 5 * 60 * 1000
          )} THEN s.id END) as very_active_sessions
        FROM "Session" s
        WHERE s."isActive" = true
      `,

      prisma.user.count({
        where: {
          role: "INSTRUCTOR",
          lastLogin: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),

      prisma.notification.count({
        where: {
          createdAt: { gte: lastHour },
        },
      }),

      prisma.$queryRaw`
        SELECT 
          COUNT(CASE WHEN p.status = 'PENDING' THEN 1 END) as pending_payments,
          COUNT(CASE WHEN p.status = 'FAILED' THEN 1 END) as failed_payments,
          COUNT(CASE WHEN c.status = 'UNDER_REVIEW' THEN 1 END) as courses_under_review,
          COUNT(CASE WHEN st.status = 'OPEN' THEN 1 END) as open_support_tickets
        FROM "Payment" p
        FULL OUTER JOIN "Course" c ON true
        FULL OUTER JOIN "SupportTicket" st ON true
        WHERE p."createdAt" >= ${last24Hours}
        OR c."createdAt" >= ${last24Hours}
        OR st."createdAt" >= ${last24Hours}
      `,
    ]);

    const stats = {
      live: {
        activeUsers,
        activeSessions,
        veryActiveSessions: Number(systemHealth[0]?.very_active_sessions || 0),
        onlineInstructors,
        avgSessionDuration: Math.round(
          Number(systemHealth[0]?.avg_session_duration || 0) / 60
        ),
      },
      today: {
        newSignups: recentSignups,
        newEnrollments: recentEnrollments,
        totalPayments: paymentsToday._count?.id || 0,
        revenueToday: Number(paymentsToday._sum?.amount || 0),
        newNotifications: liveNotifications,
      },
      systemHealth: {
        pendingPayments: Number(performanceMetrics[0]?.pending_payments || 0),
        failedPayments: Number(performanceMetrics[0]?.failed_payments || 0),
        coursesUnderReview: Number(
          performanceMetrics[0]?.courses_under_review || 0
        ),
        openSupportTickets: Number(
          performanceMetrics[0]?.open_support_tickets || 0
        ),
        systemStatus:
          activeSessions > 100
            ? "healthy"
            : activeSessions > 50
            ? "moderate"
            : "low",
      },
      recentActivity: recentActivity.map((activity) => ({
        action: activity.action,
        user: `${activity.user.firstName} ${activity.user.lastName}`,
        role: activity.user.role,
        timestamp: activity.createdAt,
        timeAgo: Math.round(
          (Date.now() - new Date(activity.createdAt).getTime()) / 60000
        ),
      })),
      alerts: [
        ...(Number(performanceMetrics[0]?.failed_payments || 0) > 10
          ? [
              {
                type: "warning",
                message: `${performanceMetrics[0]?.failed_payments} failed payments in last 24h`,
                priority: "high",
              },
            ]
          : []),
        ...(Number(performanceMetrics[0]?.open_support_tickets || 0) > 50
          ? [
              {
                type: "info",
                message: `${performanceMetrics[0]?.open_support_tickets} open support tickets`,
                priority: "medium",
              },
            ]
          : []),
        ...(activeSessions < 10
          ? [
              {
                type: "warning",
                message: "Low active session count",
                priority: "medium",
              },
            ]
          : []),
      ],
      lastUpdated: new Date().toISOString(),
    };

    await redisService.setJSON(cacheKey, stats, { ex: 300 });

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Real-time statistics retrieved successfully",
      data: stats,
      meta: {
        cached: false,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Real-time stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve real-time statistics",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

const convertToCSV = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return "";
  }

  const flattenObject = (obj, prefix = "") => {
    const flattened = {};
    for (const key in obj) {
      if (
        obj[key] !== null &&
        typeof obj[key] === "object" &&
        !Array.isArray(obj[key]) &&
        !(obj[key] instanceof Date)
      ) {
        Object.assign(flattened, flattenObject(obj[key], `${prefix}${key}.`));
      } else if (Array.isArray(obj[key])) {
        flattened[`${prefix}${key}`] = obj[key].join("; ");
      } else {
        flattened[`${prefix}${key}`] = obj[key];
      }
    }
    return flattened;
  };

  const flattenedData = data.map((item) => flattenObject(item));
  const headers = Object.keys(flattenedData[0]);

  const csvRows = [
    headers.join(","),
    ...flattenedData.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"') || value.includes("\n"))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ];

  return csvRows.join("\n");
};

export const downloadExportedData = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const { exportId } = req.params;
    const { format } = req.query;

    const exportData = await redisService.getJSON(`export:${exportId}`);

    if (!exportData) {
      return res.status(404).json({
        success: false,
        message: "Export not found or expired",
        code: "EXPORT_NOT_FOUND",
      });
    }

    const requestedFormat = format || exportData.format || "json";
    const fileExtension = requestedFormat === "csv" ? "csv" : "json";
    const filename = `educademy_analytics_${exportData.type}_${exportData.period}_${exportId}.${fileExtension}`;

    if (requestedFormat === "csv") {
      const csvData = convertToCSV(exportData.data);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Pragma", "no-cache");

      res.status(200).send(csvData);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Pragma", "no-cache");

      res.status(200).json({
        exportInfo: {
          exportId: exportData.exportId,
          type: exportData.type,
          period: exportData.period,
          recordCount: exportData.recordCount,
          generatedAt: exportData.generatedAt,
          format: requestedFormat,
        },
        data: exportData.data,
      });
    }
  } catch (error) {
    console.error("Download export error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download exported data",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export const exportAnalyticsData = asyncHandler(async (req, res) => {
  const startTime = performance.now();

  try {
    const {
      type = "dashboard",
      period = "30d",
      format = "json",
      includeDetails = "false",
      categoryId = null,
      instructorId = null,
    } = req.query;

    if (
      ![
        "dashboard",
        "users",
        "courses",
        "revenue",
        "engagement",
        "instructors",
        "students",
      ].includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid export type",
        code: "INVALID_EXPORT_TYPE",
      });
    }

    if (!["json", "csv"].includes(format)) {
      return res.status(400).json({
        success: false,
        message: "Invalid format. Supported formats: json, csv",
        code: "INVALID_FORMAT",
      });
    }

    const exportId = generateAnalyticsId();
    const fromDate = getDateRange(period);

    let exportData = {};

    switch (type) {
      case "dashboard":
        const dashboardStats = await Promise.all([
          prisma.user.count(),
          prisma.course.count({ where: { status: "PUBLISHED" } }),
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: { status: "COMPLETED" },
          }),
          prisma.enrollment.count(),
          prisma.user.count({
            where: {
              lastLogin: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          }),
        ]);

        exportData = [
          {
            metric: "Total Users",
            value: dashboardStats[0],
            type: "count",
            period: period,
            generatedAt: new Date().toISOString(),
          },
          {
            metric: "Total Courses",
            value: dashboardStats[1],
            type: "count",
            period: period,
            generatedAt: new Date().toISOString(),
          },
          {
            metric: "Total Revenue",
            value: Number(dashboardStats[2]._sum?.amount || 0),
            type: "revenue",
            period: period,
            generatedAt: new Date().toISOString(),
          },
          {
            metric: "Total Enrollments",
            value: dashboardStats[3],
            type: "count",
            period: period,
            generatedAt: new Date().toISOString(),
          },
          {
            metric: "Active Users (30 days)",
            value: dashboardStats[4],
            type: "count",
            period: period,
            generatedAt: new Date().toISOString(),
          },
        ];
        break;

      case "users":
        const userFields = {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          lastLogin: true,
          isActive: true,
          isVerified: true,
          country: true,
          language: true,
        };

        if (includeDetails === "true") {
          Object.assign(userFields, {
            studentProfile: {
              select: {
                skillLevel: true,
                totalLearningTime: true,
                learningGoals: true,
              },
            },
            instructorProfile: {
              select: {
                rating: true,
                totalStudents: true,
                totalCourses: true,
                totalRevenue: true,
                isVerified: true,
              },
            },
          });
        }

        exportData = await prisma.user.findMany({
          select: userFields,
          where: { createdAt: { gte: fromDate } },
          orderBy: { createdAt: "desc" },
        });
        break;

      case "courses":
        const courseWhereClause = {
          createdAt: { gte: fromDate },
          ...(categoryId && { categoryId }),
          ...(instructorId && { instructorId }),
        };

        const courseFields = {
          id: true,
          title: true,
          status: true,
          level: true,
          price: true,
          discountPrice: true,
          createdAt: true,
          publishedAt: true,
          totalEnrollments: true,
          totalRevenue: true,
          averageRating: true,
          totalRatings: true,
          completionRate: true,
          language: true,
          category: {
            select: {
              name: true,
            },
          },
          instructor: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        };

        if (includeDetails === "true") {
          Object.assign(courseFields, {
            sectionsCount: true,
            totalLessons: true,
            totalQuizzes: true,
            totalAssignments: true,
            reviews: {
              select: {
                rating: true,
                content: true,
                createdAt: true,
              },
              take: 5,
              orderBy: { createdAt: "desc" },
            },
          });
        }

        exportData = await prisma.course.findMany({
          select: courseFields,
          where: courseWhereClause,
          orderBy: { createdAt: "desc" },
        });
        break;

      case "revenue":
        exportData = await prisma.payment.findMany({
          select: {
            id: true,
            amount: true,
            originalAmount: true,
            discountAmount: true,
            currency: true,
            status: true,
            method: true,
            gateway: true,
            createdAt: true,
            enrollments: {
              select: {
                course: {
                  select: {
                    title: true,
                    category: {
                      select: {
                        name: true,
                      },
                    },
                    instructor: {
                      select: {
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
                student: {
                  select: {
                    user: {
                      select: {
                        country: true,
                      },
                    },
                  },
                },
              },
            },
          },
          where: {
            createdAt: { gte: fromDate },
            status: "COMPLETED",
          },
          orderBy: { createdAt: "desc" },
        });
        break;

      case "engagement":
        exportData = await prisma.lessonCompletion.findMany({
          select: {
            id: true,
            completedAt: true,
            timeSpent: true,
            watchTime: true,
            student: {
              select: {
                user: {
                  select: {
                    email: true,
                    firstName: true,
                    lastName: true,
                    country: true,
                  },
                },
              },
            },
            lesson: {
              select: {
                title: true,
                type: true,
                duration: true,
                section: {
                  select: {
                    title: true,
                    course: {
                      select: {
                        title: true,
                        category: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          where: { completedAt: { gte: fromDate } },
          take: 10000,
          orderBy: { completedAt: "desc" },
        });
        break;

      case "instructors":
        exportData = await prisma.instructor.findMany({
          select: {
            id: true,
            createdAt: true,
            rating: true,
            totalStudents: true,
            totalCourses: true,
            totalRevenue: true,
            yearsExperience: true,
            isVerified: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                country: true,
                createdAt: true,
                lastLogin: true,
              },
            },
            courses: {
              select: {
                title: true,
                status: true,
                totalEnrollments: true,
                averageRating: true,
                totalRevenue: true,
              },
              take: includeDetails === "true" ? undefined : 3,
            },
          },
          where: { createdAt: { gte: fromDate } },
          orderBy: { totalRevenue: "desc" },
        });
        break;

      case "students":
        exportData = await prisma.student.findMany({
          select: {
            id: true,
            createdAt: true,
            skillLevel: true,
            totalLearningTime: true,
            learningGoals: true,
            interests: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                country: true,
                createdAt: true,
                lastLogin: true,
              },
            },
            enrollments: {
              select: {
                createdAt: true,
                status: true,
                progress: true,
                course: {
                  select: {
                    title: true,
                    category: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
              take: includeDetails === "true" ? undefined : 5,
            },
          },
          where: { createdAt: { gte: fromDate } },
          orderBy: { createdAt: "desc" },
        });
        break;
    }

    const exportRecord = {
      exportId,
      type,
      period,
      format,
      includeDetails: includeDetails === "true",
      filters: {
        categoryId,
        instructorId,
      },
      recordCount: Array.isArray(exportData) ? exportData.length : 1,
      generatedAt: new Date().toISOString(),
      generatedBy: req.userAuthId || "system",
    };

    await redisService.setJSON(
      `export:${exportId}`,
      {
        ...exportRecord,
        data: exportData,
      },
      { ex: 3600 }
    );

    const executionTime = Math.round(performance.now() - startTime);

    res.status(200).json({
      success: true,
      message: "Analytics data exported successfully",
      data: {
        exportId,
        downloadUrl: `/api/admin/analytics/download/${exportId}?format=${format}`,
        ...exportRecord,
      },
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Export analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export analytics data",
      code: "INTERNAL_SERVER_ERROR",
      meta: {
        executionTime: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString(),
      },
    });
  }
});
