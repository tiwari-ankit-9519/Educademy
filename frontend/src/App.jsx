import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import LoginPage from "./pages/common/LoginPage";
import RegisterPage from "./pages/common/RegisterPage";
import OTPVerificationPage from "./pages/common/OTPVerificationPage";
import ForgotPasswordPage from "./pages/common/ForgotPasswordPage";
import AuthCallback from "./components/AuthCallback";
import PageNotFound from "./pages/PageNotFound";
import AdminDashboard from "./pages/admin/DashboardPage";
import Sidebar from "./components/Sidebar";
import ProfilePage from "./pages/common/ProfilePage";
import UserAnalytics from "./pages/admin/UserAnalytics";
import CourseAnalytics from "./pages/admin/CourseAnalytics";
import RevenueAnalytics from "./pages/admin/RevenueAnalytics";
import RealtimeAnalytics from "./pages/admin/RealTimeAnalytics";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import VerificationRequestsPage from "./pages/admin/VerificationRequestsPage";
import RequestDetailPage from "./pages/admin/RequestDetailPage";
import CategoriesManagementPage from "./pages/admin/CategoriesManagementPage";
import { useState } from "react";
import GeneralSettingsPage from "./pages/admin/GeneralSettingsPage";
import AnnouncementsPage from "./pages/admin/AnnouncementsPage";
import SystemHealthPage from "./pages/admin/SystemHealth";

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <main
        className={`transition-all duration-300 ease-in-out
          flex-1 justify-center items-start
          // ${isCollapsed ? "ml-20" : "ml-72"}
        `}
      >
        {children}
      </main>
    </div>
  );
};

const ProtectedRoute = ({ element }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return isAuthenticated ? (
    <Layout>{element}</Layout>
  ) : (
    <Navigate to="/login" replace />
  );
};

const RoleProtectedRoute = ({ element, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role?.toLowerCase();

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={getDashboardRoute(user)} replace />;
  }

  return <Layout>{element}</Layout>;
};

const PublicRoute = ({ element }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return isAuthenticated ? (
    <Navigate to={getDashboardRoute(user)} replace />
  ) : (
    element
  );
};

