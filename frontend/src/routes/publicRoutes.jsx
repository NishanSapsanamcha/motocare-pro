import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../utils/auth";

const PublicRoutes = () => {
  const token = getToken();

  // If already logged in, prevent access to login/register
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoutes;
