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
  getReactivationRequests,
  reviewReactivationRequest,
  getReactivationRequestDetails,
  getPendingInstructors,
  getInstructorDetails,
  verifyInstructor,
  bulkVerifyInstructors,
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
router.get("/courses/:courseId/review", requireAdmin, reviewCourse);
router.patch("/courses/:courseId/status", requireAdmin, updateCourseStatus);

router.get("/categories", getAllCategories);
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

router.get("/instructors/pending", requireAdmin, getPendingInstructors);
router.put("/instructors/:instructorId/verify", requireAdmin, verifyInstructor);
router.get(
  "/instructors/:instructorId/details",
  requireAdmin,
  getInstructorDetails
);
router.put("/instructors/bulk-verify", requireAdmin, bulkVerifyInstructors);

export default router;
