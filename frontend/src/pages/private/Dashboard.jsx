import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import serviceImg from "../../assets/dashboard/service.png";
import "./Dashboard.css";
import { removeAuth } from "../../utils/auth";
import DashboardLayout from "./DashboardLayout";
import api from "../../utils/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);

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
    const fetchAppointments = async () => {
      try {
        const res = await api.get("/users/appointments");
        if (active) {
          setAppointments(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch {
        if (active) {
          setAppointments([]);
        }
      }
    };
    fetchAppointments();
    return () => {
      active = false;
    };
  }, []);

  const { passedDays, remainingDays, aLabel, bLabel } = useMemo(() => {
    const completionDate = getLatestCompletionDate(appointments);
    if (!completionDate) {
      return {
        passedDays: 0,
        remainingDays: 90,
        aLabel: "90 Days Remaining",
        bLabel: "0 Days Passed",
      };
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = new Date() - completionDate;
    const rawPassed = diffMs > 0 ? Math.floor(diffMs / msPerDay) : 0;
    const clampedPassed = Math.min(Math.max(rawPassed, 0), 90);
    const remaining = Math.max(90 - clampedPassed, 0);
    return {
      passedDays: clampedPassed,
      remainingDays: remaining,
      aLabel: `${remaining} Days Remaining`,
      bLabel: `${clampedPassed} Days Passed`,
    };
  }, [appointments]);

  return (
    <DashboardLayout active="dashboard" fullName={fullName} onLogout={handleLogout}>
      <div className="dash-main-grid">
        {/* LEFT MAIN */}
        <section className="dash-left">
          <div className="dash-title">My Dashboard</div>
          <div className="dash-subtitle">Choose a service you want</div>

          <div className="dash-card">
            <div className="dash-card-grid">
              <ServiceCard title="Servicing" imgSrc={serviceImg} to="/dashboard/servicing" />
            </div>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="dash-right">
          <div className="dash-select-card">
            <select className="form-select">
              <option>Please add your Bike / Scooter</option>
            </select>
          </div>

          <div className="dash-analytics">
            <div className="dash-analytics-title">Servicing</div>
            <Donut
              size={190}
              thickness={18}
              aLabel={aLabel}
              bLabel={bLabel}
              aValue={remainingDays}
              bValue={passedDays}
              aColor="#2f80ed"
              bColor="#ff5b7f"
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

/* small components */
const getCompletionDate = (appointment) => {
  const history = Array.isArray(appointment?.status_history) ? appointment.status_history : [];
  let latest = null;
  for (const entry of history) {
    if (entry?.to !== "COMPLETED" || !entry?.at) continue;
    const parsed = new Date(entry.at);
    if (Number.isNaN(parsed.getTime())) continue;
    if (!latest || parsed > latest) {
      latest = parsed;
    }
  }
  if (latest) return latest;

  if (appointment?.status === "COMPLETED") {
    const updated = new Date(appointment.updated_at);
    if (!Number.isNaN(updated.getTime())) return updated;
    const preferred = new Date(appointment.preferred_date);
    if (!Number.isNaN(preferred.getTime())) return preferred;
  }
  return null;
};

const getLatestCompletionDate = (appointments) => {
  let latest = null;
  for (const appt of appointments || []) {
    const completedAt = getCompletionDate(appt);
    if (!completedAt) continue;
    if (!latest || completedAt > latest) {
      latest = completedAt;
    }
  }
  return latest;
};

function ServiceCard({ title, icon, imgSrc, to }) {
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

  if (to) {
    return (
      <Link className="service-card" to={to}>
        {content}
      </Link>
    );
  }

  return (
    <button className="service-card" type="button">
      {content}
    </button>
  );
}

function Donut({
  size = 180,
  thickness = 16,
  aValue = 30,
  bValue = 70,
  aColor = "#2f80ed",
  bColor = "#ff5b7f",
  aLabel,
  bLabel,
}) {
  const total = Math.max(1, aValue + bValue);
  const aDeg = (aValue / total) * 360;

  const donutStyle = {
    width: size,
    height: size,
    background: `conic-gradient(${aColor} 0deg ${aDeg}deg, ${bColor} ${aDeg}deg 360deg)`,
  };

  const holeStyle = { inset: thickness };

  return (
    <div className="donut-wrap">
      <div className="donut" style={donutStyle}>
        <div className="donut-hole" style={holeStyle} />
      </div>

      <div className="donut-legend">
        <LegendDot color={aColor} text={aLabel} />
        <LegendDot color={bColor} text={bLabel} />
      </div>
    </div>
  );
}

function LegendDot({ color, text }) {
  return (
    <div className="legend-item">
      <span className="legend-dot" style={{ background: color }} />
      <span className="legend-text">{text}</span>
    </div>
  );
}
