import { Route } from "react-router-dom";
import { PublicRoute, ProtectedRoute } from "../components/ProtectedRoute";
import LoginPage from "../pages/common/LoginPage";
import RegisterPage from "../pages/common/RegisterPage";
import OTPVerificationPage from "../pages/common/OTPVerificationPage";
import ForgotPasswordPage from "../pages/common/ForgotPasswordPage";
import ProfilePage from "../pages/common/ProfilePage";
import SupportPage from "@/pages/common/SupportPage";
import NotificationsPage from "@/pages/common/NotificationsPage";
import OAuthCallbackPage from "@/pages/common/OAuthCallbackPage";

export const commonRoutes = [
  <Route
    key="login"
    path="/login"
    element={<PublicRoute element={<LoginPage />} />}
  />,
  <Route
    key="register"
    path="/register"
    element={<PublicRoute element={<RegisterPage />} />}
  />,
  <Route
    key="verify-otp"
    path="/verify-otp"
    element={<PublicRoute element={<OTPVerificationPage />} />}
  />,
  <Route
    key="forgot-password"
    path="/forgot-password"
    element={<PublicRoute element={<ForgotPasswordPage />} />}
  />,
  <Route
    key="auth-callback"
    path="/auth/callback"
    element={<OAuthCallbackPage />}
  />,
  <Route
    key="profile"
    path="/profile"
    element={<ProtectedRoute element={<ProfilePage />} />}
  />,
  <Route
    key="notifications"
    path="/notifications"
    element={<ProtectedRoute element={<NotificationsPage />} />}
  />,
  <Route
    key="search"
    path="/search"
    element={<ProtectedRoute element={<div>Search</div>} />}
  />,
  <Route
    key="support"
    path="/support"
    element={<ProtectedRoute element={<SupportPage />} />}
  />,
  <Route
    key="uploads"
    path="/uploads"
    element={<ProtectedRoute element={<div>File Uploads</div>} />}
  />,
  <Route
    key="catalog"
    path="/catalog/*"
    element={<ProtectedRoute element={<div>Course Catalog</div>} />}
  />,
];
