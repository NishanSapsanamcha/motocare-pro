import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../utils/auth";

const PublicRoutes = () => {
  const token = getToken();

  let user = null;
  try {
    const str = localStorage.getItem("user");
    user = str ? JSON.parse(str) : null;
  } catch {
    user = null;
  }

  // If already logged in, route to respective dashboard
  if (token && user) {
    if (user.role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoutes;