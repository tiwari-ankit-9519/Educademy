import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Layout from "./Layout";
import { getDashboardRoute } from "@/utils/routeHelpers";

export const ProtectedRoute = ({ element }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return isAuthenticated ? (
    <Layout>{element}</Layout>
  ) : (
    <Navigate to="/login" replace />
  );
};

export const RoleProtectedRoute = ({ element, allowedRoles = [] }) => {
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

export const PublicRoute = ({ element }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return isAuthenticated ? (
    <Navigate to={getDashboardRoute(user)} replace />
  ) : (
    element
  );
};
