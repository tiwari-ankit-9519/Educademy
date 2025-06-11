import { Router } from "express";
import { requireInstructor } from "../middlewares/middleware.js";
import {
  createCourse,
  createLesson,
  createSection,
  deleteLesson,
  deleteSection,
  getAllLessons,
  getInstructorCourses,
  getInstructorDashboard,
  getInstructorStats,
  getSections,
  reorderSections,
  updateCourse,
  updateLesson,
  updateSection,
  createAssignment,
  updateAssignment,
  getSectionAssignments,
  getAssignment,
  deleteAssignment,
  gradeSubmission,
  getAssignmentSubmissions,
  reorderAssignments,
  bulkGradeSubmissions,
  exportSubmissions,
  createQuiz,
} from "../controllers/instructor/instructor.controller.js";

const router = Router();

// Dashboard and basic analytics
router.get("/dashboard", requireInstructor, getInstructorDashboard);
router.get("/stats", requireInstructor, getInstructorStats);

// Course management
router.post("/create-course", requireInstructor, createCourse);
router.put("/update-course/:courseId", requireInstructor, updateCourse);
router.get("/all-courses", requireInstructor, getInstructorCourses);

// Section management
router.post("/courses/:courseId/sections", requireInstructor, createSection);
router.get("/courses/:courseId/sections", requireInstructor, getSections);
router.put("/sections/:sectionId", requireInstructor, updateSection);
router.delete("/sections/:sectionId", requireInstructor, deleteSection);
router.put(
  "/courses/:courseId/sections/reorder",
  requireInstructor,
  reorderSections
);

// Lesson management
router.post(
  "/lessons/:sectionId/create-lesson",
  requireInstructor,
  createLesson
);
router.put("/lessons/:lessonId/update-lesson", requireInstructor, updateLesson);
router.get("/lessons/:sectionId/lessons", requireInstructor, getAllLessons);
router.delete("/lessons/:lessonId", requireInstructor, deleteLesson);

// Assignment management
router.post(
  "/assignments/:sectionId/create",
  requireInstructor,
  createAssignment
);
router.put("/assignments/:assignmentId", requireInstructor, updateAssignment);
router.get("/assignments/:assignmentId", requireInstructor, getAssignment);
router.delete(
  "/assignments/:assignmentId",
  requireInstructor,
  deleteAssignment
);

// Section assignments
router.get(
  "/sections/:sectionId/assignments",
  requireInstructor,
  getSectionAssignments
);
router.put(
  "/sections/:sectionId/assignments/reorder",
  requireInstructor,
  reorderAssignments
);

// Assignment submissions management
router.get(
  "/assignments/:assignmentId/submissions",
  requireInstructor,
  getAssignmentSubmissions
);
router.put(
  "/assignments/:assignmentId/submissions/:submissionId/grade",
  requireInstructor,
  gradeSubmission
);
router.put(
  "/assignments/:assignmentId/submissions/bulk-grade",
  requireInstructor,
  bulkGradeSubmissions
);
router.get(
  "/assignments/:assignmentId/submissions/export",
  requireInstructor,
  exportSubmissions
);

// Quiz management
router.post("/quizzes/:sectionId/create", requireInstructor, createQuiz);

export default router;
