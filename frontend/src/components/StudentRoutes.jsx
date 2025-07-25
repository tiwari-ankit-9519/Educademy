import { Route } from "react-router-dom";
import { RoleProtectedRoute } from "../components/ProtectedRoute";

export const studentRoutes = [
  <Route
    key="student-learning"
    path="/student/learning/*"
    element={
      <RoleProtectedRoute
        element={<div>My Learning</div>}
        allowedRoles={["student"]}
      />
    }
  />,
  <Route
    key="student-cart"
    path="/student/cart"
    element={
      <RoleProtectedRoute
        element={<div>Shopping Cart</div>}
        allowedRoles={["student"]}
      />
    }
  />,
  <Route
    key="student-wishlist"
    path="/student/wishlist"
    element={
      <RoleProtectedRoute
        element={<div>Wishlist</div>}
        allowedRoles={["student"]}
      />
    }
  />,
  <Route
    key="student-purchases"
    path="/student/purchases"
    element={
      <RoleProtectedRoute
        element={<div>Purchase History</div>}
        allowedRoles={["student"]}
      />
    }
  />,
  <Route
    key="student-community"
    path="/student/community/*"
    element={
      <RoleProtectedRoute
        element={<div>Community</div>}
        allowedRoles={["student"]}
      />
    }
  />,
];
