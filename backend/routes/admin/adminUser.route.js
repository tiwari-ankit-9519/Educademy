import express from "express";
import { requireAdmin } from "../../middlewares/middleware.js";
import {
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  bulkUpdateUsers,
  deleteUser,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSingleCategory,
  getAllVerificationRequests,
  getVerificationStats,
  reviewVerificationRequest,
  getVerificationRequestById,
} from "../../controllers/admin/adminUser.controller.js";
import { uploadImage } from "../../config/upload.js";
import { trackRoute } from "../../utils/routeWrapper.js";

const router = express.Router();

router.get(
  "/users",
  trackRoute("AdminUser", "getAllUsers"),
  requireAdmin,
  getAllUsers
);

router.patch(
  "/users/bulk",
  trackRoute("AdminUser", "bulkUpdateUsers"),
  requireAdmin,
  bulkUpdateUsers
);

router.get(
  "/users/:userId",
  trackRoute("AdminUser", "getUserDetails"),
  requireAdmin,
  getUserDetails
);

router.patch(
  "/users/:userId",
  trackRoute("AdminUser", "updateUserStatus"),
  requireAdmin,
  updateUserStatus
);

router.delete(
  "/users/:userId",
  trackRoute("AdminUser", "deleteUser"),
  requireAdmin,
  deleteUser
);

// Verification routes
router.get(
  "/admin/all",
  trackRoute("AdminUser", "getAllVerificationRequests"),
  requireAdmin,
  getAllVerificationRequests
);

router.get(
  "/admin/stats",
  trackRoute("AdminUser", "getVerificationStats"),
  requireAdmin,
  getVerificationStats
);

router.get(
  "/admin/:requestId",
  trackRoute("AdminUser", "getVerificationRequestById"),
  requireAdmin,
  getVerificationRequestById
);

router.put(
  "/admin/:requestId/review",
  trackRoute("AdminUser", "reviewVerificationRequest"),
  requireAdmin,
  reviewVerificationRequest
);

// Category management routes
router.get(
  "/categories",
  trackRoute("AdminUser", "getAllCategories"),
  requireAdmin,
  getAllCategories
);

router.post(
  "/categories",
  trackRoute("AdminUser", "createCategory"),
  requireAdmin,
  uploadImage.single("image"),
  createCategory
);

router.get(
  "/categories/:categoryId",
  trackRoute("AdminUser", "getSingleCategory"),
  requireAdmin,
  getSingleCategory
);

router.patch(
  "/categories/:categoryId",
  trackRoute("AdminUser", "updateCategory"),
  requireAdmin,
  uploadImage.single("image"),
  updateCategory
);

router.delete(
  "/categories/:categoryId",
  trackRoute("AdminUser", "deleteCategory"),
  requireAdmin,
  deleteCategory
);

export default router;
