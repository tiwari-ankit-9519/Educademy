import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { getDashboardRoute } from "@/utils/routeHelpers";
import PageNotFound from "./pages/PageNotFound";
import { commonRoutes } from "@/components/CommonRoute";
import { adminRoutes } from "@/components/AdminRoutes";
import { instructorRoutes } from "@/components/InstructorRoute";
import { studentRoutes } from "@/components/StudentRoutes";

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <Routes>
      {commonRoutes}
      {adminRoutes}
      {instructorRoutes}
      {studentRoutes}

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

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default App;
