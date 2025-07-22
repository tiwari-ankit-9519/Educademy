import express from "express";
import { requireAdmin } from "../../middlewares/middleware.js";
import { trackRoute } from "../../utils/routeWrapper.js";
import {
  getDashboardOverview,
  getUserAnalytics,
  getCourseAnalytics,
  getRevenueAnalytics,
  getRealtimeStats,
  exportAnalyticsData,
  downloadExportedData,
} from "../../controllers/admin/adminAnalytics.controller.js";

const router = express.Router();

router.get(
  "/dashboard",
  trackRoute("AdminAnalytics", "getDashboardOverview"),
  requireAdmin,
  getDashboardOverview
);

router.get(
  "/users",
  trackRoute("AdminAnalytics", "getUserAnalytics"),
  requireAdmin,
  getUserAnalytics
);

router.get(
  "/courses",
  trackRoute("AdminAnalytics", "getCourseAnalytics"),
  requireAdmin,
  getCourseAnalytics
);

router.get(
  "/revenue",
  trackRoute("AdminAnalytics", "getRevenueAnalytics"),
  requireAdmin,
  getRevenueAnalytics
);

router.get(
  "/realtime",
  trackRoute("AdminAnalytics", "getRealtimeStats"),
  requireAdmin,
  getRealtimeStats
);

router.post(
  "/export",
  trackRoute("AdminAnalytics", "exportAnalyticsData"),
  requireAdmin,
  exportAnalyticsData
);

router.get(
  "/download/:exportId",
  trackRoute("AdminAnalytics", "downloadExportedData"),
  requireAdmin,
  downloadExportedData
);

export default router;
