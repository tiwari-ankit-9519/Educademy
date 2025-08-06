import express from "express";
import { requireInstructor } from "../../middlewares/middleware.js";
import {
  getEnrolledStudents,
  gradeAssignment,
  bulkGradeAssignments,
  getPendingGrading,
  getStudentAnalytics,
  exportStudentData,
  getStudentEngagement,
  getStudentDetail,
} from "../../controllers/instructors/instructorStudent.controller.js";

const router = express.Router();

router.use(requireInstructor);

router.get("/pending-grading", getPendingGrading);
router.get("/export", exportStudentData);
router.post("/bulk-grade", bulkGradeAssignments);
router.post("/assignments/:submissionId/grade", gradeAssignment);
router.get("/:courseId", getEnrolledStudents);
router.get("/:courseId/analytics", getStudentAnalytics);
router.get("/:courseId/engagement", getStudentEngagement);
router.get("/:studentId/courses/:courseId/detail", getStudentDetail);

export default router;
