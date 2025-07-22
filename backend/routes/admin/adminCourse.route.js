import express from "express";
import { requireAdmin } from "../../middlewares/middleware.js";
import { trackRoute } from "../../utils/routeWrapper.js";
import {
  getPendingCourses,
  getCourseReviewDetails,
  reviewCourse,
  getCourseStats,
  bulkCourseActions,
  getCourseReviewHistory,
} from "../../controllers/admin/adminCourse.controller.js";

const router = express.Router();

router.use(requireAdmin);

router.get(
  "/pending",
  trackRoute("AdminCourse", "getPendingCourses"),
  getPendingCourses
);
router.get(
  "/stats",
  trackRoute("AdminCourse", "getCourseStats"),
  getCourseStats
);
router.get(
  "/:courseId/review",
  trackRoute("AdminCourse", "getCourseReviewDetails"),
  getCourseReviewDetails
);
router.get(
  "/:courseId/history",
  trackRoute("AdminCourse", "getCourseReviewHistory"),
  getCourseReviewHistory
);
router.post(
  "/:courseId/review",
  trackRoute("AdminCourse", "reviewCourse"),
  reviewCourse
);
router.post(
  "/bulk-actions",
  trackRoute("AdminCourse", "bulkCourseActions"),
  bulkCourseActions
);

export default router;
