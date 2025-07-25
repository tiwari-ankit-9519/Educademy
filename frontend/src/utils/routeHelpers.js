export const getDashboardRoute = (user) => {
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
