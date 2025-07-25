import { Route } from "react-router-dom";
import { RoleProtectedRoute } from "../components/ProtectedRoute";

export const instructorRoutes = [
  <Route
    key="instructor-dashboard"
    path="/instructor/dashboard"
    element={
      <RoleProtectedRoute
        element={<div>Instructor Dashboard</div>}
        allowedRoles={["instructor"]}
      />
    }
  />,
  <Route
    key="instructor-courses"
    path="/instructor/courses/*"
    element={
      <RoleProtectedRoute
        element={<div>My Courses</div>}
        allowedRoles={["instructor"]}
      />
    }
  />,
  <Route
    key="instructor-content"
    path="/instructor/content/*"
    element={
      <RoleProtectedRoute
        element={<div>Course Content</div>}
        allowedRoles={["instructor"]}
      />
    }
  />,
  <Route
    key="instructor-students"
    path="/instructor/students/*"
    element={
      <RoleProtectedRoute
        element={<div>Students Management</div>}
        allowedRoles={["instructor"]}
      />
    }
  />,
  <Route
    key="instructor-community"
    path="/instructor/community/*"
    element={
      <RoleProtectedRoute
        element={<div>Community</div>}
        allowedRoles={["instructor"]}
      />
    }
  />,
  <Route
    key="instructor-earnings"
    path="/instructor/earnings/*"
    element={
      <RoleProtectedRoute
        element={<div>Earnings</div>}
        allowedRoles={["instructor"]}
      />
    }
  />,
  <Route
    key="instructor-coupons"
    path="/instructor/coupons/*"
    element={
      <RoleProtectedRoute
        element={<div>Coupons</div>}
        allowedRoles={["instructor"]}
      />
    }
  />,
  <Route
    key="instructor-verification"
    path="/instructor/verification/*"
    element={
      <RoleProtectedRoute
        element={<div>Verification</div>}
        allowedRoles={["instructor"]}
      />
    }
  />,
];
