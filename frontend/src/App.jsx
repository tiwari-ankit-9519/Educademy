import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ToastProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { selectIsAuthenticated, selectUser } from "@/features/authSlice";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyOTPPage from "./pages/auth/VerifyOTPPage";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/user/ProfilePage";
import Layout from "@/components/Layout";

// Temporary dashboard components - replace with your actual components
const StudentDashboard = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        Student Dashboard
      </h1>
      <p className="text-gray-600">Welcome to your student dashboard!</p>
    </div>
  </div>
);

const InstructorDashboard = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-green-600 mb-4">
        Instructor Dashboard
      </h1>
      <p className="text-gray-600">Welcome to your instructor dashboard!</p>
    </div>
  </div>
);

const AdminDashboard = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Admin Dashboard</h1>
      <p className="text-gray-600">Welcome to your admin dashboard!</p>
    </div>
  </div>
);

const GeneralDashboard = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-purple-600 mb-4">Dashboard</h1>
      <p className="text-gray-600">Welcome to your dashboard!</p>
    </div>
  </div>
);

// Pages that don't need sidebar (auth pages, landing page)
const PublicLayout = ({ children }) => (
  <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
    {children}
  </div>
);

// Component to handle authenticated user redirects from landing page
const LandingPageWrapper = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  // If user is authenticated, redirect to appropriate dashboard
  if (isAuthenticated && user) {
    const userRole = user.role?.toLowerCase();

    switch (userRole) {
      case "student":
        return <Navigate to="/student/dashboard" replace />;
      case "instructor":
        return <Navigate to="/instructor/dashboard" replace />;
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  // If not authenticated, show landing page
  return <LandingPage />;
};

// Component to handle root dashboard redirect based on role
const DashboardRedirect = () => {
  const user = useSelector(selectUser);

  if (!user) {
    return <GeneralDashboard />;
  }

  const userRole = user.role?.toLowerCase();

  switch (userRole) {
    case "student":
      return <Navigate to="/student/dashboard" replace />;
    case "instructor":
      return <Navigate to="/instructor/dashboard" replace />;
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <GeneralDashboard />;
  }
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <div className="App">
          <Routes>
            {/* Landing page with authentication redirect */}
            <Route
              path="/"
              element={
                <PublicLayout>
                  <LandingPageWrapper />
                </PublicLayout>
              }
            />

            {/* Public auth routes - redirect if already authenticated */}
            <Route
              path="/auth/login"
              element={
                <PublicLayout>
                  <ProtectedRoute requireAuth={false}>
                    <LoginPage />
                  </ProtectedRoute>
                </PublicLayout>
              }
            />
            <Route
              path="/auth/register"
              element={
                <PublicLayout>
                  <ProtectedRoute requireAuth={false}>
                    <RegisterPage />
                  </ProtectedRoute>
                </PublicLayout>
              }
            />
            <Route
              path="/auth/verify-user"
              element={
                <PublicLayout>
                  <ProtectedRoute requireAuth={false}>
                    <VerifyOTPPage />
                  </ProtectedRoute>
                </PublicLayout>
              }
            />

            {/* Protected routes with sidebar layout */}

            {/* General dashboard with role-based redirect */}
            <Route
              path="/dashboard"
              element={
                <Layout>
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                </Layout>
              }
            />

            {/* Role-specific dashboards */}
            <Route
              path="/student/dashboard"
              element={
                <Layout>
                  <ProtectedRoute allowedRoles={["STUDENT"]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                </Layout>
              }
            />
            <Route
              path="/instructor/dashboard"
              element={
                <Layout>
                  <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
                    <InstructorDashboard />
                  </ProtectedRoute>
                </Layout>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <Layout>
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                </Layout>
              }
            />

            {/* Profile Page - accessible to all authenticated users */}
            <Route
              path="/profile"
              element={
                <Layout>
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                </Layout>
              }
            />

            {/* Role-specific profile routes (redirects to main profile) */}
            <Route
              path="/student/profile"
              element={<Navigate to="/profile" replace />}
            />
            <Route
              path="/instructor/profile"
              element={<Navigate to="/profile" replace />}
            />
            <Route
              path="/admin/profile"
              element={<Navigate to="/profile" replace />}
            />

            {/* Settings and account aliases */}
            <Route
              path="/settings"
              element={<Navigate to="/profile" replace />}
            />
            <Route
              path="/account"
              element={<Navigate to="/profile" replace />}
            />

            {/* Cross-role access prevention */}
            <Route
              path="/student/*"
              element={
                <Layout>
                  <ProtectedRoute allowedRoles={["STUDENT"]}>
                    <Navigate to="/student/dashboard" replace />
                  </ProtectedRoute>
                </Layout>
              }
            />
            <Route
              path="/instructor/*"
              element={
                <Layout>
                  <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
                    <Navigate to="/instructor/dashboard" replace />
                  </ProtectedRoute>
                </Layout>
              }
            />
            <Route
              path="/admin/*"
              element={
                <Layout>
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <Navigate to="/admin/dashboard" replace />
                  </ProtectedRoute>
                </Layout>
              }
            />

            {/* Catch all route - redirect based on authentication */}
            <Route path="*" element={<AuthenticatedRedirect />} />
          </Routes>

          <ToastProvider />
        </div>
      </Router>
    </ThemeProvider>
  );
}

// Component to handle 404 redirects based on authentication status
const AuthenticatedRedirect = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If authenticated, redirect to appropriate dashboard
  const userRole = user?.role?.toLowerCase();

  switch (userRole) {
    case "student":
      return <Navigate to="/student/dashboard" replace />;
    case "instructor":
      return <Navigate to="/instructor/dashboard" replace />;
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default App;
