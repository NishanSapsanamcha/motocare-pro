import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { removeAuth } from "../../utils/auth";
import DashboardLayout from "./DashboardLayout";
import serviceImg from "../../assets/dashboard/service.png";
import api from "../../utils/api";

export default function Servicing() {
  const navigate = useNavigate();
  const [hasBikes, setHasBikes] = useState(null);

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

  useEffect(() => {
    let active = true;
    const fetchBikes = async () => {
      try {
        const res = await api.get("/users/bikes");
        if (active) {
          setHasBikes(Array.isArray(res.data.data) && res.data.data.length > 0);
        }
      } catch {
        if (active) {
          setHasBikes(null);
        }
      }
    };
    fetchBikes();
    return () => {
      active = false;
    };
  }, []);

  const handleServiceClick = () => {
    if (hasBikes === false) {
      navigate("/dashboard/bikes");
      return;
    }
    navigate("/dashboard/servicing/appointment");
  };

  return (
    <DashboardLayout active="servicing" fullName={fullName} onLogout={handleLogout}>
      <div className="dash-main-grid dash-main-single">
        <section className="dash-left">
          <div className="dash-title">Servicing</div>
          <div className="dash-subtitle">Choose a service you want</div>

          <div className="dash-card">
            <div className="dash-card-grid">
              <ServiceCard title="Servicing" imgSrc={serviceImg} onClick={handleServiceClick} />
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function ServiceCard({ title, icon, imgSrc, onClick }) {
  const content = (
    <>
      <div className="service-ic">
        {imgSrc ? (
          <img className="service-ic-img" src={imgSrc} alt="" aria-hidden="true" />
        ) : (
          <i className={`bi ${icon}`} />
        )}
      </div>
      <div className="service-title">{title}</div>
    </>
  );

  return (
    <button className="service-card" type="button" onClick={onClick}>
      {content}
    </button>
  );
}
