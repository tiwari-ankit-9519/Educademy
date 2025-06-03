import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export const useAuthGuard = (
  requireAuth = true,
  redirectTo = "/auth/login"
) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        navigate(redirectTo, {
          state: { from: location.pathname },
          replace: true,
        });
      } else if (!requireAuth && isAuthenticated) {
        const authPages = [
          "/auth/login",
          "/auth/register",
          "/auth/verify-user",
        ];

        if (authPages.includes(location.pathname)) {
          const userRole = user?.role?.toLowerCase();
          const roleRoutes = {
            student: "/student/dashboard",
            instructor: "/instructor/dashboard",
            admin: "/admin/dashboard",
          };

          const from =
            location.state?.from || roleRoutes[userRole] || "/dashboard";
          navigate(from, { replace: true });
        }
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    requireAuth,
    navigate,
    redirectTo,
    location,
    user,
  ]);

  return { isAuthenticated, isLoading };
};
