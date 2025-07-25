import { Route } from "react-router-dom";
import { RoleProtectedRoute } from "../components/ProtectedRoute";
import AdminDashboard from "../pages/admin/DashboardPage";
import UserAnalytics from "../pages/admin/UserAnalytics";
import CourseAnalytics from "../pages/admin/CourseAnalytics";
import RevenueAnalytics from "../pages/admin/RevenueAnalytics";
import RealtimeAnalytics from "../pages/admin/RealTimeAnalytics";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminUserDetails from "../pages/admin/AdminUserDetails";
import VerificationRequestsPage from "../pages/admin/VerificationRequestsPage";
import RequestDetailPage from "../pages/admin/RequestDetailPage";
import CategoriesManagementPage from "../pages/admin/CategoriesManagementPage";
import GeneralSettingsPage from "../pages/admin/GeneralSettingsPage";
import AnnouncementsPage from "../pages/admin/AnnouncementsPage";
import SystemHealthPage from "../pages/admin/SystemHealth";
import ContentReports from "../pages/admin/ContentReports";
import UserViolations from "../pages/admin/UserViolations";
import ModerationStats from "../pages/admin/ModerationStats";
import CommunityStandards from "../pages/admin/CommunityStandards";
import PendingCourseReviewPage from "../pages/admin/PendingCourseReviewPage";
import CourseStatsPage from "../pages/admin/CourseStatsPage";
import ReviewHistoryPage from "../pages/admin/ReviewHistroyPage";

export const adminRoutes = [
  <Route
    key="admin-dashboard"
    path="/admin/dashboard"
    element={
      <RoleProtectedRoute
        element={<AdminDashboard />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-analytics"
    path="/admin/analytics/*"
    element={
      <RoleProtectedRoute
        element={<div>Analytics Page</div>}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-analytics-users"
    path="/admin/analytics/users"
    element={
      <RoleProtectedRoute
        element={<UserAnalytics />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-analytics-revenue"
    path="/admin/analytics/revenue"
    element={
      <RoleProtectedRoute
        element={<RevenueAnalytics />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-analytics-realtime"
    path="/admin/analytics/realtime"
    element={
      <RoleProtectedRoute
        element={<RealtimeAnalytics />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-analytics-courses"
    path="/admin/analytics/courses"
    element={
      <RoleProtectedRoute
        element={<CourseAnalytics />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-users"
    path="/admin/users"
    element={
      <RoleProtectedRoute element={<AdminUsers />} allowedRoles={["admin"]} />
    }
  />,
  <Route
    key="admin-user-details"
    path="/admin/users/:userId"
    element={
      <RoleProtectedRoute
        element={<AdminUserDetails />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-categories"
    path="/admin/users/categories"
    element={
      <RoleProtectedRoute
        element={<CategoriesManagementPage />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-courses-pending"
    path="/admin/courses/pending"
    element={
      <RoleProtectedRoute
        element={<PendingCourseReviewPage />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-courses-stats"
    path="/admin/courses/stats"
    element={
      <RoleProtectedRoute
        element={<CourseStatsPage />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-courses-history"
    path="/admin/courses/history"
    element={
      <RoleProtectedRoute
        element={<ReviewHistoryPage />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-payments"
    path="/admin/payments/*"
    element={
      <RoleProtectedRoute
        element={<div>Payment Management</div>}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-moderation-reports"
    path="/admin/moderation/reports"
    element={
      <RoleProtectedRoute
        element={<ContentReports />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-moderation-violations"
    path="/admin/moderation/violations"
    element={
      <RoleProtectedRoute
        element={<UserViolations />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-moderation-stats"
    path="/admin/moderation/stats"
    element={
      <RoleProtectedRoute
        element={<ModerationStats />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-moderation-standards"
    path="/admin/moderation/standards"
    element={
      <RoleProtectedRoute
        element={<CommunityStandards />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-system-settings"
    path="/admin/system/settings"
    element={
      <RoleProtectedRoute
        element={<GeneralSettingsPage />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-system-announcements"
    path="/admin/system/announcements"
    element={
      <RoleProtectedRoute
        element={<AnnouncementsPage />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-system-health"
    path="/admin/system/health"
    element={
      <RoleProtectedRoute
        element={<SystemHealthPage />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-verification-requests"
    path="/admin/verification/requests"
    element={
      <RoleProtectedRoute
        element={<VerificationRequestsPage />}
        allowedRoles={["admin"]}
      />
    }
  />,
  <Route
    key="admin-verification-detail"
    path="/admin/verification/:requestId"
    element={
      <RoleProtectedRoute
        element={<RequestDetailPage />}
        allowedRoles={["admin"]}
      />
    }
  />,
];
