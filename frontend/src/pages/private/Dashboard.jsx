import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./Dashboard.css";
import { removeAuth } from "../../utils/auth";

export default function Dashboard() {
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
    <div className="dash">
      {/* TOP NAV */}
      <header className="dash-top">
        <div className="dash-top-left">
          <img src={logo} alt="Motocare Pro" className="dash-logo" />
          <span className="dash-brand">Motocare Pro</span>
        </div>

        <nav className="dash-top-nav">
          <Link to="#" className="dash-top-link">Home</Link>
          <Link to="#" className="dash-top-link">Contact Us</Link>

          <button className="dash-icon-btn" aria-label="notifications">
            <i className="bi bi-bell" />
          </button>
          <button className="dash-avatar" aria-label="profile">
            <i className="bi bi-person" />
          </button>
        </nav>
      </header>

      {/* BODY */}
      <div className="dash-body">
        {/* SIDEBAR */}
        <aside className="dash-side">
          <div className="dash-user">
            <div className="dash-user-pic">
              <i className="bi bi-person-fill" />
            </div>
            <div>
              <div className="dash-user-hi">Welcome,</div>
              <div className="dash-user-name">{fullName}</div>
            </div>
          </div>

          <div className="dash-divider" />

          <div className="dash-menu">
            <MenuItem icon="bi-speedometer2" label="Dashboard" active />
            <MenuItem icon="bi-wrench-adjustable" label="Servicing" />
            <MenuItem icon="bi-bicycle" label="My Bikes" />
            <MenuItem icon="bi-award" label="Rewards" />

            {/* Logout */}
            <MenuItem
              icon="bi-box-arrow-right"
              label="Logout"
              danger
              onClick={handleLogout}
            />
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="dash-main">
          <div className="dash-main-grid">
            {/* LEFT MAIN */}
            <section className="dash-left">
              <div className="dash-title">My Dashboard</div>
              <div className="dash-subtitle">Choose a service you want</div>

              <div className="dash-card">
                <div className="dash-card-grid">
                  <ServiceCard title="Servicing" icon="bi-tools" />
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
                  aLabel="0 Days Remaining"
                  bLabel="90 Days Passed"
                  aValue={0}
                  bValue={90}
                  aColor="#2f80ed"
                  bColor="#ff5b7f"
                />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

/* small components */
function MenuItem({ icon, label, active, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`dash-menu-item ${active ? "active" : ""} ${danger ? "danger" : ""}`}
    >
      <i className={`bi ${icon}`} />
      <span>{label}</span>
    </button>
  );
}

function ServiceCard({ title, icon }) {
  return (
    <button className="service-card" type="button">
      <div className="service-ic">
        <i className={`bi ${icon}`} />
      </div>
      <div className="service-title">{title}</div>
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
