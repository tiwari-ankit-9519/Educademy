import express from "express";
import { requireInstructor } from "../../middlewares/middleware.js";
import {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  submitForReview,
  validateCourse,
  deleteCourse,
  getCourseStats,
  getInstructorDashboard,
} from "../../controllers/instructors/instructorcourse.controller.js";
import { uploadImage } from "../../config/upload.js";

const router = express.Router();

router.use(requireInstructor);

router.get("/", getCourses);
router.post("/", uploadImage.single("thumbnail"), createCourse);
router.get("/dashboard", getInstructorDashboard);

router.get("/stats", getCourseStats);
router.get("/:courseId", getCourse);
router.put("/:courseId", uploadImage.single("thumbnail"), updateCourse);
router.delete("/:courseId", deleteCourse);
router.post("/:courseId/submit", submitForReview);
router.get("/:courseId/validate", validateCourse);

export default router;
