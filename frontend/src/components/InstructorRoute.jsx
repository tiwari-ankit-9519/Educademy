import { Route } from "react-router-dom";
import { RoleProtectedRoute } from "../components/ProtectedRoute";
import VerificationPage from "@/pages/instructor/VerificationPage";
import CouponsPage from "@/pages/instructor/CouponsPage";
import QnAPage from "@/pages/instructor/QnAPage";
import ReviewsAndCommunityPage from "@/pages/instructor/ReviewsAndCommunityPage";
import StudentManagementPage from "@/pages/instructor/StudentManagement";
import QuiznAssignmentPage from "@/pages/instructor/QuiznAssignmentPage";
import MyCourses from "@/pages/instructor/MyCourses";

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
    path="/instructor/courses"
    element={
      <RoleProtectedRoute
        element={<MyCourses />}
        allowedRoles={["instructor"]}
      />
    }
  />,
  <Route
    key="instructor-content"
    path="/instructor/:courseId/content"
    element={
      <RoleProtectedRoute
        element={<QuiznAssignmentPage />}
        allowedRoles={["instructor"]}
      />
    }
  />,
  <Route
    key="instructor-students"
    path="/instructor/students"
    element={
      <RoleProtectedRoute
        element={<StudentManagementPage />}
        allowedRoles={["instructor"]}
      />
    }
  />,

  <Route
    key="instructor-community"
    path="/instructor/community/qna"
    element={
      <RoleProtectedRoute element={<QnAPage />} allowedRoles={["instructor"]} />
    }
  />,
  <Route
    key="instructor-community"
    path="/instructor/community/overview"
    element={
      <RoleProtectedRoute
        element={<ReviewsAndCommunityPage />}
        allowedRoles={["instructor"]}
      />
    }
  />,
  // <Route
  //   key="instructor-earnings"
  //   path="/instructor/earnings/"
  //   element={
  //     <RoleProtectedRoute
  //       element={<EarningsPage />}
  //       allowedRoles={["instructor"]}
  //     />
  //   }
  // />,
  <Route
    key="instructor-coupons"
    path="/instructor/coupons/"
    element={
      <RoleProtectedRoute
        element={<CouponsPage />}
        allowedRoles={["instructor"]}
      />
    }
  />,
  <Route
    key="instructor-verification"
    path="/instructor/verifications"
    element={
      <RoleProtectedRoute
        element={<VerificationPage />}
        allowedRoles={["instructor"]}
      />
    }
  />,
];
