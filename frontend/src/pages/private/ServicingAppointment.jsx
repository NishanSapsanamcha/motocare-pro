import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import api from "../../utils/api";
import { removeAuth } from "../../utils/auth";

export default function ServicingAppointment() {
  const navigate = useNavigate();
  const [bike, setBike] = useState(null);
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGarages, setLoadingGarages] = useState(false);
  const [error, setError] = useState("");
  const [garageSearch, setGarageSearch] = useState("");
  const garageTrackRef = useRef(null);
  const imageBaseUrl = (api.defaults.baseURL || "")
    .replace(/\/api\/?$/, "") || "http://localhost:4000";

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
    const loadData = async () => {
      try {
        setLoading(true);
        const bikesRes = await api.get("/users/bikes");
        const bikes = Array.isArray(bikesRes.data.data) ? bikesRes.data.data : [];
        if (bikes.length === 0) {
          navigate("/dashboard/bikes");
          return;
        }
        if (active) {
          setBike(bikes[0]);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Failed to load appointment data");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoadingGarages(true);
        const res = await api.get("/users/garages", {
          params: { search: garageSearch },
        });
        if (active) {
          setGarages(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Failed to load garages");
        }
      } finally {
        if (active) {
          setLoadingGarages(false);
        }
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [garageSearch]);

  const handleGarageSelect = (garageId) => {
    navigate(`/dashboard/servicing/appointment/details?garageId=${garageId}`);
  };

  return (
    <DashboardLayout active="servicing" fullName={fullName} onLogout={handleLogout}>
      <div className="dash-main-grid dash-main-single">
        <section className="dash-left">
          <div className="dash-title">Book Servicing</div>
          <div className="dash-subtitle">Select garage and schedule your appointment</div>

          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="text-muted">Loading...</div>
          ) : (
            <>
              {bike && (
                <div className="appointment-card">
                  <div className="appointment-card-title">Your Bike</div>
                  <div className="appointment-grid">
                    <div><strong>Company:</strong> {bike.company}</div>
                    <div><strong>Model:</strong> {bike.model}</div>
                    <div><strong>Registration:</strong> {bike.registration_no}</div>
                    <div><strong>Color:</strong> {bike.color}</div>
                    {bike.use_new_number && (
                      <>
                        <div><strong>State:</strong> {bike.state}</div>
                        <div><strong>New Reg:</strong> {bike.new_registration_no}</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="appointment-card">
                <div className="garage-header">
                  <div className="appointment-card-title">Select Garage</div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name or location..."
                    value={garageSearch}
                    onChange={(e) => setGarageSearch(e.target.value)}
                  />
                </div>
                <div className="garage-carousel">
                  <button
                    type="button"
                    className="garage-arrow left"
                    onClick={() => garageTrackRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
                    aria-label="Scroll left"
                  >
                    ‹
                  </button>
                  <div className="garage-viewport">
                    <div className="garage-grid" ref={garageTrackRef}>
                      {loadingGarages ? (
                        <div className="text-muted">Searching garages...</div>
                      ) : garages.length === 0 ? (
                        <div className="text-muted">No garages found.</div>
                      ) : (
                        garages.map((garage) => {
                          const imgSrc = garage.photo_url
                            ? `${imageBaseUrl}${garage.photo_url}`
                            : null;
                          return (
                            <button
                              key={garage.id}
                              type="button"
                              className="garage-card"
                              onClick={() => handleGarageSelect(garage.id)}
                            >
                              <div className="garage-card-media">
                                {imgSrc ? (
                                  <img src={imgSrc} alt={garage.name} />
                                ) : (
                                  <div className="garage-card-placeholder">No Image</div>
                                )}
                              </div>
                              <div className="garage-card-body">
                                <div className="garage-card-name">{garage.name}</div>
                                <div className="garage-card-meta">{garage.address}</div>
                                <div className="garage-card-meta">{garage.phone}</div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="garage-arrow right"
                    onClick={() => garageTrackRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
                    aria-label="Scroll right"
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
