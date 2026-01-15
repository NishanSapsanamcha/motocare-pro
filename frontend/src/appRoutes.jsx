import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PublicRoutes from "./routes/publicRoutes";
import PrivateRoutes from "./routes/privateRoutes";

const LandingPage = React.lazy(() => import("./pages/public/LandingPage"));
const LoginPage = React.lazy(() => import("./pages/public/Login"));
const RegisterPage = React.lazy(() => import("./pages/public/Register"));
const Dashboard = React.lazy(() => import("./pages/private/Dashboard"));

const AppRoutes = () => {
  return (
    <Suspense fallback={<div>.....loading</div>}>
      <Routes>
        <Route element={<PublicRoutes />}>
          <Route path="/" element={<Navigate to="/landing" replace />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Route>
        <Route element={<PrivateRoutes />}>
           <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
