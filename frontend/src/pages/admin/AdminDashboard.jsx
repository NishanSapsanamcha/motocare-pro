import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { removeAuth } from "../../utils/auth";
import SplashScreen from "../public/SplashScreen";
import api from "../../utils/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [slotCounts, setSlotCounts] = useState({});
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotMax, setSlotMax] = useState(4);
  const logoutTimerRef = useRef(null);

  let user = null;
  try {
    const str = localStorage.getItem("user");
    user = str ? JSON.parse(str) : null;
  } catch {
    user = null;
  }

  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadPending = async () => {
      try {
        setLoadingPending(true);
        const res = await api.get("/admin/invoices/pending");
        if (active) {
          setPendingPayments(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch {
        if (active) setPendingPayments([]);
      } finally {
        if (active) setLoadingPending(false);
      }
    };
    loadPending();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadOccupancy = async () => {
      try {
        setSlotLoading(true);
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const res = await api.get("/admin/appointments/slot-occupancy", {
          params: { date: `${yyyy}-${mm}-${dd}` },
        });
        if (active) {
          const data = res.data?.data || {};
          setSlotCounts(data.counts || {});
          setSlotMax(Number(data.maxPerSlot || 4));
        }
      } catch {
        if (active) {
          setSlotCounts({});
        }
      } finally {
        if (active) setSlotLoading(false);
      }
    };
    loadOccupancy();
    const intervalId = setInterval(loadOccupancy, 60000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleApprove = async (invoiceId) => {
    try {
      await api.patch(`/admin/invoices/${invoiceId}/status`, { status: "PAID" });
      setPendingPayments((prev) => prev.filter((inv) => inv.id !== invoiceId));
    } catch {
      // silent for dashboard quick action
    }
  };

  const logout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    logoutTimerRef.current = setTimeout(() => {
      removeAuth();
      navigate("/landing", { replace: true });
    }, 250);
  };

  return (
    <div
      className="container-fluid min-vh-100 py-4"
      style={{ backgroundColor: "#f5f7fa" }}
    >
      {loggingOut && <SplashScreen label="Signing out..." />}
      {/* HEADER */}
      <div
        className="rounded-4 p-4 mb-4 d-flex justify-content-between align-items-center"
        style={{
          background: "linear-gradient(135deg, #071827, #0b1e2d)",
          color: "#fff",
        }}
      >
        <div>
          <h2 className="fw-bold mb-1" style={{ color: "#ff7a18" }}>
            Admin Dashboard
          </h2>
          <p className="mb-0 text-light">
            Welcome, {user?.fullName || "Admin"}
          </p>
        </div>

        <button
          className="btn btn-outline-light"
          onClick={logout}
        >
          <i className="bi bi-box-arrow-right me-1" />
          Logout
        </button>
      </div>

      {/* CARDS */}
      <div className="row g-4">
        {[
          { title: "Garages", path: "/admin/garages", icon: "bi-shop" },
          { title: "Users", path: "/admin/users", icon: "bi-people" },
          { title: "Sales", path: "/admin/sales", icon: "bi-cash-coin" },
          { title: "Appointments", path: "/admin/appointments", icon: "bi-calendar-check" },
        ].map((item) => (
          <div className="col-md-3" key={item.title}>
            <div
              className="card h-100 border-0 rounded-4 shadow-sm"
            >
              <div className="card-body d-flex flex-column justify-content-between">
                <h5 className="fw-semibold">{item.title}</h5>

                <button
                  className="btn mt-3 text-white"
                  style={{ backgroundColor: "#ff7a18" }}
                  onClick={() => navigate(item.path)}
                >
                  <i className={`${item.icon} me-1`} />
                  Manage
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mt-2">
        <div className="col-lg-6">
          <div className="card h-100 border-0 rounded-4 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold mb-0">Pending Payments</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/admin/appointments")}>
                  View all
                </button>
              </div>
              {loadingPending ? (
                <div className="text-muted">Loading...</div>
              ) : pendingPayments.length === 0 ? (
                <div className="text-muted">No pending payments</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {pendingPayments.slice(0, 4).map((inv) => (
                    <div key={inv.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold">
                          {inv.appointment?.user?.full_name || "Customer"} • {inv.appointment?.service_type || "Service"}
                        </div>
                        <div className="text-muted small">
                          {inv.appointment?.preferred_date} at {inv.appointment?.time_slot}
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleApprove(inv.id)}
                      >
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card h-100 border-0 rounded-4 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold mb-0">Today’s Slot Occupancy</h5>
                <span className="text-muted small">Max {slotMax} per slot</span>
              </div>
              {slotLoading ? (
                <div className="text-muted">Loading...</div>
              ) : Object.keys(slotCounts).length === 0 ? (
                <div className="text-muted">No bookings yet</div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {Object.entries(slotCounts).map(([slot, count]) => (
                    <div
                      key={slot}
                      className="px-3 py-2 rounded-3 border"
                      style={{ background: count >= slotMax ? "#fff5f5" : "#f9fafb" }}
                    >
                      <div className="fw-semibold">{slot}</div>
                      <div className="text-muted small">{count}/{slotMax}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