const getDashboardRoute = (user) => {
  if (!user) return "/login";

  const userRole = user.role?.toLowerCase();

  switch (userRole) {
    case "admin":
      return "/admin/dashboard";
    case "instructor":
      return "/instructor/dashboard";
    case "student":
      return "/student/learning";
    default:
      return "/login";
  }
};

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute element={<LoginPage />} />} />
      <Route
        path="/register"
        element={<PublicRoute element={<RegisterPage />} />}
      />
      <Route
        path="/verify-otp"
        element={<PublicRoute element={<OTPVerificationPage />} />}
      />
      <Route
        path="/forgot-password"
        element={<PublicRoute element={<ForgotPasswordPage />} />}
      />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={getDashboardRoute(user)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <RoleProtectedRoute
            element={<AdminDashboard />}
            allowedRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/analytics/*"
        element={
          <RoleProtectedRoute
            element={<div>Analytics Page</div>}
            allowedRoles={["admin"]}
          />
        }
      />

      <Route
        path="/admin/analytics/users"
        element={
          <RoleProtectedRoute
            element={<UserAnalytics />}
            allowedRoles={["admin"]}
          />
        }
      />

      <Route
        path="/admin/analytics/revenue"
        element={
          <RoleProtectedRoute
            element={<RevenueAnalytics />}
            allowedRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/analytics/realtime"
        element={
          <RoleProtectedRoute
            element={<RealtimeAnalytics />}
            allowedRoles={["admin"]}
          />
        }
      />

      <Route
        path="/admin/analytics/courses"
        element={
          <RoleProtectedRoute
            element={<CourseAnalytics />}
            allowedRoles={["admin"]}
          />
        }
      />

      <Route
        path="/admin/users"
        element={
          <RoleProtectedRoute
            element={<AdminUsers />}
            allowedRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/users/:userId"
        element={
          <RoleProtectedRoute
            element={<AdminUserDetails />}
            allowedRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/users/categories"
        element={
          <RoleProtectedRoute
            element={<CategoriesManagementPage />}
            allowedRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/courses/*"
        element={
          <RoleProtectedRoute
            element={<div>Course Management</div>}
            allowedRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/payments/*"
        element={
          <RoleProtectedRoute
            element={<div>Payment Management</div>}
            allowedRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/moderation/*"
        element={
          <RoleProtectedRoute
            element={<div>Moderation</div>}
            allowedRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/system/settings"
        element={
          <RoleProtectedRoute
            element={<GeneralSettingsPage />}
            allowedRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/system/announcements"
        element={
          <RoleProtectedRoute
            element={<AnnouncementsPage />}
            allowedRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/system/health"
        element={
          <RoleProtectedRoute
            element={<SystemHealthPage />}
            allowedRoles={["admin"]}
          />
        }
      />
      <Route
        path="/admin/verification/requests"
        element={
          <RoleProtectedRoute
            element={<VerificationRequestsPage />}
            allowedRoles={["admin"]}
          />
        }
      />

      <Route
        path="/admin/verification/:requestId"
        element={
          <RoleProtectedRoute
            element={<RequestDetailPage />}
            allowedRoles={["admin"]}
          />
        }
      />

      <Route
        path="/instructor/dashboard"
        element={
          <RoleProtectedRoute
            element={<div>Instructor Dashboard</div>}
            allowedRoles={["instructor"]}
          />
        }
      />
      <Route
        path="/instructor/courses/*"
        element={
          <RoleProtectedRoute
            element={<div>My Courses</div>}
            allowedRoles={["instructor"]}
          />
        }
      />
      <Route
        path="/instructor/content/*"
        element={
          <RoleProtectedRoute
            element={<div>Course Content</div>}
            allowedRoles={["instructor"]}
          />
        }
      />
      <Route
        path="/instructor/students/*"
        element={
          <RoleProtectedRoute
            element={<div>Students Management</div>}
            allowedRoles={["instructor"]}
          />
        }
      />
      <Route
        path="/instructor/community/*"
        element={
          <RoleProtectedRoute
            element={<div>Community</div>}
            allowedRoles={["instructor"]}
          />
        }
      />
      <Route
        path="/instructor/earnings/*"
        element={
          <RoleProtectedRoute
            element={<div>Earnings</div>}
            allowedRoles={["instructor"]}
          />
        }
      />
      <Route
        path="/instructor/coupons/*"
        element={
          <RoleProtectedRoute
            element={<div>Coupons</div>}
            allowedRoles={["instructor"]}
          />
        }
      />
      <Route
        path="/instructor/verification/*"
        element={
          <RoleProtectedRoute
            element={<div>Verification</div>}
            allowedRoles={["instructor"]}
          />
        }
      />

      <Route
        path="/student/learning/*"
        element={
          <RoleProtectedRoute
            element={<div>My Learning</div>}
            allowedRoles={["student"]}
          />
        }
      />
      <Route
        path="/catalog/*"
        element={<ProtectedRoute element={<div>Course Catalog</div>} />}
      />
      <Route
        path="/student/cart"
        element={
          <RoleProtectedRoute
            element={<div>Shopping Cart</div>}
            allowedRoles={["student"]}
          />
        }
      />
      <Route
        path="/student/wishlist"
        element={
          <RoleProtectedRoute
            element={<div>Wishlist</div>}
            allowedRoles={["student"]}
          />
        }
      />
      <Route
        path="/student/purchases"
        element={
          <RoleProtectedRoute
            element={<div>Purchase History</div>}
            allowedRoles={["student"]}
          />
        }
      />
      <Route
        path="/student/community/*"
        element={
          <RoleProtectedRoute
            element={<div>Community</div>}
            allowedRoles={["student"]}
          />
        }
      />

      <Route
        path="/profile"
        element={<ProtectedRoute element={<ProfilePage />} />}
      />
      <Route
        path="/notifications"
        element={<ProtectedRoute element={<div>Notifications</div>} />}
      />
      <Route
        path="/search"
        element={<ProtectedRoute element={<div>Search</div>} />}
      />
      <Route
        path="/support"
        element={<ProtectedRoute element={<div>Support</div>} />}
      />
      <Route
        path="/uploads"
        element={<ProtectedRoute element={<div>File Uploads</div>} />}
      />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default App;
