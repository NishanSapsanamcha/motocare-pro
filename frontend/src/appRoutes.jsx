import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PublicRoutes from "./routes/publicRoutes";
import PrivateRoutes from "./routes/privateRoutes";
import AdminRoutes from "./routes/adminRoutes";
import SplashScreen from "./pages/public/SplashScreen";

// User Pages
const LandingPage = React.lazy(() => import("./pages/public/LandingPage"));
const LoginPage = React.lazy(() => import("./pages/public/Login"));
const RegisterPage = React.lazy(() => import("./pages/public/Register"));
const ForgotPasswordPage = React.lazy(() => import("./pages/public/ForgotPassword"));
const ResetPasswordPage = React.lazy(() => import("./pages/public/ResetPassword"));
const Dashboard = React.lazy(() => import("./pages/private/Dashboard"));
const Servicing = React.lazy(() => import("./pages/private/Servicing"));
const ServicingAppointment = React.lazy(() => import("./pages/private/ServicingAppointment"));
const ServicingAppointmentDetails = React.lazy(() => import("./pages/private/ServicingAppointmentDetails"));
const MyBikes = React.lazy(() => import("./pages/private/MyBikes"));
const Appointments = React.lazy(() => import("./pages/private/Appointments"));
const Profile = React.lazy(() => import("./pages/private/Profile"));
const Notifications = React.lazy(() => import("./pages/private/Notifications"));
const ContactUs = React.lazy(() => import("./pages/private/ContactUs"));
const Rewards = React.lazy(() => import("./pages/private/Rewards"));

// Admin Pages
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminGarages = React.lazy(() => import("./pages/admin/Garages"));
const AdminUsers = React.lazy(() => import("./pages/admin/Users"));
const AdminSales = React.lazy(() => import("./pages/admin/Sales"));
const AdminAppointments = React.lazy(() => import("./pages/admin/Appointments"));

const AppRoutes = () => {
  return (
    <Suspense
      fallback={
        <SplashScreen label="Loading app..." />
      }
    >
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoutes />}>
          <Route path="/" element={<Navigate to="/landing" replace />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Route>

        {/* User Private Routes */}
        <Route element={<PrivateRoutes />}>
          {/* User Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/servicing" element={<Servicing />} />
          <Route path="/dashboard/servicing/appointment" element={<ServicingAppointment />} />
          <Route path="/dashboard/servicing/appointment/details" element={<ServicingAppointmentDetails />} />
          <Route path="/dashboard/bikes" element={<MyBikes />} />
          <Route path="/dashboard/appointments" element={<Appointments />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/dashboard/notifications" element={<Notifications />} />
          <Route path="/dashboard/contact" element={<ContactUs />} />
          <Route path="/dashboard/rewards" element={<Rewards />} />
        </Route>

        {/* Admin Private Routes */}
        <Route element={<AdminRoutes />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/garages" element={<AdminGarages />} />
          <Route path="/admin/services" element={<Navigate to="/admin/appointments" replace />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/sales" element={<AdminSales />} />
          <Route path="/admin/appointments" element={<AdminAppointments />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
