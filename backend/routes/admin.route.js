import { Router } from "express";
import { requireAdmin } from "../middlewares/middleware.js";
import {
  getDashboardStats,
  getAnalytics,
  getAllUsers,
  getUserDetails,
  getStudents,
  getInstructors,
  getAdmins,
  getUserSessions,
  getUserActivities,
  updateUserStatus,
  deleteUser,
  bulkUpdateUsers,
  getAllCourses,
  reviewCourse,
  updateCourseStatus,
  deleteCourse,
  getMonthlyAnalytics,
  getCourseAnalyticsForAdmin,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllPayments,
  refundPayment,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getSystemLogs,
  getSystemHealth,
  getPlatformNotifications,
  getAllDiscussions,
  getPlatformMessages,
  generateReport,
  // ADD THESE NEW IMPORTS
  getReactivationRequests,
  reviewReactivationRequest,
  getReactivationRequestDetails,
} from "../controllers/admin/admin.controller.js";

const router = Router();

router.get("/dashboard/stats", requireAdmin, getDashboardStats);
router.get("/analytics", requireAdmin, getAnalytics);
router.get("/analytics/monthly", requireAdmin, getMonthlyAnalytics);
router.get("/analytics/courses", requireAdmin, getCourseAnalyticsForAdmin);

router.get("/users", requireAdmin, getAllUsers);
router.get("/users/students", requireAdmin, getStudents);
router.get("/users/instructors", requireAdmin, getInstructors);
router.get("/users/admins", requireAdmin, getAdmins);
router.get("/users/sessions", requireAdmin, getUserSessions);
router.get("/users/activities", requireAdmin, getUserActivities);
router.get("/users/:userId", requireAdmin, getUserDetails);
router.delete("/users/:userId", requireAdmin, deleteUser);
router.patch("/users/:userId/status", requireAdmin, updateUserStatus);
router.patch("/users/bulk-update", requireAdmin, bulkUpdateUsers);

// NEW REACTIVATION ROUTES FOR ADMIN
router.get("/reactivation-requests", requireAdmin, getReactivationRequests);
router.get(
  "/reactivation-requests/:reactivationRequestId",
  requireAdmin,
  getReactivationRequestDetails
);
router.patch(
  "/reactivation-requests/:reactivationRequestId/review",
  requireAdmin,
  reviewReactivationRequest
);

router.get("/courses", requireAdmin, getAllCourses);
router.delete("/courses/:courseId", requireAdmin, deleteCourse);
router.patch("/courses/:courseId/review", requireAdmin, reviewCourse);
router.patch("/courses/:courseId/status", requireAdmin, updateCourseStatus);

router.get("/categories", requireAdmin, getAllCategories);
router.post("/categories", requireAdmin, createCategory);
router.patch("/categories/:categoryId", requireAdmin, updateCategory);
router.delete("/categories/:categoryId", requireAdmin, deleteCategory);

router.get("/payments", requireAdmin, getAllPayments);
router.post("/payments/:paymentId/refund", requireAdmin, refundPayment);

router.get("/coupons", requireAdmin, getAllCoupons);
router.post("/coupons", requireAdmin, createCoupon);
router.patch("/coupons/:couponId", requireAdmin, updateCoupon);
router.delete("/coupons/:couponId", requireAdmin, deleteCoupon);

router.get("/system/logs", requireAdmin, getSystemLogs);
router.get("/system/health", requireAdmin, getSystemHealth);

router.get("/notifications", requireAdmin, getPlatformNotifications);
router.get("/discussions", requireAdmin, getAllDiscussions);
router.get("/messages", requireAdmin, getPlatformMessages);

router.post("/reports/generate", requireAdmin, generateReport);

router.get(
  "/instructor/analytics/courses",
  requireAdmin,
  getCourseAnalyticsForAdmin
);
router.get("/instructor/discussions", requireAdmin, getAllDiscussions);

export default router;
