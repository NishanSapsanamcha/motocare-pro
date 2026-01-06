import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/public/Login.jsx";
import Register from "./pages/public/Register.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}
