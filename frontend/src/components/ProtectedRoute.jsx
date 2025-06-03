/* eslint-disable react-refresh/only-export-components */
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "@/features/authSlice";

/**
 * Enhanced ProtectedRoute component with role-based access control
 *
 * @param {boolean} requireAuth - Whether authentication is required (default: true)
 * @param {string[]} allowedRoles - Array of roles allowed to access this route
 * @param {string} redirectTo - Custom redirect path
 * @param {React.ReactNode} children - Child components to render
 */
export const ProtectedRoute = ({
  children,
  requireAuth = true,
  allowedRoles = null,
  redirectTo = null,
}) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const location = useLocation();

  // Case 1: Route requires NO authentication (like login/register pages)
  if (!requireAuth) {
    // If user is already authenticated, redirect them away from auth pages
    if (isAuthenticated && user) {
      const userRole = user.role?.toLowerCase();

      // Determine where to redirect based on user role
      const redirectPath = (() => {
        switch (userRole) {
          case "student":
            return "/student/dashboard";
          case "instructor":
            return "/instructor/dashboard";
          case "admin":
            return "/admin/dashboard";
          default:
            return "/dashboard";
        }
      })();

      return <Navigate to={redirectPath} replace />;
    }

    return children;
  }

  // Case 2: Route requires authentication
  if (!isAuthenticated || !user) {
    return (
      <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role?.toUpperCase();

    if (!allowedRoles.includes(userRole)) {
      if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
      }

      const userRoleLower = userRole?.toLowerCase();
      const appropriateDashboard = (() => {
        switch (userRoleLower) {
          case "student":
            return "/student/dashboard";
          case "instructor":
            return "/instructor/dashboard";
          case "admin":
            return "/admin/dashboard";
          default:
            return "/dashboard";
        }
      })();

      return <Navigate to={appropriateDashboard} replace />;
    }
  }

  return children;
};

export const RoleGuard = ({ allowedRoles, children, fallback = null }) => {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated || !user) {
    return fallback;
  }

  const userRole = user.role?.toUpperCase();

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(userRole)
  ) {
    return fallback;
  }

  return children;
};

export const usePermissions = () => {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const hasRole = (roles) => {
    if (!isAuthenticated || !user) return false;

    const userRole = user.role?.toUpperCase();
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return allowedRoles.includes(userRole);
  };

  const isRole = (role) => {
    if (!isAuthenticated || !user) return false;
    return user.role?.toUpperCase() === role.toUpperCase();
  };

  const canAccess = (requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return isAuthenticated;
    return hasRole(requiredRoles);
  };

  return {
    user,
    isAuthenticated,
    hasRole,
    isRole,
    canAccess,
    isStudent: isRole("STUDENT"),
    isInstructor: isRole("INSTRUCTOR"),
    isAdmin: isRole("ADMIN"),
  };
};

export default ProtectedRoute;
