import express from "express";
import { requireAdmin } from "../../middlewares/middleware.js";
import {
  getSystemSettings,
  updateSystemSettings,
  createAnnouncement,
  getAllAnnouncements,
  getSystemHealth,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../controllers/admin/adminSystem.controller.js";

const router = express.Router();

router.get("/settings", requireAdmin, getSystemSettings);
router.put("/settings", requireAdmin, updateSystemSettings);
router.post("/announcements", requireAdmin, createAnnouncement);
router.get("/announcements", requireAdmin, getAllAnnouncements);
router.put("/announcements/:announcementId", requireAdmin, updateAnnouncement);
router.delete(
  "/announcements/:announcementId",
  requireAdmin,
  deleteAnnouncement
);

router.get("/health", requireAdmin, getSystemHealth);

export default router;
