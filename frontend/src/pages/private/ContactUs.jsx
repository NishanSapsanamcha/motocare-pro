import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { removeAuth } from "../../utils/auth";
import DashboardLayout from "./DashboardLayout";

export default function ContactUs() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }
  const fullName = user?.fullName || "User";

  const handleLogout = () => {
    removeAuth();
    navigate("/landing", { replace: true });
  };

  return (
    <DashboardLayout active="contact" fullName={fullName} onLogout={handleLogout}>
      <div className="dash-main-grid dash-main-single">
        <section className="dash-left">
          <div className="dash-title">Contact Us</div>
          <div className="dash-subtitle">We are happy to help with any service questions.</div>

          <div className="contact-card">
            <div className="contact-row">
              <div className="contact-label">Location</div>
              <div className="contact-value">Budhanilkantha-2, Kathmandu</div>
            </div>
            <div className="contact-row">
              <div className="contact-label">Phone</div>
              <div className="contact-value">9810203040</div>
            </div>
            <div className="contact-row">
              <div className="contact-label">Email</div>
              <div className="contact-value">support@motocare-pro.com</div>
            </div>
          </div>

          <Link className="dash-cta-btn" to="/dashboard">
            Back to Dashboard
          </Link>
        </section>
      </div>
    </DashboardLayout>
  );
}
