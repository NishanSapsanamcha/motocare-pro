import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import dashboardImg from "../../assets/dashboard/dashboard.png";
import serviceImg from "../../assets/dashboard/service.png";
import motorImg from "../../assets/dashboard/motor.png";
import appointmentImg from "../../assets/dashboard/appointment.png";
import awardImg from "../../assets/dashboard/award.jpg";
import logoutImg from "../../assets/dashboard/logout.png";
import "./Dashboard.css";
import api from "../../utils/api";
import SplashScreen from "../public/SplashScreen";

export default function DashboardLayout({ active, fullName, onLogout, children }) {
  const [openNotifications, setOpenNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutTimerRef = useRef(null);
  const imageBaseUrl = (api.defaults.baseURL || "").replace(/\/api\/?$/, "") || "http://localhost:4000";

  const getAvatarSrc = () => {
    const userStr = localStorage.getItem("user");
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch {
      user = null;
    }
    const avatarUrl = user?.avatarUrl || "";
    if (!avatarUrl) return "";
    if (avatarUrl.startsWith("http")) return avatarUrl;
    return `${imageBaseUrl}${avatarUrl}`;
  };

  const [avatarSrc, setAvatarSrc] = useState(() => getAvatarSrc());

  useEffect(() => {
    let activeRequest = true;
    const fetchAppointments = async () => {
      try {
        setLoadingAppointments(true);
        const res = await api.get("/users/appointments");
        if (activeRequest) {
          setAppointments(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch {
        if (activeRequest) {
          setAppointments([]);
        }
      } finally {
        if (activeRequest) {
          setLoadingAppointments(false);
        }
      }
    };
    fetchAppointments();
    return () => {
      activeRequest = false;
    };
  }, []);

  useEffect(() => {
    const root = document.getElementById("root");
    document.body.classList.add("dash-mode");
    if (root) root.classList.add("dash-root");
    return () => {
      document.body.classList.remove("dash-mode");
      if (root) root.classList.remove("dash-root");
    };
  }, []);

  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleUserUpdate = () => {
      setAvatarSrc(getAvatarSrc());
    };
    window.addEventListener("user-updated", handleUserUpdate);
    window.addEventListener("storage", handleUserUpdate);
    return () => {
      window.removeEventListener("user-updated", handleUserUpdate);
      window.removeEventListener("storage", handleUserUpdate);
    };
  }, []);

  const handleLogoutClick = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    logoutTimerRef.current = setTimeout(() => {
      if (onLogout) onLogout();
    }, 250);
  };

  // Close mobile menu when clicking a link
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close mobile menu on window resize above mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 900) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="dash">
      {loggingOut && <SplashScreen label="Signing out..." />}
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="dash-mobile-overlay" 
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
      {/* TOP NAV */}
      <header className="dash-top">
        <div className="dash-top-left">
          {/* Hamburger button for mobile */}
          <button
            type="button"
            className="dash-hamburger"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <i className={`bi ${mobileMenuOpen ? "bi-x-lg" : "bi-list"}`} />
          </button>
          <img src={logo} alt="Motocare Pro" className="dash-logo" />
          <span className="dash-brand">Motocare Pro</span>
        </div>

        <nav className="dash-top-nav">
          <Link to="/dashboard" className="dash-top-link">Home</Link>
          <Link to="/dashboard/contact" className="dash-top-link">Contact Us</Link>

          <div className="dash-notifications">
            <button
              type="button"
              className="dash-icon-btn"
              aria-label="notifications"
              onClick={() => setOpenNotifications((prev) => !prev)}
            >
              <i className="bi bi-bell" />
              {appointments.length > 0 && <span className="dash-badge" />}
            </button>
            {openNotifications && (
              <div className="dash-dropdown">
                <div className="dash-dropdown-title">Notifications</div>
                {loadingAppointments ? (
                  <div className="dash-dropdown-item text-muted">Loading...</div>
                ) : appointments.length > 0 ? (
                  <>
                    {appointments.slice(0, 5).map((appt) => (
                      <div key={appt.id} className="dash-dropdown-item">
                        <div className="dash-dropdown-main">
                          {appt.service_type} • {appt.status}
                        </div>
                        <div className="dash-dropdown-sub">
                          {appt.preferred_date} at {appt.time_slot}
                        </div>
                      </div>
                    ))}
                    <Link className="dash-dropdown-link" to="/dashboard/appointments">
                      View all appointments
                    </Link>
                  </>
                ) : (
                  <div className="dash-dropdown-item text-muted">No notifications yet.</div>
                )}
              </div>
            )}
          </div>
          <Link to="/dashboard/profile" className="dash-avatar" aria-label="profile">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Profile" className="dash-avatar-img" />
            ) : (
              <i className="bi bi-person" />
            )}
          </Link>
        </nav>
      </header>

      {/* BODY */}
      <div className="dash-body">
        {/* SIDEBAR */}
        <aside className={`dash-side ${mobileMenuOpen ? "dash-side-open" : ""}`}>
          <div className="dash-user">
            <div className="dash-user-pic">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="dash-user-avatar" />
              ) : (
                <i className="bi bi-person-fill" />
              )}
            </div>
            <div>
              <div className="dash-user-hi">Welcome,</div>
              <div className="dash-user-name">{fullName}</div>
            </div>
          </div>

          <div className="dash-divider" />

          <div className="dash-menu">
            <MenuItem
              imgSrc={dashboardImg}
              label="Dashboard"
              active={active === "dashboard"}
              to="/dashboard"
              onClick={closeMobileMenu}
            />
            <MenuItem
              imgSrc={serviceImg}
              label="Servicing"
              active={active === "servicing"}
              to="/dashboard/servicing"
              onClick={closeMobileMenu}
            />
            <MenuItem
              imgSrc={motorImg}
              label="My Bikes"
              active={active === "bikes"}
              to="/dashboard/bikes"
              onClick={closeMobileMenu}
            />
            <MenuItem
              imgSrc={appointmentImg}
              label="My Appointments"
              active={active === "appointments"}
              to="/dashboard/appointments"
              onClick={closeMobileMenu}
            />
            <MenuItem
              imgSrc={awardImg}
              label="Rewards"
              active={active === "rewards"}
              to="/dashboard/rewards"
              onClick={closeMobileMenu}
            />

            {/* Logout */}
            <MenuItem
              imgSrc={logoutImg}
              label="Logout"
              danger
              onClick={handleLogoutClick}
            />
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="dash-main">
          {children}
        </main>
      </div>
    </div>
  );
}

function MenuItem({ icon, imgSrc, label, active, onClick, danger, to }) {
  const className = `dash-menu-item ${active ? "active" : ""} ${danger ? "danger" : ""}`;

  if (to) {
    return (
      <Link to={to} className={className} onClick={onClick}>
        {imgSrc ? (
          <img className="dash-menu-icon" src={imgSrc} alt="" aria-hidden="true" />
        ) : (
          <i className={`bi ${icon}`} />
        )}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {imgSrc ? (
        <img className="dash-menu-icon" src={imgSrc} alt="" aria-hidden="true" />
      ) : (
        <i className={`bi ${icon}`} />
      )}
      <span>{label}</span>
    </button>
  );
}
